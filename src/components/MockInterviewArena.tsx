import React from 'react';
import {
  Award,
  Clock,
  Code2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Trash2,
  Volume2,
} from 'lucide-react';
import { AlgorithmProblem, CompanyProfile, Language } from '../types/visualizer';
import {
  evaluateMockInterview,
  getBlindStarterCode,
  getMultiLanguageCode,
  LANGUAGE_LABELS,
  MockRubricScorecard,
} from '../utils/zeroCostEngines';

interface MockInterviewArenaProps {
  companies: CompanyProfile[];
  problems: AlgorithmProblem[];
  currentProblem: AlgorithmProblem;
  language: Language;
  activeCode: string;
  mockActive: boolean;
  mockBlindMode: boolean;
  mockCompany: string;
  mockSecondsLeft: number;
  mockApproachNotes: string;
  mockScorecard: MockRubricScorecard | null;
  mockHistory: MockRubricScorecard[];
  quizCorrectCount: number;
  onSelectProblemId: (id: string) => void;
  onSelectLanguage: (lang: Language) => void;
  onCodeChange: (code: string) => void;
  onToggleBlindMode: (nextBlind: boolean, nextCode: string) => void;
  onToggleTimer: () => void;
  onChangeCompany: (companyName: string) => void;
  onChangeApproachNotes: (notes: string) => void;
  onScoreGenerated: (card: MockRubricScorecard) => void;
  onSelectHistoryCard: (card: MockRubricScorecard) => void;
  onClearHistory: () => void;
  onOpenVoiceInterviewer: () => void;
  onOpenInVisualizer: () => void;
  onExportBackup: () => void;
}

const LANGUAGES = Object.keys(LANGUAGE_LABELS) as Language[];

