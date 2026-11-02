import React, { useState } from 'react';
import { AlgorithmProblem, ExecutionStep, Language } from '../types/visualizer';
import { Play, RotateCcw, Sparkles, Terminal } from 'lucide-react';

interface CodeEditorPanelProps {
  problem: AlgorithmProblem;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  code: string;
  onCodeChange: (newCode: string) => void;
  onResetCode: () => void;
  customInput: string;
  onCustomInputChange: (val: string) => void;
  onRunTrace: () => void;
  onRunGeminiCustomTrace: () => void;
  isTracingGemini: boolean;
  currentStep: ExecutionStep;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  problem,
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onResetCode,
  customInput,
  onCustomInputChange,
  onRunTrace,
  onRunGeminiCustomTrace,
  isTracingGemini,
  currentStep,
}) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

  const activeLine = language === 'python' ? currentStep.pythonLine : currentStep.javaLine;
  const lines = code.split('\n');
  const solutionMeta = language === 'python' ? problem.python : problem.java;

  const toggleBreakpoint = (lineNum: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] overflow-hidden">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        {/* Python / Java Language Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => onLanguageChange('python')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              language === 'python'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Python 3.12
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('java')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              language === 'java'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Java 21 LTS
          </button>
        </div>

        {/* Mode & Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingCode(!isEditingCode)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {isEditingCode ? 'Step Trace View' : 'Edit Source Code'}
          </button>
          <button
            type="button"
            onClick={onResetCode}
            aria-label="Reset code to canonical solution"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
            title="Reset to canonical solution"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Viewport: Interactive Line-Highlighted Debugger or Editable Textarea */}
      {isEditingCode ? (
        <div className="p-3 bg-slate-950">
          <label htmlFor="source-code-editor" className="sr-only">
            Source Code Editor ({language})
          </label>
          <textarea
            id="source-code-editor"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            rows={15}
            spellCheck={false}
            className="w-full font-mono text-xs leading-6 bg-slate-950 text-slate-100 focus:outline-none resize-y p-2 rounded border border-slate-800"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              Modify the {language === 'python' ? 'Python' : 'Java'} implementation above and trace execution with Gemini AI.
            </span>
            <button
              type="button"
              onClick={onRunGeminiCustomTrace}
              disabled={isTracingGemini}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isTracingGemini ? 'Tracing Memory...' : 'Trace Custom Code with Gemini'}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="overflow-x-auto py-3 bg-slate-50/40 dark:bg-[#0B0F17]"
          role="region"
          aria-label="Step-by-step code execution viewer"
        >
          <div className="min-w-max font-mono text-xs leading-6">
            {lines.map((lineText, idx) => {
              const lineNumber = idx + 1;
              const isCurrent = lineNumber === activeLine;
              const hasBp = breakpoints.has(lineNumber);

              return (
                <div
                  key={lineNumber}
                  onClick={() => toggleBreakpoint(lineNumber)}
                  className={`flex items-center px-3 cursor-pointer select-none transition-colors ${
                    isCurrent
                      ? 'bg-sky-500/15 dark:bg-sky-500/20 text-slate-950 dark:text-white font-medium'
                      : 'hover:bg-slate-200/40 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {/* Breakpoint & Active Execution Arrow Gutter */}
                  <div className="w-12 shrink-0 flex items-center justify-between pr-3 text-slate-400 dark:text-slate-500 tabular-nums">
                    <span className="w-3 text-[10px] text-amber-500 font-bold">
                      {isCurrent ? '▶' : hasBp ? '●' : ''}
                    </span>
                    <span>{lineNumber}</span>
                  </div>
                  <pre className="whitespace-pre font-mono">{lineText || ' '}</pre>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complexity & Memory Footprint Strip */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
          <span>Time: <strong className="text-slate-900 dark:text-slate-200">{solutionMeta.timeComplexity}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Space: <strong className="text-slate-900 dark:text-slate-200">{solutionMeta.spaceComplexity}</strong></span>
        </div>
      </div>

      {/* Live Custom Input & Sample Presets Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="custom-test-input"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-500" />
            Interactive Test Case Input
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {problem.sampleInputs.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => onCustomInputChange(sample.value)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                  customInput === sample.value
                    ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="custom-test-input"
            type="text"
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            placeholder="Enter custom array, linked list, or target..."
            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={onRunTrace}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Execute &amp; Trace
          </button>
        </div>
      </div>
    </div>
  );
};
