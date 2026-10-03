import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  FileCheck,
  X,
  Copy,
  Check,
  Download,
  List,
  Bookmark,
  AlignLeft,
} from 'lucide-react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { ErrorMessage } from '../common/ErrorMessage';

type FormatType = 'short_summary' | 'bullet_points' | 'key_terms';

const SAMPLE_NOTES = `Cellular respiration is a series of chemical reactions that break down glucose to produce ATP, which may be used as energy to power many reactions throughout the body. There are three main steps of cellular respiration: glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation.
Glycolysis produces 2 ATP molecules and occurs in the cytoplasm without oxygen (anaerobic).
The citric acid cycle takes place in the mitochondrial matrix and generates electron carriers (NADH and FADH2) along with 2 ATP.
Oxidative phosphorylation takes place across the inner mitochondrial membrane via the electron transport chain and ATP synthase, producing approximately 26 to 28 ATP molecules. In total, a single molecule of glucose yields about 30-32 ATP. Oxygen serves as the final electron acceptor, combining with protons to form water. Without oxygen, cells revert to fermentation (such as lactic acid fermentation in human muscles or alcoholic fermentation in yeast).`;

export const NotesSummarizer: React.FC = () => {
  const [text, setText] = useState('');
  const [format, setFormat] = useState<FormatType>('short_summary');
  const [fileData, setFileData] = useState<{
    base64: string;
    mimeType: string;
    fileName: string;
    fileSizeKb: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string>('');
  const [errorState, setErrorState] = useState<{ message: string; isRateLimit: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();

    if (file.type === 'text/plain') {
      reader.onload = () => {
        const content = reader.result as string;
        setText(content);
        setFileData(null);
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        setFileData({
          base64,
          mimeType: file.type,
          fileName: file.name,
          fileSizeKb: Math.round(file.size / 1024),
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a .txt or .pdf file.');
    }
  };

  const handleRemoveFile = () => {
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSummarize = async () => {
    if (!text.trim() && !fileData) return;

    setIsLoading(true);
    setErrorState(null);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          fileData,
          format,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to summarize notes.');
      }

      setSummaryResult(data.summary || '');
    } catch (err: any) {
      console.error('Summarize error:', err);
      const is429 = err.message?.includes('429') || err.message?.includes('Too many requests');
      setErrorState({
        message: err.message || 'Could not summarize notes. Please try again.',
        isRateLimit: is429,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summaryResult) return;
    const blob = new Blob([summaryResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edugenie-summary-${format}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Notes Summarizer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste lectures, book chapters, or upload a .txt/.pdf to distill the vital concepts.
            </p>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Select Output Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'short_summary', label: 'Short Summary', icon: AlignLeft, desc: 'Executive overview & key takeaways' },
              { id: 'bullet_points', label: 'Bullet Points', icon: List, desc: 'Hierarchical study outline' },
              { id: 'key_terms', label: 'Key Terms & Defs', icon: Bookmark, desc: 'Vocabulary & formula glossary' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = format === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormat(tab.id as FormatType)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-xs">{tab.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{tab.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Text Area or Uploaded File Banner */}
        <div className="space-y-3">
          {fileData ? (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {fileData.fileName}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">
                    PDF Document • {fileData.fileSizeKb} KB ready for Gemini parsing
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Remove attached file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="Paste your study notes, essay, article, or lecture transcript here..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1">
                <span>{wordCount} words</span>
                {!text && (
                  <button
                    type="button"
                    onClick={() => setText(SAMPLE_NOTES)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    Paste sample notes (Biology)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Row: Upload File & Summarize Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt or .pdf file</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {(text || fileData) && (
                <button
                  type="button"
                  onClick={() => {
                    setText('');
                    handleRemoveFile();
                    setSummaryResult('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={handleSummarize}
                disabled={(!text.trim() && !fileData) || isLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Distilling Notes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {errorState && (
        <ErrorMessage
          message={errorState.message}
          isRateLimit={errorState.isRateLimit}
          onRetry={handleSummarize}
        />
      )}

      {/* Summary Output */}
      {summaryResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm animate-fadeIn space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                {format.replace('_', ' ')}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy markdown"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download markdown file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save .md</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <MarkdownRenderer content={summaryResult} />
          </div>
        </div>
      )}
    </div>
  );
};
