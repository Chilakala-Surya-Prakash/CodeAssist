import React from 'react';
import { motion } from 'motion/react';
import { HeapObject, PointerRef } from '../types/visualizer';
import { ThemeConfig } from '../utils/canvasThemes';
import { computeBinaryTreeLayout, computeDirectedGraphLayout } from '../utils/canvasLayout';

type GetPointerColorFn = (name: string) => {
  badge: string;
  arrow: string;
  border: string;
  bgLight: string;
};

interface SharedVisualizerProps {
  heap: HeapObject;
  theme: ThemeConfig;
  getPointersForCell: (objId: string, cellIndex: number | string) => PointerRef[];
  getPointerSemanticColor: GetPointerColorFn;
  onCellClick?: (cellIndex: number | string) => void;
}

/**
 * Renders a Binary Tree or Binary Heap with exact slot-based (2i+1, 2i+2) SVG topology
 * and parent-to-child edges so sparse/unbalanced trees never misalign children.
 */
export const BinaryTreeVisualizer: React.FC<SharedVisualizerProps> = ({
  heap,
  theme,
  getPointersForCell,
  getPointerSemanticColor,
  onCellClick,
}) => {
  const layout = computeBinaryTreeLayout(heap.cells, 680, 104, 58, 48);

  if (layout.nodes.length === 0) {
    return (
      <div className={`py-8 text-center text-xs font-mono opacity-65 rounded-lg border border-dashed ${theme.dividerClass}`}>
        Tree is empty (root = NULL)
      </div>
    );
  }

  return (
    <div className="py-2 overflow-x-auto" data-testid="binary-tree-svg-stage">
      <div
        className="relative mx-auto w-full max-w-[680px] min-w-[440px]"
        style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
      >
        {/* SVG Edges Layer */}
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          {layout.edges.map((edge) => {
            const strokeColor = edge.isActive ? theme.svgEdgeActiveColor : theme.svgEdgeIdleColor;
            const midX = (edge.x1 + edge.x2) / 2;
            const midY = (edge.y1 + edge.y2) / 2;
            return (
              <g key={edge.id} data-edge-from={edge.fromSlot} data-edge-to={edge.toSlot}>
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={strokeColor}
                  strokeWidth={edge.isActive ? 2.5 : 1.75}
                  strokeOpacity={edge.isActive ? 1 : 0.65}
                  strokeLinecap="round"
                />
                <text
                  x={midX + (edge.side === 'left' ? -10 : 10)}
                  y={midY - 3}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill={strokeColor}
                  opacity={edge.isActive ? 0.95 : 0.65}
                >
                  {edge.side === 'left' ? 'L' : 'R'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Accessible Tree Node Cards positioned at exact (x, y) coordinates */}
        {layout.nodes.map((node) => {
          const { cell } = node;
          const cellPtrs = getPointersForCell(heap.id, cell.index);
          const isActive = cell.status === 'active';
          const isTarget = cell.status === 'target';
          const isMutated = cell.status === 'mutated';
          const isVisited = cell.status === 'visited';

          const statusClass = isMutated
            ? theme.cardMutatedClass
            : isActive
            ? theme.cardActiveClass
            : isTarget
            ? theme.cardTargetClass
            : isVisited
            ? theme.cardDiscardedClass
            : theme.cardIdleClass;

          return (
            <div
              key={String(cell.index)}
              data-tree-slot={node.slot}
              data-parent-slot={node.parentSlot ?? 'root'}
              style={{
                left: `${(node.x / layout.width) * 100}%`,
                top: `${(node.y / layout.height) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute flex flex-col items-center"
            >
              {/* Pointer badges anchored above node */}
              {cellPtrs.length > 0 && (
                <div className="mb-1 flex items-center gap-1">
                  {cellPtrs.map((p) => {
                    const pCol = getPointerSemanticColor(p.name);
                    return (
                      <motion.span
                        layout="position"
                        layoutId={`ptr-${p.id}`}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        key={p.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap ${pCol.badge}`}
                      >
                        *{p.name}
                      </motion.span>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => onCellClick?.(cell.index)}
                aria-label={`Tree node ${cell.value} at slot ${node.slot}, address ${cell.addressOffset}, status ${cell.status}`}
                className={`min-w-[74px] px-2.5 py-1.5 text-center ${theme.cardBaseClass} ${statusClass} ${
                  onCellClick ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="text-[10px] font-mono opacity-65 tabular-nums leading-tight">
                  {cell.addressOffset}
                </div>
                <div className="text-sm font-mono font-bold tabular-nums leading-snug">
                  {cell.value}
                </div>
                <div className="text-[10px] font-mono opacity-65 leading-tight">
                  {cell.status === 'active'
                    ? 'current'
                    : cell.status === 'target'
                    ? 'queued'
                    : cell.status === 'visited'
                    ? 'done'
                    : `slot ${node.slot}`}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Subtle status legend */}
      <div className={`mt-2 pt-2 border-t ${theme.dividerClass} flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono opacity-75`}>
        <span>Binary heap slot geometry: left = 2i + 1 · right = 2i + 2</span>
        <span>Active: processing · Queued: in FIFO frontier · Done: visited</span>
      </div>
    </div>
  );
};

/**
 * Renders a true SVG Directed Graph with curved arrowheads, active edge relaxation
 * highlights, vertex in-degree badges, and an accessible vertex summary strip.
 */
export const DirectedGraphVisualizer: React.FC<SharedVisualizerProps> = ({
  heap,
  theme,
  getPointersForCell,
  getPointerSemanticColor,
  onCellClick,
}) => {
  const layout = computeDirectedGraphLayout(heap.cells, 640, 240, 34);
  const markerIdleId = `dag-arrow-idle-${theme.id}-${heap.id}`;
  const markerActiveId = `dag-arrow-active-${theme.id}-${heap.id}`;

  return (
    <div className="py-2 space-y-4" data-testid="directed-graph-svg-stage">
      <div className="text-xs font-mono opacity-80 flex flex-wrap items-center justify-between gap-2">
        <span>Directed Graph Topology &amp; Indegree Decay (Kahn&apos;s Topological BFS)</span>
        <span className="text-[11px] font-semibold">
          Frontier Invariant: in-degree = 0 ready to dequeue
        </span>
      </div>

      {/* Interactive SVG Node-Link Graph */}
      <div className={`rounded-lg border ${theme.insetSurfaceClass} overflow-x-auto p-2`}>
        <div
          className="relative mx-auto w-full max-w-[640px] min-w-[420px]"
          style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
        >
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id={markerIdleId}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill={theme.svgEdgeIdleColor} />
              </marker>
              <marker
                id={markerActiveId}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill={theme.svgEdgeActiveColor} />
              </marker>
            </defs>

            {layout.edges.map((edge) => {
              const stroke = edge.isActive ? theme.svgEdgeActiveColor : theme.svgEdgeIdleColor;
              return (
                <path
                  key={edge.id}
                  data-graph-edge={`${edge.from}->${edge.to}`}
                  d={`M ${edge.x1} ${edge.y1} Q ${edge.cx} ${edge.cy} ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={edge.isActive ? 2.6 : 1.8}
                  strokeOpacity={edge.isActive ? 1 : 0.72}
                  markerEnd={`url(#${edge.isActive ? markerActiveId : markerIdleId})`}
                />
              );
            })}
          </svg>

          {/* Vertex Nodes */}
          {layout.nodes.map((node) => {
            const { cell } = node;
            const cellPtrs = getPointersForCell(heap.id, cell.index);
            const isActive = cell.status === 'active';
            const isTarget = cell.status === 'target';
            const isMutated = cell.status === 'mutated';
            const isVisited = cell.status === 'visited';

            const nodeClass = isMutated
              ? theme.cardMutatedClass
              : isActive
              ? theme.cardActiveClass
              : isTarget
              ? theme.cardTargetClass
              : isVisited
              ? theme.cardDiscardedClass
              : theme.cardIdleClass;

            return (
              <div
                key={String(cell.index)}
                data-graph-vertex={node.vertexId}
                style={{
                  left: `${(node.x / layout.width) * 100}%`,
                  top: `${(node.y / layout.height) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute flex flex-col items-center"
              >
                {cellPtrs.length > 0 && (
                  <div className="mb-1 flex items-center gap-1">
                    {cellPtrs.map((p) => {
                      const pCol = getPointerSemanticColor(p.name);
                      return (
                        <motion.span
                          layout="position"
                          layoutId={`ptr-${p.id}`}
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          key={p.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap ${pCol.badge}`}
                        >
                          *{p.name}
                        </motion.span>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onCellClick?.(cell.index)}
                  aria-label={`Vertex ${node.vertexId}, ${cell.value}, status ${cell.status}, ${cell.annotation || ''}`}
                  className={`w-[58px] h-[58px] rounded-full border-2 flex flex-col items-center justify-center font-mono transition-all shadow-xs ${nodeClass} ${
                    onCellClick ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">V{node.vertexId}</span>
                  <span className="text-[10px] opacity-80 tabular-nums mt-0.5 leading-none">
                    {cell.value}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Vertex Adjacency & Indegree Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {heap.cells.map((cell) => {
          const isTarget = cell.status === 'target' || cell.status === 'active';
          const isMutated = cell.status === 'mutated';
          const isVisited = cell.status === 'visited';
          return (
            <button
              key={String(cell.index)}
              type="button"
              onClick={() => onCellClick?.(cell.index)}
              className={`text-left px-3 py-2 ${theme.cardBaseClass} ${
                isMutated
                  ? theme.cardMutatedClass
                  : isTarget
                  ? theme.cardActiveClass
                  : isVisited
                  ? theme.cardDiscardedClass
                  : theme.cardIdleClass
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold">{cell.label}</span>
                <span className="tabular-nums opacity-75">{cell.value}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-mono opacity-80">
                <span className="truncate">{cell.annotation}</span>
                <span className={`px-1.5 py-0.2 rounded uppercase font-semibold shrink-0 ${theme.statusIdleBadgeClass}`}>
                  {cell.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Renders a dedicated horizontal FIFO Queue / Deque strip (e.g., BFS frontier queue)
 * with explicit FRONT (Dequeue) and BACK (Enqueue) orientation.
 */
export const FifoQueueVisualizer: React.FC<SharedVisualizerProps> = ({
  heap,
  theme,
  onCellClick,
}) => {
  return (
    <div className="py-2 space-y-3" data-testid="fifo-queue-stage">
      <div className="text-xs font-mono opacity-80 flex flex-wrap items-center justify-between gap-2">
        <span>FIFO Frontier Queue · Dequeue from FRONT (left) · Enqueue at BACK (right)</span>
        <span className="text-[11px] font-semibold tabular-nums">
          {heap.cells.length} {heap.cells.length === 1 ? 'item' : 'items'} queued
        </span>
      </div>

      {heap.cells.length === 0 ? (
        <div className={`py-5 text-center text-xs font-mono opacity-65 rounded-lg border border-dashed ${theme.dividerClass}`}>
          FIFO Queue is empty — traversal complete
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className={`text-[11px] font-mono font-semibold px-2 py-1 rounded border shrink-0 ${theme.badgeMutedClass}`}>
            FRONT →
          </span>
          {heap.cells.map((cell, idx) => {
            const isFront = idx === 0;
            return (
              <button
                key={`${cell.index}-${cell.addressOffset}`}
                type="button"
                onClick={() => onCellClick?.(cell.index)}
                className={`min-w-[132px] px-3 py-2 text-left shrink-0 ${theme.cardBaseClass} ${
                  isFront ? theme.cardActiveClass : theme.cardIdleClass
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono opacity-75">
                  <span className="font-bold">{isFront ? 'FRONT' : `q[${idx}]`}</span>
                  <span className="tabular-nums">{cell.addressOffset}</span>
                </div>
                <div className="text-sm font-mono font-bold tabular-nums mt-0.5 truncate">
                  {cell.annotation || cell.value}
                </div>
              </button>
            );
          })}
          <span className={`text-[11px] font-mono font-semibold px-2 py-1 rounded border shrink-0 ${theme.badgeMutedClass}`}>
            ← BACK
          </span>
        </div>
      )}
    </div>
  );
};
