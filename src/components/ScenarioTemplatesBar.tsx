import React, { useState } from 'react';
import { AlgorithmProblem } from '../types/visualizer';
import { Check, Edit3, Layers, Play, Sparkles, X } from 'lucide-react';

interface ScenarioTemplatesBarProps {
  problem: AlgorithmProblem;
  customInput: string;
  onSelectTemplate: (value: string, label: string) => void;
}

interface EdgeCaseTemplate {
  label: string;
  value: string;
  badge?: string;
}

/**
 * Returns canonical algorithmic edge cases tailored to the problem's underlying data structure
 */
function getCuratedEdgeCases(problem: AlgorithmProblem): EdgeCaseTemplate[] {
  const pId = problem.id.toLowerCase();
  const topic = (problem.topic || '').toLowerCase();
  const pattern = (problem.pattern || '').toLowerCase();

  if (pId.includes('cycle') || pId.includes('floyd')) {
    return [
      { label: 'Standard Cycle (3->0)', value: '3 -> 2 -> 0 -> -4 (pos=1)', badge: 'Cycle' },
      { label: 'Two-Node Loop', value: '1 -> 2 (pos=0)', badge: 'Mini' },
      { label: 'No Cycle (Linear)', value: '1 -> 2 -> 3 -> 4 (pos=-1)', badge: 'Acyclic' },
    ];
  }

  if (topic.includes('linked list') || pattern.includes('linked list') || pId.includes('reverse') || pId.includes('list')) {
    return [
      { label: 'Single Node [42]', value: '42', badge: 'Edge: N=1' },
      { label: 'Two-Node Flip [1->2]', value: '1 -> 2', badge: 'Edge: N=2' },
      { label: 'Descending [50..10]', value: '50 -> 40 -> 30 -> 20 -> 10', badge: 'Reverse' },
      { label: 'Alternating High-Low', value: '10 -> 90 -> 20 -> 80 -> 30', badge: 'Challenger' },
    ];
  }

  if (pId.includes('water') || pId.includes('container') || pId.includes('trapping')) {
    return [
      { label: 'Stepped Canyon', value: '3, 0, 2, 0, 4', badge: 'Chasm' },
      { label: 'Deep Central Basin', value: '4, 1, 0, 2, 1, 4', badge: 'Basin' },
      { label: 'Flat Plateau (0 water)', value: '3, 3, 3, 3', badge: 'Zero' },
      { label: 'Twin Peak Islands', value: '5, 0, 0, 5', badge: 'V-Valley' },
    ];
  }

  if (pId.includes('window') || pId.includes('substring')) {
    return [
      { label: 'Repeated Clumps "pwwkew"', value: 'pwwkew', badge: 'Duplicate' },
      { label: 'All Unique "abcdef"', value: 'abcdef', badge: 'Strict Unique' },
      { label: 'Single Char "bbbbbb"', value: 'bbbbbb', badge: 'All Same' },
      { label: 'Alternating "abacaba"', value: 'abacaba', badge: 'Palindrome' },
    ];
  }

  if (pId.includes('parenthes') || topic.includes('stack') || pattern.includes('stack')) {
    return [
      { label: 'Deeply Nested ({[()]})', value: '({[()]})', badge: 'Nested' },
      { label: 'Adjacent Pairs ()[]{}', value: '()[]{}', badge: 'Sequential' },
      { label: 'Mismatched Closure ({[)]', value: '({[)]', badge: 'Invalid' },
      { label: 'Unclosed Prefix (([{}', value: '(([{}', badge: 'Unfinished' },
    ];
  }

  if (pId.includes('sum') || topic.includes('hash') || pattern.includes('hash')) {
    return [
      { label: 'Direct Target [2,7,11,15 | t=9]', value: '2, 7, 11, 15 | target: 9', badge: 'Instant' },
      { label: 'Zero Sum [-3,4,3,90 | t=0]', value: '-3, 4, 3, 90 | target: 0', badge: 'Negatives' },
      { label: 'Equal Pair [3,3 | t=6]', value: '3, 3 | target: 6', badge: 'Duplicates' },
    ];
  }

  if (pId.includes('tree') || topic.includes('tree') || pattern.includes('tree')) {
    return [
      { label: 'Complete 3-Level Tree', value: '1, 2, 3, 4, 5, 6, 7', badge: 'Balanced' },
      { label: 'Degenerate Right Spine', value: '1, null, 2, null, 3', badge: 'Spine' },
      { label: 'Symmetric Inverted', value: '1, 2, 2, 3, 4, 4, 3', badge: 'Mirror' },
    ];
  }

  // General Arrays / Two Pointers / Dynamic Programming Fallback
  return [
    { label: 'Small Pair [1, 2]', value: '1, 2', badge: 'Minimal' },
    { label: 'Ascending [1, 2, 3, 4, 5]', value: '1, 2, 3, 4, 5', badge: 'Sorted' },
    { label: 'Descending [5, 4, 3, 2, 1]', value: '5, 4, 3, 2, 1', badge: 'Reverse' },
    { label: 'All Identical [7, 7, 7, 7]', value: '7, 7, 7, 7', badge: 'Uniform' },
  ];
}

