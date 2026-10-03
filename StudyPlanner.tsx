import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Clock,
  BookOpen,
  CheckCircle2,
  Printer,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Award,
  Zap,
} from 'lucide-react';
import { StudyPlan, StudyDay, StudyBlock } from '../../types';
import { ErrorMessage } from '../common/ErrorMessage';
import { getStoredStudyPlan, saveStoredStudyPlan } from '../../utils/storage';

export const StudyPlanner: React.FC = () => {
  const [subjectsInput, setSubjectsInput] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState<number>(3);
  const [pace, setPace] = useState<'Light' | 'Balanced' | 'Intensive'>('Balanced');

  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(() => getStoredStudyPlan());
  const [errorState, setErrorState] = useState<{ message: string; isRateLimit: boolean } | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const handleGeneratePlan = async () => {
    if (!subjectsInput.trim()) return;

    setIsLoading(true);
    setErrorState(null);

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjectsInput.split(',').map((s) => s.trim()).filter(Boolean),
          examDate: examDate || 'In 14 days',
          hoursPerDay,
          pace,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate study plan.');
      }

      const newPlan: StudyPlan = {
        ...data,
        createdDate: new Date().toLocaleDateString(),
      };

      setPlan(newPlan);
      saveStoredStudyPlan(newPlan);
    } catch (err: any) {
      console.error('Planner error:', err);
      const is429 = err.message?.includes('429') || err.message?.includes('Too many requests');
      setErrorState({
        message: err.message || 'Could not generate study schedule. Please try again.',
        isRateLimit: is429,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = (dayIndex: number, blockIndex: number) => {
    if (!plan) return;
    const updatedDays = [...plan.days];
    const targetBlock = updatedDays[dayIndex].blocks[blockIndex];
    targetBlock.completed = !targetBlock.completed;

    const updatedPlan = { ...plan, days: updatedDays };
    setPlan(updatedPlan);
    saveStoredStudyPlan(updatedPlan);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate overall completed blocks percentage
  const totalBlocks = plan
    ? plan.days.reduce((acc, d) => acc + d.blocks.length, 0)
    : 0;
  const completedBlocks = plan
    ? plan.days.reduce(
        (acc, d) => acc + d.blocks.filter((b) => b.completed).length,
        0
      )
    : 0;
  const completionPercentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Planner Generator Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all print:hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Smart Study Planner
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create a personalized daily study timeline with active recall and scheduled revision cycles.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGeneratePlan();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Subjects / Topics to Cover (separated by commas)
            </label>
            <input
              type="text"
              value={subjectsInput}
              onChange={(e) => setSubjectsInput(e.target.value)}
              placeholder="e.g. Organic Chemistry, Linear Algebra, Macroeconomics, Modern European History"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Target Exam Date or Deadline
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Available Study Hours / Day: <strong className="text-emerald-600">{hoursPerDay} hrs</strong>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 mt-2 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Study Pace
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['Light', 'Balanced', 'Intensive'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPace(p)}
                    className={`py-2 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      pace === p
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!subjectsInput.trim() || isLoading}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Structuring Study Roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error display */}
      {errorState && (
        <ErrorMessage
          message={errorState.message}
          isRateLimit={errorState.isRateLimit}
          onRetry={handleGeneratePlan}
        />
      )}

      {/* Generated Study Schedule */}
      {plan && (
        <div className="space-y-4 animate-fadeIn">
          {/* Plan Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {plan.totalDays} Days Roadmap
                </span>
                <span className="text-xs text-slate-400">Target: {plan.dailyHoursTarget} hrs/day</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {plan.planTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {plan.overview}
              </p>
            </div>

            {/* Print and View Toggle */}
            <div className="flex items-center gap-2 shrink-0 print:hidden">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'timeline'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Table
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Print or Save PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                {completionPercentage}%
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Study Progress: {completedBlocks} of {totalBlocks} sessions completed
                </div>
                <div className="w-48 sm:w-72 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {completionPercentage === 100 && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-bounce">
                <Award className="w-4 h-4" />
                All Sessions Completed!
              </span>
            )}
          </div>

          {/* Day by Day View */}
          {viewMode === 'timeline' ? (
            <div className="space-y-4">
              {plan.days.map((day, dayIdx) => (
                <div
                  key={day.dayNumber}
                  className={`rounded-3xl p-6 border transition-all ${
                    day.isRevisionDay
                      ? 'bg-gradient-to-r from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-900/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {day.dateOrLabel}
                      </span>
                      {day.isRevisionDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          ⭐ Spaced Revision Day
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Focus: <strong className="text-slate-800 dark:text-slate-200">{day.theme}</strong>
                    </span>
                  </div>

                  {/* Study Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {day.blocks.map((block, blockIdx) => (
                      <div
                        key={blockIdx}
                        onClick={() => handleToggleBlock(dayIdx, blockIdx)}
                        className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${
                          block.completed
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-slate-500 dark:text-slate-400'
                            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {block.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                              {block.timeSlot}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {block.technique}
                            </span>
                          </div>
                          <div className={`font-semibold text-xs text-slate-900 dark:text-white ${block.completed ? 'line-through opacity-70' : ''}`}>
                            {block.subject}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                            {block.task}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily Retention Tip */}
                  {day.dailyTip && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5 pt-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{day.dailyTip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/70 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Day / Date</th>
                    <th className="px-4 py-3">Focus Theme</th>
                    <th className="px-4 py-3">Sessions & Tasks</th>
                    <th className="px-4 py-3">Study Technique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {plan.days.map((day) => (
                    <tr
                      key={day.dayNumber}
                      className={day.isRevisionDay ? 'bg-purple-50/30 dark:bg-purple-950/20 font-medium' : ''}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {day.dateOrLabel}
                        {day.isRevisionDay && (
                          <span className="block text-[10px] text-purple-600 font-semibold">Revision</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {day.theme}
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        {day.blocks.map((b, idx) => (
                          <div key={idx} className="leading-snug">
                            <strong className="text-indigo-600 dark:text-indigo-400">[{b.timeSlot} - {b.subject}]</strong> {b.task}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {day.blocks.map((b) => b.technique).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
