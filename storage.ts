import { ChatMessage, QuizResultRecord, Flashcard, StudyPlan } from '../types';

const STORAGE_KEYS = {
  THEME: 'edugenie_theme',
  CHAT_MESSAGES: 'edugenie_chat_messages',
  QUIZ_HISTORY: 'edugenie_quiz_history',
  FLASHCARDS: 'edugenie_flashcards',
  STUDY_PLAN: 'edugenie_study_plan',
  SAVED_CONCEPT: 'edugenie_saved_concept',
};

// Safe JSON parse wrapper
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing to localStorage key "${key}":`, e);
  }
}

// Chat storage
export const getStoredChat = (): ChatMessage[] => safeGet<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
export const saveStoredChat = (messages: ChatMessage[]) => safeSet(STORAGE_KEYS.CHAT_MESSAGES, messages);
export const clearStoredChat = () => localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);

// Quiz history storage
export const getStoredQuizHistory = (): QuizResultRecord[] => safeGet<QuizResultRecord[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
export const saveQuizResult = (record: QuizResultRecord) => {
  const current = getStoredQuizHistory();
  const updated = [record, ...current].slice(0, 30); // keep last 30 quizzes
  safeSet(STORAGE_KEYS.QUIZ_HISTORY, updated);
};
export const clearStoredQuizzes = () => localStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);

// Flashcards storage
export const getStoredFlashcards = (): { deckTitle: string; cards: Flashcard[] } | null =>
  safeGet<{ deckTitle: string; cards: Flashcard[] } | null>(STORAGE_KEYS.FLASHCARDS, null);
export const saveStoredFlashcards = (deck: { deckTitle: string; cards: Flashcard[] }) =>
  safeSet(STORAGE_KEYS.FLASHCARDS, deck);
export const clearStoredFlashcards = () => localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);

// Study Plan storage
export const getStoredStudyPlan = (): StudyPlan | null => safeGet<StudyPlan | null>(STORAGE_KEYS.STUDY_PLAN, null);
export const saveStoredStudyPlan = (plan: StudyPlan) => safeSet(STORAGE_KEYS.STUDY_PLAN, plan);
export const clearStoredStudyPlan = () => localStorage.removeItem(STORAGE_KEYS.STUDY_PLAN);

// Concept explanation cache
export const getStoredConcept = (): any => safeGet(STORAGE_KEYS.SAVED_CONCEPT, null);
export const saveStoredConcept = (concept: any) => safeSet(STORAGE_KEYS.SAVED_CONCEPT, concept);

// Theme storage ('light' | 'dark')
export const getStoredTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};
export const saveStoredTheme = (theme: 'light' | 'dark') => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
};

// Clear All Session data
export const clearAllUserData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
    localStorage.removeItem(STORAGE_KEYS.STUDY_PLAN);
    localStorage.removeItem(STORAGE_KEYS.SAVED_CONCEPT);
  } catch (e) {
    console.error('Failed to clear session data:', e);
  }
};