export const ScenarioTemplatesBar: React.FC<ScenarioTemplatesBarProps> = ({
  problem,
  customInput,
  onSelectTemplate,
}) => {
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [inputDraft, setInputDraft] = useState(customInput);
  const [activeLabelToast, setActiveLabelToast] = useState<string | null>(null);

  // Combine authentic problem samples with curated edge cases
  const sampleInputs = problem.sampleInputs || [];
  const edgeCases = getCuratedEdgeCases(problem);

  const handleSelect = (val: string, label: string) => {
    onSelectTemplate(val, label);
    setInputDraft(val);
    setActiveLabelToast(label);
    setTimeout(() => setActiveLabelToast(null), 3000);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputDraft.trim()) {
      handleSelect(inputDraft.trim(), 'Custom Input');
      setIsEditingCustom(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-[#111111]/90 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xs space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Available Templates & Scenarios</span>
          {activeLabelToast && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold animate-fade-in">
              Active: {activeLabelToast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsEditingCustom((prev) => !prev);
              setInputDraft(customInput);
            }}
            className={`px-2.5 py-1 text-xs font-medium font-mono rounded-md border transition-all flex items-center gap-1.5 ${
              isEditingCustom
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingCustom ? 'Close Editor' : 'Custom Input...'}</span>
          </button>
        </div>
      </div>

      {/* Primary Sample Input & Canonical Edge Case Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {/* Authentic Curated Sample Inputs */}
        {sampleInputs.map((sample, idx) => {
          const isSelected = customInput.trim() === sample.value.trim();
          return (
            <button
              key={`sample-${idx}`}
              type="button"
              onClick={() => handleSelect(sample.value, sample.label)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 font-bold ring-1 ring-blue-500/50 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              {isSelected ? (
                <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
              <span>{sample.label}</span>
            </button>
          );
        })}

        {/* Curated Algorithmic Edge Cases */}
        {edgeCases.map((edge, idx) => {
          const isSelected = customInput.trim() === edge.value.trim();
          return (
            <button
              key={`edge-${idx}`}
              type="button"
              onClick={() => handleSelect(edge.value, edge.label)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 font-bold ring-1 ring-emerald-500/50 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              {isSelected ? (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-[10px] opacity-60">⚡</span>
              )}
              <span>{edge.label}</span>
              {edge.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-sans">
                  {edge.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expandable Custom Input Drawer */}
      {isEditingCustom && (
        <form
          onSubmit={handleApplyCustom}
          className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
              placeholder="e.g. 10 -> 20 -> 30 -> 40 or 0, 2, 0, 3, 1, 0, 1, 3, 2, 1"
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Apply & Trace</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingCustom(false)}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
