import React, { useEffect, useMemo, useState } from 'react';
import { AlgorithmProblem, ExecutionStep, Language } from '../types/visualizer';
import {
  getBugChallenge,
  LANGUAGE_LABELS,
  LocalTestCaseResult,
  runLocalTestSuite,
} from '../utils/zeroCostEngines';
import { resolveActiveLine } from '../utils/traceLineMap';
import {
  buildAllLinesWalkthrough,
  LINE_ROLE_META,
  resolveLineExplanation,
} from '../utils/lineExplainer';
import { AlertTriangle, BookOpen, Bug, ChevronLeft, ChevronRight, List, RotateCcw, Sparkles, Terminal, X } from 'lucide-react';

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
  breakpoints: Set<number>;
  onToggleBreakpoint: (lineNum: number) => void;
  hasCustomCodeEdits: boolean;
  isCustomTraceActive: boolean;
  customTraceStepCount: number;
  customTraceError: string | null;
  onClearCustomTrace: () => void;
  onDismissCustomTraceError: () => void;
}

type LineExplanations = Record<number, string>;

// Small stable hash so explanations can be cached per code version in localStorage
function hashCode(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const ALL_LANGUAGES: Language[] = ['python', 'java', 'cpp', 'go', 'typescript', 'rust'];

/** Renders inline backtick tokens (`curr.next`) as crisp monospace spans. */
function InlineCodeText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, idx) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code
            key={idx}
            className="px-1 py-0.2 mx-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-[0.92em]"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
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
  breakpoints,
  onToggleBreakpoint,
  hasCustomCodeEdits,
  isCustomTraceActive,
  customTraceStepCount,
  customTraceError,
  onClearCustomTrace,
  onDismissCustomTraceError,
}) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [bugHunterActive, setBugHunterActive] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<LocalTestCaseResult[] | null>(null);
  const [autoLoadedFailLabel, setAutoLoadedFailLabel] = useState<string | null>(null);

  const [pinnedLine, setPinnedLine] = useState<number | null>(null);
  const [showAllLines, setShowAllLines] = useState(false);
  const [explanations, setExplanations] = useState<LineExplanations | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const lines = code.split('\n');
  const explainKey = `tracecraft-explain-${language}-${hashCode(code)}`;

  // Reset transient editor/challenge state when switching problems
  useEffect(() => {
    setBugHunterActive(false);
    setTestSuiteResults(null);
    setAutoLoadedFailLabel(null);
    setIsEditingCode(false);
    setShowAllLines(false);
  }, [problem.id]);

  // Auto-switch back to Step Trace View once a custom AI trace succeeds
  useEffect(() => {
    if (isCustomTraceActive) {
      setIsEditingCode(false);
    }
  }, [isCustomTraceActive]);

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
  const activeLine = useMemo(
    () => resolveActiveLine(currentStep, language, problem.python.code, code),
    [currentStep, language, problem.python.code, code]
  );

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
    onToggleBreakpoint(lineNum);
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
      {/* Editor Header: Language Switcher, Active Line Status & Modes */}
      <div className="flex flex-col gap-2.5 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <span className="tabular-nums">
            Executing <strong className="text-neutral-900 dark:text-neutral-100">Line {activeLine}</strong>
            <span aria-hidden="true"> · </span>
            <span>{LANGUAGE_LABELS[language]}</span>
          </span>
          <span className="text-[11px] tabular-nums">
            {breakpoints.size > 0
              ? `${breakpoints.size} breakpoint${breakpoints.size > 1 ? 's' : ''} active`
              : 'Click line number to set breakpoint'}
          </span>
        </div>
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
              title="Optional: ask AI mentor for custom line explanations (prewritten guide is already active)"
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {isExplaining
                ? 'Explaining...'
                : explanations
                ? 'AI Re-explain'
                : hasCustomCodeEdits
                ? 'AI Explain Custom'
                : 'AI Deep Explain'}
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

      {/* Custom AI Trace Active Banner */}
      {isCustomTraceActive && (
        <div
          data-testid="custom-trace-active-banner"
          className="px-4 py-2.5 border-b border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/40 text-xs flex flex-wrap items-center justify-between gap-2"
        >
          <span className="font-mono font-semibold text-blue-900 dark:text-blue-200">
            Custom AI Execution Trace Active · {customTraceStepCount} steps
          </span>
          <button
            type="button"
            onClick={onClearCustomTrace}
            className="px-2.5 py-1 text-[11px] font-mono font-medium rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-neutral-900 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Return to Canonical Trace
          </button>
        </div>
      )}

      {/* Untraced Local Edits Notice */}
      {hasCustomCodeEdits && !isCustomTraceActive && !isEditingCode && !bugHunterActive && (
        <div
          data-testid="untraced-edits-notice"
          className="px-4 py-2.5 border-b border-amber-200 dark:border-amber-800/70 bg-amber-50/75 dark:bg-amber-950/30 text-xs flex flex-wrap items-center justify-between gap-2"
        >
          <span className="text-amber-900 dark:text-amber-200">
            Modified source — memory canvas is still showing the canonical trace until you run{' '}
            <strong>Trace Custom Code</strong>.
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRunGeminiCustomTrace}
              disabled={isTracingGemini}
              className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 disabled:opacity-50"
            >
              {isTracingGemini ? 'Tracing...' : 'Trace Custom Code'}
            </button>
            <button
              type="button"
              onClick={onResetCode}
              className="px-2 py-1 text-[11px] font-mono rounded border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Honest Custom Trace Error Alert */}
      {customTraceError && (
        <div
          role="alert"
          data-testid="custom-trace-error"
          className="px-4 py-2.5 border-b border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-950/40 text-xs flex items-start justify-between gap-2 text-red-800 dark:text-red-200"
        >
          <div className="space-y-0.5">
            <div className="font-mono font-semibold">Custom trace unavailable</div>
            <p className="leading-relaxed">{customTraceError}</p>
          </div>
          <button
            type="button"
            onClick={onDismissCustomTraceError}
            aria-label="Dismiss custom trace error"
            className="p-1 text-red-600 dark:text-red-300 hover:opacity-75 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
              Edit {LANGUAGE_LABELS[language]} code, run structural invariant verification, or trace custom execution.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunTestSuite}
                className="px-3 py-1.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
              >
                Verify Invariants &amp; Cases
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBreakpoint(lineNumber);
                    }}
                    aria-label={`${hasBp ? 'Remove' : 'Set'} breakpoint on line ${lineNumber}`}
                    aria-pressed={hasBp}
                    title={hasBp ? `Remove breakpoint on Line ${lineNumber}` : `Set breakpoint on Line ${lineNumber}`}
                    className="w-12 shrink-0 flex items-center justify-between pr-3 text-neutral-400 dark:text-neutral-500 hover:text-red-500 tabular-nums"
                  >
                    <span
                      className={`w-3 text-[11px] font-bold ${
                        hasBp
                          ? 'text-red-500'
                          : isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : ''
                      }`}
                    >
                      {hasBp ? '●' : isCurrent ? '▶' : ''}
                    </span>
                    <span>{lineNumber}</span>
                  </button>
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

      {/* Prewritten + Live Line-by-Line Explainer: instant plain-English guide for every line */}
      {!isEditingCode && (() => {
        const shown = pinnedLine ?? activeLine;
        const text = lines[shown - 1] ?? '';
        const aiText = explanations?.[shown] ?? null;
        const resolved = resolveLineExplanation(problem, language, code, shown, aiText);
        const roleMeta = LINE_ROLE_META[resolved.role];
        const allWalkthrough = showAllLines
          ? buildAllLinesWalkthrough(problem, language, code, explanations)
          : [];

        return (
          <div
            data-testid="line-explanation-panel"
            className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-900/40 space-y-2"
            role="region"
            aria-label="Line explanation"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 font-mono">
                <span className="font-bold text-neutral-950 dark:text-neutral-100">
                  Line {shown}
                </span>
                <span className="text-neutral-400 dark:text-neutral-600" aria-hidden="true">·</span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {pinnedLine ? 'pinned' : 'following execution'}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded border ${roleMeta.toneClass}`}
                >
                  {roleMeta.label}
                </span>
                {resolved.source === 'ai' && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    AI Custom
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAllLines((v) => !v)}
                  aria-pressed={showAllLines}
                  className={`px-2 py-1 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    showAllLines
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                      : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <List className="w-3 h-3" />
                  {showAllLines ? 'Single Line' : 'All Lines'}
                </button>
                {!showAllLines && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous line"
                      onClick={() => setPinnedLine(Math.max(1, shown - 1))}
                      disabled={shown <= 1}
                      className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next line"
                      onClick={() => setPinnedLine(Math.min(lines.length, shown + 1))}
                      disabled={shown >= lines.length}
                      className="p-1 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {pinnedLine && (
                      <button
                        type="button"
                        onClick={() => setPinnedLine(null)}
                        className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        Follow
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {showAllLines ? (
              <div
                data-testid="all-lines-walkthrough"
                className="max-h-72 overflow-y-auto divide-y divide-neutral-200/70 dark:divide-neutral-800/80 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950/70"
              >
                {allWalkthrough.map((item) => {
                  const isItemActive = item.lineNumber === activeLine;
                  const isItemPinned = item.lineNumber === pinnedLine;
                  const itemRole = LINE_ROLE_META[item.explanation.role];
                  return (
                    <button
                      key={item.lineNumber}
                      type="button"
                      onClick={() => {
                        setPinnedLine(item.lineNumber);
                        setShowAllLines(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 transition-colors space-y-1 ${
                        isItemActive
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-2 border-l-blue-500'
                          : isItemPinned
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-l-2 border-l-amber-500'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-neutral-500 dark:text-neutral-400 tabular-nums shrink-0">
                            L{item.lineNumber}
                          </span>
                          <code className="text-[11px] font-mono text-neutral-800 dark:text-neutral-200 truncate">
                            {item.codeText}
                          </code>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase rounded border shrink-0 ${itemRole.toneClass}`}
                        >
                          {itemRole.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                        <InlineCodeText text={item.explanation.summary} />
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        <strong className="font-medium text-neutral-600 dark:text-neutral-300">Why:</strong>{' '}
                        <InlineCodeText text={item.explanation.why} />
                      </p>
                      {item.explanation.watchOut && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>
                            <strong>Watch out:</strong> <InlineCodeText text={item.explanation.watchOut} />
                          </span>
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                <code className="block px-2.5 py-1.5 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate">
                  {text.trim() || '(blank line)'}
                </code>

                <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                  <InlineCodeText text={resolved.summary} />
                </p>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <strong className="font-semibold text-neutral-700 dark:text-neutral-300">Why:</strong>{' '}
                  <InlineCodeText text={resolved.why} />
                </p>

                {resolved.watchOut && (
                  <div className="px-2.5 py-1.5 rounded-md border border-amber-200/90 dark:border-amber-800/70 bg-amber-50/75 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      <strong className="font-semibold">Watch out:</strong>{' '}
                      <InlineCodeText text={resolved.watchOut} />
                    </span>
                  </div>
                )}

                {shown === activeLine && (currentStep.memoryMutation || currentStep.intuition) && (
                  <div className="pt-1 border-t border-neutral-200/70 dark:border-neutral-800/70 text-[11px] font-mono text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong className="uppercase tracking-wide text-[10px] mr-1.5">This step:</strong>
                    {currentStep.memoryMutation || currentStep.intuition}
                  </div>
                )}
              </div>
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
        <div
          data-testid="verification-suite-drawer"
          className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 space-y-2.5 text-xs font-mono"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                Static Invariant &amp; Trace Suite: {testSuiteResults.filter((r) => r.passed).length}/
                {testSuiteResults.length} Passed
              </span>
              {testSuiteResults[0]?.checkedInvariant && (
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Checked invariant: {testSuiteResults[0].checkedInvariant}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTestSuiteResults(null)}
              aria-label="Close verification suite results"
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {!testSuiteResults[0]?.passed && testSuiteResults[0]?.actualOutput && (
            <div
              role="alert"
              className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-[11px] leading-relaxed"
            >
              <strong className="block mb-0.5">Structural Defect Detected:</strong>
              {testSuiteResults[0].actualOutput}
              {autoLoadedFailLabel && (
                <div className="mt-1 opacity-80">
                  Loaded failing case into visualizer: {autoLoadedFailLabel}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
            {testSuiteResults.map((tc) => (
              <button
                key={tc.id}
                type="button"
                onClick={() => {
                  onCustomInputChange(tc.input);
                  onRunTrace();
                }}
                title={`Click to trace input: ${tc.input}`}
                className={`p-2 rounded border text-left transition-colors flex flex-col gap-0.5 ${
                  tc.passed
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40'
                    : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 hover:bg-red-100/60 dark:hover:bg-red-950/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <span className="truncate font-semibold">{tc.label}</span>
                  <span className="tabular-nums font-bold shrink-0">
                    {tc.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 w-full">
                  <span className="truncate">{tc.input}</span>
                  <span className="shrink-0 tabular-nums">{tc.stepsCount} steps</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