export const MockInterviewArena: React.FC<MockInterviewArenaProps> = ({
  companies,
  problems,
  currentProblem,
  language,
  activeCode,
  mockActive,
  mockBlindMode,
  mockCompany,
  mockSecondsLeft,
  mockApproachNotes,
  mockScorecard,
  mockHistory,
  quizCorrectCount,
  onSelectProblemId,
  onSelectLanguage,
  onCodeChange,
  onToggleBlindMode,
  onToggleTimer,
  onChangeCompany,
  onChangeApproachNotes,
  onScoreGenerated,
  onSelectHistoryCard,
  onClearHistory,
  onOpenVoiceInterviewer,
  onOpenInVisualizer,
  onExportBackup,
}) => {
  const nativeProblems = problems.filter((p) => p.traceMode === 'native');
  const templateProblems = problems.filter((p) => p.traceMode !== 'native');

  const notesTrimmed = mockApproachNotes.trim();
  const hasTimeBigO = /O\s*\([^)]+\)|linear|log\s*n|n\s*log\s*n/i.test(notesTrimmed);
  const hasSpaceBigO = /space|O\s*\(\s*1\s*\)|O\s*\(\s*[ncvk]\s*\)|in-?place|heap|stack|auxiliary/i.test(
    notesTrimmed
  );
  const hasInvariant = /invariant|pointer|edge|empty|null|boundary|duplicate|overflow|cycle/i.test(
    notesTrimmed
  );

  const verdictStyle = (verdict: MockRubricScorecard['verdict']) => {
    if (verdict === 'Strong Hire') return 'bg-emerald-600 text-white';
    if (verdict === 'Hire') return 'bg-blue-600 text-white';
    if (verdict === 'Lean Hire') return 'bg-amber-500 text-neutral-950';
    return 'bg-rose-600 text-white';
  };

  return (
    <section
      className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-5 sm:p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      data-testid="mock-interview-arena"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            45-MINUTE ONSITE CODING ROUND SIMULATOR · EMBEDDED BLIND EDITOR + RUBRIC CALIBRATION
          </div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mt-1">
            Timed Mock Interview &amp; 5-Dimension Hiring Committee Scorecard
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Hide the canonical solution with Blind Mode, write your implementation and complexity invariants below, and receive a calibrated 100-point rubric packet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 font-mono text-sm font-bold tabular-nums flex items-center gap-1.5"
            aria-label="Mock interview remaining time"
          >
            <Clock className="w-4 h-4" />
            {String(Math.floor(mockSecondsLeft / 60)).padStart(2, '0')}:
            {String(mockSecondsLeft % 60).padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={() => {
              const nextBlind = !mockBlindMode;
              const nextCode = nextBlind
                ? getBlindStarterCode(currentProblem, language)
                : getMultiLanguageCode(currentProblem, language);
              onToggleBlindMode(nextBlind, nextCode);
            }}
            className={`px-3 py-2 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
              mockBlindMode
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {mockBlindMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {mockBlindMode ? 'Restore Canonical Solution' : 'Hide Solution (Blind Mode)'}
          </button>
          <button
            type="button"
            onClick={onToggleTimer}
            className="px-3.5 py-2 text-xs font-medium rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors"
          >
            {mockActive ? 'Pause Timer' : 'Start 45m Mock Round'}
          </button>
          <button
            type="button"
            onClick={onOpenVoiceInterviewer}
            className="px-3 py-2 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice Interviewer
          </button>
          <button
            type="button"
            onClick={onExportBackup}
            className="px-3 py-2 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config + Embedded Live Code Editor + Notes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="mock-company-select" className="block text-xs font-mono text-neutral-500 mb-1">
                Target Company
              </label>
              <select
                id="mock-company-select"
                value={mockCompany}
                onChange={(e) => onChangeCompany(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
              >
                {companies.slice(0, 30).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.tier.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mock-problem-select" className="block text-xs font-mono text-neutral-500 mb-1">
                Interview Question ({problems.length})
              </label>
              <select
                id="mock-problem-select"
                value={currentProblem.id}
                onChange={(e) => onSelectProblemId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
              >
                <optgroup label={`Native Memory Traces (${nativeProblems.length})`}>
                  {nativeProblems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.topicCode}] {p.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`Pattern Practice (${templateProblems.length})`}>
                  {templateProblems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.topicCode}] {p.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label htmlFor="mock-lang-select" className="block text-xs font-mono text-neutral-500 mb-1">
                Coding Language
              </label>
              <select
                id="mock-lang-select"
                value={language}
                onChange={(e) => onSelectLanguage(e.target.value as Language)}
                className="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {LANGUAGE_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Embedded Live Code Editor inside Mock Arena */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="mock-code-editor"
                className="text-xs font-mono text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5" />
                Candidate Implementation ({LANGUAGE_LABELS[language]})
                {mockBlindMode && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    · Blind Starter Active
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={onOpenInVisualizer}
                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Open in Step Visualizer
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <textarea
              id="mock-code-editor"
              data-testid="mock-code-editor"
              rows={9}
              value={activeCode}
              onChange={(e) => onCodeChange(e.target.value)}
              spellCheck={false}
              className="w-full p-3 text-xs font-mono leading-relaxed rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0B0E14] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Pre-Coding Approach & Big-O Notes */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="mock-approach-notes" className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                Pre-Coding Approach, Loop Invariant &amp; Big-O Notes
              </label>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className={hasTimeBigO ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-400'}>
                  {hasTimeBigO ? '✓' : '○'} Time Big-O
                </span>
                <span className={hasSpaceBigO ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-400'}>
                  {hasSpaceBigO ? '✓' : '○'} Space Big-O
                </span>
                <span className={hasInvariant ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-400'}>
                  {hasInvariant ? '✓' : '○'} Invariant/Edges
                </span>
              </div>
            </div>
            <textarea
              id="mock-approach-notes"
              rows={3}
              value={mockApproachNotes}
              onChange={(e) => onChangeApproachNotes(e.target.value)}
              placeholder="State Time O(N), Space O(1), pointer/loop invariants, and edge cases (empty input, duplicates, single element)..."
              className="w-full p-3 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const card = evaluateMockInterview({
                companyName: mockCompany,
                problem: currentProblem,
                language,
                code: activeCode,
                approachNotes: mockApproachNotes,
                elapsedSeconds: Math.max(60, 45 * 60 - mockSecondsLeft),
                quizCorrectCount,
              });
              onScoreGenerated(card);
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <Award className="w-4 h-4" />
            Submit Round &amp; Generate 5-Dimension Hiring Scorecard
          </button>
        </div>

        {/* Right Column: Scorecard Packet + Persistent History */}
        <div className="lg:col-span-5 space-y-4">
          {mockScorecard ? (
            <div
              className="p-4 rounded-lg border border-neutral-900 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-900 space-y-3"
              data-testid="mock-scorecard-packet"
            >
              <div className="flex items-start justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    {mockScorecard.companyName} Hiring Committee Packet · {mockScorecard.createdAt}
                  </div>
                  <div className="text-base font-bold text-neutral-950 dark:text-white mt-0.5">
                    {mockScorecard.overallScore}/100
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    {LANGUAGE_LABELS[mockScorecard.language]} · {mockScorecard.elapsedMinutes}m · {mockScorecard.problemTitle.split('(')[0].trim()}
                  </div>
                </div>
                <span
                  data-testid="mock-verdict-badge"
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold shrink-0 ${verdictStyle(
                    mockScorecard.verdict
                  )}`}
                >
                  {mockScorecard.verdict}
                </span>
              </div>

              <div className="space-y-2">
                {mockScorecard.dimensions.map((dim) => (
                  <div
                    key={dim.label}
                    className="p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      <span>{dim.label}</span>
                      <span className="tabular-nums">{dim.score}/20</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dim.score >= 16
                            ? 'bg-emerald-500'
                            : dim.score >= 11
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (dim.score / 20) * 100)}%` }}
                      />
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {dim.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="min-h-[260px] rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
              <Award className="w-6 h-6 text-neutral-400 mb-2" />
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No Mock Scorecard Generated Yet
              </div>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Write or inspect your implementation on the left, state explicit time/space bounds and invariants, then click Submit Round for an honest 5-dimension evaluation.
              </p>
            </div>
          )}

          {/* Persistent Saved Mock Rounds History */}
          {mockHistory.length > 0 && (
            <div
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 p-3.5 space-y-2.5"
              data-testid="mock-history-panel"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Saved Mock Rounds ({mockHistory.length})
                </div>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[11px] font-mono text-neutral-500 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {mockHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectHistoryCard(item)}
                    className={`w-full text-left px-2.5 py-2 rounded-md border text-xs font-mono flex items-center justify-between gap-2 transition-colors ${
                      mockScorecard?.id === item.id
                        ? 'border-neutral-900 dark:border-neutral-200 bg-white dark:bg-[#111111]'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-[#111111]/70 hover:border-neutral-400'
                    }`}
                  >
                    <span className="truncate text-neutral-800 dark:text-neutral-200">
                      {item.companyName} · {item.problemTitle.split('(')[0].trim()}
                    </span>
                    <span className="shrink-0 font-bold text-neutral-950 dark:text-white">
                      {item.overallScore}/100 ({item.verdict})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
