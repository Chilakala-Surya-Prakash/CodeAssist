/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { COMPANIES } from './data/companies';
import { PROBLEMS } from './data/problems';
import { ExecutionStep, Language } from './types/visualizer';
import { generateExecutionTrace } from './utils/traceEngine';
import { MemoryCanvas } from './components/MemoryCanvas';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { CompanyDirectory } from './components/CompanyDirectory';
import { TutorDrawer } from './components/TutorDrawer';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Volume2,
} from 'lucide-react';

type ActiveTab = 'visualizer' | 'companies' | 'challenges' | 'roadmap';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const [selectedProblemId, setSelectedProblemId] = useState<string>('reverse-linked-list');
  const [language, setLanguage] = useState<Language>('python');
  const [customInput, setCustomInput] = useState<string>('10 -> 20 -> 30 -> 40');
  const [codeMap, setCodeMap] = useState<Record<string, { python: string; java: string }>>(() => {
    const init: Record<string, { python: string; java: string }> = {};
    PROBLEMS.forEach((p) => {
      init[p.id] = { python: p.python.code, java: p.java.code };
    });
    return init;
  });

  const [customSteps, setCustomSteps] = useState<ExecutionStep[] | null>(null);
  const [isTracingGemini, setIsTracingGemini] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1100);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [voiceTriggerCount, setVoiceTriggerCount] = useState<number>(0);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(
    () => new Set(['reverse-linked-list', 'two-sum-hash'])
  );

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const currentProblem = useMemo(
    () => PROBLEMS.find((p) => p.id === selectedProblemId) || PROBLEMS[0],
    [selectedProblemId]
  );

  const deterministicSteps = useMemo(
    () => generateExecutionTrace(currentProblem.id, customInput),
    [currentProblem.id, customInput]
  );

  const steps = customSteps && customSteps.length > 0 ? customSteps : deterministicSteps;
  const boundedStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[boundedStepIndex] || steps[0];

  // Auto-advance timer when Play is active
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev + 1 >= steps.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeedMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, steps.length, playbackSpeedMs]);

  const handleSelectProblem = useCallback((problemId: string, preferredLang?: Language) => {
    const prob = PROBLEMS.find((p) => p.id === problemId);
    if (!prob) return;
    setSelectedProblemId(prob.id);
    setCustomInput(prob.defaultInput);
    setCustomSteps(null);
    setStepIndex(0);
    setIsPlaying(false);
    if (preferredLang) {
      setLanguage(preferredLang);
    }
    setActiveTab('visualizer');
  }, []);

  const handleToggleSolved = useCallback((problemId: string) => {
    setSolvedProblemIds((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) next.delete(problemId);
      else next.add(problemId);
      return next;
    });
  }, []);

  const handleStepCommand = useCallback(
    (action: 'next' | 'prev' | 'reset' | 'goto', targetIdx?: number) => {
      setIsPlaying(false);
      setStepIndex((prev) => {
        if (action === 'next') return Math.min(steps.length - 1, prev + 1);
        if (action === 'prev') return Math.max(0, prev - 1);
        if (action === 'reset') return 0;
        if (action === 'goto' && typeof targetIdx === 'number') {
          return Math.max(0, Math.min(steps.length - 1, targetIdx));
        }
        return prev;
      });
    },
    [steps.length]
  );

  const handleRunGeminiCustomTrace = async () => {
    setIsTracingGemini(true);
    setIsPlaying(false);
    try {
      const activeCode = codeMap[currentProblem.id]?.[language] || currentProblem[language].code;
      const res = await fetch('/api/tutor/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeCode,
          language,
          customInput,
          problemTitle: currentProblem.title,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.steps) && data.steps.length > 0) {
        const mapped: ExecutionStep[] = data.steps.map((s: any, idx: number) => ({
          stepIndex: idx,
          title: s.title || `Execution Step ${idx + 1}`,
          pythonLine: s.pythonLine || 1,
          javaLine: s.javaLine || 1,
          operationType: (s.operationType as any) || 'MUTATE_MEMORY',
          intuition: s.intuition || 'Dynamic execution step traced by Gemini.',
          memoryMutation: s.memoryMutation || 'Updated stack & heap state.',
          invariantCheck: s.invariantCheck || 'Loop invariant maintained.',
          stdout: s.stdout,
          stackFrames: [
            {
              id: `custom-frame-${idx}`,
              functionName: `${currentProblem.slug}()`,
              line: s.pythonLine || 1,
              returnAddress: '0x7FFF0100',
              isActive: true,
              variables: (s.stackVariables || []).map((v: any) => ({
                name: v.name || 'var',
                value: String(v.value ?? ''),
                type: v.type || 'int',
                address: v.address || '0x7FFF0108',
                isPointer: Boolean(v.isPointer),
                changed: true,
              })),
            },
          ],
          heapObjects: [
            {
              id: 'custom-heap',
              address: '0x1040',
              type: 'Array',
              label: `Custom Traced Heap State (${language.toUpperCase()})`,
              byteSize: 64,
              refCount: 1,
              gcStatus: 'mutated',
              cells: (s.heapCells || []).map((c: any, cIdx: number) => ({
                index: c.index ?? cIdx,
                label: c.label || `[${cIdx}]`,
                value: c.value ?? 0,
                addressOffset: c.addressOffset || `0x10${40 + cIdx * 4}`,
                nextAddress: c.nextAddress || null,
                status: (c.status as any) || 'active',
                annotation: c.annotation || '',
              })),
            },
          ],
          pointers: (s.pointers || []).map((p: any, pIdx: number) => ({
            id: `cp-${pIdx}`,
            name: p.name || 'ptr',
            targetObjectId: 'custom-heap',
            targetIndex: p.targetIndex ?? 0,
            targetAddress: p.targetAddress || '0x1040',
            role: pIdx === 0 ? 'primary' : 'secondary',
            deltaDescription: p.deltaDescription,
          })),
          metrics: {
            comparisons: idx + 1,
            pointerOps: idx + 1,
            heapBytesUsed: 64,
            timeStepO: `Step ${idx + 1}`,
          },
        }));
        setCustomSteps(mapped);
        setStepIndex(0);
      }
    } catch {
      // Fallback to deterministic engine
    } finally {
      setIsTracingGemini(false);
    }
  };

  const activeCode = codeMap[currentProblem.id]?.[language] ?? currentProblem[language].code;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#visualizer"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('visualizer');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          TraceCraft
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav aria-label="Primary Navigation" className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('visualizer')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'visualizer'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Visualizer Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'companies'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            50+ Tech Firms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('challenges')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'challenges'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Challenge Explorer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'roadmap'
                ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Pattern Mastery
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsTutorOpen((prev) => !prev)}
            className="px-3 sm:px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isTutorOpen ? 'Close AI Tutor' : 'Live Voice & AI Tutor'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
        {activeTab === 'visualizer' && (
          <div className="space-y-6" data-testid="visualizer-studio-view">
            {/* Workspace Control Toolbar (Below Header) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>Problem #{currentProblem.number}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      currentProblem.difficulty === 'Easy'
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : currentProblem.difficulty === 'Medium'
                        ? 'text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-rose-600 dark:text-rose-400 font-semibold'
                    }
                  >
                    {currentProblem.difficulty}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{currentProblem.pattern}</span>
                  <span aria-hidden="true">·</span>
                  <span>Asked at {currentProblem.companies.length} Top Tech Firms</span>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <label htmlFor="problem-select" className="sr-only">
                    Select Algorithm Problem
                  </label>
                  <select
                    id="problem-select"
                    value={currentProblem.id}
                    onChange={(e) => handleSelectProblem(e.target.value)}
                    className="w-full max-w-full sm:w-auto text-base sm:text-xl font-bold bg-white dark:bg-[#0F1522] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 truncate focus:outline-none focus:border-sky-500"
                  >
                    {PROBLEMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number}. {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Workspace Utility Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleSolved(currentProblem.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    solvedProblemIds.has(currentProblem.id)
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {solvedProblemIds.has(currentProblem.id) ? 'Completed' : 'Mark Completed'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTutorOpen(true);
                    setVoiceTriggerCount((c) => c + 1);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Voice Explain Step
                </button>

                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Balanced Two-Zone Sandbox Layout: Left Code & Spec (5 cols) | Right Memory & Pointer Stage (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Problem Spec & Interactive Code Editor */}
              <div className="lg:col-span-5 space-y-5">
                {/* Problem Brief & Pointer Mechanics Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] p-5 space-y-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentProblem.description}
                  </p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Core Algorithmic Insight:{' '}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {currentProblem.keyInsight}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        Pointer &amp; Memory Mechanics:{' '}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {currentProblem.pointerMechanicsNote}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Code Editor Panel (Python & Java) */}
                <CodeEditorPanel
                  problem={currentProblem}
                  language={language}
                  onLanguageChange={setLanguage}
                  code={activeCode}
                  onCodeChange={(newCode) =>
                    setCodeMap((prev) => ({
                      ...prev,
                      [currentProblem.id]: {
                        ...prev[currentProblem.id],
                        [language]: newCode,
                      },
                    }))
                  }
                  onResetCode={() => {
                    setCodeMap((prev) => ({
                      ...prev,
                      [currentProblem.id]: {
                        python: currentProblem.python.code,
                        java: currentProblem.java.code,
                      },
                    }));
                    setCustomSteps(null);
                    setStepIndex(0);
                  }}
                  customInput={customInput}
                  onCustomInputChange={(val) => {
                    setCustomInput(val);
                    setCustomSteps(null);
                    setStepIndex(0);
                    setIsPlaying(false);
                  }}
                  onRunTrace={() => {
                    setCustomSteps(null);
                    setStepIndex(0);
                    setIsPlaying(true);
                  }}
                  onRunGeminiCustomTrace={handleRunGeminiCustomTrace}
                  isTracingGemini={isTracingGemini}
                  currentStep={currentStep}
                />
              </div>

              {/* Right Column: Step Controller Deck & Dynamic Memory Canvas */}
              <div className="lg:col-span-7 space-y-5">
                {/* Step-by-Step Playback Controller & Pedagogical Explanation Deck */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepCommand('reset')}
                        aria-label="Reset execution trace to step 1"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepCommand('prev')}
                        disabled={boundedStepIndex === 0}
                        aria-label="Step Backward"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Step Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (boundedStepIndex >= steps.length - 1) {
                            setStepIndex(0);
                            setIsPlaying(true);
                          } else {
                            setIsPlaying((p) => !p);
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlaying ? 'Pause' : 'Play Trace'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepCommand('next')}
                        disabled={boundedStepIndex >= steps.length - 1}
                        aria-label="Step Forward"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        Step Forward
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Speed Control & Step Counter */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <label htmlFor="speed-slider" className="text-slate-500 flex items-center gap-2">
                        <span>Pace: {(1000 / playbackSpeedMs).toFixed(1)}x</span>
                        <input
                          id="speed-slider"
                          type="range"
                          min={400}
                          max={2000}
                          step={200}
                          value={2400 - playbackSpeedMs}
                          onChange={(e) => setPlaybackSpeedMs(2400 - Number(e.target.value))}
                          className="w-20 accent-sky-500"
                        />
                      </label>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        Step {boundedStepIndex + 1} / {steps.length}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Timeline Step Scrubber */}
                  <div>
                    <label htmlFor="timeline-scrubber" className="sr-only">
                      Execution Step Scrubber
                    </label>
                    <input
                      id="timeline-scrubber"
                      type="range"
                      min={0}
                      max={ Math.max(0, steps.length - 1) }
                      value={boundedStepIndex}
                      onChange={(e) => {
                        setIsPlaying(false);
                        setStepIndex(Number(e.target.value));
                      }}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  {/* Current Step Pedagogical Callout */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-sky-600 dark:text-sky-400 mb-1">
                      <span>
                        Step {boundedStepIndex + 1}: {currentStep.title}
                      </span>
                      <span>
                        {language === 'python'
                          ? `Python Line ${currentStep.pythonLine}`
                          : `Java Line ${currentStep.javaLine}`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentStep.intuition}
                    </p>
                  </div>
                </div>

                {/* Dynamic Memory Allocation & Pointer Canvas */}
                <MemoryCanvas
                  problemId={currentProblem.id}
                  step={currentStep}
                  totalSteps={steps.length}
                  onSelectStep={(idx) => {
                    setIsPlaying(false);
                    setStepIndex(idx);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <CompanyDirectory
            companies={COMPANIES}
            problems={PROBLEMS}
            activeProblemId={selectedProblemId}
            solvedProblemIds={solvedProblemIds}
            onToggleSolved={handleToggleSolved}
            onSelectProblem={handleSelectProblem}
            mode="companies"
          />
        )}

        {activeTab === 'challenges' && (
          <CompanyDirectory
            companies={COMPANIES}
            problems={PROBLEMS}
            activeProblemId={selectedProblemId}
            solvedProblemIds={solvedProblemIds}
            onToggleSolved={handleToggleSolved}
            onSelectProblem={handleSelectProblem}
            mode="challenges"
          />
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-6" data-testid="pattern-roadmap-view">
            <div className="pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="text-xs font-mono text-sky-600 dark:text-sky-400">
                Algorithmic Memory Architecture &amp; Complexity Curriculum
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                Core Pointer &amp; Memory Patterns Across {COMPANIES.length} Tech Firms
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Master the underlying memory topologies that power software engineering interviews: in-place pointer mutations, sliding windows, monotonic stacks, BFS/DAG queues, and dynamic programming tables.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(
                [
                  {
                    pattern: 'Linked List & Pointers',
                    desc: 'In-place .next/.prev reference rotation, Floyd fast/slow cycle detection, and O(1) LRU sentinel splicing.',
                    spaceTarget: 'O(1) Auxiliary Registers',
                    sampleId: 'reverse-linked-list',
                  },
                  {
                    pattern: 'Two Pointers',
                    desc: 'Converging left/right index scans on contiguous arrays to eliminate O(N) prefix tables or nested O(N^2) loops.',
                    spaceTarget: 'O(1) Stack Index Pointers',
                    sampleId: 'trapping-rain-water',
                  },
                  {
                    pattern: 'Sliding Window',
                    desc: 'Elastic [left..right] span tracking with O(1) hash map index jumps for substring and stream invariants.',
                    spaceTarget: 'O(Σ) Bounded Alphabet Map',
                    sampleId: 'longest-substring-unique',
                  },
                  {
                    pattern: 'Trees & Graphs',
                    desc: 'Level-order BFS frontier queues and Kahn topological in-degree relaxation for cycle detection in DAGs.',
                    spaceTarget: 'O(V + E) Adjacency & Queue',
                    sampleId: 'course-schedule-cycle',
                  },
                  {
                    pattern: 'Binary Search',
                    desc: 'Logarithmic interval halving across rotated sorted partitions using low, mid, and high index pointers.',
                    spaceTarget: 'O(1) Iterative Bisect',
                    sampleId: 'search-rotated-sorted',
                  },
                  {
                    pattern: 'Monotonic Stack',
                    desc: 'Amortized O(1) next-greater element resolution by maintaining strictly ordered index stacks on the heap.',
                    spaceTarget: 'O(N) Index Deque',
                    sampleId: 'daily-temperatures-stack',
                  },
                  {
                    pattern: 'Dynamic Programming',
                    desc: '1D bottom-up state table compression with lookback pointers to solve overlapping subproblems.',
                    spaceTarget: 'O(A) Contiguous DP Array',
                    sampleId: 'coin-change-dp',
                  },
                  {
                    pattern: 'Heap & Priority Queue',
                    desc: 'Bounded size-K Min-Heap gatekeeper at root index 0 for streaming Top-K selection in O(N log K).',
                    spaceTarget: 'O(K) PriorityQueue Array',
                    sampleId: 'kth-largest-heap',
                  },
                ] as const
              ).map((item, idx) => (
                <div
                  key={item.pattern}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      0{idx + 1}. {item.spaceTarget}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.pattern}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectProblem(item.sampleId)}
                    className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    Launch Reference Simulation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Gemini Live Voice + Socratic Text AI Tutor Drawer */}
      <TutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        problem={currentProblem}
        language={language}
        code={activeCode}
        currentStep={currentStep}
        totalSteps={steps.length}
        onStepCommand={handleStepCommand}
        voiceTriggerCount={voiceTriggerCount}
      />
    </div>
  );
}
