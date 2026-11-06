/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { COMPANIES } from './data/companies';
import { CORE_TOPICS, PROBLEMS } from './data/problems';
import { CoreTopic, ExecutionStep, Language } from './types/visualizer';
import { generateExecutionTrace } from './utils/traceEngine';
import {
  buildPredictQuestion,
  buildRecursionCallTree,
  computeComplexityDiff,
  evaluateMockInterview,
  getBlindStarterCode,
  getMultiLanguageCode,
  LANGUAGE_LABELS,
  MockRubricScorecard,
  SpacedRepetitionItem,
  StepBookmark,
  SYSTEMS_CONCURRENCY_SCENARIOS,
  updateSpacedRepetition,
} from './utils/zeroCostEngines';
import {
  computeStepSoundProfile,
  DEFAULT_DSP_CONFIG,
  DspAudioConfig,
  FilterMode,
  OscillatorWaveform,
  triggerStepSonification,
} from './utils/soundEngine';
import { MemoryCanvas } from './components/MemoryCanvas';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { CompanyDirectory } from './components/CompanyDirectory';
import { TutorDrawer } from './components/TutorDrawer';
import {
  Award,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  EyeOff,
  HelpCircle,
  Monitor,
  Moon,
  RotateCcw,
  Scale,
  Server,
  Share2,
  Sliders,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react';

type ActiveTab = 'visualizer' | 'challenges' | 'companies' | 'roadmap';
export type ThemeMode = 'system' | 'light' | 'dark';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = window.localStorage.getItem('tracecraft-theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'system';
  });

  // Read initial state from URL search params if present (Shareable Trace Permalinks)
  const initialUrlParams = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const probId = params.get('problem');
    const validProb = PROBLEMS.find((p) => p.id === probId);
    const langParam = params.get('lang') as Language | null;
    const validLang: Language =
      langParam && langParam in LANGUAGE_LABELS ? langParam : 'python';
    const stepParam = Number(params.get('step'));
    const inputParam = params.get('input');
    return {
      problemId: validProb ? validProb.id : 'reverse-linked-list',
      language: validLang,
      stepIndex: !isNaN(stepParam) && stepParam >= 0 ? stepParam : 0,
      customInput: inputParam || (validProb ? validProb.defaultInput : '10 -> 20 -> 30 -> 40'),
    };
  }, []);

  const [selectedProblemId, setSelectedProblemId] = useState<string>(
    initialUrlParams?.problemId || 'reverse-linked-list'
  );
  const [language, setLanguage] = useState<Language>(initialUrlParams?.language || 'python');
  const [customInput, setCustomInput] = useState<string>(
    initialUrlParams?.customInput || '10 -> 20 -> 30 -> 40'
  );
  const [codeMap, setCodeMap] = useState<Record<string, Partial<Record<Language, string>>>>({});

  const [customSteps, setCustomSteps] = useState<ExecutionStep[] | null>(null);
  const [isTracingGemini, setIsTracingGemini] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(initialUrlParams?.stepIndex || 0);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [voiceTriggerCount, setVoiceTriggerCount] = useState<number>(0);

  // Zero-Cost Local Persistence: Solved Problems, Spaced Repetition (SM-2) & Step Bookmarks
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem('tracecraft-solved');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore
    }
    return new Set(['reverse-linked-list', 'two-sum-hash']);
  });

  const [srSchedule, setSrSchedule] = useState<Record<string, SpacedRepetitionItem>>(() => {
    try {
      const saved = window.localStorage.getItem('tracecraft-sr-schedule');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const [bookmarks, setBookmarks] = useState<StepBookmark[]>(() => {
    try {
      const saved = window.localStorage.getItem('tracecraft-step-bookmarks');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [bookmarkNoteDraft, setBookmarkNoteDraft] = useState<string>('');
  const [showBookmarksPanel, setShowBookmarksPanel] = useState<boolean>(false);

  // Sound Engineering & DSP Sonification State
  const [dspConfig, setDspConfig] = useState<DspAudioConfig>(DEFAULT_DSP_CONFIG);
  const [showDspConsole, setShowDspConsole] = useState<boolean>(false);

  // Zero-Cost Feature States: Complexity Diff, Predict Next Step Quiz, Share Permalink, Mock Interview
  const [showComplexityDiff, setShowComplexityDiff] = useState<boolean>(false);
  const [predictModeActive, setPredictModeActive] = useState<boolean>(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [nodeClickFeedback, setNodeClickFeedback] = useState<string | null>(null);
  const [quizStats, setQuizStats] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });
  const [copiedPermalink, setCopiedPermalink] = useState<boolean>(false);

  // Timed 45-Min Mock Interview Simulator State
  const [mockActive, setMockActive] = useState<boolean>(false);
  const [mockBlindMode, setMockBlindMode] = useState<boolean>(false);
  const [mockCompany, setMockCompany] = useState<string>('Google');
  const [mockSecondsLeft, setMockSecondsLeft] = useState<number>(45 * 60);
  const [mockApproachNotes, setMockApproachNotes] = useState<string>('');
  const [mockScorecard, setMockScorecard] = useState<MockRubricScorecard | null>(null);

  // Interactive System Design & OS Concurrency Visualizer State
  const [selectedSysScenarioId, setSelectedSysScenarioId] = useState<string>(
    SYSTEMS_CONCURRENCY_SCENARIOS[0].id
  );
  const [sysStepIdx, setSysStepIdx] = useState<number>(0);

  // Sync System / Light / Dark mode on <html>
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    try {
      window.localStorage.setItem('tracecraft-theme', themeMode);
    } catch {
      // ignore storage errors
    }

    if (themeMode === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [themeMode]);

  // Persist solved problems, spaced repetition & bookmarks in localStorage ($0 cloud-free persistence)
  useEffect(() => {
    try {
      window.localStorage.setItem(
        'tracecraft-solved',
        JSON.stringify(Array.from(solvedProblemIds))
      );
    } catch {
      // ignore
    }
  }, [solvedProblemIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem('tracecraft-sr-schedule', JSON.stringify(srSchedule));
    } catch {
      // ignore
    }
  }, [srSchedule]);

  useEffect(() => {
    try {
      window.localStorage.setItem('tracecraft-step-bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Mock Interview Countdown Timer
  useEffect(() => {
    if (!mockActive) return;
    const interval = window.setInterval(() => {
      setMockSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mockActive]);

  const currentProblem = useMemo(
    () => PROBLEMS.find((p) => p.id === selectedProblemId) || PROBLEMS[0],
    [selectedProblemId]
  );

  const activeTopic: CoreTopic = (currentProblem.topic as CoreTopic) || 'Linked Lists';

  const topicProblems = useMemo(
    () => PROBLEMS.filter((p) => (p.topic || 'Arrays') === activeTopic),
    [activeTopic]
  );

  const deterministicSteps = useMemo(
    () => generateExecutionTrace(currentProblem.id, customInput),
    [currentProblem.id, customInput]
  );

  const steps = customSteps && customSteps.length > 0 ? customSteps : deterministicSteps;
  const boundedStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[boundedStepIndex] || steps[0];

  const complexityDiff = useMemo(
    () => computeComplexityDiff(currentProblem, steps, boundedStepIndex),
    [currentProblem, steps, boundedStepIndex]
  );

  const recursionTree = useMemo(
    () => buildRecursionCallTree(currentProblem, steps, boundedStepIndex),
    [currentProblem, steps, boundedStepIndex]
  );

  const predictQuestion = useMemo(
    () => (predictModeActive ? buildPredictQuestion(steps, boundedStepIndex) : null),
    [predictModeActive, steps, boundedStepIndex]
  );

  const currentSoundProfile = useMemo(
    () => computeStepSoundProfile(currentStep, dspConfig),
    [currentStep, dspConfig]
  );

  // Trigger Web Audio DSP synthesis whenever the user steps to a new line and DSP is enabled
  useEffect(() => {
    if (dspConfig.enabled) {
      triggerStepSonification(currentStep, dspConfig);
    }
  }, [boundedStepIndex, currentStep, dspConfig]);

  // Reset selected quiz option whenever step changes
  useEffect(() => {
    setSelectedQuizOption(null);
    setNodeClickFeedback(null);
  }, [boundedStepIndex, selectedProblemId]);

  const handleSelectProblem = useCallback((problemId: string, preferredLang?: Language) => {
    const prob = PROBLEMS.find((p) => p.id === problemId);
    if (!prob) return;
    setSelectedProblemId(prob.id);
    setCustomInput(prob.defaultInput);
    setCustomSteps(null);
    setStepIndex(0);
    if (preferredLang) {
      setLanguage(preferredLang);
    }
    setActiveTab('visualizer');
  }, []);

  const handleSelectTopicInVisualizer = useCallback(
    (topicId: CoreTopic) => {
      const firstInTopic = PROBLEMS.find((p) => p.topic === topicId);
      if (firstInTopic) {
        handleSelectProblem(firstInTopic.id);
      }
    },
    [handleSelectProblem]
  );

  const handleToggleSolved = useCallback((problemId: string) => {
    setSolvedProblemIds((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) next.delete(problemId);
      else next.add(problemId);
      return next;
    });
  }, []);

  const handleRateSpacedRepetition = useCallback(
    (problemId: string, rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
      setSrSchedule((prev) => ({
        ...prev,
        [problemId]: updateSpacedRepetition(prev[problemId], problemId, rating),
      }));
      setSolvedProblemIds((prev) => new Set(prev).add(problemId));
    },
    []
  );

  const handleAddBookmark = useCallback(() => {
    const newBm: StepBookmark = {
      id: `${currentProblem.id}-${boundedStepIndex}-${Date.now()}`,
      problemId: currentProblem.id,
      problemTitle: currentProblem.title,
      stepIndex: boundedStepIndex,
      stepTitle: currentStep.title,
      customInput,
      note:
        bookmarkNoteDraft.trim() ||
        `Step ${boundedStepIndex + 1} invariant: ${currentStep.invariantCheck}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookmarks((prev) => [newBm, ...prev]);
    setBookmarkNoteDraft('');
    setShowBookmarksPanel(true);
  }, [currentProblem, boundedStepIndex, currentStep, customInput, bookmarkNoteDraft]);

  const handleCellClickInCanvas = useCallback(
    (cellIndex: number | string) => {
      if (!predictModeActive || !predictQuestion) return;
      const isCorrectNode =
        predictQuestion.expectedCellIndex !== null &&
        String(cellIndex) === String(predictQuestion.expectedCellIndex);

      if (selectedQuizOption === null) {
        setSelectedQuizOption(
          isCorrectNode ? predictQuestion.correctIndex : (predictQuestion.correctIndex + 1) % 4
        );
        setQuizStats((prev) => ({
          correct: prev.correct + (isCorrectNode ? 1 : 0),
          total: prev.total + 1,
        }));
      }
      setNodeClickFeedback(
        isCorrectNode
          ? `Verified! Heap cell [${cellIndex}] is the exact target of *${predictQuestion.targetPointerName} on Step ${boundedStepIndex + 2}.`
          : `Clicked cell [${cellIndex}], but *${predictQuestion.targetPointerName} will target [${predictQuestion.expectedCellIndex ?? 'NULL'}] next.`
      );
    },
    [predictModeActive, predictQuestion, selectedQuizOption, boundedStepIndex]
  );

  const handleSharePermalink = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('problem', currentProblem.id);
    url.searchParams.set('lang', language);
    url.searchParams.set('step', String(boundedStepIndex));
    url.searchParams.set('input', customInput);
    window.history.replaceState({}, '', url.toString());

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url.toString()).catch(() => {});
    }
    setCopiedPermalink(true);
    window.setTimeout(() => setCopiedPermalink(false), 2200);
  }, [currentProblem.id, language, boundedStepIndex, customInput]);

  const handleExportProgressJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      solvedProblemIds: Array.from(solvedProblemIds),
      spacedRepetitionSchedule: srSchedule,
      bookmarks,
      quizStats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tracecraft-progress-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [solvedProblemIds, srSchedule, bookmarks, quizStats]);

  const handleStepCommand = useCallback(
    (action: 'next' | 'prev' | 'reset' | 'goto', targetIdx?: number) => {
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

  const canonicalCodeForLang = useMemo(
    () => getMultiLanguageCode(currentProblem, language),
    [currentProblem, language]
  );

  const activeCode =
    codeMap[currentProblem.id]?.[language] ?? canonicalCodeForLang;

  const handleRunGeminiCustomTrace = async () => {
    setIsTracingGemini(true);
    try {
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
          intuition: s.intuition || 'Dynamic execution step traced.',
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
              label: `Custom Traced Heap State (${LANGUAGE_LABELS[language]})`,
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

  const activeSysScenario = useMemo(
    () =>
      SYSTEMS_CONCURRENCY_SCENARIOS.find((s) => s.id === selectedSysScenarioId) ||
      SYSTEMS_CONCURRENCY_SCENARIOS[0],
    [selectedSysScenarioId]
  );
  const boundedSysStepIdx = Math.min(
    sysStepIdx,
    Math.max(0, activeSysScenario.steps.length - 1)
  );
  const currentSysStep = activeSysScenario.steps[boundedSysStepIdx];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-900 dark:bg-[#0A0A0A] dark:text-neutral-100">
      {/* Strict 3-Zone Top Bar */}
      <header className="flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#visualizer"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('visualizer');
          }}
          className="text-base font-semibold tracking-tight text-neutral-950 dark:text-white whitespace-nowrap shrink-0"
        >
          TraceCraft
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('visualizer')}
            className={`hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'visualizer'
                ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Step Visualizer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('challenges')}
            className={`hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'challenges'
                ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Topics &amp; 160 Questions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'companies'
                ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Companies ({COMPANIES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'roadmap'
                ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white font-semibold'
                : 'border-transparent'
            }`}
          >
            Systems &amp; Mock Arena
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsTutorOpen((prev) => !prev)}
            className="px-3 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {isTutorOpen ? 'Close Tutor' : 'Voice & Tutor'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
        {activeTab === 'visualizer' && (
          <div className="space-y-5" data-testid="visualizer-studio-view">
            {/* Clean 2-Row Topic & Question Navigator */}
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-4 space-y-3.5">
              {/* Row 1: 8 Core Topics Selector (20 Questions Each) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                  1. Select Topic (20 Questions Each):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {CORE_TOPICS.map((tMeta) => {
                    const isCurrentTopic = activeTopic === tMeta.id;
                    return (
                      <button
                        key={tMeta.id}
                        type="button"
                        onClick={() => handleSelectTopicInVisualizer(tMeta.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                          isCurrentTopic
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600'
                        }`}
                      >
                        {tMeta.id} (20)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: 20-Question Selector Within Active Topic + Clean Workspace Utilities */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0 flex-1">
                  <label
                    htmlFor="problem-select"
                    className="text-xs font-mono text-neutral-500 dark:text-neutral-400 shrink-0"
                  >
                    2. Question ({ currentProblem.topicIndex || 1 }/20):
                  </label>
                  <select
                    id="problem-select"
                    value={currentProblem.id}
                    onChange={(e) => handleSelectProblem(e.target.value)}
                    className="w-full sm:max-w-xl text-sm font-semibold bg-neutral-50 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-md px-3 py-1.5 truncate focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
                  >
                    {topicProblems.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.topicCode || `Q-${p.number}`}] {p.title} ({p.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Essential Workspace Utilities + Theme Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSolved(currentProblem.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      solvedProblemIds.has(currentProblem.id)
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                        : 'border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-700 dark:text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {solvedProblemIds.has(currentProblem.id) ? 'Solved' : 'Mark Solved'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBookmarksPanel((v) => !v)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      showBookmarksPanel
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                        : 'border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Notes ({bookmarks.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDspConsole((v) => !v)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      showDspConsole || dspConfig.enabled
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                        : 'border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {dspConfig.enabled ? 'DSP Audio: ON' : 'Sound Lab'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSharePermalink}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedPermalink ? 'Copied Link!' : 'Share'}
                  </button>

                  {/* System / Light / Dark Theme Segmented Control */}
                  <div
                    role="group"
                    aria-label="Theme preference"
                    className="inline-flex items-center p-0.5 rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
                  >
                    <button
                      type="button"
                      onClick={() => setThemeMode('system')}
                      aria-label="System theme"
                      title="System theme"
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                        themeMode === 'system'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      aria-label="Light theme"
                      title="Light theme"
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                        themeMode === 'light'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      aria-label="Dark theme"
                      title="Dark theme"
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                        themeMode === 'dark'
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sound Engineering & DSP Sonification Rack (Expandable) */}
            {showDspConsole && (
              <div
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#111111] p-4 space-y-4"
                data-testid="dsp-sound-console"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <div className="text-[11px] font-mono text-neutral-500">
                      WEB AUDIO API DSP CHAIN · HARMONIC OSCILLATOR + BIQUAD FILTER + SPATIAL HEAP PANNER + DYNAMICS COMPRESSOR
                    </div>
                    <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                      Algorithmic Memory Sonification &amp; Sound Engineering Rack
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextConfig = { ...dspConfig, enabled: !dspConfig.enabled };
                        setDspConfig(nextConfig);
                        if (nextConfig.enabled) {
                          triggerStepSonification(currentStep, nextConfig);
                        }
                      }}
                      className={`px-3 py-1 text-xs font-mono font-semibold rounded border transition-colors ${
                        dspConfig.enabled
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                          : 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {dspConfig.enabled ? 'DSP Engine: ACTIVE' : 'Enable Step Sonification'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerStepSonification(currentStep, { ...dspConfig, enabled: true })
                      }
                      className="px-3 py-1 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Audition Step Tone ({currentSoundProfile.baseFrequencyHz}Hz)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2">
                    <div className="text-neutral-500 font-semibold">1. OSCILLATOR &amp; GAIN</div>
                    <label className="block">
                      <span className="text-[11px] text-neutral-500">Waveform Harmonic</span>
                      <select
                        value={dspConfig.waveform}
                        onChange={(e) =>
                          setDspConfig((prev) => ({
                            ...prev,
                            waveform: e.target.value as OscillatorWaveform,
                          }))
                        }
                        className="mt-1 w-full px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                      >
                        <option value="triangle">Triangle (Odd Harmonics -12dB/oct)</option>
                        <option value="sine">Pure Sine (Fundamental f0)</option>
                        <option value="sawtooth">Sawtooth (Full Harmonic Series)</option>
                        <option value="square">Square (Hollow Odd Harmonics)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-neutral-500">
                        Master Bus Gain: {dspConfig.masterGainDb} dBFS
                      </span>
                      <input
                        type="range"
                        min={-24}
                        max={3}
                        step={1}
                        value={dspConfig.masterGainDb}
                        onChange={(e) =>
                          setDspConfig((prev) => ({
                            ...prev,
                            masterGainDb: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-neutral-900 dark:accent-neutral-100"
                      />
                    </label>
                  </div>

                  <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2">
                    <div className="text-neutral-500 font-semibold">2. BIQUAD RESONANT FILTER</div>
                    <label className="block">
                      <span className="text-[11px] text-neutral-500">Filter Topology</span>
                      <select
                        value={dspConfig.filterMode}
                        onChange={(e) =>
                          setDspConfig((prev) => ({
                            ...prev,
                            filterMode: e.target.value as FilterMode,
                          }))
                        }
                        className="mt-1 w-full px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                      >
                        <option value="lowpass">Low-Pass (-12dB/oct Warmth)</option>
                        <option value="bandpass">Band-Pass (Resonant Formant)</option>
                        <option value="highpass">High-Pass (Transient Air)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-neutral-500">
                        Cutoff: {dspConfig.cutoffHz} Hz · Q: {dspConfig.resonanceQ}
                      </span>
                      <input
                        type="range"
                        min={250}
                        max={6400}
                        step={50}
                        value={dspConfig.cutoffHz}
                        onChange={(e) =>
                          setDspConfig((prev) => ({
                            ...prev,
                            cutoffHz: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-neutral-900 dark:accent-neutral-100"
                      />
                    </label>
                  </div>

                  <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2">
                    <div className="text-neutral-500 font-semibold">3. ADSR ENVELOPE</div>
                    <label className="block">
                      <span className="text-[11px] text-neutral-500">
                        Attack: {dspConfig.attackMs}ms · Decay: {dspConfig.decayMs}ms
                      </span>
                      <input
                        type="range"
                        min={5}
                        max={120}
                        step={5}
                        value={dspConfig.attackMs}
                        onChange={(e) =>
                          setDspConfig((prev) => ({
                            ...prev,
                            attackMs: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-neutral-900 dark:accent-neutral-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-neutral-500">
                        Release Tail: {dspConfig.releaseMs}ms
                      </span>
                      <input
                        type="range"
                        min={40}
                        max={400}
                        step={20}
                        value={dspConfig.releaseMs}
                        onChange={(e) =>
                          setDspConfig((prev) => ({
                            ...prev,
                            releaseMs: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-neutral-900 dark:accent-neutral-100"
                      />
                    </label>
                  </div>

                  <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-1.5">
                    <div className="text-neutral-500 font-semibold">4. LIVE ACOUSTIC TELEMETRY</div>
                    <div>
                      Fundamental f0:{' '}
                      <strong className="text-neutral-950 dark:text-white">
                        {currentSoundProfile.baseFrequencyHz} Hz
                      </strong>
                    </div>
                    <div>
                      Overtone f1:{' '}
                      <strong className="text-neutral-950 dark:text-white">
                        {currentSoundProfile.harmonicFrequencyHz} Hz
                      </strong>
                    </div>
                    <div>
                      Stereo Field Pan:{' '}
                      <strong className="text-neutral-950 dark:text-white">
                        {currentSoundProfile.stereoPan === 0
                          ? 'Center (0.0)'
                          : currentSoundProfile.stereoPan < 0
                          ? `Left (${currentSoundProfile.stereoPan})`
                          : `Right (+${currentSoundProfile.stereoPan})`}
                      </strong>
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {currentSoundProfile.operationAcousticTag}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Bookmarks & Personal Notes Drawer */}
            {showBookmarksPanel && (
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="text-xs font-mono font-semibold text-neutral-950 dark:text-white">
                    BOOKMARKED EXECUTION STEPS &amp; PERSONAL INVARIANT NOTES ({bookmarks.length})
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={bookmarkNoteDraft}
                      onChange={(e) => setBookmarkNoteDraft(e.target.value)}
                      placeholder={`Add note for Step ${boundedStepIndex + 1}...`}
                      className="flex-1 sm:w-64 px-2.5 py-1 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddBookmark}
                      className="px-3 py-1 text-xs font-medium rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shrink-0"
                    >
                      Save Step #{boundedStepIndex + 1}
                    </button>
                  </div>
                </div>

                {bookmarks.length === 0 ? (
                  <p className="text-xs font-mono text-neutral-500">
                    No steps bookmarked yet. Click &quot;Save Step #{boundedStepIndex + 1}&quot; above to pin this exact memory state and note.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-2.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {bm.problemTitle} · Step {bm.stepIndex + 1} ({bm.stepTitle})
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-400">{bm.note}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProblemId(bm.problemId);
                              setCustomInput(bm.customInput);
                              setCustomSteps(null);
                              setStepIndex(bm.stepIndex);
                            }}
                            className="px-2 py-1 text-[11px] font-mono rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          >
                            Jump
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBookmarks((prev) => prev.filter((x) => x.id !== bm.id))
                            }
                            aria-label="Remove bookmark"
                            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Two-Zone Layout: Left Code & Spec (5 cols) | Right Manual Step Controller & Memory Stage (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Problem Spec, Spaced Repetition Bar & Interactive Code Editor */}
              <div className="lg:col-span-5 space-y-5">
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    <span>
                      {currentProblem.topicCode || `Q-${currentProblem.number}`} · {currentProblem.topic || currentProblem.pattern}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {currentProblem.difficulty}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-neutral-950 dark:text-neutral-100">
                    {currentProblem.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {currentProblem.description}
                  </p>
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-neutral-950 dark:text-neutral-100">
                        Key Invariant:{' '}
                      </span>
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {currentProblem.keyInsight}
                      </span>
                    </div>
                  </div>

                  {/* Spaced Repetition (SM-2) Quick Self-Rating Strip */}
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-neutral-500 dark:text-neutral-400">
                      {srSchedule[currentProblem.id]
                        ? `Next Review: ${srSchedule[currentProblem.id].nextReviewIso} (${srSchedule[currentProblem.id].intervalDays}d)`
                        : 'Spaced Repetition Recall:'}
                    </span>
                    <div className="flex items-center gap-1">
                      {(['Again', 'Hard', 'Good', 'Easy'] as const).map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRateSpacedRepetition(currentProblem.id, rating)}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                            srSchedule[currentProblem.id]?.lastRating === rating
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                              : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

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
                    setCodeMap((prev) => {
                      const next = { ...prev };
                      delete next[currentProblem.id];
                      return next;
                    });
                    setCustomSteps(null);
                    setStepIndex(0);
                  }}
                  customInput={customInput}
                  onCustomInputChange={(val) => {
                    setCustomInput(val);
                    setCustomSteps(null);
                    setStepIndex(0);
                  }}
                  onRunTrace={() => {
                    setCustomSteps(null);
                    setStepIndex(0);
                  }}
                  onRunGeminiCustomTrace={handleRunGeminiCustomTrace}
                  isTracingGemini={isTracingGemini}
                  currentStep={currentStep}
                />
              </div>

              {/* Right Column: Manual Step-by-Step Controller, Active Recall, Complexity Diff & Memory Canvas */}
              <div className="lg:col-span-7 space-y-5">
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-5 space-y-4">
                  {/* Manual Line-by-Line Step Controller (No Auto-Play All At Once) */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepCommand('reset')}
                        disabled={boundedStepIndex === 0}
                        aria-label="Reset execution trace to step 1"
                        className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset (Step 1)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepCommand('prev')}
                        disabled={boundedStepIndex === 0}
                        aria-label="Previous Line Execution"
                        className="px-3.5 py-2 rounded-md border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Prev Line
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepCommand('next')}
                        disabled={boundedStepIndex >= steps.length - 1}
                        aria-label="Next Line Execution"
                        className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white disabled:opacity-40 text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        Next Line Execution
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step Progress & Analysis Toggles */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPredictModeActive((v) => !v)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          predictModeActive
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                            : 'border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Predict Next Move
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowComplexityDiff((v) => !v)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          showComplexityDiff
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                            : 'border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Brute vs Optimal
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTutorOpen(true);
                          setVoiceTriggerCount((c) => c + 1);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Voice
                      </button>
                    </div>
                  </div>

                  {/* Step Scrubber & Active Line Indicator */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label htmlFor="timeline-scrubber" className="sr-only">
                        Execution Step Scrubber
                      </label>
                      <input
                        id="timeline-scrubber"
                        type="range"
                        min={0}
                        max={Math.max(0, steps.length - 1)}
                        value={boundedStepIndex}
                        onChange={(e) => setStepIndex(Number(e.target.value))}
                        className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums shrink-0">
                      Step {boundedStepIndex + 1} of {steps.length} · Line{' '}
                      {language === 'python' ? currentStep.pythonLine : currentStep.javaLine}
                    </span>
                  </div>

                  {/* Current Step Explanation Callout */}
                  <div className="p-3.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-900 dark:text-neutral-200 font-semibold mb-1">
                      <span>
                        Step {boundedStepIndex + 1}: {currentStep.title}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 font-normal">
                        {LANGUAGE_LABELS[language]} · Executing Line{' '}
                        {language === 'python' ? currentStep.pythonLine : currentStep.javaLine}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {currentStep.intuition}
                    </p>
                  </div>

                  {/* Interactive "Predict the Next Step" Active Recall Deck */}
                  {predictModeActive && predictQuestion && (
                    <div className="p-4 rounded-md border border-neutral-900 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-900 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-neutral-950 dark:text-white">
                          ACTIVE RECALL CHALLENGE (SELECT OPTION OR CLICK HEAP NODE)
                        </span>
                        <span className="text-neutral-500">
                          Score: {quizStats.correct}/{quizStats.total}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {predictQuestion.prompt}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        Heap Target Challenge: {predictQuestion.nodeClickPrompt}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {predictQuestion.options.map((opt, oIdx) => {
                          const isSelected = selectedQuizOption === oIdx;
                          const isCorrect = oIdx === predictQuestion.correctIndex;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                if (selectedQuizOption !== null) return;
                                setSelectedQuizOption(oIdx);
                                setQuizStats((prev) => ({
                                  correct: prev.correct + (isCorrect ? 1 : 0),
                                  total: prev.total + 1,
                                }));
                              }}
                              className={`text-left p-2.5 rounded border text-xs font-mono transition-colors ${
                                selectedQuizOption === null
                                  ? 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#111111] hover:border-neutral-900 dark:hover:border-neutral-200'
                                  : isCorrect
                                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                                  : isSelected
                                  ? 'border-neutral-400 bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 line-through'
                                  : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </button>
                          );
                        })}
                      </div>
                      {nodeClickFeedback && (
                        <div className="p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-mono text-neutral-900 dark:text-neutral-100">
                          {nodeClickFeedback}
                        </div>
                      )}
                      {selectedQuizOption !== null && (
                        <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-neutral-700 dark:text-neutral-300">
                            {selectedQuizOption === predictQuestion.correctIndex
                              ? 'Correct! Pointer invariant verified.'
                              : 'Review the correct mutation highlighted above.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStepCommand('next')}
                            className="px-3 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium shrink-0"
                          >
                            Advance to Step {boundedStepIndex + 2} →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Side-by-Side Brute-Force vs Optimal ("Diff Mode") Panel */}
                  {showComplexityDiff && (
                    <div className="p-4 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/90 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <span className="font-bold text-neutral-950 dark:text-white">
                          SIDE-BY-SIDE BRUTE-FORCE VS. OPTIMAL DIFF MODE (N = {complexityDiff.inputSizeN})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold">
                          {complexityDiff.optimal.speedupFactor} · Saves {complexityDiff.optimal.memorySavedBytes} B
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] space-y-1.5">
                          <div className="font-mono text-neutral-400">NAIVE / BRUTE-FORCE</div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {complexityDiff.bruteForce.name}
                          </div>
                          <div className="font-mono text-neutral-600 dark:text-neutral-400">
                            Time: {complexityDiff.bruteForce.timeComplexity} · Space: {complexityDiff.bruteForce.spaceComplexity}
                          </div>
                          <div className="font-mono text-neutral-800 dark:text-neutral-200">
                            Total Ops: <strong>{complexityDiff.bruteForce.estimatedOps} ops</strong> ({complexityDiff.bruteForce.estimatedBytes} B)
                          </div>
                          <div className="font-mono text-[11px] text-neutral-500">
                            Cells Scanned by Step {boundedStepIndex + 1}: <strong>{complexityDiff.bruteForce.scannedCellsAtStep}</strong>
                          </div>
                          <p className="text-[11px] text-neutral-500 pt-1">
                            {complexityDiff.bruteForce.bottleneckReason}
                          </p>
                        </div>

                        <div className="p-3 rounded border border-neutral-900 dark:border-neutral-200 bg-white dark:bg-[#111111] space-y-1.5">
                          <div className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold">
                            OPTIMAL POINTER ENGINE
                          </div>
                          <div className="font-semibold text-neutral-950 dark:text-white">
                            {complexityDiff.optimal.name}
                          </div>
                          <div className="font-mono text-neutral-600 dark:text-neutral-400">
                            Time: {complexityDiff.optimal.timeComplexity} · Space: {complexityDiff.optimal.spaceComplexity}
                          </div>
                          <div className="font-mono text-neutral-950 dark:text-white">
                            Actual Ops: <strong>{complexityDiff.optimal.actualOps} ops</strong> ({complexityDiff.optimal.actualBytes} B)
                          </div>
                          <div className="font-mono text-[11px] text-neutral-500">
                            Cells Scanned by Step {boundedStepIndex + 1}: <strong>{complexityDiff.optimal.scannedCellsAtStep}</strong>
                          </div>
                          <p className="text-[11px] text-neutral-500 pt-1">
                            Maintains strict loop invariants on existing heap cells without redundant O(N) re-scans.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Memory Allocation, Pointer Canvas & Recursion Call-Tree Flamegraph */}
                <MemoryCanvas
                  problemId={currentProblem.traceFamilyId || currentProblem.id}
                  step={currentStep}
                  totalSteps={steps.length}
                  onSelectStep={(idx) => setStepIndex(idx)}
                  recursionTree={recursionTree}
                  predictModeActive={predictModeActive}
                  onCellClick={handleCellClickInCanvas}
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
          <div className="space-y-8" data-testid="pattern-roadmap-view">
            {/* 1. Interactive System Design & Low-Level OS Concurrency Memory Visualizer */}
            <div
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-6 space-y-5"
              data-testid="systems-concurrency-visualizer"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    DISTRIBUTED ARCHITECTURE &amp; OS / HARDWARE CONCURRENCY SIMULATOR
                  </div>
                  <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mt-1">
                    System Design Packet Tracer &amp; CPU Cache / Mutex Concurrency Lab
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Step through Distributed Consistent Hashing, Redis Stampede Lease Locks, Token Bucket Rate Limiters, CPU 64B Cache Line False Sharing (MESI), and AB-BA Mutex Deadlocks.
                  </p>
                </div>

                {/* Scenario Selector */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {SYSTEMS_CONCURRENCY_SCENARIOS.map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => {
                        setSelectedSysScenarioId(scen.id);
                        setSysStepIdx(0);
                      }}
                      className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                        activeSysScenario.id === scen.id
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                          : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {scen.category === 'Distributed System Design' ? (
                        <Server className="w-3 h-3 inline mr-1" />
                      ) : (
                        <Cpu className="w-3 h-3 inline mr-1" />
                      )}
                      {scen.title.split('&')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div>
                    <div className="text-xs font-mono text-neutral-500">
                      {activeSysScenario.category} · Target Firms: {activeSysScenario.companies.join(', ')}
                    </div>
                    <div className="text-sm font-semibold text-neutral-950 dark:text-white mt-0.5">
                      Step {boundedSysStepIdx + 1}/{activeSysScenario.steps.length}: {currentSysStep.title}
                    </div>
                    <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 mt-1">
                      Packet / Bus Trace: {currentSysStep.packetLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSysStepIdx((i) => Math.max(0, i - 1))}
                      disabled={boundedSysStepIdx === 0}
                      className="px-3 py-1.5 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
                    >
                      ← Prev Step
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSysStepIdx((i) =>
                          Math.min(activeSysScenario.steps.length - 1, i + 1)
                        )
                      }
                      disabled={boundedSysStepIdx >= activeSysScenario.steps.length - 1}
                      className="px-3 py-1.5 text-xs font-mono rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 disabled:opacity-40"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>

                {/* Topological Nodes / CPU Cores / Lock Registers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {activeSysScenario.nodes.map((node) => {
                    const isHot = currentSysStep.activeNodeIds.includes(node.id);
                    return (
                      <div
                        key={node.id}
                        className={`p-4 rounded-md border transition-all flex flex-col justify-between space-y-2 ${
                          isHot
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800/90 ring-1 ring-neutral-900 dark:ring-neutral-100'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span>{node.address}</span>
                          <span className="uppercase font-bold text-neutral-900 dark:text-neutral-100">
                            {isHot ? 'ACTIVE' : 'IDLE'}
                          </span>
                        </div>
                        <div className="text-sm font-mono font-bold text-neutral-950 dark:text-white">
                          {node.label}
                        </div>
                        <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                          {node.sublabel}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live State & Telemetry Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentSysStep.stateTable.map((row) => (
                    <div
                      key={row.key}
                      className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>{row.key}</span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {row.status}
                        </span>
                      </div>
                      <div className="font-semibold text-neutral-950 dark:text-white mt-1">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                  <strong>Hardware / Protocol Invariant:</strong> {currentSysStep.invariantNote}
                </div>
              </div>
            </div>

            {/* 2. Timed 45-Minute Live Voice Mock Interview Simulator & 5-Dimension Scorecard */}
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    45-Minute Onsite Coding Round Simulator · Blind Coding + Live Voice Interviewer
                  </div>
                  <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mt-1">
                    Timed Mock Interview &amp; 5-Dimension Hiring Committee Scorecard
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Hide the canonical solution with Blind Coding Mode, explain your approach to the Live Voice Interviewer, and generate a 5-dimension L4/L5 hiring rubric evaluation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 font-mono text-sm font-bold tabular-nums flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {String(Math.floor(mockSecondsLeft / 60)).padStart(2, '0')}:
                    {String(mockSecondsLeft % 60).padStart(2, '0')}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextBlind = !mockBlindMode;
                      setMockBlindMode(nextBlind);
                      if (nextBlind) {
                        setCodeMap((prev) => ({
                          ...prev,
                          [currentProblem.id]: {
                            ...prev[currentProblem.id],
                            [language]: getBlindStarterCode(currentProblem, language),
                          },
                        }));
                      }
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
                      mockBlindMode
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                        : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {mockBlindMode ? 'Blind Mode: ON' : 'Hide Solution (Blind Mode)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mockActive) {
                        setMockActive(false);
                      } else {
                        setMockSecondsLeft(45 * 60);
                        setMockScorecard(null);
                        setMockActive(true);
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-medium rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors"
                  >
                    {mockActive ? 'Pause Timer' : 'Start 45m Mock Round'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTutorOpen(true);
                      setVoiceTriggerCount((c) => c + 1);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Voice Interviewer
                  </button>
                  <button
                    type="button"
                    onClick={handleExportProgressJson}
                    className="px-3 py-2 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Backup JSON
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-neutral-500 mb-1">
                        Target Company Persona
                      </label>
                      <select
                        value={mockCompany}
                        onChange={(e) => setMockCompany(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                      >
                        {COMPANIES.slice(0, 30).map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.tier.split(' ')[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-neutral-500 mb-1">
                        Interview Question ({PROBLEMS.length} Available)
                      </label>
                      <select
                        value={currentProblem.id}
                        onChange={(e) => setSelectedProblemId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                      >
                        {PROBLEMS.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.topicCode || `Q-${p.number}`}] {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-1">
                      Candidate Pre-Coding Approach &amp; Complexity Notes (Explain Invariant &amp; Big-O)
                    </label>
                    <textarea
                      rows={4}
                      value={mockApproachNotes}
                      onChange={(e) => setMockApproachNotes(e.target.value)}
                      placeholder="Example: Use two converging pointers (left, right) in O(N) time and O(1) auxiliary heap space. Handle edge cases (empty list, single node, negative values)..."
                      className="w-full p-3 text-xs font-mono rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMockActive(false);
                      const card = evaluateMockInterview({
                        companyName: mockCompany,
                        problem: currentProblem,
                        language,
                        code: activeCode,
                        approachNotes: mockApproachNotes,
                        elapsedSeconds: Math.max(60, 45 * 60 - mockSecondsLeft),
                        quizCorrectCount: quizStats.correct,
                      });
                      setMockScorecard(card);
                    }}
                    className="w-full py-2.5 px-4 text-xs font-semibold rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    Submit Round &amp; Generate 5-Dimension Hiring Scorecard
                  </button>
                </div>

                {/* Hiring Committee Rubric Scorecard Output */}
                <div className="lg:col-span-6">
                  {mockScorecard ? (
                    <div className="p-4 rounded-md border border-neutral-900 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-900 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
                        <div>
                          <div className="text-[11px] font-mono text-neutral-500">
                            {mockScorecard.companyName} Hiring Committee Packet
                          </div>
                          <div className="text-sm font-bold text-neutral-950 dark:text-white">
                            Verdict: {mockScorecard.verdict} ({mockScorecard.overallScore}/100)
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950">
                          {LANGUAGE_LABELS[mockScorecard.language]} · {mockScorecard.elapsedMinutes}m
                        </span>
                      </div>

                      <div className="space-y-2">
                        {mockScorecard.dimensions.map((dim) => (
                          <div
                            key={dim.label}
                            className="p-2.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] text-xs"
                          >
                            <div className="flex items-center justify-between font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                              <span>{dim.label}</span>
                              <span>{dim.score}/20</span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                              {dim.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[220px] rounded-md border border-dashed border-neutral-300 dark:border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
                      <Award className="w-6 h-6 text-neutral-400 mb-2" />
                      <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        No Mock Scorecard Generated Yet
                      </div>
                      <p className="text-xs text-neutral-500 max-w-sm mt-1">
                        Select a target company, articulate your pointer invariant and complexity analysis on the left, and click Submit Round to receive your 5-dimension (100-point) rubric breakdown.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live Voice + Academic Tutor Drawer */}
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
