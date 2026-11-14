import React, { useEffect, useMemo, useState } from 'react';
import { AlgorithmProblem, ExecutionStep, Language } from '../types/visualizer';
import {
  getBugChallenge,
  LANGUAGE_LABELS,
  LocalTestCaseResult,
  runLocalTestSuite,
} from '../utils/zeroCostEngines';
import { BookOpen, Bug, Check, ChevronLeft, ChevronRight, Play, RotateCcw, Sparkles, Terminal, X } from 'lucide-react';

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
  stepIndex?: number;
  totalSteps?: number;
  onStepCommand?: (action: 'next' | 'prev' | 'reset' | 'goto', stepIndex?: number) => void;
}

type LineExplanations = Record<number, string>;

// Small stable hash so explanations can be cached per code version in localStorage
function hashCode(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
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
  stepIndex,
  totalSteps,
  onStepCommand,
}) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [bugHunterActive, setBugHunterActive] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<LocalTestCaseResult[] | null>(null);
  const [autoLoadedFailLabel, setAutoLoadedFailLabel] = useState<string | null>(null);

  const [pinnedLine, setPinnedLine] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<LineExplanations | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const lines = code.split('\n');
  const explainKey = `tracecraft-explain-${language}-${hashCode(code)}`;

  // Load cached explanations for this exact code; reset when code, language or problem changes
  useEffect(() => {
    setPinnedLine(null);
    setExplainError(null);
    try {
      const saved = window.localStorage.getItem(explainKey);
      setExplanations(saved ? (JSON.parse(saved) as LineExplanations) : null);
    } catch {
      setExplanations(null);
    }
  }, [explainKey, problem.id]);

  const handleExplainLines = async () => {
    setIsExplaining(true);
    setExplainError(null);
    try {
      const res = await fetch('/api/tutor/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, problemTitle: problem.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not explain the code.');
      const map: LineExplanations = {};
      for (const l of data.lines || []) map[l.line] = l.text;
      setExplanations(map);
      try {
        window.localStorage.setItem(explainKey, JSON.stringify(map));
      } catch {
        // storage full or unavailable: explanations still work for this session
      }
    } catch (err: any) {
      setExplainError(err?.message || 'Could not explain the code.');
    } finally {
      setIsExplaining(false);
    }
  };
  const activeLine =
    language === 'python'
      ? currentStep.pythonLine
      : Math.min(lines.length, Math.max(1, currentStep.javaLine));

  const solutionMeta = language === 'python' ? problem.python : problem.java;
  const bugChallenge = useMemo(() => getBugChallenge(problem), [problem]);

  // Compute inline ghost value (VS Code / Error Lens style) for the active line
  const inlineGhost = useMemo(() => {
    const changedVar = currentStep.stackFrames?.[0]?.variables?.find((v) => v.changed);
    if (changedVar) {
      return `${changedVar.isPointer ? `*${changedVar.name}` : changedVar.name} = ${changedVar.value}`;
    }
    if (currentStep.pointers && currentStep.pointers.length > 0) {
      const p = currentStep.pointers[0];
      return p.deltaDescription || `*${p.name} → ${p.targetAddress}`;
    }
    return currentStep.memoryMutation?.split('.')[0] || '';
  }, [currentStep]);

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
    <div className="flex flex-col rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Unified VS Code Floating Debugger Bar docked directly atop code */}
      {onStepCommand && typeof stepIndex === 'number' && typeof totalSteps === 'number' && (
        <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-neutral-900 text-white dark:bg-[#161B22] border-b border-neutral-800 text-xs font-mono select-none">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStepCommand('reset')}
              disabled={stepIndex === 0}
              title="Reset execution to Line 1 (|<)"
              className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-300" />
            </button>
            <button
              type="button"
              onClick={() => onStepCommand('prev')}
              disabled={stepIndex === 0}
              title="Step Back (<)"
              className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-300" />
            </button>
            <button
              type="button"
              onClick={() => onStepCommand('next')}
              disabled={stepIndex >= totalSteps - 1}
              title="Step Over / Next Line Execution (▶)"
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-30 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Step</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-300 tabular-nums">
              Step <strong className="text-white">{stepIndex + 1}</strong> of {totalSteps} · Line {activeLine}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={stepIndex}
              onChange={(e) => onStepCommand('goto', Number(e.target.value))}
              className="w-16 sm:w-28 accent-blue-500 cursor-pointer h-1.5"
            />
          </div>
        </div>
      )}

      {/* Editor Sub-Header: Language Switcher & Modes */}
      <div className="flex flex-col gap-2.5 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-900/60">
        {/* 6-Language Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-md">
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
              onClick={handleExplainLines}
              disabled={isExplaining}
              title="Ask the AI mentor to explain every line"
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {isExplaining ? 'Explaining...' : explanations ? 'Re-explain lines' : 'Explain lines'}
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
            <span className="tabular-nums">Line ~{bugChallenge.brokenLineNumber}</span>
          </div>
          <p className="text-neutral-700 dark:text-neutral-300">{bugChallenge.symptom}</p>
          <p className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
            Fix Hint: {bugChallenge.fixExplanation}
          </p>
        </div>
      )}

      {/* Code Viewport with Line-Level Micro-Indicators (Ghost Values) */}
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
            className="w-full font-mono text-xs leading-6 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none resize-y p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-800"
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
                  onClick={() => setPinnedLine((p) => (p === lineNumber ? null : lineNumber))}
                  className={`flex items-center px-3 cursor-pointer select-none transition-colors ${
                    isCurrent
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 text-neutral-950 dark:text-white font-semibold'
                      : pinnedLine === lineNumber
                      ? 'bg-amber-500/10 dark:bg-amber-400/10 text-neutral-950 dark:text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBreakpoint(lineNumber);
                    }}
                    title="Click to toggle breakpoint"
                    className="w-12 shrink-0 flex items-center justify-between pr-3 text-neutral-400 dark:text-neutral-500 tabular-nums">
                    <span className="w-3 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                      {isCurrent ? '▶' : hasBp ? '●' : ''}
                    </span>
                    <span>{lineNumber}</span>
                  </div>
                  <pre className="whitespace-pre font-mono">{lineText || ' '}</pre>
                  {explanations?.[lineNumber] && !isCurrent && (
                    <span aria-hidden="true" className="ml-2 text-[11px] text-amber-500/80 select-none">•</span>
                  )}

                  {/* Line-Level Micro-Indicator: Inline Ghost Value */}
                  {isCurrent && inlineGhost && (
                    <span className="ml-4 text-[11px] font-mono font-normal text-blue-600/90 dark:text-blue-400/90 italic truncate shrink-0 select-none bg-blue-50/70 dark:bg-blue-950/40 px-2 py-0.2 rounded border border-blue-200/50 dark:border-blue-800/50 tabular-nums">
                      // → {inlineGhost}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Line Explainer: follows the running line, or the line the learner pinned */}
      {!isEditingCode && (() => {
        const shown = pinnedLine ?? activeLine;
        const text = lines[shown - 1] ?? '';
        const aiText = explanations?.[shown];
        return (
          <div
            className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-900/40 space-y-1.5"
            role="region"
            aria-label="Line explanation"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="font-bold text-neutral-950 dark:text-neutral-100">
                Line {shown}
                <span className="ml-2 font-normal text-neutral-500">
                  {pinnedLine ? 'pinned' : 'following execution'}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous line"
                  onClick={() => setPinnedLine(Math.max(1, shown - 1))}
                  disabled={shown <= 1}
                  className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Next line"
                  onClick={() => setPinnedLine(Math.min(lines.length, shown + 1))}
                  disabled={shown >= lines.length}
                  className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {pinnedLine && (
                  <button
                    type="button"
                    onClick={() => setPinnedLine(null)}
                    className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-xs"
                  >
                    Follow
                  </button>
                )}
              </span>
            </div>
            <code className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
              {text.trim() || '(blank line)'}
            </code>
            {aiText ? (
              <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">{aiText}</p>
            ) : (
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {shown === activeLine
                  ? currentStep.intuition
                  : explanations
                  ? 'Nothing to explain on this line.'
                  : 'Press "Explain lines" to get a plain-English explanation of every line.'}
              </p>
            )}
            {shown === activeLine && aiText && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This step: {currentStep.memoryMutation}
              </p>
            )}
            {explainError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {explainError}
              </p>
            )}
          </div>
        );
      })()}

      {/* Complexity & 16-Case Test Runner Strip */}
      <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-neutral-500 dark:text-neutral-400 font-mono">
          <span>
            Time: <strong className="text-neutral-950 dark:text-neutral-200">{solutionMeta.timeComplexity}</strong>
          </span>
          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
          <span>
            Space: <strong className="text-neutral-950 dark:text-neutral-200">{solutionMeta.spaceComplexity}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleRunTestSuite}
          className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Terminal className="w-3.5 h-3.5" />
          Run Verification Suite
        </button>
      </div>

      {/* Test Suite Results Drawer */}
      {testSuiteResults && (
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Test Suite Verification: {testSuiteResults.filter((r) => r.passed).length}/{testSuiteResults.length} Passed
            </span>
            <button
              type="button"
              onClick={() => setTestSuiteResults(null)}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {autoLoadedFailLabel && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px]">
              Loaded failing test input into visualizer: {autoLoadedFailLabel}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {testSuiteResults.map((tc) => (
              <div
                key={tc.id}
                onClick={() => {
                  onCustomInputChange(tc.input);
                  onRunTrace();
                }}
                className={`p-2 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                  tc.passed
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                }`}
              >
                <span className="truncate">{tc.label}</span>
                <span className="tabular-nums font-semibold shrink-0 ml-1">
                  {tc.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
