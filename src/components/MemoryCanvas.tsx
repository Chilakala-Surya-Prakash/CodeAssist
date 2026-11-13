import React, { useState } from 'react';
import { ExecutionStep, HeapCell, HeapObject, PointerRef } from '../types/visualizer';
import { RecursionTreeNode } from '../utils/zeroCostEngines';
import {
  ArrowRight,
  Cpu,
  GitBranch,
  Layers,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Database,
  Hash,
  Network,
  Share2,
} from 'lucide-react';

interface MemoryCanvasProps {
  problemId: string;
  step: ExecutionStep;
  totalSteps: number;
  onSelectStep: (idx: number) => void;
  recursionTree?: RecursionTreeNode[];
  predictModeActive?: boolean;
  onCellClick?: (cellIndex: number | string) => void;
}

/**
 * High-contrast semantic palette strictly for pointer roles:
 * - head / curr / left / slow: Electric Blue (#2563EB)
 * - prev / right / fast: Emerald / Teal (#059669)
 * - nxt / next / mid / target: Amber / Violet (#7C3AED / #D97706)
 * - NULL: Muted Slate (#94A3B8)
 */
export function getPointerSemanticColor(name: string): {
  badge: string;
  arrow: string;
  border: string;
  bgLight: string;
} {
  const lower = name.toLowerCase();
  if (lower.includes('curr') || lower.includes('head') || lower.includes('slow') || lower.includes('left')) {
    return {
      badge: 'bg-blue-600 text-white border-blue-500 shadow-xs dark:bg-blue-600 dark:text-white',
      arrow: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/50',
      bgLight: 'bg-blue-50/80 dark:bg-blue-950/40',
    };
  }
  if (lower.includes('prev') || lower.includes('fast') || lower.includes('right')) {
    return {
      badge: 'bg-emerald-600 text-white border-emerald-500 shadow-xs dark:bg-emerald-600 dark:text-white',
      arrow: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500/50',
      bgLight: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    };
  }
  if (lower.includes('nxt') || lower.includes('next') || lower.includes('mid') || lower.includes('target')) {
    return {
      badge: 'bg-violet-600 text-white border-violet-500 shadow-xs dark:bg-violet-600 dark:text-white',
      arrow: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-500 dark:border-violet-400 ring-1 ring-violet-500/50',
      bgLight: 'bg-violet-50/80 dark:bg-violet-950/40',
    };
  }
  return {
    badge: 'bg-amber-600 text-white border-amber-500 shadow-xs dark:bg-amber-600 dark:text-white',
    arrow: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500/50',
    bgLight: 'bg-amber-50/80 dark:bg-amber-950/40',
  };
}

