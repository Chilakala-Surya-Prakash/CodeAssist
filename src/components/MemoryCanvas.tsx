import React from 'react';
import { ExecutionStep, HeapCell, HeapObject, PointerRef } from '../types/visualizer';
import { ArrowRight, Cpu, Layers, CornerDownLeft, RotateCcw } from 'lucide-react';

interface MemoryCanvasProps {
  problemId: string;
  step: ExecutionStep;
  totalSteps: number;
  onSelectStep: (idx: number) => void;
}

export const MemoryCanvas: React.FC<MemoryCanvasProps> = ({
  problemId,
  step,
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {primaryHeap?.address || '0x1000'} · {primaryHeap?.type || 'HeapMemory'} · {primaryHeap?.byteSize || 0} bytes allocated
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {primaryHeap?.label || 'Heap Memory Workspace'}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
            <span>Comparisons: <strong className="text-slate-900 dark:text-slate-100 tabular-nums">{step.metrics.comparisons}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Pointer Ops: <strong className="text-sky-600 dark:text-sky-400 tabular-nums">{step.metrics.pointerOps}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Heap: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{step.metrics.heapBytesUsed} B</strong></span>
          </div>
        </div>

        {/* Linked List & Doubly Linked List Renderer */}
        {primaryHeap?.type === 'LinkedList' && (
          <div className="py-3 overflow-x-auto">
            {nullPointers.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400">
                <span>NULL (0x0000) Register:</span>
                {nullPointers.map((np) => (
                  <span key={np.id} className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 font-semibold">
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
                                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/40'
                                : ptr.role === 'fast'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            *{ptr.name} ↓
                          </span>
                        ))}
                      </div>

                      {/* Heap Node Box [val | next] */}
                      <div
                        className={`w-32 sm:w-36 rounded-lg border transition-all ${
                          cell.status === 'mutated'
                            ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                            : cell.status === 'target'
                            ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30'
                            : cell.status === 'active'
                            ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70'
                        }`}
                      >
                        <div className="px-2 py-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>{cell.addressOffset}</span>
                          <span>{cell.status.toUpperCase()}</span>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
                          <div className="p-2 text-center">
                            <div className="text-[10px] font-mono text-slate-400">val</div>
                            <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                              {cell.value}
                            </div>
                          </div>
                          <div className="p-2 text-center">
                            <div className="text-[10px] font-mono text-slate-400">.next</div>
                            <div className="text-[11px] font-mono font-medium text-sky-600 dark:text-sky-400 truncate">
                              {cell.nextAddress || 'NULL'}
                            </div>
                          </div>
                        </div>
                        <div className="px-2 py-1 border-t border-slate-200 dark:border-slate-800/80 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span className="truncate">{cell.annotation}</span>
                          {nextPointsBackwardToCurr && <RotateCcw className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                      </div>
                    </div>

                    {/* Pointer Link Arrow Between Nodes */}
                    {idx < primaryHeap.cells.length - 1 && (
                      <div className="flex flex-col items-center justify-center pt-6 px-0.5">
                        {nextPointsBackwardToCurr ? (
                          <div className="flex flex-col items-center text-emerald-500 dark:text-emerald-400 font-mono text-[10px]">
                            <span>← .next</span>
                            <CornerDownLeft className="w-4 h-4" />
                          </div>
                        ) : isSeveredBetween ? (
                          <div className="flex flex-col items-center text-amber-500/80 font-mono text-[10px]">
                            <span>NULL</span>
                            <span className="text-xs font-bold">⨯</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                            <span>.next</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )}

                    {isSelfOrCycleBack && (
                      <div className="flex flex-col items-center justify-center pt-6 pl-1 text-amber-500 font-mono text-xs">
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
                        className="w-full max-w-xl h-7 text-slate-300 dark:text-slate-700 pointer-events-none"
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
                      <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                        Tree Depth {depth} {depth === 0 ? '(Root)' : `(Frontier Ring ${depth})`}
                      </div>
                    <div className="flex items-center justify-around w-full max-w-2xl gap-3">
                      {levelCells.map((cell) => {
                        const cellPtrs = getPointersForCell(primaryHeap.id, cell.index);
                        return (
                          <div key={String(cell.index)} className="flex flex-col items-center">
                            {cellPtrs.length > 0 && (
                              <div className="mb-1 flex gap-1">
                                {cellPtrs.map((p) => (
                                  <span
                                    key={p.id}
                                    className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-sky-500/15 text-sky-500 border border-sky-500/40"
                                  >
                                    *{p.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div
                              className={`px-3.5 py-2 rounded-xl border text-center min-w-[110px] transition-all ${
                                cell.status === 'active'
                                  ? 'border-sky-500 bg-sky-500/15 dark:bg-sky-950/40'
                                  : cell.status === 'target'
                                  ? 'border-amber-500 bg-amber-500/15 dark:bg-amber-950/40'
                                  : cell.status === 'visited'
                                  ? 'border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-950/25'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                              }`}
                            >
                              <div className="text-[10px] font-mono text-slate-400">
                                {cell.addressOffset}
                              </div>
                              <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums my-0.5">
                                {cell.value}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-1 mt-1">
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
            {/* SVG Topological Dependency Graph Diagram */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
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
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-sky-500" />
                  </marker>
                </defs>
                {/* Render edges between vertices */}
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
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        strokeOpacity="0.65"
                        markerEnd="url(#dag-arrow)"
                      />
                    );
                  });
                })}
                {/* Render vertex nodes */}
                {primaryHeap.cells.map((cell, idx) => {
                  const total = primaryHeap.cells.length;
                  const cx = 70 + idx * Math.floor(420 / Math.max(1, total - 1));
                  const cy = idx % 2 === 0 ? 40 : 92;
                  const isAct = cell.status === 'active';
                  const isVis = cell.status === 'visited';
                  return (
                    <g key={`v-${idx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={22}
                        className={
                          isAct
                            ? 'fill-sky-500/20 stroke-sky-400'
                            : isVis
                            ? 'fill-emerald-500/20 stroke-emerald-400'
                            : 'fill-slate-900 stroke-slate-600'
                        }
                        strokeWidth="2"
                      />
                      <text
                        x={cx}
                        y={cy - 2}
                        textAnchor="middle"
                        className="fill-slate-100 text-[11px] font-mono font-bold"
                      >
                        V{idx}
                      </text>
                      <text
                        x={cx}
                        y={cy + 11}
                        textAnchor="middle"
                        className="fill-sky-400 text-[9px] font-mono"
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
                return (
                  <div
                    key={String(cell.index)}
                    className={`p-3.5 rounded-xl border transition-all ${
                      cell.status === 'active'
                        ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-950/40'
                        : cell.status === 'mutated'
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/40'
                        : cell.status === 'visited'
                        ? 'border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>{cell.label}</span>
                      <span>{cell.addressOffset}</span>
                    </div>
                    <div className="flex items-baseline justify-between my-1">
                      <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {cell.value}
                      </span>
                      {cellPtrs.map((p) => (
                        <span key={p.id} className="text-xs font-mono text-sky-400 font-semibold">
                          *{p.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1.5">
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
            {/* Optional Elevation Profile Bar Chart for Rain Water & Container */}
            {(problemId === 'trapping-rain-water' || problemId === 'container-most-water') && (
              <div className="mb-5 px-3 pt-4 pb-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
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
                              className="w-full bg-sky-500/50 border-t border-sky-400 transition-all"
                              title={`+${waterUnits} water`}
                            />
                          )}
                          <div
                            style={{ height: `${ Math.max(6, barPct) }%` }}
                            className={`w-full transition-all ${
                              isLeftOrRight
                                ? 'bg-sky-500 dark:bg-sky-400'
                                : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
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
                return (
                  <div key={String(cell.index)} className="flex flex-col">
                    {/* Pointer Badges Above Cell */}
                    <div className="min-h-[26px] flex flex-wrap items-center gap-1 mb-1">
                      {cellPtrs.map((ptr) => (
                        <span
                          key={ptr.id}
                          className={`px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded border ${
                            ptr.role === 'primary'
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/40'
                              : ptr.role === 'fast'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40'
                              : ptr.role === 'anchor'
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/40'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          *{ptr.name}
                        </span>
                      ))}
                    </div>

                    {/* Memory Cell Box */}
                    <div
                      className={`p-2.5 rounded-lg border transition-all ${
                        cell.status === 'mutated'
                          ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                          : cell.status === 'target'
                          ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30'
                          : cell.status === 'active'
                          ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-950/30'
                          : cell.status === 'discarded'
                          ? 'border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/30 opacity-50'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{cell.label}</span>
                        <span>{cell.addressOffset}</span>
                      </div>
                      <div className="text-base font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums my-1">
                        {cell.value}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {cell.annotation || cell.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Companion Secondary Heap Structure (HashMap, Monotonic Stack, or BFS Queue) */}
        {secondaryHeap && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                {secondaryHeap.label} ({secondaryHeap.address})
              </span>
              <span className="text-xs font-mono text-slate-500">
                {secondaryHeap.byteSize} bytes · {secondaryHeap.gcStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {secondaryHeap.cells.length === 0 ? (
                <div className="text-xs font-mono text-slate-400 py-1">
                  Empty structure (0 elements allocated)
                </div>
              ) : (
                secondaryHeap.cells.map((cell: HeapCell) => (
                  <div
                    key={String(cell.index)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      cell.status === 'target'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-slate-400 mr-1.5">{cell.label}:</span>
                    <strong className="tabular-nums">{cell.value}</strong>
                    {cell.annotation && (
                      <span className="ml-1.5 text-slate-500">({cell.annotation})</span>
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
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Call Stack Frame &amp; Registers
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {step.stackFrames[0]?.functionName} @ {step.stackFrames[0]?.returnAddress}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  <th className="py-1.5 pr-2">Stack Addr</th>
                  <th className="py-1.5 px-2">Symbol</th>
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 pl-2 text-right">Value / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs font-mono">
                {step.stackFrames[0]?.variables.map((v) => (
                  <tr key={v.name} className={v.changed ? 'bg-sky-500/5' : ''}>
                    <td className="py-2 pr-2 text-slate-400 tabular-nums">{v.address}</td>
                    <td className="py-2 px-2 font-semibold text-slate-900 dark:text-slate-100">
                      {v.name}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{v.type}</td>
                    <td className="py-2 pl-2 text-right tabular-nums">
                      <span
                        className={
                          v.changed
                            ? 'text-sky-600 dark:text-sky-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
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
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1522] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Pointer Vector &amp; Memory Mutation
                </h4>
              </div>
              <span className="text-xs font-mono text-sky-600 dark:text-sky-400 shrink-0">
                {step.operationType}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="font-mono text-[11px] text-slate-400 mb-0.5">
                  Memory Delta
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200">
                  {step.memoryMutation}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="font-mono text-[11px] text-slate-400 mb-0.5">
                  Loop Invariant Verified
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  {step.invariantCheck}
                </div>
              </div>
            </div>
          </div>

          {step.stdout && (
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">STDOUT / Return:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {step.stdout}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
