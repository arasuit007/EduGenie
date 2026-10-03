export type TabType = 'tutor' | 'explainer' | 'summarizer' | 'quiz' | 'flashcards' | 'planner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ConceptExplanation {
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  simpleDefinition: string;
  analogy: string;
  keyPoints: string[];
  realWorldExample: string;
  recap: string;
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
}

export interface QuizResultRecord {
  id: string;
  topic: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
  difficulty: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string;
  category: string;
  known?: boolean;
}

export interface FlashcardDeck {
  deckTitle: string;
  cards: Flashcard[];
}

export interface StudyBlock {
  timeSlot: string;
  subject: string;
  task: string;
  technique: string;
  completed?: boolean;
}

export interface StudyDay {
  dayNumber: number;
  dateOrLabel: string;
  theme: string;
  isRevisionDay: boolean;
  blocks: StudyBlock[];
  dailyTip: string;
}

export interface StudyPlan {
  planTitle: string;
  overview: string;
  totalDays: number;
  dailyHoursTarget: number;
  days: StudyDay[];
  createdDate: string;
}
