import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Globe,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Layers,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { ConceptExplanation } from '../../types';
import { ErrorMessage } from '../common/ErrorMessage';
import { saveStoredConcept, getStoredConcept } from '../../utils/storage';

const SAMPLE_TOPICS = [
  'Black Holes & Event Horizon',
  'Mitochondria & ATP Cellular Energy',
  'Supply and Demand in Economics',
  'Object-Oriented Programming (OOP)',
  'Plate Tectonics & Continental Drift',
  'The Doppler Effect in Sound & Light',
];

export const ConceptExplainer: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ConceptExplanation | null>(() => getStoredConcept());
  const [errorState, setErrorState] = useState<{ message: string; isRateLimit: boolean } | null>(null);

  // Quick check state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExplain = async (customTopic?: string) => {
    const topicToSearch = (customTopic || topic).trim();
    if (!topicToSearch || isLoading) return;

    setIsLoading(true);
    setErrorState(null);
    setSelectedOption(null);
    setShowAnswer(false);

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToSearch,
          level,
          subject: subject.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to explain concept.');
      }

      setExplanation(data);
      saveStoredConcept(data);
    } catch (err: any) {
      console.error('Explainer error:', err);
      const is429 = err.message?.includes('429') || err.message?.includes('Too many requests');
      setErrorState({
        message: err.message || 'Could not explain concept. Please check your network and try again.',
        isRateLimit: is429,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyExplanation = () => {
    if (!explanation) return;
    const text = `# ${explanation.topic} (${explanation.level} Level)\n\n## Simple Definition\n${explanation.simpleDefinition}\n\n## Everyday Analogy\n${explanation.analogy}\n\n## Key Points\n${explanation.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n## Real-World Example\n${explanation.realWorldExample}\n\n## Golden Recap\n${explanation.recap}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Concept Explainer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Break down any confusing topic into clear definitions, intuitive analogies, and real-life examples.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExplain();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Concept or Topic to Master
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. CRISPR gene editing, Bayes Theorem, Keynesian economics, Quantum tunneling..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Level Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Explanation Depth
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      level === lvl
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Subject */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Subject or Context (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. AP Biology, Grade 10 Physics, CS 101"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 font-medium mr-2">Try sample:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {SAMPLE_TOPICS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTopic(item);
                    handleExplain(item);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!topic.trim() || isLoading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Concept...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Concept</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {errorState && (
        <ErrorMessage
          message={errorState.message}
          isRateLimit={errorState.isRateLimit}
          onRetry={() => handleExplain()}
        />
      )}

      {/* Output Display */}
      {explanation && !isLoading && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Card with Copy */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {explanation.level} Level
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {explanation.topic}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyExplanation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Simple Definition */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Simple Definition</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {explanation.simpleDefinition}
                </p>
              </div>
            </div>

            {/* 2. Vivid Everyday Analogy */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:to-slate-900/40 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Everyday Analogy</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                  "{explanation.analogy}"
                </p>
              </div>
            </div>
          </div>

          {/* 3. Key Points */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm mb-3">
              <Layers className="w-4 h-4" />
              <span>Core Key Points</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {explanation.keyPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Real World Example & Golden Recap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-2">
                <Globe className="w-4 h-4" />
                <span>Real-World Application</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {explanation.realWorldExample}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent dark:from-indigo-950/40 dark:to-slate-900/40 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Golden Recap</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm leading-relaxed">
                {explanation.recap}
              </p>
            </div>
          </div>

          {/* 5. Quick Comprehension Check */}
          {explanation.quickCheck && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm mb-3">
                <HelpCircle className="w-4 h-4" />
                <span>Quick Check: Test Your Understanding</span>
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                {explanation.quickCheck.question}
              </h4>

              <div className="space-y-2 mb-4">
                {explanation.quickCheck.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrect = idx === explanation.quickCheck.correctIndex;
                  let btnStyle = 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-slate-50 dark:bg-slate-800/60';

                  if (showAnswer) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                    } else if (isChosen) {
                      btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    }
                  } else if (isChosen) {
                    btnStyle = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !showAnswer && setSelectedOption(idx)}
                      className={`w-full text-left p-3 rounded-2xl border text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {showAnswer && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {!showAnswer ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={() => setShowAnswer(true)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Check Answer
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">
                    {selectedOption === explanation.quickCheck.correctIndex ? '🎉 Spot on!' : '💡 Good try!'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {explanation.quickCheck.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
