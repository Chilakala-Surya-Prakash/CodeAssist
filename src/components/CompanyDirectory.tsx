import React, { useMemo, useState } from 'react';
import {
  AlgorithmPattern,
  AlgorithmProblem,
  CompanyProfile,
  Difficulty,
  Language,
} from '../types/visualizer';
import { Building2, Code2, Search, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface CompanyDirectoryProps {
  companies: CompanyProfile[];
  problems: AlgorithmProblem[];
  activeProblemId: string;
  solvedProblemIds: Set<string>;
  onToggleSolved: (problemId: string) => void;
  onSelectProblem: (problemId: string, preferredLang?: Language) => void;
  mode: 'companies' | 'challenges';
}

const DIFFICULTIES: ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard'];

const PATTERNS: ('All' | AlgorithmPattern)[] = [
  'All',
  'Linked List & Pointers',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Monotonic Stack',
  'Trees & Graphs',
  'Dynamic Programming',
  'Heap & Priority Queue',
];

const TIERS: ('All' | CompanyProfile['tier'])[] = [
  'All',
  'FAANG & Hyperscalers',
  'AI & Frontier Labs',
  'Quant & High-Frequency',
  'FinTech & Commerce',
  'Enterprise & Cloud Systems',
];

export const CompanyDirectory: React.FC<CompanyDirectoryProps> = ({
  companies,
  problems,
  activeProblemId,
  solvedProblemIds,
  onToggleSolved,
  onSelectProblem,
  mode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'All' | CompanyProfile['tier']>('All');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | Difficulty>('All');
  const [selectedPattern, setSelectedPattern] = useState<'All' | AlgorithmPattern>('All');
  const [expandedCompanyId, setExpandedCompanyId] = useState<string>(companies[0]?.id || 'google');

  const problemMap = useMemo(() => {
    const map = new Map<string, AlgorithmProblem>();
    problems.forEach((p) => map.set(p.id, p));
    return map;
  }, [problems]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesTier = selectedTier === 'All' || c.tier === selectedTier;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.hq.toLowerCase().includes(q) ||
        c.interviewBarSummary.toLowerCase().includes(q) ||
        c.signaturePatterns.some((p) => p.toLowerCase().includes(q));
      return matchesTier && matchesQuery;
    });
  }, [companies, selectedTier, searchQuery]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesCompany = selectedCompanyId === 'all' || p.companies.includes(selectedCompanyId);
      const matchesDiff = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
      const matchesPattern = selectedPattern === 'All' || p.pattern === selectedPattern;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        String(p.number).includes(q) ||
        p.pattern.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q);
      return matchesCompany && matchesDiff && matchesPattern && matchesQuery;
    });
  }, [problems, selectedCompanyId, selectedDifficulty, selectedPattern, searchQuery]);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === expandedCompanyId) || filteredCompanies[0] || companies[0],
    [companies, expandedCompanyId, filteredCompanies]
  );

  if (mode === 'companies') {
    return (
      <div className="space-y-6" data-testid="company-directory-view">
        {/* Header & Search Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-mono text-sky-600 dark:text-sky-400">
              {companies.length} Curated Engineering Organizations · Python &amp; Java Benchmarks
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Top Tech &amp; Quant Firm Question Directory
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Explore standard algorithmic interview questions across {companies.length} top technology, frontier AI, and quantitative trading firms with direct 1-click loading into the Memory &amp; Pointer Visualizer.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search companies by name or pattern"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${companies.length} companies (e.g. Google, Citadel, OpenAI)...`}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1522] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Tier Segmented Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedTier === tier
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Split Layout: 51+ Company Grid + Selected Firm Deep-Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Scrollable 51+ Firm Roster */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Showing {filteredCompanies.length} of {companies.length} Firms</span>
              <span>Questions</span>
            </div>
            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {filteredCompanies.map((comp) => {
                const isSelected = comp.id === activeCompany?.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setExpandedCompanyId(comp.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-sky-500/10 dark:bg-sky-500/15 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{comp.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {comp.tier} · {comp.hq}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                      {comp.totalCuratedQuestions} Qs
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Company Interview Bar & Standard Questions */}
          {activeCompany && (
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] p-6 space-y-5">
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {activeCompany.tier} · {activeCompany.hq} · {activeCompany.totalCuratedQuestions} Curated Problems
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeCompany.name} — Engineering Interview Standard
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {activeCompany.interviewBarSummary}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                  <span>Preferred Languages: <strong className="text-slate-800 dark:text-slate-200">{activeCompany.preferredLanguages.join(', ')}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Core Patterns: <strong className="text-sky-600 dark:text-sky-400">{activeCompany.signaturePatterns.join(' / ')}</strong></span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  High-Frequency {activeCompany.name} Coding Questions (Python &amp; Java)
                </h3>

                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {activeCompany.featuredQuestions.map((entry) => {
                    const prob = problemMap.get(entry.problemId);
                    if (!prob) return null;

                    return (
                      <div
                        key={entry.problemId}
                        className="p-4 bg-slate-50/40 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                              #{prob.number}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                prob.difficulty === 'Easy'
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : prob.difficulty === 'Medium'
                                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                  : 'text-rose-600 dark:text-rose-400 font-semibold'
                              }
                            >
                              {prob.difficulty}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{prob.pattern}</span>
                            <span aria-hidden="true">·</span>
                            <span>Freq: {entry.frequency}</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.roundType}</span>
                          </div>

                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {prob.title}
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <strong className="text-slate-700 dark:text-slate-300">Interviewer Focus:</strong> {entry.interviewerFocus}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onSelectProblem(prob.id, 'python')}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            Python Trace
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectProblem(prob.id, 'java')}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                          >
                            Java Trace
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Challenge Explorer Mode (LeetCode-style Filterable Table)
  return (
    <div className="space-y-6" data-testid="challenge-explorer-view">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-mono text-sky-600 dark:text-sky-400">
            Interactive Coding Challenge Explorer · {solvedProblemIds.size}/{problems.length} Completed
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Algorithmic Challenges &amp; Data Structure Simulations
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Filter by company, difficulty, or data structure topic. Launch any challenge directly into the step-by-step Python &amp; Java Memory Visualizer.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search coding challenges"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, number, or pattern..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1522] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Multi-Dimensional Filter Controls (Company, Difficulty, Pattern) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="company-filter-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Company:
            </label>
            <select
              id="company-filter-select"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1522] text-slate-900 dark:text-slate-100"
            >
              <option value="all">All {companies.length} Tech Firms</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.featuredQuestions.length} featured)
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Topic / Pattern Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PATTERNS.map((pat) => (
            <button
              key={pat}
              type="button"
              onClick={() => setSelectedPattern(pat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                selectedPattern === pat
                  ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              {pat}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Challenge Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-mono text-slate-500">
                <th className="py-3 px-4 w-12">Done</th>
                <th className="py-3 px-4">Challenge &amp; Memory Structure</th>
                <th className="py-3 px-4">Topic Pattern</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Top Hiring Firms</th>
                <th className="py-3 px-4 text-right">Launch Visualizer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
              {filteredProblems.map((prob) => {
                const isSolved = solvedProblemIds.has(prob.id);
                const isCurrent = prob.id === activeProblemId;

                return (
                  <tr
                    key={prob.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-sky-500/5 dark:bg-sky-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleSolved(prob.id)}
                        aria-label={`Mark ${prob.title} as ${isSolved ? 'unsolved' : 'solved'}`}
                        className={`p-1 rounded transition-colors ${
                          isSolved
                            ? 'text-emerald-500'
                            : 'text-slate-300 dark:text-slate-700 hover:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        <span className="font-mono text-xs text-slate-400 mr-2 tabular-nums">
                          #{prob.number}
                        </span>
                        {prob.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {prob.summary}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {prob.pattern}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono whitespace-nowrap">
                      <span
                        className={
                          prob.difficulty === 'Easy'
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : prob.difficulty === 'Medium'
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-rose-600 dark:text-rose-400 font-semibold'
                        }
                      >
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {prob.companies.slice(0, 4).join(' · ')} · +{Math.max(1, prob.companies.length - 4)} firms
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob.id, 'python')}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white transition-colors inline-flex items-center gap-1"
                        >
                          Python <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob.id, 'java')}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Java
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
