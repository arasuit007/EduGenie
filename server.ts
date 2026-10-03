import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware to parse JSON payloads (limit 15mb to support uploaded notes and small PDFs)
app.use(express.json({ limit: '15mb' }));

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Primary fast & reliable model with automatic fallback
const MODELS_TO_TRY = ['gemini-3.5-flash', 'gemini-3.8-flash'];

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying fallback:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

async function generateStreamWithFallback(params: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;
  for (const model of MODELS_TO_TRY) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: params.config,
      });
      return stream;
    } catch (err: any) {
      console.warn(`Model ${model} stream failed, trying fallback:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

// Helper to format error responses nicely
function handleGeminiError(error: any, res: Response) {
  console.error('Gemini API Error:', error);
  const errorMessage = error?.message || String(error);

  // High demand 503
  if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('high demand') || errorMessage.toLowerCase().includes('temporarily unavailable')) {
    return res.status(503).json({
      error: 'The AI model is experiencing high demand. Please try again in a moment.',
      isRateLimit: true,
      retryAfter: 3,
    });
  }
  
  // Rate limit / 429 error
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
    return res.status(429).json({
      error: 'Too many requests, please wait a moment and try again.',
      isRateLimit: true,
      retryAfter: 5,
    });
  }

  // Missing or invalid API key
  if (errorMessage.includes('API key') || errorMessage.includes('403') || errorMessage.includes('401')) {
    return res.status(401).json({
      error: 'Gemini API key is not configured or is invalid. Please check your environment configuration.',
    });
  }

  return res.status(500).json({
    error: 'An error occurred while generating the response. Please try again.',
    details: errorMessage,
  });
}

// ---------------------------------------------------------------------------
// 1. AI Tutor Chat (Streaming with SSE & Conversation Memory)
// ---------------------------------------------------------------------------
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const { messages, subject, gradeLevel } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const systemInstruction = `You are EduGenie, an expert, enthusiastic, and empathetic AI learning assistant and doubt solver for ${gradeLevel || 'school and college'} students${subject ? ` studying ${subject}` : ''}.
Your pedagogical approach:
1. Explain step-by-step with clear, accessible language suited for students.
2. Break down complex ideas using intuitive analogies and everyday examples.
3. Structure your response cleanly using Markdown: bold important concepts, use organized bullet points or numbered lists, wrap code in proper \`\`\`language blocks, and format mathematical formulas cleanly.
4. If the student asks for homework answers directly, guide them through the logic and method rather than simply stating the solution.
5. Always end your response with a friendly, short follow-up check question (1-2 sentences) to test their understanding or invite them to try the next step.`;

  try {
    // Map client messages to Gemini contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const responseStream = await generateStreamWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat stream error:', error);
    const errText = error?.message || 'Chat generation error';
    const isHighDemand = errText.includes('503') || errText.toLowerCase().includes('high demand');
    const is429 = errText.includes('429') || errText.toLowerCase().includes('quota') || isHighDemand;
    const userMsg = is429
      ? 'The AI model is busy. Please wait a moment and try again.'
      : 'Something went wrong while generating the tutor response. Please retry.';

    res.write(`data: ${JSON.stringify({ error: userMsg, isRateLimit: is429 })}\n\n`);
    res.end();
  }
});

