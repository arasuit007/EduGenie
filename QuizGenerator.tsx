import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  Clock,
  History,
  BookOpen,
} from 'lucide-react';
import { QuizData, QuizResultRecord } from '../../types';
import { ErrorMessage } from '../common/ErrorMessage';
import { saveQuizResult, getStoredQuizHistory } from '../../utils/storage';

interface QuizGeneratorProps {
  onQuizCompleted?: () => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onQuizCompleted }) => {
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [inputMode, setInputMode] = useState<'topic' | 'notes'>('topic');
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showInstantFeedback, setShowInstantFeedback] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; isRateLimit: boolean } | null>(null);

  // Past quiz history
  const [quizHistory, setQuizHistory] = useState<QuizResultRecord[]>(() => getStoredQuizHistory());

  const handleGenerateQuiz = async () => {
    const payloadTopic = inputMode === 'topic' ? topic.trim() : '';
    const payloadNotes = inputMode === 'notes' ? notes.trim() : '';

    if (!payloadTopic && !payloadNotes) return;

    setIsLoading(true);
    setErrorState(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: payloadTopic,
          notes: payloadNotes,
          count: questionCount,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate quiz.');
      }

      setQuizData(data);
    } catch (err: any) {
      console.error('Quiz error:', err);
      const is429 = err.message?.includes('429') || err.message?.includes('Too many requests');
      setErrorState({
        message: err.message || 'Could not generate quiz. Please try again.',
        isRateLimit: is429,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    // Only allow selecting once per question
    if (selectedAnswers[questionIndex] !== undefined) return;

    const newAnswers = { ...selectedAnswers, [questionIndex]: optionIndex };
    setSelectedAnswers(newAnswers);

    // If it's the last question, or if all are answered, check completion
    const allAnswered = quizData && Object.keys(newAnswers).length === quizData.questions.length;
    if (allAnswered) {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = (finalAnswers: Record<number, number>) => {
    if (!quizData) return;

    let score = 0;
    quizData.questions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correctIndex) {
        score++;
      }
    });

    const percentage = Math.round((score / quizData.questions.length) * 100);

    // Trigger confetti if high score
    if (percentage >= 60) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    const record: QuizResultRecord = {
      id: `quiz-${Date.now()}`,
      topic: quizData.topic || topic || 'Custom Practice',
      score,
      total: quizData.questions.length,
      percentage,
      date: new Date().toLocaleDateString(),
      difficulty: quizData.difficulty,
    };

    saveQuizResult(record);
    setQuizHistory(getStoredQuizHistory());
    setIsCompleted(true);
    onQuizCompleted?.();
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  const currentQ = quizData?.questions[currentQuestionIndex];
  const userSelected = currentQ ? selectedAnswers[currentQuestionIndex] : undefined;
  const isAnswered = userSelected !== undefined;

  // Calculate score so far
  const totalCorrect = quizData
    ? quizData.questions.reduce((acc, q, idx) => {
        return selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc;
      }, 0)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Creator Form */}
      {!quizData && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Interactive Quiz Generator
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generate tailored multiple-choice tests with step-by-step answer rationales.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Input Mode Toggle */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setInputMode('topic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'topic'
                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Enter Topic
              </button>
              <button
                type="button"
                onClick={() => setInputMode('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'notes'
                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Paste Study Notes
              </button>
            </div>

            {inputMode === 'topic' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Quiz Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. World War II European Theater, Organic Chemistry Isomers, Calculus Integrals..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Notes Content
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Paste lecture text, textbook summary, or concepts to generate questions from..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            )}

            {/* Questions count & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Number of Questions
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {([5, 10] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        difficulty === diff
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={(!topic.trim() && !notes.trim()) || isLoading}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Formulating Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorState && (
        <ErrorMessage
          message={errorState.message}
          isRateLimit={errorState.isRateLimit}
          onRetry={handleGenerateQuiz}
        />
      )}

      {/* Active Quiz Gameplay */}
      {quizData && !isCompleted && currentQ && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quiz Top bar: Progress, Question count, reset */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {quizData.topic || topic} • {quizData.difficulty}
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Question {currentQuestionIndex + 1} of {quizData.questions.length}
              </div>
            </div>

            {/* Score so far badge */}
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Score: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCorrect}</span> / {Object.keys(selectedAnswers).length}
              </div>

              <button
                type="button"
                onClick={() => setQuizData(null)}
                className="text-xs font-medium text-slate-500 hover:text-rose-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                Exit Quiz
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = userSelected === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;

                let stateClasses = 'border-slate-200 dark:border-slate-700 hover:border-purple-300 bg-slate-50/70 dark:bg-slate-800/50';

                if (isAnswered) {
                  if (isCorrect) {
                    stateClasses = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                  } else if (isSelected) {
                    stateClasses = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
                  } else {
                    stateClasses = 'opacity-60 border-slate-200 dark:border-slate-800';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between cursor-pointer ${stateClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Card */}
            {isAnswered && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 animate-fadeIn space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {userSelected === currentQ.correctIndex ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Correct! Outstanding!
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Incorrect
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>

              {currentQuestionIndex < quizData.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  disabled={!isAnswered}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => finishQuiz(selectedAnswers)}
                  disabled={!isAnswered}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <span>View Final Results</span>
                  <Trophy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion & Final Score Screen */}
      {quizData && isCompleted && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800/80 shadow-md text-center space-y-6 animate-scaleUp">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Quiz Completed!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {quizData.topic} • {quizData.difficulty} Difficulty
            </p>
          </div>

          {/* Score Badge */}
          <div className="inline-block p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400">
              {totalCorrect} / {quizData.questions.length}
            </div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
              Score: {Math.round((totalCorrect / quizData.questions.length) * 100)}%
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry This Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuizData(null);
                setTopic('');
                setNotes('');
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              New Quiz Topic
            </button>
          </div>

          {/* Review Detailed Answers Breakdown */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-left space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Question Review & Explanations:
            </h4>
            <div className="space-y-4">
              {quizData.questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white mb-2 flex items-start justify-between gap-2">
                      <span>{idx + 1}. {q.question}</span>
                      {isCorrect ? (
                        <span className="text-emerald-600 font-bold shrink-0">✓ Correct</span>
                      ) : (
                        <span className="text-rose-600 font-bold shrink-0">✗ Missed</span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 space-y-1">
                      <div>Correct Answer: <strong className="text-emerald-700 dark:text-emerald-300">{q.options[q.correctIndex]}</strong></div>
                      {!isCorrect && userAns !== undefined && (
                        <div>Your Choice: <span className="text-rose-600 line-through">{q.options[userAns]}</span></div>
                      )}
                      <p className="mt-1 text-slate-500 dark:text-slate-400 italic">
                        Why: {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Past Performance History */}
      {!quizData && quizHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm mb-4">
            <History className="w-4 h-4 text-purple-500" />
            <span>Recent Quiz Scores</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizHistory.slice(0, 6).map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {rec.topic}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {rec.difficulty} • {rec.date}
                  </div>
                </div>
                <div
                  className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                    rec.percentage >= 70
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {rec.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
