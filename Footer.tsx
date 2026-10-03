import React from 'react';
import { AlertCircle, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-5 px-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Mandatory Disclaimer */}
        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400/90 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>AI can make mistakes. Verify important information.</span>
        </div>

        {/* Free Tier & Privacy Badge */}
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private & Browser-Stored</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Built for learners with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </span>
        </div>
      </div>
    </footer>
  );
};
