import React, { useState } from 'react';
import {
  MessageSquare,
  Lightbulb,
  FileText,
  HelpCircle,
  Layers,
  CalendarDays,
  Trash2,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { TabType } from '../../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  onClearSession: () => void;
  chatCount: number;
  flashcardCount: number;
  quizCount: number;
}

interface NavItem {
  id: TabType;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onClearSession,
  chatCount,
  flashcardCount,
  quizCount,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'tutor',
      label: 'AI Tutor Chat',
      description: 'Doubt solver & explanation',
      icon: MessageSquare,
      badge: chatCount > 0 ? chatCount : undefined,
    },
    {
      id: 'explainer',
      label: 'Concept Explainer',
      description: 'Analogies & breakdowns',
      icon: Lightbulb,
    },
    {
      id: 'summarizer',
      label: 'Notes Summarizer',
      description: 'Text & PDF distillations',
      icon: FileText,
    },
    {
      id: 'quiz',
      label: 'Quiz Generator',
      description: 'Instant practice & grading',
      icon: HelpCircle,
      badge: quizCount > 0 ? `${quizCount} taken` : undefined,
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      description: 'Flip-card active recall',
      icon: Layers,
      badge: flashcardCount > 0 ? `${flashcardCount}` : undefined,
    },
    {
      id: 'planner',
      label: 'Study Planner',
      description: 'Exam timetable & revision',
      icon: CalendarDays,
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    onClose();
  };

  const handleConfirmClear = () => {
    onClearSession();
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-40 md:z-20 h-full md:h-[calc(100vh-4rem)] w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header in Mobile */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">EduGenie</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-3.5 space-y-1.5 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learning Suite</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/60 dark:to-slate-850 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs border border-indigo-200/70 dark:border-indigo-800/50'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium leading-tight">{item.label}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Clear Session & Study Tip */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent border border-indigo-200/50 dark:border-indigo-900/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Tip</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Test your knowledge right after reading with Flashcards or Quiz to double retention!
            </p>
          </div>

          {/* Clear Session Button */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors cursor-pointer"
            title="Reset and clear all saved local session data"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Session Data</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white">
              Clear All Session Data?
            </h3>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              This will reset your chat history, saved quiz records, generated flashcards, and study plans in this browser.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