export const MemoryCanvas: React.FC<MemoryCanvasProps> = ({
  problemId,
  step,
  recursionTree = [],
  predictModeActive = false,
  onCellClick,
}) => {
  const [flamegraphExpanded, setFlamegraphExpanded] = useState(false);
  const primaryHeap = step.heapObjects[0];
  const secondaryHeap = step.heapObjects[1];

  const getPointersForCell = (objId: string, cellIndex: number | string): PointerRef[] => {
    return step.pointers.filter(
      (p) => p.targetObjectId === objId && String(p.targetIndex) === String(cellIndex)
    );
  };

  const nullPointers = step.pointers.filter((p) => p.targetIndex === null);

  // Contextual flamegraph: only show or expand by default for recursive algorithms
  const isRecursiveAlgorithm =
    problemId.includes('tree') ||
    problemId.includes('graph') ||
    problemId.includes('course') ||
    problemId.includes('coin') ||
    primaryHeap?.type === 'BinaryTree' ||
    step.stackFrames.length > 1;

  // Check if current problem has a sliding window
  const isSlidingWindow =
    problemId.includes('substring') ||
    problemId.includes('window') ||
    step.pointers.some((p) => p.name.toLowerCase() === 'left') &&
    step.pointers.some((p) => p.name.toLowerCase() === 'right');

  // Helper renderer for any HeapObject (Primary or Secondary)
  const renderDataStructure = (heap: HeapObject, isPrimary: boolean) => {
    if (!heap) return null;

    return (
      <div
        key={heap.id}
        className={`rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-[#F8FAFC] dark:bg-[#0D1117] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 ${
          !isPrimary ? 'mt-5' : ''
        }`}
      >
        {/* Structure Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 -mx-5 -mt-5 px-5 pt-4 rounded-t-xl backdrop-blur-xs">
          <div>
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{heap.address}</span> · {heap.type} · {heap.byteSize} bytes allocated
            </div>
            <h3 className="text-base font-bold text-neutral-950 dark:text-neutral-100 mt-0.5 flex items-center gap-2">
              {heap.type === 'GraphQueue' && <Network className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
              {heap.type === 'BinaryTree' && <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {heap.type === 'Stack' && <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {heap.type === 'HashMap' && <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              {heap.type === 'DPTable' && <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
              <span>{heap.label}</span>
            </h3>
          </div>

          {isPrimary && (
            <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <span>
                Comparisons: <strong className="text-neutral-950 dark:text-neutral-100 tabular-nums">{step.metrics.comparisons}</strong>
              </span>
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
              <span>
                Pointer Ops: <strong className="text-neutral-950 dark:text-neutral-100 tabular-nums">{step.metrics.pointerOps}</strong>
              </span>
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
              <span>
                Heap: <strong className="text-neutral-950 dark:text-neutral-100 tabular-nums">{step.metrics.heapBytesUsed} B</strong>
              </span>
            </div>
          )}
        </div>

        {/* 1. LINKED LIST & DOUBLY LINKED LIST RENDERER */}
        {heap.type === 'LinkedList' && (
          <div className="py-2 overflow-x-auto">
            {nullPointers.length > 0 && isPrimary && (
              <div className="mb-4 flex items-center gap-2 text-xs font-mono">
                <span className="text-neutral-500 dark:text-neutral-400">NULL Register:</span>
                {nullPointers.map((np) => (
                  <span
                    key={np.id}
                    className="px-2.5 py-0.5 rounded-md border border-dashed border-slate-400 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs tabular-nums"
                  >
                    *{np.name} → NULL (0x0000)
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {heap.cells.map((cell, idx) => {
                const cellPtrs = getPointersForCell(heap.id, cell.index);
                const nextCell = idx + 1 < heap.cells.length ? heap.cells[idx + 1] : null;
                const pointsForwardToNext = nextCell && cell.nextAddress === nextCell.addressOffset;
                const nextPointsBackwardToCurr = nextCell && nextCell.nextAddress === cell.addressOffset;
                const isSeveredBetween = nextCell && !pointsForwardToNext && !nextPointsBackwardToCurr;

                const isSelfOrCycleBack =
                  problemId === 'cycle-detection-floyd' &&
                  idx === heap.cells.length - 1 &&
                  cell.nextAddress !== null;

                const isHighlighted =
                  cell.status === 'mutated' || cell.status === 'active' || cell.status === 'target';

                const primaryPointer = cellPtrs[0];
                const semanticStyle = primaryPointer ? getPointerSemanticColor(primaryPointer.name) : null;

                return (
                  <React.Fragment key={String(cell.index)}>
                    <div className="flex flex-col items-center">
                      <div className="min-h-[28px] flex flex-wrap items-center justify-center gap-1 mb-1.5">
                        {cellPtrs.map((ptr) => {
                          const pColor = getPointerSemanticColor(ptr.name);
                          return (
                            <span
                              key={ptr.id}
                              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md border whitespace-nowrap transition-all ${pColor.badge}`}
                            >
                              *{ptr.name} ↓
                            </span>
                          );
                        })}
                      </div>

                      <div
                        onClick={() => onCellClick?.(cell.index)}
                        role={onCellClick ? 'button' : undefined}
                        tabIndex={onCellClick ? 0 : undefined}
                        className={`w-32 sm:w-36 rounded-lg border transition-all shadow-xs ${
                          onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                        } ${
                          semanticStyle && isHighlighted
                            ? `${semanticStyle.border} ${semanticStyle.bgLight}`
                            : isHighlighted
                            ? 'border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-800 ring-1 ring-neutral-900 dark:ring-neutral-100'
                            : 'border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111111]'
                        }`}
                      >
                        <div className="px-2.5 py-1 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                            {cell.addressOffset}
                          </span>
                          <span className={`font-semibold uppercase ${
                            cell.status === 'mutated'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : cell.status === 'active'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-neutral-500'
                          }`}>
                            {cell.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-neutral-100 dark:divide-neutral-800/80">
                          <div className="p-2 text-center">
                            <div className="text-[10px] font-mono text-neutral-400 uppercase">val</div>
                            <div className="text-base font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums">
                              {cell.value}
                            </div>
                          </div>
                          <div className="p-2 text-center">
                            <div className="text-[10px] font-mono text-neutral-400 uppercase">.next</div>
                            <div className="text-[11px] font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate tabular-nums">
                              {cell.nextAddress ? (
                                <span className="text-violet-600 dark:text-violet-400 font-semibold">{cell.nextAddress}</span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">NULL</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {cell.annotation && (
                          <div className="px-2.5 py-1 border-t border-neutral-100 dark:border-neutral-800/80 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                            <span className="truncate">{cell.annotation}</span>
                            {nextPointsBackwardToCurr && (
                              <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {idx < heap.cells.length - 1 && (
                      <div className="flex flex-col items-center justify-center pt-8 px-1">
                        {nextPointsBackwardToCurr ? (
                          <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                            <span className="text-[9px] mb-0.5">reversed</span>
                            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700">
                              <span className="text-xs">←</span>
                              <span>.next</span>
                            </div>
                          </div>
                        ) : isSeveredBetween ? (
                          <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                            <span className="text-[9px] text-red-500 font-semibold">broken</span>
                            <div className="px-1 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500">
                              ⨯
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
                            <svg className="w-6 h-5" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 10h14m-5-5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}

                    {isSelfOrCycleBack && (
                      <div className="flex flex-col items-center justify-center pt-8 pl-1 text-violet-600 dark:text-violet-400 font-mono text-xs font-semibold tabular-nums">
                        <span>↩ cycle → {cell.nextAddress}</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. DIRECTED GRAPH & TOPOLOGICAL QUEUE RENDERER (Graphs & Search) */}
        {heap.type === 'GraphQueue' && (
          <div className="py-2 space-y-4">
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
              <span>Directed Graph Vertices & In-Degree Status (Kahn's Topological Sort)</span>
              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                Frontier Invariant: in=0 Ready
              </span>
            </div>

            {/* Vertices Grid with Directed Edges & In-degree Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {heap.cells.map((cell) => {
                const cellPtrs = getPointersForCell(heap.id, cell.index);
                const isTarget = cell.status === 'target' || cell.status === 'active';
                const isMutated = cell.status === 'mutated';
                const isVisited = cell.status === 'visited';

                return (
                  <div
                    key={String(cell.index)}
                    onClick={() => onCellClick?.(cell.index)}
                    className={`p-3 rounded-xl border transition-all shadow-xs relative flex flex-col justify-between space-y-2 ${
                      onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                    } ${
                      isTarget
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : isMutated
                        ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : isVisited
                        ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/40 opacity-70'
                        : 'border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111111]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{cell.label}</span>
                      <span className="tabular-nums text-[10px] text-neutral-400">{cell.addressOffset}</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-base font-mono font-bold text-neutral-950 dark:text-white tabular-nums">
                        {cell.value}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isTarget
                            ? 'bg-blue-600 text-white'
                            : isMutated
                            ? 'bg-emerald-600 text-white'
                            : isVisited
                            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {cell.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-1.5 flex items-center justify-between">
                      <span className="truncate">{cell.annotation}</span>
                    </div>

                    {cellPtrs.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {cellPtrs.map((p) => {
                          const pCol = getPointerSemanticColor(p.name);
                          return (
                            <span key={p.id} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${pCol.badge}`}>
                              *{p.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. VERTICAL LIFO STACK VESSEL (Stacks & Queues) */}
        {heap.type === 'Stack' && (
          <div className="py-2">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Vertical Stack Chamber */}
              <div className="w-full sm:w-64 rounded-xl border-2 border-dashed border-amber-400/80 dark:border-amber-600/80 bg-white/90 dark:bg-[#111111]/90 p-3 flex flex-col justify-end space-y-2 min-h-[220px] shadow-xs">
                <div className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 text-center pb-1 border-b border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1">
                  <span>▲ LIFO TOP (PUSH / POP)</span>
                </div>

                {heap.cells.length === 0 ? (
                  <div className="text-center py-8 text-xs font-mono text-neutral-400">
                    Stack is empty (0 frames)
                  </div>
                ) : (
                  <div className="flex flex-col-reverse gap-2">
                    {heap.cells.map((cell, idx) => {
                      const isTop = idx === heap.cells.length - 1;
                      const cellPtrs = getPointersForCell(heap.id, cell.index);
                      return (
                        <div
                          key={String(cell.index)}
                          onClick={() => onCellClick?.(cell.index)}
                          className={`p-2 rounded-lg border transition-all text-xs font-mono flex items-center justify-between ${
                            isTop
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 font-bold shadow-2xs'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-400 tabular-nums">[{cell.index}]</span>
                            <span className="text-sm font-bold tabular-nums">{cell.value}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isTop && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-white font-bold">
                                *TOP
                              </span>
                            )}
                            {cellPtrs.map((p) => (
                              <span key={p.id} className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold">
                                *{p.name}
                              </span>
                            ))}
                            <span className="text-[10px] text-neutral-400">{cell.addressOffset}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="text-[10px] font-mono text-neutral-400 text-center pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  STACK BASE (0x00)
                </div>
              </div>

              {/* Stack Details & Invariant Note */}
              <div className="flex-1 space-y-3">
                <div className="p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 text-xs font-mono">
                  <div className="text-neutral-400 text-[10px] mb-1">MONOTONIC / LIFO INVARIANT</div>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    Stack preserves strict order for next-greater element or balanced delimiter validation.
                    Elements are popped whenever the incoming element breaks the monotonic invariant.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <span className="text-neutral-400 block text-[10px]">DEPTH</span>
                    <strong className="text-neutral-900 dark:text-neutral-100 tabular-nums">{heap.cells.length} items</strong>
                  </div>
                  <div className="p-2.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <span className="text-neutral-400 block text-[10px]">MEMORY USAGE</span>
                    <strong className="text-neutral-900 dark:text-neutral-100 tabular-nums">{heap.byteSize} bytes</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. HASH MAP & KEY-VALUE PAIR TABLE (Hash Table & Two Sum) */}
        {heap.type === 'HashMap' && (
          <div className="py-2 space-y-3">
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
              <span>Amortized O(1) Hash Table Buckets & Key-Value Lookup</span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {heap.cells.length} Active Key Entries
              </span>
            </div>

            {heap.cells.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                Hash Table empty (0 key-value pairs stored)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {heap.cells.map((cell) => {
                  const isMatch = cell.status === 'target' || cell.annotation?.includes('Partner');
                  return (
                    <div
                      key={String(cell.index)}
                      onClick={() => onCellClick?.(cell.index)}
                      className={`p-3 rounded-lg border transition-all text-xs font-mono ${
                        isMatch
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500'
                          : 'border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111111] text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                        <span>KEY: <strong className="text-neutral-700 dark:text-neutral-300">{cell.label}</strong></span>
                        <span className="tabular-nums">{cell.addressOffset}</span>
                      </div>
                      <div className="text-base font-bold tabular-nums">
                        → {cell.value}
                      </div>
                      {cell.annotation && (
                        <div className="text-[10px] mt-1 text-neutral-500 truncate">
                          {cell.annotation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. HIERARCHICAL BINARY TREE & MIN-HEAP (Trees & Heaps) */}
        {heap.type === 'BinaryTree' && (
          <div className="py-3">
            <div className="relative flex flex-col items-center gap-4">
              {[0, 1, 2, 3].map((depth) => {
                const startIdx = Math.pow(2, depth) - 1;
                const endIdx = Math.pow(2, depth + 1) - 1;
                const levelCells = heap.cells.slice(startIdx, endIdx);
                if (levelCells.length === 0) return null;

                return (
                  <div key={depth} className="flex items-center justify-center gap-3 sm:gap-6 w-full">
                    {levelCells.map((cell) => {
                      const cellPtrs = getPointersForCell(heap.id, cell.index);
                      const isTarget = cell.status === 'target' || cell.status === 'active';
                      return (
                        <div
                          key={String(cell.index)}
                          onClick={() => onCellClick?.(cell.index)}
                          className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all shadow-xs min-w-[70px] ${
                            onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                          } ${
                            isTarget
                              ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-neutral-800 ring-1 ring-blue-500'
                              : 'border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111111]'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-neutral-400 tabular-nums mb-1">
                            {cell.addressOffset}
                          </div>
                          <div className="text-base font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums">
                            {cell.value}
                          </div>
                          {cellPtrs.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {cellPtrs.map((p) => {
                                const pCol = getPointerSemanticColor(p.name);
                                return (
                                  <span key={p.id} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${pCol.badge}`}>
                                    *{p.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. CONTIGUOUS ARRAY / ELEVATION PROFILE / DP TABLE / SLIDING WINDOW / UNIVERSAL FALLBACK */}
        {(heap.type === 'Array' || heap.type === 'DPTable' || (heap.type as any) === 'Deque' || (heap.type !== 'LinkedList' && heap.type !== 'BinaryTree' && heap.type !== 'Stack' && heap.type !== 'HashMap' && heap.type !== 'GraphQueue')) && (
          <div className="py-2">
            {/* Elevation Profile for Water Trapping & Container Area */}
            {(problemId === 'trapping-rain-water' || problemId === 'container-most-water') && (
              <div className="mb-5 px-4 pt-4 pb-2 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-3">
                  Elevation & Water Column Profile (Dual Pointer Convergence)
                </div>
                <div className="h-32 flex items-end gap-2">
                  {heap.cells.map((cell) => {
                    const hVal = Number(cell.value) || 0;
                    const waterMatch = cell.annotation?.match(/\+(\d+)/);
                    const waterUnits = waterMatch ? Number(waterMatch[1]) : 0;
                    const maxBar = 9;
                    const barPct = Math.min(100, Math.round((hVal / maxBar) * 100));
                    const waterPct = Math.min(100 - barPct, Math.round((waterUnits / maxBar) * 100));
                    const isLeftOrRight = cell.status === 'active' || cell.status === 'mutated';

                    return (
                      <div key={String(cell.index)} className="flex-1 flex flex-col items-center h-full justify-end">
                        <div className="w-full flex flex-col justify-end h-24 rounded-t overflow-hidden">
                          {waterUnits > 0 && (
                            <div
                              style={{ height: `${waterPct}%` }}
                              className="w-full bg-blue-300 dark:bg-blue-600/60 border-t border-dashed border-blue-500 transition-all"
                              title={`+${waterUnits} water`}
                            />
                          )}
                          <div
                            style={{ height: `${Math.max(6, barPct)}%` }}
                            className={`w-full transition-all ${
                              isLeftOrRight
                                ? 'bg-neutral-900 dark:bg-neutral-100'
                                : 'bg-neutral-300 dark:bg-neutral-700'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                          [{cell.index}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sliding Window Banner Indicator */}
            {isSlidingWindow && (
              <div className="mb-3 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-mono text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <span>Sliding Window Buffer Span</span>
                <span className="font-bold">Elastic [left..right] Subarray</span>
              </div>
            )}

            {/* Contiguous Memory Cells with Tabular Alignment */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {heap.cells.map((cell) => {
                const cellPtrs = getPointersForCell(heap.id, cell.index);
                const isHighlighted =
                  cell.status === 'mutated' || cell.status === 'active' || cell.status === 'target';
                const primaryPtr = cellPtrs[0];
                const pColor = primaryPtr ? getPointerSemanticColor(primaryPtr.name) : null;

                return (
                  <div key={String(cell.index)} className="flex flex-col">
                    <div className="min-h-[26px] flex flex-wrap items-center gap-1 mb-1">
                      {cellPtrs.map((ptr) => {
                        const col = getPointerSemanticColor(ptr.name);
                        return (
                          <span
                            key={ptr.id}
                            className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${col.badge}`}
                          >
                            *{ptr.name}
                          </span>
                        );
                      })}
                    </div>

                    <div
                      onClick={() => onCellClick?.(cell.index)}
                      className={`p-2.5 rounded-lg border transition-all shadow-xs ${
                        onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                      } ${
                        pColor && isHighlighted
                          ? `${pColor.border} ${pColor.bgLight}`
                          : isHighlighted
                          ? 'border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-800 ring-1 ring-neutral-900 dark:ring-neutral-100'
                          : cell.status === 'discarded'
                          ? 'border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-100/40 dark:bg-neutral-900/20 opacity-40'
                          : 'border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111111]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 tabular-nums">
                        <span>{cell.label}</span>
                        <span>{cell.addressOffset}</span>
                      </div>
                      <div className="text-base font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums my-1">
                        {cell.value}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                        {cell.annotation || cell.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5" data-testid="memory-canvas">
      {/* Primary Data Structure Visualizer */}
      {renderDataStructure(primaryHeap, true)}

      {/* Secondary Companion Data Structure Visualizer (e.g., Hash Map, Monotonic Stack, BFS Queue) */}
      {secondaryHeap && renderDataStructure(secondaryHeap, false)}

      {/* Low-Level Hardware Memory Inspector: Call Stack & Active Pointers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call Stack & Registers */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#111111] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                Call Stack & Registers
              </h4>
            </div>
            <span className="text-xs font-mono text-neutral-500 tabular-nums">
              {step.stackFrames[0]?.functionName} @ {step.stackFrames[0]?.returnAddress}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-mono text-neutral-400">
                  <th className="py-1.5 pr-2">Stack Addr</th>
                  <th className="py-1.5 px-2">Symbol</th>
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 pl-2 text-right">Value / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs font-mono">
                {step.stackFrames[0]?.variables.map((v) => {
                  const pCol = getPointerSemanticColor(v.name);
                  return (
                    <tr key={v.name} className={v.changed ? 'bg-neutral-50 dark:bg-neutral-900/60' : ''}>
                      <td className="py-2 pr-2 text-neutral-400 tabular-nums">{v.address}</td>
                      <td className="py-2 px-2 font-semibold text-neutral-950 dark:text-neutral-100">
                        {v.isPointer ? `*${v.name}` : v.name}
                      </td>
                      <td className="py-2 px-2 text-neutral-500">{v.type}</td>
                      <td className="py-2 pl-2 text-right tabular-nums">
                        <span
                          className={
                            v.changed
                              ? `${pCol.arrow} font-bold underline underline-offset-4 decoration-2`
                              : 'text-neutral-700 dark:text-neutral-300'
                          }
                        >
                          {v.value}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Memory Delta & Invariants */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#111111] p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-neutral-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                  Memory Delta & Invariants
                </h4>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 shrink-0">
                {step.operationType}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80">
                <div className="font-mono text-[11px] text-neutral-400 mb-0.5">
                  Memory Delta
                </div>
                <div className="font-mono text-neutral-900 dark:text-neutral-200 leading-relaxed">
                  {step.memoryMutation}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80">
                <div className="font-mono text-[11px] text-neutral-400 mb-0.5">
                  Loop Invariant Verified
                </div>
                <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {step.invariantCheck}
                </div>
              </div>
            </div>
          </div>

          {step.stdout && (
            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">STDOUT / Return:</span>
              <span className="text-neutral-950 dark:text-white font-semibold tabular-nums">
                {step.stdout}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contextual Flamegraph */}
      {recursionTree.length > 0 && (isRecursiveAlgorithm || flamegraphExpanded) && (
        <div
          className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#111111] p-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          data-testid="recursion-flamegraph"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                Recursion Call-Tree & Backtracking Flamegraph
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">ACTIVE: Stack Top</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400">MEMOIZED: Cache Hit</span>
              <span>·</span>
              <span className="text-slate-400">PRUNED: Branch Skipped</span>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {recursionTree.map((node) => {
              const isAct = node.status === 'active';
              const isMemo = node.status === 'memoized';
              const isPruned = node.status === 'pruned';
              return (
                <div
                  key={node.id}
                  style={{ marginLeft: `${Math.min(node.depth * 14, 56)}px` }}
                  className={`p-2 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isAct
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-semibold shadow-2xs'
                      : isMemo
                      ? 'border-emerald-500/50 dark:border-emerald-600/50 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : isPruned
                      ? 'border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-neutral-400 line-through'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 tabular-nums">
                    <span className="px-1.5 py-0.5 rounded text-[10px] border border-neutral-300 dark:border-neutral-700">
                      D{node.depth} · {node.address}
                    </span>
                    <span className="truncate">{node.signature}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {node.returnSummary}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        isAct
                          ? 'bg-blue-600 text-white'
                          : isMemo
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recursionTree.length > 0 && !isRecursiveAlgorithm && (
        <button
          type="button"
          onClick={() => setFlamegraphExpanded((v) => !v)}
          className="text-xs font-mono text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1.5 self-start transition-colors px-1"
        >
          {flamegraphExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>{flamegraphExpanded ? 'Hide' : 'Inspect'} Recursion & Call Frame Flamegraph</span>
        </button>
      )}
    </div>
  );
};
