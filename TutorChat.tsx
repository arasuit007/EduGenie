import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Square,
  BookOpen,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  Copy,
  Check,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { ErrorMessage } from '../common/ErrorMessage';

interface TutorChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const STARTER_PROMPTS = [
  { label: 'Photosynthesis Analogy', prompt: 'Can you explain photosynthesis step-by-step using a kitchen or cooking analogy?' },
  { label: 'Calculus: Derivatives', prompt: 'What actually is a derivative in calculus? Explain with an intuitive real-life example.' },
  { label: 'Python: Recursion', prompt: 'How does recursion work in programming? Show a simple code example with step-by-step trace.' },
  { label: 'Newton’s 3rd Law', prompt: 'Explain Newton’s Third Law of Motion. Why does a rocket move upward in space if there is no air to push against?' },
];

export const TutorChat: React.FC<TutorChatProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [subject, setSubject] = useState('General');
  const [gradeLevel, setGradeLevel] = useState('High School / College');
  const [errorState, setErrorState] = useState<{ message: string; isRateLimit: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear current tutor conversation?')) {
      setMessages([]);
      setErrorState(null);
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isStreaming) return;

    setErrorState(null);
    setInput('');

    // Append user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Placeholder model message for streaming
    const modelMessageId = `model-${Date.now()}`;
    const modelPlaceholder: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    };

    setMessages([...newMessages, modelPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare conversation history (last 10 messages for context efficiency)
      const recentHistory = newMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentHistory,
          subject: subject === 'General' ? '' : subject,
          gradeLevel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming not supported by browser.');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Update active model message content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === modelMessageId ? { ...msg, content: accumulatedText } : msg
                  )
                );
              }
            } catch (err: any) {
              if (err.message && !err.message.includes('JSON')) {
                throw err;
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation stopped by user');
      } else {
        console.error('Chat error:', err);
        const errMsg = err?.message || 'Failed to communicate with AI Tutor.';
        const isRateLimit = errMsg.includes('Too many requests') || errMsg.includes('429');
        setErrorState({ message: errMsg, isRateLimit });

        // If the model message is empty, remove it
        setMessages((prev) =>
          prev.filter((msg) => !(msg.id === modelMessageId && !msg.content))
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto w-full">
      {/* Settings Bar: Grade Level & Subject */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <span>Target Level:</span>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Middle School">Middle School (Ages 11-14)</option>
              <option value="High School">High School (Ages 14-18)</option>
              <option value="High School / College">College / Undergraduate</option>
              <option value="Beginner / Simple">ELI5 (Simple terms)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <BookOpen className="w-4 h-4 text-sky-500" />
            <span>Subject:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="General">All / General</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="History">History</option>
              <option value="Literature">Literature</option>
            </select>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Clear Chat Messages"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4 animate-bounce duration-1000">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Hello! I'm your AI Learning Tutor
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
              Ask me any doubt or problem. I'll explain step-by-step with analogies and examples, then check if it makes sense!
            </p>

            {/* Quick Prompts */}
            <div className="mt-8 w-full max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center justify-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Try an example question</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sp.prompt)}
                    className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all text-xs group cursor-pointer"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {sp.label}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {sp.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative group max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-tl-xs'
                  }`}
                >
                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      isUser
                        ? 'text-indigo-200 hover:text-white hover:bg-indigo-700/60'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Copy message"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isUser ? (
                    <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {message.content}
                    </div>
                  ) : message.content ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 py-1">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-semibold">Tutor is thinking step-by-step...</span>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 flex items-center justify-end ${
                      isUser ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner if present */}
      {errorState && (
        <ErrorMessage
          message={errorState.message}
          isRateLimit={errorState.isRateLimit}
          onRetry={() => {
            const lastUser = [...messages].reverse().find((m) => m.role === 'user');
            if (lastUser) handleSendMessage(lastUser.content);
          }}
        />
      )}

      {/* Chat Input Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md p-2 sm:p-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question or homework doubt... (Press Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 pb-1">
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-sm cursor-pointer"
                title="Stop response"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
