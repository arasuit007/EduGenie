import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw, Clock } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  isRateLimit?: boolean;
  onRetry?: () => void;
  cooldownSeconds?: number;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  isRateLimit = false,
  onRetry,
  cooldownSeconds = 3,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(isRateLimit ? Math.max(cooldownSeconds, 5) : cooldownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div
      role="alert"
      className="p-4 my-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm transition-all animate-fadeIn"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-amber-950 dark:text-amber-100">
            {isRateLimit ? 'Rate Limit Reached' : 'Unable to complete request'}
          </h4>
          <p className="text-sm mt-0.5 text-amber-800 dark:text-amber-300/90 leading-relaxed">
            {message}
          </p>

          {onRetry && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                disabled={secondsLeft > 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${secondsLeft > 0 ? 'animate-spin' : ''}`} />
                <span>Retry Now</span>
              </button>

              {secondsLeft > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-750 dark:text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Wait {secondsLeft}s cooldown</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
