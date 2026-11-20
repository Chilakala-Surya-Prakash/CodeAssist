import React, { useState } from 'react';
import { LayoutGroup, MotionConfig, motion } from 'motion/react';
import { CanvasThemeTemplate, ExecutionStep, HeapObject, PointerRef } from '../types/visualizer';
import { CANVAS_THEMES } from '../utils/canvasThemes';
import {
  BinaryTreeVisualizer,
  DirectedGraphVisualizer,
  FifoQueueVisualizer,
} from './TreeGraphVisualizers';
import {
  Cpu,
  GitBranch,
  Layers,
  RotateCcw,
  Database,
  Hash,
  Network,
  ListOrdered,
} from 'lucide-react';

interface MemoryCanvasProps {
  problemId: string;
  step: ExecutionStep;
  totalSteps: number;
  onSelectStep: (idx: number) => void;
  predictModeActive?: boolean;
  onCellClick?: (cellIndex: number | string) => void;
  theme?: CanvasThemeTemplate;
  onThemeChange?: (theme: CanvasThemeTemplate) => void;
}

/**
 * High-contrast semantic palette strictly for pointer roles:
 * - head / curr / left / slow: Electric Blue (#2563EB)
 * - prev / right / fast: Emerald / Teal (#059669)
 * - nxt / next / mid / target: Violet (#7C3AED)
 * - other: Amber (#D97706)
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
      border: 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/40',
      bgLight: 'bg-blue-50/80 dark:bg-blue-950/40',
    };
  }
  if (lower.includes('prev') || lower.includes('fast') || lower.includes('right')) {
    return {
      badge: 'bg-emerald-600 text-white border-emerald-500 shadow-xs dark:bg-emerald-600 dark:text-white',
      arrow: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500/40',
      bgLight: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    };
  }
  if (lower.includes('nxt') || lower.includes('next') || lower.includes('mid') || lower.includes('target')) {
    return {
      badge: 'bg-violet-600 text-white border-violet-500 shadow-xs dark:bg-violet-600 dark:text-white',
      arrow: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-500 dark:border-violet-400 ring-1 ring-violet-500/40',
      bgLight: 'bg-violet-50/80 dark:bg-violet-950/40',
    };
  }
  return {
    badge: 'bg-amber-600 text-white border-amber-500 shadow-xs dark:bg-amber-600 dark:text-white',
    arrow: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-500/40',
    bgLight: 'bg-amber-50/80 dark:bg-amber-950/40',
  };
}

const THEME_ORDER: CanvasThemeTemplate[] = ['glass', 'paper', 'blueprint', 'neon'];

export const MemoryCanvas: React.FC<MemoryCanvasProps> = ({
  problemId,
  step,
  onCellClick,
  theme: propsTheme,
  onThemeChange,
}) => {
  const [activeThemeId, setActiveThemeId] = useState<CanvasThemeTemplate>(() => {
    if (propsTheme) return propsTheme;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tracecraft-canvas-theme') as CanvasThemeTemplate;
      if (saved && CANVAS_THEMES[saved]) return saved;
    }
    // Default to adaptive Studio ('glass') so Light mode never clashes with dark neon
    return 'glass';
  });

  const currentThemeId = propsTheme || activeThemeId;
  const theme = CANVAS_THEMES[currentThemeId] || CANVAS_THEMES.glass;

  const handleSelectTheme = (tId: CanvasThemeTemplate) => {
    setActiveThemeId(tId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tracecraft-canvas-theme', tId);
    }
    onThemeChange?.(tId);
  };

  const primaryHeap = step.heapObjects[0];
  const secondaryHeap = step.heapObjects[1];

  const getPointersForCell = (objId: string, cellIndex: number | string): PointerRef[] => {
    return step.pointers.filter(
      (p) => p.targetObjectId === objId && String(p.targetIndex) === String(cellIndex)
    );
  };

  const nullPointers = step.pointers.filter((p) => p.targetIndex === null);

  const isSlidingWindow =
    problemId.includes('substring') ||
    problemId.includes('window') ||
    (step.pointers.some((p) => p.name.toLowerCase() === 'left') &&
      step.pointers.some((p) => p.name.toLowerCase() === 'right') &&
      problemId !== 'trapping-rain-water' &&
      problemId !== 'container-most-water' &&
      problemId !== 'three-sum-zero');

  const renderDataStructure = (heap: HeapObject, isPrimary: boolean) => {
    if (!heap) return null;

    const maxElevationVal =
      problemId === 'trapping-rain-water' || problemId === 'container-most-water'
        ? Math.max(1, ...heap.cells.map((c) => Number(c.value) || 0))
        : 9;

    return (
      <div
        key={heap.id}
        className={`rounded-xl ${theme.containerClass} ${theme.gridClass} p-5 ${
          !isPrimary ? 'mt-1' : ''
        }`}
      >
        {/* Structure Header Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 -mx-5 -mt-5 px-5 pt-3.5 rounded-t-xl ${theme.headerClass}`}
        >
          <div>
            <div className="text-xs font-mono opacity-75 tabular-nums">
              <span className="font-semibold">{heap.address}</span> · {heap.type} · {heap.byteSize} bytes allocated
            </div>
            <h3 className="text-base font-bold mt-0.5 flex items-center gap-2">
              {heap.type === 'GraphQueue' && <Network className="w-4 h-4 text-violet-500 dark:text-violet-400" />}
              {heap.type === 'Queue' && <ListOrdered className="w-4 h-4 text-sky-500 dark:text-sky-400" />}
              {heap.type === 'BinaryTree' && <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {heap.type === 'Stack' && <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {heap.type === 'HashMap' && <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              {heap.type === 'DPTable' && <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
              <span>{heap.label}</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isPrimary && (
              <div className="flex items-center gap-2.5 text-xs font-mono opacity-85">
                <span>
                  Ops: <strong className="tabular-nums">{step.metrics.comparisons + step.metrics.pointerOps}</strong>
                </span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span>
                  Heap: <strong className="tabular-nums">{step.metrics.heapBytesUsed} B</strong>
                </span>
              </div>
            )}

            {/* Contrast-Safe Canvas Theme Switcher (only shown on primary heap panel) */}
            {isPrimary && (
              <div
                role="group"
                aria-label="Canvas visual theme"
                className={`flex items-center gap-0.5 p-0.5 rounded-lg ${theme.themeToggleTrackClass}`}
              >
                {THEME_ORDER.map((tKey) => {
                  const tCfg = CANVAS_THEMES[tKey];
                  const isCurrent = currentThemeId === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => handleSelectTheme(tKey)}
                      title={tCfg.tagline}
                      aria-pressed={isCurrent}
                      className={`px-2 py-0.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                        isCurrent ? theme.themeToggleActiveClass : theme.themeToggleIdleClass
                      }`}
                    >
                      <span aria-hidden="true">{tCfg.icon}</span>
                      <span className="hidden sm:inline">{tCfg.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 1. LINKED LIST & DOUBLY LINKED LIST RENDERER */}
        {heap.type === 'LinkedList' && (
          <div className="py-2 overflow-x-auto">
            {nullPointers.length > 0 && isPrimary && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="opacity-75">NULL Register:</span>
                {nullPointers.map((np) => (
                  <motion.span
                    layout="position"
                    layoutId={`ptr-${np.id}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    key={np.id}
                    className={`px-2.5 py-0.5 rounded-md border border-dashed font-semibold shadow-2xs tabular-nums ${theme.badgeMutedClass}`}
                  >
                    *{np.name} → NULL (0x0000)
                  </motion.span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pb-2">
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

                const isMutated = cell.status === 'mutated';
                const isActive = cell.status === 'active';
                const isTarget = cell.status === 'target';

                const primaryPointer = cellPtrs[0];
                const semanticStyle = primaryPointer ? getPointerSemanticColor(primaryPointer.name) : null;

                return (
                  <React.Fragment key={String(cell.index)}>
                    <div className="flex flex-col items-center">
                      <div className="min-h-[28px] flex flex-wrap items-center justify-center gap-1 mb-1.5">
                        {cellPtrs.map((ptr) => {
                          const pColor = getPointerSemanticColor(ptr.name);
                          return (
                            <motion.span
                              layout="position"
                              layoutId={`ptr-${ptr.id}`}
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              key={ptr.id}
                              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md border whitespace-nowrap ${pColor.badge}`}
                            >
                              *{ptr.name} ↓
                            </motion.span>
                          );
                        })}
                      </div>

                      <div
                        onClick={() => onCellClick?.(cell.index)}
                        role={onCellClick ? 'button' : undefined}
                        tabIndex={onCellClick ? 0 : undefined}
                        className={`animate-cell-enter w-32 sm:w-36 ${theme.cardBaseClass} ${
                          onCellClick ? 'cursor-pointer' : ''
                        } ${
                          isMutated
                            ? `${theme.cardMutatedClass} glow-mutated-emerald`
                            : isActive
                            ? `${theme.cardActiveClass}${theme.isDarkSurface ? ' glow-active-neon' : ''}`
                            : isTarget
                            ? theme.cardTargetClass
                            : semanticStyle
                            ? `${semanticStyle.border} ${semanticStyle.bgLight}`
                            : theme.cardIdleClass
                        }`}
                      >
                        <div className={`px-2.5 py-1 border-b ${theme.dividerClass} flex items-center justify-between text-[11px] font-mono opacity-85`}>
                          <span className="font-semibold tabular-nums">{cell.addressOffset}</span>
                          <span
                            className={`font-semibold uppercase ${
                              isMutated
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : isActive
                                ? 'text-blue-600 dark:text-cyan-400 font-bold'
                                : 'opacity-70'
                            }`}
                          >
                            {cell.status}
                          </span>
                        </div>

                        <div className={`grid grid-cols-2 divide-x ${theme.dividerClass}`}>
                          <div className="p-2 text-center">
                            <div className="text-[11px] font-mono uppercase opacity-60">val</div>
                            <div className="text-base font-mono font-bold tabular-nums">
                              {cell.value}
                            </div>
                          </div>
                          <div className="p-2 text-center">
                            <div className="text-[11px] font-mono uppercase opacity-60">.next</div>
                            <div className="text-[11px] font-mono font-medium truncate tabular-nums">
                              {cell.nextAddress ? (
                                <span className="text-violet-600 dark:text-violet-400 font-semibold">
                                  {cell.nextAddress}
                                </span>
                              ) : (
                                <span className="opacity-50 italic">NULL</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {cell.annotation && (
                          <div className={`px-2.5 py-1 border-t ${theme.dividerClass} text-[11px] font-mono opacity-85 flex items-center justify-between`}>
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
                          <div className="flex flex-col items-center text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold">
                            <span className="text-[11px] mb-0.5 uppercase tracking-wider">reversed</span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-600/50 dark:border-emerald-500/60">
                              <span className="text-xs font-bold">←</span>
                              <span>.next</span>
                            </div>
                          </div>
                        ) : isSeveredBetween ? (
                          <div className="flex flex-col items-center text-red-600 dark:text-red-400 font-mono text-[11px]">
                            <span className="text-[11px] font-bold uppercase tracking-wider">broken</span>
                            <div className="px-1.5 py-0.5 rounded border border-dashed border-red-500/60 bg-red-500/10 font-bold">
                              ⨯
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-8 h-6 overflow-visible" viewBox="0 0 32 20" fill="none">
                              <defs>
                                <marker
                                  id={`arrow-${theme.id}-${cell.index}`}
                                  viewBox="0 0 10 10"
                                  refX="7"
                                  refY="5"
                                  markerWidth="6"
                                  markerHeight="6"
                                  orient="auto-start-reverse"
                                >
                                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={theme.svgArrowColor} />
                                </marker>
                              </defs>
                              <path
                                d="M 2 10 L 25 10"
                                stroke={theme.svgArrowColor}
                                strokeWidth="2.25"
                                strokeDasharray={theme.svgStrokeDash !== 'none' ? theme.svgStrokeDash : undefined}
                                className={theme.id === 'neon' ? 'animate-flow-dash' : ''}
                                markerEnd={`url(#arrow-${theme.id}-${cell.index})`}
                              />
                            </svg>
                            <span className="text-[11px] font-mono tracking-tight opacity-65">.next</span>
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

        {/* 2. DIRECTED GRAPH RENDERER (True SVG Node-Link Topology) */}
        {heap.type === 'GraphQueue' && (
          <DirectedGraphVisualizer
            heap={heap}
            theme={theme}
            getPointersForCell={getPointersForCell}
            getPointerSemanticColor={getPointerSemanticColor}
            onCellClick={onCellClick}
          />
        )}

        {/* 2B. DEDICATED FIFO QUEUE / DEQUE RENDERER */}
        {heap.type === 'Queue' && (
          <FifoQueueVisualizer
            heap={heap}
            theme={theme}
            getPointersForCell={getPointersForCell}
            getPointerSemanticColor={getPointerSemanticColor}
            onCellClick={onCellClick}
          />
        )}

        {/* 3. VERTICAL LIFO STACK VESSEL */}
        {heap.type === 'Stack' && (
          <div className="py-2">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className={`w-full sm:w-64 rounded-xl ${theme.stackChamberClass} p-3 flex flex-col justify-end space-y-2 min-h-[220px]`}>
                <div className={`text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 text-center pb-1 border-b ${theme.dividerClass}`}>
                  ▲ LIFO TOP (PUSH / POP)
                </div>

                {heap.cells.length === 0 ? (
                  <div className="text-center py-8 text-xs font-mono opacity-60">
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
                            isTop ? theme.stackItemTopClass : theme.stackItemIdleClass
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] opacity-65 tabular-nums">[{cell.index}]</span>
                            <span className="text-sm font-bold tabular-nums">{cell.value}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isTop && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] bg-amber-600 text-white font-bold">
                                *TOP
                              </span>
                            )}
                            {cellPtrs.map((p) => (
                              <motion.span
                                layout="position"
                                layoutId={`ptr-${p.id}`}
                                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                key={p.id}
                                className="px-1.5 py-0.5 rounded text-[11px] bg-blue-600 text-white font-semibold"
                              >
                                *{p.name}
                              </motion.span>
                            ))}
                            <span className="text-[11px] opacity-65">{cell.addressOffset}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className={`text-[11px] font-mono opacity-60 text-center pt-1 border-t ${theme.dividerClass}`}>
                  STACK BASE (0x00)
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className={`p-3 rounded-lg border ${theme.insetSurfaceClass} text-xs font-mono`}>
                  <div className="opacity-65 text-[11px] mb-1">MONOTONIC / LIFO INVARIANT</div>
                  <p className="leading-relaxed">
                    Stack preserves strict order for next-greater element or balanced delimiter validation.
                    Elements are popped whenever the incoming element breaks the monotonic invariant.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className={`p-2.5 rounded border ${theme.insetSurfaceClass}`}>
                    <span className="opacity-65 block text-[11px]">DEPTH</span>
                    <strong className="tabular-nums">{heap.cells.length} items</strong>
                  </div>
                  <div className={`p-2.5 rounded border ${theme.insetSurfaceClass}`}>
                    <span className="opacity-65 block text-[11px]">MEMORY USAGE</span>
                    <strong className="tabular-nums">{heap.byteSize} bytes</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. HASH MAP & KEY-VALUE PAIR TABLE */}
        {heap.type === 'HashMap' && (
          <div className="py-2 space-y-3">
            <div className="text-xs font-mono opacity-80 flex items-center justify-between">
              <span>Amortized O(1) Hash Table Buckets &amp; Key-Value Lookup</span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {heap.cells.length} Active Key Entries
              </span>
            </div>

            {heap.cells.length === 0 ? (
              <div className={`py-6 text-center text-xs font-mono opacity-60 border border-dashed ${theme.dividerClass} rounded-lg`}>
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
                        isMatch ? `${theme.cardMutatedClass} glow-mutated-emerald` : theme.cardIdleClass
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] opacity-70 mb-1">
                        <span>KEY: <strong className="opacity-100">{cell.label}</strong></span>
                        <span className="tabular-nums">{cell.addressOffset}</span>
                      </div>
                      <div className="text-base font-bold tabular-nums">→ {cell.value}</div>
                      {cell.annotation && (
                        <div className="text-[11px] mt-1 opacity-75 truncate">{cell.annotation}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. HIERARCHICAL BINARY TREE & MIN-HEAP (True Slot-Indexed SVG Edges) */}
        {heap.type === 'BinaryTree' && (
          <BinaryTreeVisualizer
            heap={heap}
            theme={theme}
            getPointersForCell={getPointersForCell}
            getPointerSemanticColor={getPointerSemanticColor}
            onCellClick={onCellClick}
          />
        )}

        {/* 6. CONTIGUOUS ARRAY / ELEVATION PROFILE / DP TABLE / SLIDING WINDOW */}
        {(heap.type === 'Array' ||
          heap.type === 'DPTable' ||
          (heap.type !== 'LinkedList' &&
            heap.type !== 'BinaryTree' &&
            heap.type !== 'Stack' &&
            heap.type !== 'HashMap' &&
            heap.type !== 'GraphQueue' &&
            heap.type !== 'Queue')) && (
          <div className="py-2">
            {/* Elevation Profile for Water Trapping & Container Area */}
            {(problemId === 'trapping-rain-water' || problemId === 'container-most-water') && (
              <div className={`mb-5 px-4 pt-4 pb-2 rounded-xl border ${theme.insetSurfaceClass}`}>
                <div className="text-xs font-mono opacity-80 mb-3 flex items-center justify-between">
                  <span>Elevation &amp; Water Column Profile (max height = {maxElevationVal})</span>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                    Dynamic Scaled Bars
                  </span>
                </div>
                <div className="h-32 flex items-end gap-2">
                  {heap.cells.map((cell) => {
                    const hVal = Number(cell.value) || 0;
                    const waterMatch = cell.annotation?.match(/\+(\d+)/);
                    const waterUnits = waterMatch ? Number(waterMatch[1]) : 0;
                    const barPct = Math.min(100, Math.round((hVal / maxElevationVal) * 100));
                    const waterPct = Math.min(100 - barPct, Math.round((waterUnits / maxElevationVal) * 100));
                    const isLeftOrRight = cell.status === 'active' || cell.status === 'mutated';

                    return (
                      <div key={String(cell.index)} className="flex-1 flex flex-col items-center h-full justify-end">
                        <div className="w-full flex flex-col justify-end h-24 rounded-t overflow-hidden">
                          {waterUnits > 0 && (
                            <div
                              style={{ height: `${waterPct}%` }}
                              className={`w-full ${theme.waterGradient} border-t-2 border-dashed border-sky-300 transition-all`}
                              title={`+${waterUnits} water trapped`}
                            />
                          )}
                          <div
                            style={{ height: `${Math.max(6, barPct)}%` }}
                            className={`w-full transition-all ${
                              isLeftOrRight
                                ? 'bg-blue-600 dark:bg-cyan-400'
                                : theme.barIdleClass
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-mono opacity-70 mt-1 tabular-nums">
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
              <div className={`mb-3 px-3 py-1.5 rounded-lg border ${theme.insetSurfaceClass} text-xs font-mono flex items-center justify-between`}>
                <span>Sliding Window Buffer Span</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Elastic [left..right] Subarray
                </span>
              </div>
            )}

            {/* Contiguous Memory Cells with Tabular Alignment */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {heap.cells.map((cell) => {
                const cellPtrs = getPointersForCell(heap.id, cell.index);
                const isMutated = cell.status === 'mutated';
                const isActive = cell.status === 'active';
                const isTarget = cell.status === 'target';
                const isDiscarded = cell.status === 'discarded';

                const primaryPtr = cellPtrs[0];
                const pColor = primaryPtr ? getPointerSemanticColor(primaryPtr.name) : null;

                return (
                  <div key={String(cell.index)} className="flex flex-col">
                    <div className="min-h-[26px] flex flex-wrap items-center gap-1 mb-1">
                      {cellPtrs.map((ptr) => {
                        const col = getPointerSemanticColor(ptr.name);
                        return (
                          <motion.span
                            layout="position"
                            layoutId={`ptr-${ptr.id}`}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            key={ptr.id}
                            className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded ${col.badge}`}
                          >
                            *{ptr.name}
                          </motion.span>
                        );
                      })}
                    </div>

                    <div
                      onClick={() => onCellClick?.(cell.index)}
                      className={`p-2.5 ${theme.cardBaseClass} ${
                        onCellClick ? 'cursor-pointer' : ''
                      } ${
                        isMutated
                          ? `${theme.cardMutatedClass} glow-mutated-emerald`
                          : isActive
                          ? `${theme.cardActiveClass}${theme.isDarkSurface ? ' glow-active-neon' : ''}`
                          : isTarget
                          ? theme.cardTargetClass
                          : isDiscarded
                          ? theme.cardDiscardedClass
                          : pColor
                          ? `${pColor.border} ${pColor.bgLight}`
                          : theme.cardIdleClass
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono opacity-65 tabular-nums">
                        <span>{cell.label}</span>
                        <span>{cell.addressOffset}</span>
                      </div>
                      <div className="text-base font-mono font-bold tabular-nums my-1">
                        {cell.value}
                      </div>
                      <div className="text-[11px] font-mono opacity-75 truncate">
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
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="flex flex-col gap-4" data-testid="memory-canvas">
          {/* Primary Data Structure Visualizer */}
          {renderDataStructure(primaryHeap, true)}

          {/* Secondary Companion Data Structure Visualizer (HashMap, Stack, FIFO Queue) */}
          {secondaryHeap && renderDataStructure(secondaryHeap, false)}

          {/* Low-Level Hardware Memory Inspector: Call Stack & Memory Delta */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Call Stack & Registers */}
            <div className={`rounded-xl border ${theme.subPanelClass} p-4`}>
              <div className={`flex items-center justify-between pb-2.5 mb-3 border-b ${theme.dividerClass}`}>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 opacity-80" />
                  <h4 className="text-sm font-semibold">Call Stack &amp; Registers</h4>
                </div>
                <span className="text-xs font-mono opacity-65 tabular-nums">
                  {step.stackFrames[0]?.functionName} @ {step.stackFrames[0]?.returnAddress}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[11px] font-mono ${theme.tableHeaderClass}`}>
                      <th className="py-1.5 pr-2">Stack Addr</th>
                      <th className="py-1.5 px-2">Symbol</th>
                      <th className="py-1.5 px-2">Type</th>
                      <th className="py-1.5 pl-2 text-right">Value / Target</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono">
                    {step.stackFrames[0]?.variables.map((v) => {
                      const pCol = getPointerSemanticColor(v.name);
                      return (
                        <tr key={v.name} className={v.changed ? theme.tableRowActiveClass : theme.tableRowClass}>
                          <td className="py-2 pr-2 opacity-65 tabular-nums">{v.address}</td>
                          <td className="py-2 px-2 font-semibold">
                            {v.isPointer ? `*${v.name}` : v.name}
                          </td>
                          <td className="py-2 px-2 opacity-75">{v.type}</td>
                          <td className="py-2 pl-2 text-right tabular-nums">
                            <span
                              className={
                                v.changed
                                  ? `${pCol.arrow} font-bold underline underline-offset-4 decoration-2`
                                  : 'opacity-90'
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
            <div className={`rounded-xl border ${theme.subPanelClass} p-4 flex flex-col justify-between`}>
              <div>
                <div className={`flex items-center justify-between gap-2 pb-2.5 mb-3 border-b ${theme.dividerClass}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Cpu className="w-4 h-4 opacity-80 shrink-0" />
                    <h4 className="text-sm font-semibold">Memory Delta &amp; Invariants</h4>
                  </div>
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${theme.badgeMutedClass} shrink-0`}>
                    {step.operationType}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className={`p-3 rounded-lg border ${theme.insetSurfaceClass}`}>
                    <div className="font-mono text-[11px] opacity-65 mb-0.5">Memory Delta</div>
                    <div className="font-mono leading-relaxed">{step.memoryMutation}</div>
                  </div>

                  <div className={`p-3 rounded-lg border ${theme.insetSurfaceClass}`}>
                    <div className="font-mono text-[11px] opacity-65 mb-0.5">Loop Invariant Verified</div>
                    <div className="leading-relaxed opacity-90">{step.invariantCheck}</div>
                  </div>
                </div>
              </div>

              {step.stdout && (
                <div className={`mt-3 pt-2.5 border-t ${theme.dividerClass} flex items-center justify-between text-xs font-mono`}>
                  <span className="opacity-65">STDOUT / Return:</span>
                  <span className="font-semibold tabular-nums">{step.stdout}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
};