// ---------------------------------------------------------------------------
// 2. Concept Explainer (Structured output with Definition, Analogy, Key Points, Real-World Example, Recap)
// ---------------------------------------------------------------------------
app.post('/api/explain', async (req: Request, res: Response) => {
  const { topic, level, subject } = req.body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const selectedLevel = level || 'Intermediate';

  const prompt = `Explain the concept "${topic.trim()}" at a ${selectedLevel} level${subject ? ` for ${subject}` : ''}.
Produce a comprehensive, engaging learning guide tailored for a student at the ${selectedLevel} level.`;

  try {
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Concept Explainer engine. Provide a structured, engaging explanation suitable for a ${selectedLevel} student. Always output valid JSON conforming strictly to the requested schema. Ensure the analogy is vivid and memorable, key points are insightful, real-world example is practical, and the recap is concise. Also provide a quick 1-question check to test comprehension.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            level: { type: Type.STRING },
            simpleDefinition: {
              type: Type.STRING,
              description: 'A 2-3 sentence definition that explains the concept clearly without unnecessary jargon.',
            },
            analogy: {
              type: Type.STRING,
              description: 'A creative, relatable everyday analogy (e.g. "Think of it like a library librarian...").',
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 to 6 crucial takeaways or principles that define this concept.',
            },
            realWorldExample: {
              type: Type.STRING,
              description: 'A concrete example of how this concept is applied in modern technology, nature, daily life, or industry.',
            },
            recap: {
              type: Type.STRING,
              description: 'A memorable 1-2 sentence golden takeaway.',
            },
            quickCheck: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: 'Zero-based index of the correct option (0-3).',
                },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
          required: [
            'topic',
            'level',
            'simpleDefinition',
            'analogy',
            'keyPoints',
            'realWorldExample',
            'recap',
            'quickCheck',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// ---------------------------------------------------------------------------
// 3. Notes Summarizer (Text or uploaded .txt / .pdf file)
// ---------------------------------------------------------------------------
app.post('/api/summarize', async (req: Request, res: Response) => {
  const { text, fileData, format } = req.body;

  if (!text && !fileData) {
    return res.status(400).json({ error: 'Please provide either text or upload a file.' });
  }

  const selectedFormat = format || 'short_summary'; // 'short_summary' | 'bullet_points' | 'key_terms'

  let formatInstruction = '';
  if (selectedFormat === 'short_summary') {
    formatInstruction = 'Provide a structured, crystal-clear executive summary with an overview paragraph, major takeaways, and practical significance. Include a short "TL;DR" highlight at the top.';
  } else if (selectedFormat === 'bullet_points') {
    formatInstruction = 'Provide organized bullet points categorized into logical sections with descriptive sub-headings. Use bold text for key concepts and bullet points for supporting facts.';
  } else if (selectedFormat === 'key_terms') {
    formatInstruction = 'Extract all critical terms, formulas, key people/dates, or specialized vocabulary. Format each item with the Term (in bold), a concise definition, and its significance.';
  }

  const systemInstruction = `You are EduGenie's Study Notes Summarizer. Your goal is to synthesize student notes, textbooks, and documents into high-retention study materials.
Output strictly formatted Markdown. Format style: ${selectedFormat}.
${formatInstruction}`;

  try {
    const parts: any[] = [];

    // Support uploaded PDF or TXT files via Gemini inlineData
    if (fileData && fileData.base64 && fileData.mimeType) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.base64,
        },
      });
      parts.push({
        text: `Please summarize the contents of the attached document according to the requested format: ${selectedFormat}.${text ? ` Additional student focus: ${text}` : ''}`,
      });
    } else {
      parts.push({
        text: `Here are the notes to summarize:\n\n${text}\n\nFormat requested: ${selectedFormat}.`,
      });
    }

    const response = await generateContentWithFallback({
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const summaryText = response.text || '';
    return res.json({
      summary: summaryText,
      format: selectedFormat,
    });
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// ---------------------------------------------------------------------------
// 4. Quiz Generator (Structured Multiple Choice Questions)
// ---------------------------------------------------------------------------
app.post('/api/quiz', async (req: Request, res: Response) => {
  const { topic, notes, count = 5, difficulty = 'Medium' } = req.body;

  if (!topic && !notes) {
    return res.status(400).json({ error: 'Please provide a topic or notes for the quiz.' });
  }

  const questionCount = count === 10 ? 10 : 5;
  const prompt = topic
    ? `Generate ${questionCount} multiple-choice questions on "${topic}" at a ${difficulty} difficulty level.`
    : `Generate ${questionCount} multiple-choice questions based on the following notes at a ${difficulty} difficulty level:\n\n${notes}`;

  try {
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Quiz Generator. Create exactly ${questionCount} high-quality, pedagogically sound multiple-choice questions at ${difficulty} level.
Each question must have:
- Exactly 4 distinct, plausible options.
- Exactly one correct answer specified by index (0, 1, 2, or 3).
- A thorough, encouraging explanation explaining why the correct option is right and clarifying common student misconceptions.
Return strictly valid JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exactly 4 distinct answer choices.',
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: 'The 0-based index of the correct option (0, 1, 2, or 3).',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Explanation of why this choice is correct.',
                  },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['topic', 'difficulty', 'questions'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// ---------------------------------------------------------------------------
// 5. Flashcards Generator
// ---------------------------------------------------------------------------
app.post('/api/flashcards', async (req: Request, res: Response) => {
  const { topic, notes, count = 8 } = req.body;

  if (!topic && !notes) {
    return res.status(400).json({ error: 'Please provide a topic or notes to generate flashcards.' });
  }

  const flashcardCount = Math.min(Math.max(Number(count) || 8, 4), 16);
  const prompt = topic
    ? `Generate ${flashcardCount} smart flashcards for "${topic}".`
    : `Generate ${flashcardCount} smart flashcards based on these notes:\n\n${notes}`;

  try {
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Flashcard Generator. Create effective spaced-repetition study flashcards.
Front should contain a focused question, prompt, or term.
Back should contain a clear, concise, accurate answer or definition with key takeaways.
Include a helpful "hint" and a "category" or topic tag for each card.
Output strictly JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING, description: 'Question, concept, or term.' },
                  back: { type: Type.STRING, description: 'Answer, explanation, or definition.' },
                  hint: { type: Type.STRING, description: 'A subtle memory clue or hint.' },
                  category: { type: Type.STRING, description: 'Subtopic or category tag.' },
                },
                required: ['id', 'front', 'back', 'hint', 'category'],
              },
            },
          },
          required: ['deckTitle', 'cards'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// ---------------------------------------------------------------------------
// 6. Study Planner Generator
// ---------------------------------------------------------------------------
app.post('/api/planner', async (req: Request, res: Response) => {
  const { subjects, examDate, hoursPerDay, pace = 'Balanced' } = req.body;

  if (!subjects || (Array.isArray(subjects) && subjects.length === 0)) {
    return res.status(400).json({ error: 'Please specify subjects or topics.' });
  }

  const subjectsList = Array.isArray(subjects) ? subjects.join(', ') : String(subjects);
  const prompt = `Create a complete day-by-day study schedule for a student preparing for exams.
Subjects/Topics: ${subjectsList}
Target Exam Date or Deadline: ${examDate || 'In 14 days'}
Available Study Hours per Day: ${hoursPerDay || 3} hours
Preferred Study Pace: ${pace}`;

  try {
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Academic Study Planner. Create a realistic, science-backed study schedule incorporating active recall and spaced repetition.
Include dedicated revision days, practice test days, rest intervals, and manageable daily study blocks.
Format as strictly valid JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            overview: { type: Type.STRING, description: 'Brief strategy summary and study advice.' },
            totalDays: { type: Type.INTEGER },
            dailyHoursTarget: { type: Type.NUMBER },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  dateOrLabel: { type: Type.STRING, description: 'e.g., "Day 1 (Mon)" or specific date' },
                  theme: { type: Type.STRING, description: 'Core focus or subject for the day' },
                  isRevisionDay: { type: Type.BOOLEAN },
                  blocks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeSlot: { type: Type.STRING, description: 'e.g. "Morning (1.5 hrs)" or "Block 1"' },
                        subject: { type: Type.STRING },
                        task: { type: Type.STRING, description: 'Specific action or chapters to cover' },
                        technique: { type: Type.STRING, description: 'e.g., "Active Recall", "Flashcards", "Practice Problems"' },
                      },
                      required: ['timeSlot', 'subject', 'task', 'technique'],
                    },
                  },
                  dailyTip: { type: Type.STRING, description: 'A quick motivational or cognitive retention tip' },
                },
                required: ['dayNumber', 'dateOrLabel', 'theme', 'isRevisionDay', 'blocks', 'dailyTip'],
              },
            },
          },
          required: ['planTitle', 'overview', 'totalDays', 'dailyHoursTarget', 'days'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    return handleGeminiError(error, res);
  }
});

// ---------------------------------------------------------------------------
// Vite Dev Server or Production Static Serving
// ---------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGenie server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
