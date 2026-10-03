import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-sm px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match ? match[1] : ''}>{String(children).replace(/\n$/, '')}</CodeBlock>;
          },
          h1({ children }) {
            return <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3 mb-2 tracking-tight">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mt-2.5 mb-1.5">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1 text-slate-700 dark:text-slate-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-700 dark:text-slate-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="my-2 leading-relaxed">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 pl-4 py-1.5 my-3 italic text-slate-700 dark:text-slate-300 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm divide-y divide-slate-200 dark:divide-slate-800">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 font-semibold text-slate-900 dark:text-white">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; children: string }> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/90 text-xs font-mono text-slate-400 border-b border-slate-700/60">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-slate-700/60"
          title="Copy code"
          type="button"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-slate-100">
        <code>{children}</code>
      </pre>
    </div>
  );
};
