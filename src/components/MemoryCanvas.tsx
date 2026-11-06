import React from 'react';
import { ExecutionStep, HeapCell } from '../types/visualizer';
import { RecursionTreeNode } from '../utils/zeroCostEngines';
import { ArrowRight, Cpu, GitBranch, Layers, CornerDownLeft, RotateCcw } from 'lucide-react';

interface MemoryCanvasProps {
  problemId: string;
  step: ExecutionStep;
  totalSteps: number;
  onSelectStep: (idx: number) => void;
  recursionTree?: RecursionTreeNode[];
  predictModeActive?: boolean;
  onCellClick?: (cellIndex: number | string) => void;
}

export const MemoryCanvas: React.FC<MemoryCanvasProps> = ({
  problemId,
  step,
  recursionTree = [],
  predictModeActive = false,
  onCellClick,
}) => {
  const primaryHeap = step.heapObjects[0];
  const secondaryHeap = step.heapObjects[1];

  const getPointersForCell = (objId: string, cellIndex: number | string) => {
    return step.pointers.filter(
      (p) => p.targetObjectId === objId && String(p.targetIndex) === String(cellIndex)
    );
  };

  const nullPointers = step.pointers.filter((p) => p.targetIndex === null);

  return (
    <div className="flex flex-col gap-5" data-testid="memory-canvas">
      {/* 1. Primary Topological Data Structure Stage */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              {primaryHeap?.address || '0x1000'} · {primaryHeap?.type || 'HeapMemory'} · {primaryHeap?.byteSize || 0} bytes allocated
            </div>
            <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-100 mt-0.5">
              {primaryHeap?.label || 'Heap Memory Workspace'}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
            <span>
              Comparisons: <strong className="text-neutral-950 dark:text-neutral-100 tabular-nums">{step.metrics.comparisons}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Pointer Ops: <strong className="text-neutral-950 dark:text-neutral-100 tabular-nums">{step.metrics.pointerOps}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Heap: <strong className="text-neutral-950 dark:text-neutral-100 tabular-nums">{step.metrics.heapBytesUsed} B</strong>
            </span>
          </div>
        </div>

        {predictModeActive && (
          <div className="mb-3 px-3 py-1.5 rounded border border-dashed border-neutral-400 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
            Interactive Pointer Target Mode Active: Click any Heap Node / Cell below to predict the next pointer target.
          </div>
        )}

        {/* Linked List & Doubly Linked List Renderer */}
        {primaryHeap?.type === 'LinkedList' && (
          <div className="py-3 overflow-x-auto">
            {nullPointers.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <span>NULL (0x0000) Register:</span>
                {nullPointers.map((np) => (
                  <span
                    key={np.id}
                    className="px-2 py-0.5 rounded border border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold"
                  >
                    *{np.name} = NULL
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pb-2">
              {primaryHeap.cells.map((cell, idx) => {
                const cellPtrs = getPointersForCell(primaryHeap.id, cell.index);
                const nextCell = idx + 1 < primaryHeap.cells.length ? primaryHeap.cells[idx + 1] : null;
                const pointsForwardToNext = nextCell && cell.nextAddress === nextCell.addressOffset;
                const nextPointsBackwardToCurr = nextCell && nextCell.nextAddress === cell.addressOffset;
                const isSeveredBetween = nextCell && !pointsForwardToNext && !nextPointsBackwardToCurr;

                const isSelfOrCycleBack =
                  problemId === 'cycle-detection-floyd' &&
                  idx === primaryHeap.cells.length - 1 &&
                  cell.nextAddress !== null;

                const isHighlighted =
                  cell.status === 'mutated' || cell.status === 'active' || cell.status === 'target';

                return (
                  <React.Fragment key={String(cell.index)}>
                    <div className="flex flex-col items-center">
                      {/* Dynamic Pointer Callouts Above Node */}
                      <div className="min-h-[28px] flex flex-wrap items-center justify-center gap-1 mb-1">
                        {cellPtrs.map((ptr) => (
                          <span
                            key={ptr.id}
                            className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded border whitespace-nowrap ${
                              ptr.role === 'primary'
                                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                                : 'bg-neutral-100 text-neutral-900 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600'
                            }`}
                          >
                            *{ptr.name} ↓
                          </span>
                        ))}
                      </div>

                      {/* Heap Node Box [val | next] */}
                      <div
                        onClick={() => onCellClick?.(cell.index)}
                        role={onCellClick ? 'button' : undefined}
                        tabIndex={onCellClick ? 0 : undefined}
                        className={`w-32 sm:w-36 rounded-md border transition-all ${
                          onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                        } ${
                          isHighlighted
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/80 dark:bg-neutral-800/70 ring-1 ring-neutral-900 dark:ring-neutral-100'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70'
                        }`}
                      >
                        <div className="px-2 py-1 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                          <span>{cell.addressOffset}</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                            {cell.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-800">
                          <div className="p-2 text-center">
                            <div className="text-[10px] font-mono text-neutral-400">val</div>
                            <div className="text-sm font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums">
                              {cell.value}
                            </div>
                          </div>
                          <div className="p-2 text-center">
                            <div className="text-[10px] font-mono text-neutral-400">.next</div>
                            <div className="text-[11px] font-mono font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {cell.nextAddress || 'NULL'}
                            </div>
                          </div>
                        </div>
                        <div className="px-2 py-1 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                          <span className="truncate">{cell.annotation}</span>
                          {nextPointsBackwardToCurr && <RotateCcw className="w-3 h-3 text-neutral-900 dark:text-neutral-100 shrink-0" />}
                        </div>
                      </div>
                    </div>

                    {/* Pointer Link Arrow Between Nodes */}
                    {idx < primaryHeap.cells.length - 1 && (
                      <div className="flex flex-col items-center justify-center pt-6 px-0.5">
                        {nextPointsBackwardToCurr ? (
                          <div className="flex flex-col items-center text-neutral-950 dark:text-neutral-100 font-mono text-[10px] font-semibold">
                            <span>← .next</span>
                            <CornerDownLeft className="w-4 h-4" />
                          </div>
                        ) : isSeveredBetween ? (
                          <div className="flex flex-col items-center text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
                            <span>NULL</span>
                            <span className="text-xs font-bold">⨯</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">
                            <span>.next</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )}

                    {isSelfOrCycleBack && (
                      <div className="flex flex-col items-center justify-center pt-6 pl-1 text-neutral-900 dark:text-neutral-100 font-mono text-xs font-semibold">
                        <span>↩ Loops to {cell.nextAddress}</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Binary Tree & Min-Heap Hierarchical 2D Node Renderer with SVG Edges */}
        {primaryHeap?.type === 'BinaryTree' && (
          <div className="py-3">
            <div className="relative flex flex-col items-center gap-3">
              {[0, 1, 2].map((depth) => {
                const startIdx = Math.pow(2, depth) - 1;
                const endIdx = Math.pow(2, depth + 1) - 1;
                const levelCells = primaryHeap.cells.filter(
                  (c) => Number(c.index) >= startIdx && Number(c.index) < endIdx
                );
                if (levelCells.length === 0) return null;

                return (
                  <React.Fragment key={depth}>
                    {depth > 0 && (
                      <svg
                        className="w-full max-w-xl h-7 text-neutral-300 dark:text-neutral-700 pointer-events-none"
                        viewBox="0 0 400 28"
                        fill="none"
                        aria-hidden="true"
                      >
                        {depth === 1 ? (
                          <path
                            d="M200 2 L105 26 M200 2 L295 26"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeDasharray="3 2"
                          />
                        ) : (
                          <path
                            d="M295 2 L140 26 M295 2 L320 26"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeDasharray="3 2"
                          />
                        )}
                      </svg>
                    )}
                    <div className="w-full flex flex-col items-center">
                      <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mb-1.5">
                        Tree Depth {depth} {depth === 0 ? '(Root)' : `(Level ${depth})`}
                      </div>
                      <div className="flex items-center justify-around w-full max-w-2xl gap-3">
                        {levelCells.map((cell) => {
                          const cellPtrs = getPointersForCell(primaryHeap.id, cell.index);
                          const isHighlighted =
                            cell.status === 'active' || cell.status === 'target';
                          return (
                            <div key={String(cell.index)} className="flex flex-col items-center">
                              {cellPtrs.length > 0 && (
                                <div className="mb-1 flex gap-1">
                                  {cellPtrs.map((p) => (
                                    <span
                                      key={p.id}
                                      className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                                    >
                                      *{p.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div
                                onClick={() => onCellClick?.(cell.index)}
                                className={`px-3.5 py-2 rounded-md border text-center min-w-[110px] transition-all ${
                                  onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                                } ${
                                  isHighlighted
                                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 ring-1 ring-neutral-900 dark:ring-neutral-100'
                                    : cell.status === 'visited'
                                    ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/90'
                                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'
                                }`}
                              >
                                <div className="text-[10px] font-mono text-neutral-400">
                                  {cell.addressOffset}
                                </div>
                                <div className="text-base font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums my-0.5">
                                  {cell.value}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-1 mt-1">
                                  <span>L:{cell.leftAddress ? cell.leftAddress.slice(-3) : '∅'}</span>
                                  <span>R:{cell.rightAddress ? cell.rightAddress.slice(-3) : '∅'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Directed Graph (DAG) Topological Renderer with SVG Edge Arrows */}
        {primaryHeap?.type === 'GraphQueue' && problemId === 'course-schedule-cycle' && (
          <div className="py-3 space-y-4">
            <div className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-2">
                Topological Dependency Graph (Directed Edges u → v &amp; Live In-Degrees)
              </div>
              <svg className="w-full h-36" viewBox="0 0 560 130">
                <defs>
                  <marker
                    id="dag-arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-neutral-500 dark:fill-neutral-400" />
                  </marker>
                </defs>
                {primaryHeap.cells.map((cell, uIdx) => {
                  const targets = (cell.nextAddress || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map(Number);
                  const total = primaryHeap.cells.length;
                  const x1 = 70 + uIdx * Math.floor(420 / Math.max(1, total - 1));
                  const y1 = uIdx % 2 === 0 ? 40 : 92;

                  return targets.map((vIdx) => {
                    if (isNaN(vIdx) || vIdx >= total) return null;
                    const x2 = 70 + vIdx * Math.floor(420 / Math.max(1, total - 1));
                    const y2 = vIdx % 2 === 0 ? 40 : 92;
                    return (
                      <line
                        key={`e-${uIdx}-${vIdx}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className="stroke-neutral-400 dark:stroke-neutral-600"
                        strokeWidth="1.75"
                        markerEnd="url(#dag-arrow)"
                      />
                    );
                  });
                })}
                {primaryHeap.cells.map((cell, idx) => {
                  const total = primaryHeap.cells.length;
                  const cx = 70 + idx * Math.floor(420 / Math.max(1, total - 1));
                  const cy = idx % 2 === 0 ? 40 : 92;
                  const isAct = cell.status === 'active';
                  return (
                    <g key={`v-${idx}`} onClick={() => onCellClick?.(cell.index)} className="cursor-pointer">
                      <circle
                        cx={cx}
                        cy={cy}
                        r={22}
                        className={
                          isAct
                            ? 'fill-neutral-900 dark:fill-neutral-100 stroke-neutral-900 dark:stroke-neutral-100'
                            : 'fill-white dark:fill-neutral-900 stroke-neutral-400 dark:stroke-neutral-600'
                        }
                        strokeWidth="2"
                      />
                      <text
                        x={cx}
                        y={cy - 2}
                        textAnchor="middle"
                        className={`text-[11px] font-mono font-bold ${
                          isAct
                            ? 'fill-white dark:fill-neutral-950'
                            : 'fill-neutral-900 dark:fill-neutral-100'
                        }`}
                      >
                        V{idx}
                      </text>
                      <text
                        x={cx}
                        y={cy + 11}
                        textAnchor="middle"
                        className={`text-[9px] font-mono ${
                          isAct
                            ? 'fill-neutral-300 dark:fill-neutral-700'
                            : 'fill-neutral-500 dark:fill-neutral-400'
                        }`}
                      >
                        {cell.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {primaryHeap.cells.map((cell) => {
                const cellPtrs = getPointersForCell(primaryHeap.id, cell.index);
                const isHighlighted = cell.status === 'active' || cell.status === 'mutated';
                return (
                  <div
                    key={String(cell.index)}
                    onClick={() => onCellClick?.(cell.index)}
                    className={`p-3.5 rounded-md border transition-all ${
                      onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                    } ${
                      isHighlighted
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800/80 ring-1 ring-neutral-900 dark:ring-neutral-100'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                      <span>{cell.label}</span>
                      <span>{cell.addressOffset}</span>
                    </div>
                    <div className="flex items-baseline justify-between my-1">
                      <span className="text-lg font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums">
                        {cell.value}
                      </span>
                      {cellPtrs.map((p) => (
                        <span
                          key={p.id}
                          className="px-1.5 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 text-xs font-mono font-semibold"
                        >
                          *{p.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 pt-1.5 mt-1.5">
                      {cell.annotation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contiguous Array / Elevation Profile / DP Table / Stack Renderer */}
        {(primaryHeap?.type === 'Array' || primaryHeap?.type === 'DPTable' || primaryHeap?.type === 'Stack') && (
          <div className="py-2">
            {(problemId === 'trapping-rain-water' || problemId === 'container-most-water') && (
              <div className="mb-5 px-3 pt-4 pb-2 rounded-md bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-3">
                  Elevation &amp; Water Column Profile (Two-Pointer Boundary Scan)
                </div>
                <div className="h-32 flex items-end gap-2">
                  {primaryHeap.cells.map((cell) => {
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
                              className="w-full bg-neutral-300 dark:bg-neutral-700 border-t border-dashed border-neutral-500 transition-all"
                              title={`+${waterUnits} water`}
                            />
                          )}
                          <div
                            style={{ height: `${Math.max(6, barPct)}%` }}
                            className={`w-full transition-all ${
                              isLeftOrRight
                                ? 'bg-neutral-900 dark:bg-neutral-100'
                                : 'bg-neutral-400 dark:bg-neutral-600'
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

            {/* Contiguous Memory Cells */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {primaryHeap.cells.map((cell) => {
                const cellPtrs = getPointersForCell(primaryHeap.id, cell.index);
                const isHighlighted =
                  cell.status === 'mutated' || cell.status === 'active' || cell.status === 'target';
                return (
                  <div key={String(cell.index)} className="flex flex-col">
                    <div className="min-h-[26px] flex flex-wrap items-center gap-1 mb-1">
                      {cellPtrs.map((ptr) => (
                        <span
                          key={ptr.id}
                          className={`px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded border ${
                            ptr.role === 'primary'
                              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                              : 'bg-neutral-100 text-neutral-900 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600'
                          }`}
                        >
                          *{ptr.name}
                        </span>
                      ))}
                    </div>

                    <div
                      onClick={() => onCellClick?.(cell.index)}
                      className={`p-2.5 rounded-md border transition-all ${
                        onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                      } ${
                        isHighlighted
                          ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800/80 ring-1 ring-neutral-900 dark:ring-neutral-100'
                          : cell.status === 'discarded'
                          ? 'border-neutral-200 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-900/30 opacity-45'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                        <span>{cell.label}</span>
                        <span>{cell.addressOffset}</span>
                      </div>
                      <div className="text-base font-mono font-bold text-neutral-950 dark:text-neutral-100 tabular-nums my-1">
                        {cell.value}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                        {cell.annotation || cell.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Companion Secondary Heap Structure */}
        {secondaryHeap && (
          <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                {secondaryHeap.label} ({secondaryHeap.address})
              </span>
              <span className="text-xs font-mono text-neutral-500">
                {secondaryHeap.byteSize} bytes · {secondaryHeap.gcStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {secondaryHeap.cells.length === 0 ? (
                <div className="text-xs font-mono text-neutral-400 py-1">
                  Empty structure (0 elements allocated)
                </div>
              ) : (
                secondaryHeap.cells.map((cell: HeapCell) => (
                  <div
                    key={String(cell.index)}
                    onClick={() => onCellClick?.(cell.index)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-mono ${
                      onCellClick ? 'cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100' : ''
                    } ${
                      cell.status === 'target'
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <span className="text-neutral-400 mr-1.5">{cell.label}:</span>
                    <strong className="tabular-nums">{cell.value}</strong>
                    {cell.annotation && (
                      <span className="ml-1.5 text-neutral-500">({cell.annotation})</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Low-Level Hardware Memory Inspector: Call Stack & Active Pointers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call Stack Frame & Registers */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                Call Stack Frame &amp; Registers
              </h4>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              {step.stackFrames[0]?.functionName} @ {step.stackFrames[0]?.returnAddress}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-400">
                  <th className="py-1.5 pr-2">Stack Addr</th>
                  <th className="py-1.5 px-2">Symbol</th>
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 pl-2 text-right">Value / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-xs font-mono">
                {step.stackFrames[0]?.variables.map((v) => (
                  <tr key={v.name} className={v.changed ? 'bg-neutral-100/70 dark:bg-neutral-800/50' : ''}>
                    <td className="py-2 pr-2 text-neutral-400 tabular-nums">{v.address}</td>
                    <td className="py-2 px-2 font-semibold text-neutral-950 dark:text-neutral-100">
                      {v.name}
                    </td>
                    <td className="py-2 px-2 text-neutral-500">{v.type}</td>
                    <td className="py-2 pl-2 text-right tabular-nums">
                      <span
                        className={
                          v.changed
                            ? 'text-neutral-950 dark:text-white font-bold underline decoration-neutral-400 underline-offset-4'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }
                      >
                        {v.value}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Pointer Vector & Step Invariant */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100 truncate">
                  Pointer Vector &amp; Memory Mutation
                </h4>
              </div>
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                {step.operationType}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="font-mono text-[11px] text-neutral-400 mb-0.5">
                  Memory Delta
                </div>
                <div className="font-mono text-neutral-900 dark:text-neutral-200">
                  {step.memoryMutation}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="font-mono text-[11px] text-neutral-400 mb-0.5">
                  Loop Invariant Verified
                </div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {step.invariantCheck}
                </div>
              </div>
            </div>
          </div>

          {step.stdout && (
            <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">STDOUT / Return:</span>
              <span className="text-neutral-950 dark:text-white font-semibold">
                {step.stdout}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Live Recursion Call-Tree & Backtracking / Memoization Flamegraph */}
      {recursionTree.length > 0 && (
        <div
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-4 space-y-3"
          data-testid="recursion-flamegraph"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h4 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                Recursion Call-Tree &amp; Backtracking / Memoization Flamegraph
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
              <span>ACTIVE: Stack Top</span>
              <span>·</span>
              <span>MEMOIZED: O(1) Cache Hit</span>
              <span>·</span>
              <span>PRUNED: Subtree Skipped</span>
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
                  className={`p-2 rounded border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isAct
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold'
                      : isMemo
                      ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200'
                      : isPruned
                      ? 'border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-neutral-400 line-through'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] border border-neutral-300 dark:border-neutral-700">
                      D{node.depth} · {node.address}
                    </span>
                    <span className="truncate">{node.signature}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {node.returnSummary}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        isAct
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950'
                          : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
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
    </div>
  );
};
