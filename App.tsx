import React, { useState, useEffect } from 'react';
import { TabType, ChatMessage } from './types';
import {
  getStoredTheme,
  saveStoredTheme,
  getStoredChat,
  saveStoredChat,
  getStoredQuizHistory,
  getStoredFlashcards,
  clearAllUserData,
} from './utils/storage';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { TutorChat } from './components/tutor/TutorChat';
import { ConceptExplainer } from './components/explainer/ConceptExplainer';
import { NotesSummarizer } from './components/summarizer/NotesSummarizer';
import { QuizGenerator } from './components/quiz/QuizGenerator';
import { FlashcardDeck } from './components/flashcards/FlashcardDeck';
import { StudyPlanner } from './components/planner/StudyPlanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tutor');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistent States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => getStoredChat());
  const [quizHistoryCount, setQuizHistoryCount] = useState<number>(() => getStoredQuizHistory().length);
  const [flashcardCount, setFlashcardCount] = useState<number>(() => {
    const deck = getStoredFlashcards();
    return deck ? deck.cards.length : 0;
  });

  // Sync theme changes with DOM class and storage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  // Sync chat messages to localStorage
  useEffect(() => {
    saveStoredChat(chatMessages);
  }, [chatMessages]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleClearSession = () => {
    clearAllUserData();
    setChatMessages([]);
    setQuizHistoryCount(0);
    setFlashcardCount(0);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        theme={theme}
        toggleTheme={toggleTheme}
        toggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onClearSession={handleClearSession}
          chatCount={chatMessages.length}
          flashcardCount={flashcardCount}
          quizCount={quizHistoryCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'tutor' && (
            <TutorChat
              messages={chatMessages}
              setMessages={setChatMessages}
            />
          )}

          {activeTab === 'explainer' && (
            <ConceptExplainer />
          )}

          {activeTab === 'summarizer' && (
            <NotesSummarizer />
          )}

          {activeTab === 'quiz' && (
            <QuizGenerator
              onQuizCompleted={() => setQuizHistoryCount(getStoredQuizHistory().length)}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardDeck
              onDeckUpdated={() => {
                const deck = getStoredFlashcards();
                setFlashcardCount(deck ? deck.cards.length : 0);
              }}
            />
          )}

          {activeTab === 'planner' && (
            <StudyPlanner />
          )}
        </main>
      </div>

      {/* Footer with mandatory disclaimer */}
      <Footer />
    </div>
  );
}
