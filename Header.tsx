import React from 'react';
import { Sparkles, Sun, Moon, Menu, GraduationCap } from 'lucide-react';
import { TabType } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toggleMobileMenu: () => void;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string }> = {
  tutor: { title: 'AI Tutor Chat', subtitle: 'Step-by-step doubt solver & study mentor' },
  explainer: { title: 'Concept Explainer', subtitle: 'Deep understanding with analogies & examples' },
  summarizer: { title: 'Notes Summarizer', subtitle: 'Transform notes and PDFs into key takeaways' },
  quiz: { title: 'Quiz Generator', subtitle: 'Test your mastery with instant explanations' },
  flashcards: { title: 'Interactive Flashcards', subtitle: 'Spaced repetition cards for active recall' },
  planner: { title: 'Study Planner', subtitle: 'Personalized exam schedule with revision days' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  theme,
  toggleTheme,
  toggleMobileMenu,
}) => {
  const currentTab = TAB_TITLES[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle + App Branding / Page Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  EduGenie
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini Flash
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentTab.title} — {currentTab.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle & Quick Status */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Free Tier • Ready</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all cursor-pointer shadow-xs"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
