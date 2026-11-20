import { HeapCell } from '../types/visualizer';

export interface PositionedTreeNode {
  cell: HeapCell;
  slot: number;
  depth: number;
  posInLevel: number;
  parentSlot: number | null;
  x: number;
  y: number;
}

export interface TreeEdge {
  id: string;
  fromSlot: number;
  toSlot: number;
  side: 'left' | 'right';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive: boolean;
}

export interface BinaryTreeLayout {
  nodes: PositionedTreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
  maxDepth: number;
}

/**
 * Computes exact 2D SVG coordinates for a binary tree using heap-array slot indices
 * (left child = 2*i + 1, right child = 2*i + 2). Sparse/null slots stay empty so
 * children always align under their true parent node rather than shifting left.
 */
export function computeBinaryTreeLayout(
  cells: HeapCell[],
  width = 680,
  rowHeight = 96,
  topPadding = 44,
  bottomPadding = 44
): BinaryTreeLayout {
  if (cells.length === 0) {
    return { nodes: [], edges: [], width, height: 140, maxDepth: 0 };
  }

  const slotMap = new Map<number, PositionedTreeNode>();
  let maxDepth = 0;

  for (const cell of cells) {
    const slot = Number(cell.index);
    if (!Number.isInteger(slot) || slot < 0) continue;
    const depth = Math.floor(Math.log2(slot + 1));
    if (depth > maxDepth) maxDepth = depth;
  }

  const horizontalMargin = 36;
  const usableWidth = Math.max(240, width - horizontalMargin * 2);

  for (const cell of cells) {
    const slot = Number(cell.index);
    if (!Number.isInteger(slot) || slot < 0) continue;
    const depth = Math.floor(Math.log2(slot + 1));
    const levelCapacity = Math.pow(2, depth);
    const posInLevel = slot - (levelCapacity - 1);
    const x = horizontalMargin + ((posInLevel + 0.5) / levelCapacity) * usableWidth;
    const y = topPadding + depth * rowHeight;
    const parentSlot = slot === 0 ? null : Math.floor((slot - 1) / 2);

    slotMap.set(slot, {
      cell,
      slot,
      depth,
      posInLevel,
      parentSlot,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  }

  const nodes = Array.from(slotMap.values()).sort((a, b) => a.slot - b.slot);
  const edges: TreeEdge[] = [];

  for (const node of nodes) {
    if (node.parentSlot === null) continue;
    const parent = slotMap.get(node.parentSlot);
    if (!parent) continue;
    const side: 'left' | 'right' = node.slot === 2 * parent.slot + 1 ? 'left' : 'right';
    const isActive =
      parent.cell.status === 'active' ||
      node.cell.status === 'active' ||
      node.cell.status === 'target';

    edges.push({
      id: `edge-${parent.slot}-${node.slot}`,
      fromSlot: parent.slot,
      toSlot: node.slot,
      side,
      x1: parent.x,
      y1: parent.y,
      x2: node.x,
      y2: node.y,
      isActive,
    });
  }

  const height = topPadding + maxDepth * rowHeight + bottomPadding;
  return { nodes, edges, width, height, maxDepth };
}

export interface PositionedGraphNode {
  cell: HeapCell;
  vertexId: number;
  x: number;
  y: number;
  inDegreeText: string;
}

export interface DirectedGraphEdge {
  id: string;
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  isBidirectional: boolean;
  isActive: boolean;
}

export interface DirectedGraphLayout {
  nodes: PositionedGraphNode[];
  edges: DirectedGraphEdge[];
  width: number;
  height: number;
  nodeRadius: number;
}

/**
 * Parses outgoing adjacency lists stored on HeapCell.nextAddress ("1,2") and
 * lays out directed graph vertices cleanly so edges and arrowheads remain readable.
 */
export function computeDirectedGraphLayout(
  cells: HeapCell[],
  width = 640,
  height = 260,
  nodeRadius = 28
): DirectedGraphLayout {
  const n = cells.length;
  if (n === 0) {
    return { nodes: [], edges: [], width, height: 140, nodeRadius };
  }

  // Deterministic ergonomic presets for small graphs (2..6 vertices), circular fallback for >6
  const presetPositions = (count: number): Array<[number, number]> => {
    if (count === 1) return [[0.5, 0.5]];
    if (count === 2) return [[0.26, 0.5], [0.74, 0.5]];
    if (count === 3) return [[0.2, 0.5], [0.55, 0.24], [0.55, 0.76]];
    if (count === 4) {
      // Classic diamond DAG layout (V0 -> V1, V2 -> V3)
      return [
        [0.16, 0.5],
        [0.5, 0.23],
        [0.5, 0.77],
        [0.84, 0.5],
      ];
    }
    if (count === 5) {
      return [
        [0.14, 0.5],
        [0.42, 0.22],
        [0.42, 0.78],
        [0.72, 0.28],
        [0.86, 0.72],
      ];
    }
    if (count === 6) {
      return [
        [0.14, 0.3],
        [0.14, 0.72],
        [0.5, 0.22],
        [0.5, 0.78],
        [0.86, 0.3],
        [0.86, 0.72],
      ];
    }
    const cx = 0.5;
    const cy = 0.5;
    const rx = 0.36;
    const ry = 0.34;
    return Array.from({ length: count }, (_, idx) => {
      const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
      return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)] as [number, number];
    });
  };

  const normalized = presetPositions(n);
  const nodeMap = new Map<number, PositionedGraphNode>();

  const nodes: PositionedGraphNode[] = cells.map((cell, idx) => {
    const vertexId = Number.isInteger(Number(cell.index)) ? Number(cell.index) : idx;
    const [nx, ny] = normalized[idx] ?? [0.5, 0.5];
    const positioned: PositionedGraphNode = {
      cell,
      vertexId,
      x: Math.round(nx * width * 10) / 10,
      y: Math.round(ny * height * 10) / 10,
      inDegreeText: String(cell.value),
    };
    nodeMap.set(vertexId, positioned);
    return positioned;
  });

  // Collect raw edge pairs first so we can curve opposing/bidirectional edges cleanly
  const rawEdges: Array<{ from: number; to: number }> = [];
  const edgeSet = new Set<string>();

  for (const node of nodes) {
    const rawAdj = (node.cell.nextAddress || '').trim();
    if (!rawAdj) continue;
    const targets = rawAdj
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((v) => Number.isInteger(v) && nodeMap.has(v));

    for (const to of targets) {
      const key = `${node.vertexId}->${to}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        rawEdges.push({ from: node.vertexId, to });
      }
    }
  }

  const edges: DirectedGraphEdge[] = rawEdges.map(({ from, to }) => {
    const src = nodeMap.get(from)!;
    const dst = nodeMap.get(to)!;
    const isBidirectional = edgeSet.has(`${to}->${from}`);

    const dx = dst.x - src.x;
    const dy = dst.y - src.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    // Shorten endpoints so the arrowhead rests cleanly on the target circle edge
    const startOffset = nodeRadius + 2;
    const endOffset = nodeRadius + 7;
    const x1 = src.x + ux * startOffset;
    const y1 = src.y + uy * startOffset;
    const x2 = dst.x - ux * endOffset;
    const y2 = dst.y - uy * endOffset;

    // Curve offset: stronger bend for bidirectional pairs, subtle arch for long horizontal spans
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const perpX = -uy;
    const perpY = ux;
    const curveMagnitude = isBidirectional ? 24 : dist > width * 0.55 ? 18 : 6;

    const isActive =
      src.cell.status === 'active' ||
      (src.cell.status === 'visited' && dst.cell.status === 'mutated');

    return {
      id: `dag-edge-${from}-${to}`,
      from,
      to,
      x1: Math.round(x1 * 10) / 10,
      y1: Math.round(y1 * 10) / 10,
      x2: Math.round(x2 * 10) / 10,
      y2: Math.round(y2 * 10) / 10,
      cx: Math.round((midX + perpX * curveMagnitude) * 10) / 10,
      cy: Math.round((midY + perpY * curveMagnitude) * 10) / 10,
      isBidirectional,
      isActive,
    };
  });

  return { nodes, edges, width, height, nodeRadius };
}
