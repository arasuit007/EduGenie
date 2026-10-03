import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Shuffle,
  Plus,
  Trash2,
  BookmarkCheck,
  Eye,
} from 'lucide-react';
import { Flashcard, FlashcardDeck as FlashcardDeckType } from '../../types';
import { ErrorMessage } from '../common/ErrorMessage';
import { getStoredFlashcards, saveStoredFlashcards } from '../../utils/storage';

interface FlashcardDeckProps {
  onDeckUpdated?: () => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ onDeckUpdated }) => {
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [inputMode, setInputMode] = useState<'topic' | 'notes'>('topic');
  const [count, setCount] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; isRateLimit: boolean } | null>(null);

  // Deck State
  const [deck, setDeck] = useState<FlashcardDeckType | null>(() => getStoredFlashcards());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [showHint, setShowHint] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleGenerateDeck = async () => {
    const payloadTopic = inputMode === 'topic' ? topic.trim() : '';
    const payloadNotes = inputMode === 'notes' ? notes.trim() : '';

    if (!payloadTopic && !payloadNotes) return;

    setIsLoading(true);
    setErrorState(null);
    setIsFlipped(false);
    setShowHint(false);

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: payloadTopic,
          notes: payloadNotes,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate flashcards.');
      }

      setDeck(data);
      saveStoredFlashcards(data);
      setCurrentIndex(0);
      onDeckUpdated?.();
    } catch (err: any) {
      console.error('Flashcard error:', err);
      const is429 = err.message?.includes('429') || err.message?.includes('Too many requests');
      setErrorState({
        message: err.message || 'Could not generate flashcards. Please try again.',
        isRateLimit: is429,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleKnown = (cardId: string) => {
    if (!deck) return;
    const updatedCards = deck.cards.map((c) =>
      c.id === cardId ? { ...c, known: !c.known } : c
    );
    const updatedDeck = { ...deck, cards: updatedCards };
    setDeck(updatedDeck);
    saveStoredFlashcards(updatedDeck);
    onDeckUpdated?.();
  };

  const handleShuffle = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    const updatedDeck = { ...deck, cards: shuffled };
    setDeck(updatedDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  // Filter cards based on user selection
  const filteredCards = deck
    ? deck.cards.filter((card) => {
        if (filterMode === 'mastered') return card.known === true;
        if (filterMode === 'unmastered') return !card.known;
        return true;
      })
    : [];

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredCards.length - 1));
  const currentCard = filteredCards[safeIndex];

  const handleNext = () => {
    if (safeIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(safeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(safeIndex - 1);
    }
  };

  const masteredCount = deck ? deck.cards.filter((c) => c.known).length : 0;
  const totalDeckCount = deck ? deck.cards.length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Flashcard Generation Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Flashcard Studio
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generate active-recall flashcard decks from any topic or raw notes with hints.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setInputMode('topic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'topic'
                  ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300'
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
                  ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              From Notes
            </button>
          </div>

          {inputMode === 'topic' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Deck Subject or Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Spanish Irregular Verbs, Organic Chemistry Functional Groups, World Geography Capitals..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Notes to convert into Flashcards
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Paste key terms, definitions, formulas, or lecture points here..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Card count:</span>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[6, 8, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      count === num
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateDeck}
              disabled={(!topic.trim() && !notes.trim()) || isLoading}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Flashcards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Deck</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorState && (
        <ErrorMessage
          message={errorState.message}
          isRateLimit={errorState.isRateLimit}
          onRetry={handleGenerateDeck}
        />
      )}

      {/* Deck Controls & Active Flashcard */}
      {deck && filteredCards.length > 0 && currentCard && (
        <div className="space-y-4 animate-fadeIn">
          {/* Deck Header: Title, Mastered count, Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate max-w-sm">
                {deck.deckTitle}
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mastered: <span className="font-bold text-emerald-600 dark:text-emerald-400">{masteredCount}</span> of {totalDeckCount} cards
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                {(['all', 'unmastered', 'mastered'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setFilterMode(mode);
                      setCurrentIndex(0);
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                      filterMode === mode
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleShuffle}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Shuffle Deck"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Flip Flashcard */}
          <div className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] flex items-center justify-center">
            <div
              onClick={() => setIsFlipped((prev) => !prev)}
              className={`relative w-full h-[320px] sm:h-[360px] rounded-3xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-lg hover:shadow-xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                    {currentCard.category || 'Concept'}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Card {safeIndex + 1} of {filteredCards.length}</span>
                    {currentCard.known && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mastered
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center my-auto px-4">
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-widest block mb-2">
                    Question / Term
                  </span>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentCard.front}
                  </h4>

                  {/* Hint Toggle */}
                  {currentCard.hint && (
                    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                      {showHint ? (
                        <div className="inline-block px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs border border-amber-200/60 dark:border-amber-900/60">
                          💡 Hint: {currentCard.hint}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowHint(true)}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show hint</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Click or press Space to reveal answer</span>
                  <RotateCw className="w-4 h-4 animate-spin-slow" />
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-indigo-700/60 flex flex-col justify-between select-none shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-800/80 text-indigo-200 border border-indigo-700">
                    Answer & Explanation
                  </span>
                  <span className="text-xs text-indigo-300">
                    Card {safeIndex + 1} of {filteredCards.length}
                  </span>
                </div>

                <div className="my-auto px-4 text-center">
                  <p className="text-base sm:text-xl font-medium leading-relaxed text-indigo-100">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-300 pt-2 border-t border-indigo-800/60">
                  <span>Click to flip back</span>
                  <RotateCw className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Mastery Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={safeIndex === 0}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                title="Previous card (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={safeIndex === filteredCards.length - 1}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                title="Next card (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <span className="text-xs text-slate-400 font-medium px-2">
                Card {safeIndex + 1} / {filteredCards.length}
              </span>
            </div>

            {/* "Mark as Known" Toggle */}
            <button
              type="button"
              onClick={() => handleToggleKnown(currentCard.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                currentCard.known
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${
                  currentCard.known ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span>{currentCard.known ? 'Marked as Known' : 'Mark as Known'}</span>
            </button>
          </div>
        </div>
      )}

      {/* If filtered cards is empty */}
      {deck && filteredCards.length === 0 && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookmarkCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-bold text-base text-slate-900 dark:text-white">
            No cards found in this filter
          </h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try switching back to "All" to review your deck.
          </p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold cursor-pointer"
          >
            Show All Cards
          </button>
        </div>
      )}
    </div>
  );
};
