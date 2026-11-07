import React, { useMemo, useState } from 'react';
import {
  AlgorithmProblem,
  CompanyProfile,
  CompanyQuestionEntry,
  CoreTopic,
  Difficulty,
  Language,
} from '../types/visualizer';
import { CORE_TOPICS } from '../data/problems';
import { Building2, Code2, Search, ArrowUpRight, Check } from 'lucide-react';

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
  const [selectedTopic, setSelectedTopic] = useState<'All' | CoreTopic>('Arrays');
  const [expandedCompanyId, setExpandedCompanyId] = useState<string>(companies[0]?.id || 'google');

  // Active company question sub-filters
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyDifficultyFilter, setCompanyDifficultyFilter] = useState<'All' | Difficulty>('All');
  const [companyRoundFilter, setCompanyRoundFilter] = useState<'All' | 'Featured' | 'Phone Screen' | 'Onsite Coding' | 'Bar Raiser / Core'>('All');
  const [companyTopicFilter, setCompanyTopicFilter] = useState<'All' | CoreTopic>('All');

  const problemMap = useMemo(() => {
    const map = new Map<string, AlgorithmProblem>();
    problems.forEach((p) => map.set(p.id, p));
    return map;
  }, [problems]);

  const companyQuestionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    companies.forEach((comp) => {
      const featSet = new Set(comp.featuredQuestions.map((q) => q.problemId));
      let count = 0;
      problems.forEach((p) => {
        if (featSet.has(p.id) || p.companies.includes(comp.id)) {
          count++;
        }
      });
      counts.set(comp.id, count);
    });
    return counts;
  }, [companies, problems]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, { total: number; solved: number }> = {};
    CORE_TOPICS.forEach((t) => {
      counts[t.id] = { total: 0, solved: 0 };
    });
    problems.forEach((p) => {
      const tKey = p.topic || 'Arrays';
      if (!counts[tKey]) counts[tKey] = { total: 0, solved: 0 };
      counts[tKey].total += 1;
      if (solvedProblemIds.has(p.id)) {
        counts[tKey].solved += 1;
      }
    });
    return counts;
  }, [problems, solvedProblemIds]);

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
      const matchesTopic = selectedTopic === 'All' || p.topic === selectedTopic;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.topicCode && p.topicCode.toLowerCase().includes(q)) ||
        String(p.number).includes(q) ||
        p.pattern.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q);
      return matchesCompany && matchesDiff && matchesTopic && matchesQuery;
    });
  }, [problems, selectedCompanyId, selectedDifficulty, selectedTopic, searchQuery]);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === expandedCompanyId) || filteredCompanies[0] || companies[0],
    [companies, expandedCompanyId, filteredCompanies]
  );

  const activeCompanyQuestions = useMemo(() => {
    if (!activeCompany) return [];
    const featMap = new Map<string, CompanyQuestionEntry>();
    activeCompany.featuredQuestions.forEach((q) => featMap.set(q.problemId, q));

    const list: {
      prob: AlgorithmProblem;
      isFeatured: boolean;
      frequency: string;
      roundType: 'Phone Screen' | 'Onsite Coding' | 'Bar Raiser / Core' | 'System & Algo';
      interviewerFocus: string;
    }[] = [];

    // 1. First add all featured questions in their defined priority order
    activeCompany.featuredQuestions.forEach((fq) => {
      const prob = problemMap.get(fq.problemId);
      if (prob) {
        list.push({
          prob,
          isFeatured: true,
          frequency: fq.frequency,
          roundType: fq.roundType,
          interviewerFocus: fq.interviewerFocus,
        });
      }
    });

    // 2. Add all other curriculum problems tagged with activeCompany.id
    const addedIds = new Set(list.map((item) => item.prob.id));
    problems.forEach((prob) => {
      if (prob.companies.includes(activeCompany.id) && !addedIds.has(prob.id)) {
        const roundType: 'Phone Screen' | 'Onsite Coding' | 'Bar Raiser / Core' =
          prob.difficulty === 'Hard'
            ? 'Bar Raiser / Core'
            : prob.difficulty === 'Easy'
            ? 'Phone Screen'
            : 'Onsite Coding';

        const freq =
          prob.frequencyScore >= 95
            ? '95% (Last 6 mos)'
            : prob.frequencyScore >= 90
            ? '89% (Last 1 yr)'
            : prob.frequencyScore >= 85
            ? '82% (Core Bar)'
            : '75% (Rotated)';

        list.push({
          prob,
          isFeatured: false,
          frequency: freq,
          roundType,
          interviewerFocus: prob.keyInsight || prob.pointerMechanicsNote || prob.summary,
        });
      }
    });

    return list;
  }, [activeCompany, problemMap, problems]);

  const filteredCompanyQuestions = useMemo(() => {
    return activeCompanyQuestions.filter((item) => {
      if (companyRoundFilter === 'Featured' && !item.isFeatured) return false;
      if (companyRoundFilter !== 'All' && companyRoundFilter !== 'Featured' && item.roundType !== companyRoundFilter) return false;
      if (companyDifficultyFilter !== 'All' && item.prob.difficulty !== companyDifficultyFilter) return false;
      if (companyTopicFilter !== 'All' && item.prob.topic !== companyTopicFilter) return false;
      if (companySearchQuery.trim()) {
        const q = companySearchQuery.trim().toLowerCase();
        const matches =
          item.prob.title.toLowerCase().includes(q) ||
          (item.prob.topicCode && item.prob.topicCode.toLowerCase().includes(q)) ||
          item.prob.summary.toLowerCase().includes(q) ||
          item.interviewerFocus.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activeCompanyQuestions, companyRoundFilter, companyDifficultyFilter, companyTopicFilter, companySearchQuery]);

  if (mode === 'companies') {
    const totalCompanyQs = activeCompanyQuestions.length;
    const featuredCount = activeCompanyQuestions.filter((q) => q.isFeatured).length;
    const phoneCount = activeCompanyQuestions.filter((q) => q.roundType === 'Phone Screen').length;
    const onsiteCount = activeCompanyQuestions.filter((q) => q.roundType === 'Onsite Coding').length;
    const barRaiserCount = activeCompanyQuestions.filter((q) => q.roundType === 'Bar Raiser / Core').length;

    return (
      <div className="space-y-6" data-testid="company-directory-view">
        {/* Header & Search Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              {companies.length} Engineering Organizations · Python &amp; Java Benchmarks
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-1">
              Top Tech &amp; Quant Firm Question Directory
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
              Explore standard algorithmic interview questions across {companies.length} top technology, frontier AI, and quantitative trading firms with direct 1-click loading into the step-by-step Memory Visualizer.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search companies by name or pattern"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${companies.length} companies (e.g. Google, Citadel, OpenAI)...`}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
            />
          </div>
        </div>

        {/* Tier Segmented Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 w-fit">
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                selectedTier === tier
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Split Layout: 59 Company Grid + Selected Firm Deep-Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Scrollable 59 Firm Roster */}
          <div className="lg:col-span-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-500">
              <span>Showing {filteredCompanies.length} of {companies.length} Firms</span>
              <span>Available Qs</span>
            </div>
            <div className="max-h-[640px] overflow-y-auto divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
              {filteredCompanies.map((comp) => {
                const isSelected = comp.id === activeCompany?.id;
                const totalQs = companyQuestionCounts.get(comp.id) || comp.featuredQuestions.length;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => {
                      setExpandedCompanyId(comp.id);
                      setCompanySearchQuery('');
                      setCompanyRoundFilter('All');
                      setCompanyDifficultyFilter('All');
                      setCompanyTopicFilter('All');
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-950 dark:text-white'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">{comp.name}</span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                        {comp.tier} · {comp.hq}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums shrink-0 px-2 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800">
                      {totalQs} Qs
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Company Interview Bar & Full Question Bank */}
          {activeCompany && (
            <div className="lg:col-span-7 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-6 space-y-5">
              <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {activeCompany.tier} · {activeCompany.hq} · <strong className="text-neutral-900 dark:text-neutral-100">{totalCompanyQs} Curated Problems Available</strong>
                </div>
                <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mt-1">
                  {activeCompany.name} — Engineering Interview Bank
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                  {activeCompany.interviewBarSummary}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-3 font-mono">
                  <span>
                    Languages: <strong className="text-neutral-900 dark:text-neutral-200">{activeCompany.preferredLanguages.join(', ')}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Core Patterns: <strong className="text-neutral-900 dark:text-neutral-200">{activeCompany.signaturePatterns.join(' / ')}</strong>
                  </span>
                </div>
              </div>

              {/* Round & Frequency Filter Tabs */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setCompanyRoundFilter('All')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      companyRoundFilter === 'All'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    All Questions ({totalCompanyQs})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyRoundFilter('Featured')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      companyRoundFilter === 'Featured'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    ⭐ Core High-Freq ({featuredCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyRoundFilter('Phone Screen')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      companyRoundFilter === 'Phone Screen'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    Phone Screen ({phoneCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyRoundFilter('Onsite Coding')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      companyRoundFilter === 'Onsite Coding'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    Onsite Coding ({onsiteCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyRoundFilter('Bar Raiser / Core')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      companyRoundFilter === 'Bar Raiser / Core'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    Bar Raiser &amp; Hard ({barRaiserCount})
                  </button>
                </div>

                {/* Sub-Filters: Search within active company + Difficulty + Topic */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                      placeholder={`Filter ${activeCompany.name} questions (e.g. tree, two pointers, cycle)...`}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
                    />
                  </div>

                  {/* Difficulty Pills */}
                  <div className="flex items-center gap-1 shrink-0">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCompanyDifficultyFilter(d)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          companyDifficultyFilter === d
                            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 border-neutral-900 dark:border-neutral-100 font-semibold'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {/* Topic Select */}
                  <select
                    value={companyTopicFilter}
                    onChange={(e) => setCompanyTopicFilter(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 focus:outline-none shrink-0"
                  >
                    <option value="All">All Topics (8)</option>
                    {CORE_TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Questions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                  <span>Showing {filteredCompanyQuestions.length} of {totalCompanyQs} Questions for {activeCompany.name}</span>
                  <span>1-Click Trace Launcher</span>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden max-h-[640px] overflow-y-auto">
                  {filteredCompanyQuestions.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-neutral-500">
                      No questions match the current company filters. Try clearing search or changing difficulty/round filter.
                    </div>
                  ) : (
                    filteredCompanyQuestions.map(({ prob, isFeatured, frequency, roundType, interviewerFocus }) => {
                      const isSolved = solvedProblemIds.has(prob.id);

                      return (
                        <div
                          key={prob.id}
                          className="p-4 bg-white dark:bg-[#111111] hover:bg-neutral-50 dark:hover:bg-neutral-900/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                              <button
                                type="button"
                                onClick={() => onToggleSolved(prob.id)}
                                title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  isSolved
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-neutral-400 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-200'
                                }`}
                              >
                                {isSolved && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                                {prob.topicCode || `Q-${prob.number}`}
                              </span>
                              <span aria-hidden="true">·</span>

                              <span
                                className={`font-semibold px-1.5 py-0.2 rounded text-[11px] ${
                                  prob.difficulty === 'Easy'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : prob.difficulty === 'Medium'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                }`}
                              >
                                {prob.difficulty}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{prob.topic || prob.pattern}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{frequency}</span>
                              <span aria-hidden="true">·</span>
                              <span className="px-1.5 py-0.2 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {roundType}
                              </span>
                              {isFeatured && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                                  Top Pick
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-100 flex items-center gap-2">
                              <span className="truncate">{prob.title}</span>
                            </div>

                            <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                              <strong className="text-neutral-800 dark:text-neutral-300">Interviewer Focus:</strong> {interviewerFocus}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onSelectProblem(prob.id, 'python')}
                              className="px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-950 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              Python Trace
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectProblem(prob.id, 'java')}
                              className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors whitespace-nowrap shrink-0"
                            >
                              Java Trace
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Topic-by-Topic Curriculum Explorer (8 Core Topics x 25 Questions = 200 Problems)
  return (
    <div className="space-y-6" data-testid="challenge-explorer-view">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            8 Core Programming Topics · 25 Curated Problems Per Topic ({problems.length} Total) · {solvedProblemIds.size} Completed
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-1">
            Topic-by-Topic Engineering Curriculum (25 Questions Each)
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Select a topic below—Arrays, Linked Lists, Dynamic Programming, Greedy, Sliding Window, Stacks &amp; Queues, Trees &amp; Heaps, or Graphs &amp; Search—to practice its 25 sequential problems step by step.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search coding challenges"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic code (e.g. ARR-01, DP-05) or title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
          />
        </div>
      </div>

      {/* 8 Topic Cards Grid (25 Questions Per Topic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {CORE_TOPICS.map((topicMeta) => {
          const isSelected = selectedTopic === topicMeta.id;
          const stats = topicCounts[topicMeta.id] || { total: 25, solved: 0 };
          return (
            <button
              key={topicMeta.id}
              type="button"
              onClick={() => setSelectedTopic(topicMeta.id)}
              className={`text-left p-4 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              <div>
                <div
                  className={`flex items-center justify-between text-xs font-mono ${
                    isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'
                  }`}
                >
                  <span>{topicMeta.codePrefix}-01..25</span>
                  <span>
                    {stats.solved}/{stats.total} Solved
                  </span>
                </div>
                <div className="text-sm font-bold mt-1">{topicMeta.label}</div>
              </div>
              <p
                className={`text-xs line-clamp-2 ${
                  isSelected
                    ? 'text-neutral-200 dark:text-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {topicMeta.shortDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Secondary Filter Bar: Topic All Toggle, Difficulty & Company */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            Active Topic: {selectedTopic === 'All' ? `All Topics (${problems.length} Questions)` : `${selectedTopic} (25 Questions)`}
          </span>
          {selectedTopic !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedTopic('All')}
              className="px-2.5 py-1 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Show All {problems.length} Questions
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="company-filter-select" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Company:
            </label>
            <select
              id="company-filter-select"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100"
            >
              <option value="all">All {companies.length} Tech Firms</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clean 20-Question Topic Table */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs font-mono text-neutral-500">
                <th className="py-3 px-4 w-12">Done</th>
                <th className="py-3 px-4 w-24">Code</th>
                <th className="py-3 px-4">Problem &amp; Memory Invariant</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4 text-right">Step-by-Step Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70 text-sm">
              {filteredProblems.map((prob) => {
                const isSolved = solvedProblemIds.has(prob.id);
                const isCurrent = prob.id === activeProblemId;

                return (
                  <tr
                    key={prob.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-neutral-100/80 dark:bg-neutral-800/40'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleSolved(prob.id)}
                        aria-label={`Mark ${prob.title} as ${isSolved ? 'unsolved' : 'solved'}`}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSolved
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                            : 'border-neutral-300 dark:border-neutral-700 text-transparent hover:border-neutral-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap tabular-nums">
                      {prob.topicCode || `Q-${prob.number}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-950 dark:text-neutral-100">
                        {prob.title}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                        {prob.summary}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                      {prob.topic || prob.pattern}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono whitespace-nowrap">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob.id, 'python')}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-950 transition-colors inline-flex items-center gap-1"
                        >
                          Python <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectProblem(prob.id, 'java')}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
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
