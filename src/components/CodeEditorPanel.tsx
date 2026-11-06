import React, { useMemo, useState } from 'react';
import { AlgorithmProblem, ExecutionStep, Language } from '../types/visualizer';
import {
  getBugChallenge,
  LANGUAGE_LABELS,
  LocalTestCaseResult,
  runLocalTestSuite,
} from '../utils/zeroCostEngines';
import { Bug, Check, Play, RotateCcw, Sparkles, Terminal, X } from 'lucide-react';

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

const ALL_LANGUAGES: Language[] = ['python', 'java', 'cpp', 'go', 'typescript', 'rust'];

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
  const [bugHunterActive, setBugHunterActive] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<LocalTestCaseResult[] | null>(null);
  const [autoLoadedFailLabel, setAutoLoadedFailLabel] = useState<string | null>(null);

  const lines = code.split('\n');
  const activeLine =
    language === 'python'
      ? currentStep.pythonLine
      : Math.min(lines.length, Math.max(1, currentStep.javaLine));

  const solutionMeta = language === 'python' ? problem.python : problem.java;
  const bugChallenge = useMemo(() => getBugChallenge(problem), [problem]);

  const toggleBreakpoint = (lineNum: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  const executeSuiteAndAutoOpenFailure = (targetCode: string, targetLang: Language) => {
    const results = runLocalTestSuite(problem, targetCode, targetLang);
    setTestSuiteResults(results);
    const firstFailed = results.find((r) => !r.passed);
    if (firstFailed) {
      onCustomInputChange(firstFailed.input);
      setAutoLoadedFailLabel(`${firstFailed.label} (${firstFailed.input})`);
    } else {
      setAutoLoadedFailLabel(null);
    }
  };

  const handleToggleBugHunter = () => {
    if (bugHunterActive) {
      setBugHunterActive(false);
      setAutoLoadedFailLabel(null);
      onResetCode();
      setTestSuiteResults(null);
    } else {
      setBugHunterActive(true);
      const buggy =
        bugChallenge.buggyCodeByLang[language] || bugChallenge.buggyCodeByLang.python;
      onCodeChange(buggy);
      setIsEditingCode(true);
      executeSuiteAndAutoOpenFailure(buggy, language);
    }
  };

  const handleRunTestSuite = () => {
    executeSuiteAndAutoOpenFailure(code, language);
  };

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] overflow-hidden">
      {/* Editor Header Bar */}
      <div className="flex flex-col gap-2.5 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
        {/* 6-Language Switcher (Python, Java, C++20, Go, TypeScript, Rust) */}
        <div className="flex flex-wrap items-center gap-1 p-0.5 bg-neutral-200/70 dark:bg-neutral-800 rounded-md">
          {ALL_LANGUAGES.map((langKey) => (
            <button
              key={langKey}
              type="button"
              onClick={() => {
                onLanguageChange(langKey);
                setTestSuiteResults(null);
                setAutoLoadedFailLabel(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                language === langKey
                  ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {LANGUAGE_LABELS[langKey]}
            </button>
          ))}
        </div>

        {/* Mode & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleBugHunter}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                bugHunterActive
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              {bugHunterActive ? 'Restore Canonical Fix' : 'Bug Hunter Mode'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingCode(!isEditingCode)}
              className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
            >
              {isEditingCode ? 'Step Trace View' : 'Edit Source Code'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setBugHunterActive(false);
              setTestSuiteResults(null);
              setAutoLoadedFailLabel(null);
              onResetCode();
            }}
            aria-label="Reset code to canonical solution"
            className="p-1.5 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-md transition-colors"
            title="Reset to canonical solution"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bug Hunter Active Callout */}
      {bugHunterActive && (
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs space-y-1">
          <div className="font-mono font-semibold text-neutral-950 dark:text-white flex items-center justify-between">
            <span>BUG HUNTER CHALLENGE: {bugChallenge.bugTitle}</span>
            <span>Line ~{bugChallenge.brokenLineNumber}</span>
          </div>
          <p className="text-neutral-700 dark:text-neutral-300">{bugChallenge.symptom}</p>
          <p className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
            Fix Hint: {bugChallenge.fixExplanation}
          </p>
        </div>
      )}

      {/* Code Viewport */}
      {isEditingCode ? (
        <div className="p-3 bg-neutral-50 dark:bg-[#0D0D0D]">
          <label htmlFor="source-code-editor" className="sr-only">
            Source Code Editor ({LANGUAGE_LABELS[language]})
          </label>
          <textarea
            id="source-code-editor"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            rows={15}
            spellCheck={false}
            className="w-full font-mono text-xs leading-6 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none resize-y p-2.5 rounded border border-neutral-300 dark:border-neutral-800"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Edit {LANGUAGE_LABELS[language]} code, run the 16-case verification suite, or trace custom execution.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunTestSuite}
                className="px-3 py-1.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
              >
                Verify 16-Case Suite
              </button>
              <button
                type="button"
                onClick={onRunGeminiCustomTrace}
                disabled={isTracingGemini}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 disabled:opacity-50 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isTracingGemini ? 'Tracing Memory...' : 'Trace Custom Code'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="overflow-x-auto py-3 bg-white dark:bg-[#0D0D0D]"
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
                      ? 'bg-neutral-900/10 dark:bg-neutral-100/15 text-neutral-950 dark:text-white font-semibold'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="w-12 shrink-0 flex items-center justify-between pr-3 text-neutral-400 dark:text-neutral-500 tabular-nums">
                    <span className="w-3 text-[10px] text-neutral-950 dark:text-neutral-100 font-bold">
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

      {/* Complexity & 16-Case Test Runner Strip */}
      <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-neutral-500 dark:text-neutral-400 font-mono">
          <span>
            Time: <strong className="text-neutral-950 dark:text-neutral-200">{solutionMeta.timeComplexity}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Space: <strong className="text-neutral-950 dark:text-neutral-200">{solutionMeta.spaceComplexity}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleRunTestSuite}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Run 16 Hidden Edge Cases
        </button>
      </div>

      {/* Local 16-Test-Case Suite Results Panel */}
      {testSuiteResults && (
        <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-neutral-950 dark:text-white">
              Edge-Case Verification Suite ({testSuiteResults.filter((r) => r.passed).length}/{testSuiteResults.length} Passed)
            </span>
            <button
              type="button"
              onClick={() => setTestSuiteResults(null)}
              className="text-neutral-500 hover:text-neutral-950 dark:hover:text-white"
            >
              Hide
            </button>
          </div>
          {autoLoadedFailLabel && (
            <div className="p-2 rounded border border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-950 text-[11px] font-mono text-neutral-900 dark:text-neutral-100">
              Auto-Opened Failing Test Case in Memory Visualizer: <strong>{autoLoadedFailLabel}</strong>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-[#111111]">
            {testSuiteResults.map((tc) => (
              <div
                key={tc.id}
                className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tc.passed ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 text-[10px] font-bold">
                        <Check className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-neutral-900 dark:border-neutral-100 text-neutral-950 dark:text-white text-[10px] font-bold">
                        <X className="w-3 h-3" /> FAIL
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-400">
                      {tc.category}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {tc.label}
                    </span>
                    <span className="text-neutral-400">({tc.stepsCount} steps · {tc.peakHeapBytes}B)</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    Input: {tc.input} → {tc.actualOutput}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCustomInputChange(tc.input)}
                  className="px-2 py-1 text-[11px] rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shrink-0"
                >
                  Load in Visualizer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Custom Input & Sample Presets Bar */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="custom-test-input"
            className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            Test Case Input
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {problem.sampleInputs.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => onCustomInputChange(sample.value)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                  customInput === sample.value
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-medium'
                    : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
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
            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
          />
          <button
            type="button"
            onClick={onRunTrace}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Load Input (Line 1)
          </button>
        </div>
      </div>
    </div>
  );
};
