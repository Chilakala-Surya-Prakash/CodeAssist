import { ExecutionStep, HeapCell, HeapObject, PointerRef, StackVariable } from '../types/visualizer';

function hexAddr(base: number, offset: number): string {
  return '0x' + (base + offset).toString(16).toUpperCase();
}

function parseNumberList(raw: string, fallback: number[]): number[] {
  const matches = raw.match(/-?\d+/g);
  if (!matches || matches.length === 0) return fallback;
  return matches.map(Number).slice(0, 12);
}

/**
 * Generates a full step-by-step execution trace with Stack Frames, Heap Allocations,
 * and Dynamic Pointer mutations for any problem and custom input string.
 */
export function generateExecutionTrace(problemId: string, rawInput?: string): ExecutionStep[] {
  switch (problemId) {
    case 'reverse-linked-list':
      return traceReverseLinkedList(rawInput || '10 -> 20 -> 30 -> 40');
    case 'trapping-rain-water':
      return traceTrappingRainWater(rawInput || '0, 2, 0, 3, 1, 0, 1, 3, 2, 1');
    case 'lru-cache-pointers':
      return traceLRUCache(rawInput || 'cap=2 | PUT(1,10), PUT(2,20), GET(1), PUT(3,30)');
    case 'binary-tree-level-order':
      return traceBinaryTreeBFS(rawInput || '3, 9, 20, null, null, 15, 7');
    case 'course-schedule-cycle':
      return traceCourseScheduleDAG(rawInput || 'V=4 | 0->1, 0->2, 1->3, 2->3');
    case 'cycle-detection-floyd':
      return traceCycleDetectionFloyd(rawInput || '3 -> 2 -> 0 -> -4 (cycle=1)');
    case 'longest-substring-unique':
      return traceLongestSubstring(rawInput || 'abcabcbb');
    case 'search-rotated-sorted':
      return traceRotatedBinarySearch(rawInput || 'nums=[4, 5, 6, 7, 0, 1, 2] | target=0');
    case 'daily-temperatures-stack':
      return traceDailyTemperatures(rawInput || '73, 74, 75, 71, 69, 72, 76, 73');
    case 'three-sum-zero':
      return traceThreeSum(rawInput || '-4, -1, -1, 0, 1, 2');
    case 'coin-change-dp':
      return traceCoinChangeDP(rawInput || 'coins=[1, 3, 4] | amount=6');
    case 'kth-largest-heap':
      return traceKthLargestHeap(rawInput || 'nums=[3, 2, 1, 5, 6, 4] | k=2');
    case 'valid-parentheses-stack':
      return traceValidParentheses(rawInput || '{[()]}');
    case 'two-sum-hash':
      return traceTwoSumHash(rawInput || 'nums=[2, 7, 11, 15] | target=9');
    case 'container-most-water':
      return traceContainerMostWater(rawInput || '1, 8, 6, 2, 5, 4, 8, 3, 7');
    default:
      return traceReverseLinkedList('10 -> 20 -> 30 -> 40');
  }
}

// 1. Reverse Singly Linked List
function traceReverseLinkedList(rawInput: string): ExecutionStep[] {
  const vals = parseNumberList(rawInput, [10, 20, 30, 40]).slice(0, 6);
  const n = vals.length;
  const baseHeap = 0x1040;
  const nodeAddrs = vals.map((_, i) => hexAddr(baseHeap, i * 0x20));
  const nextLinks: (string | null)[] = vals.map((_, i) => (i + 1 < n ? nodeAddrs[i + 1] : null));

  const steps: ExecutionStep[] = [];
  let pointerOps = 0;
  let comparisons = 0;

  const snapshotHeap = (activeIdx: number | null, mutatedIdx: number | null, reversedUpTo: number): HeapObject => ({
    id: 'heap-ll',
    address: nodeAddrs[0],
    type: 'LinkedList',
    label: `SinglyLinkedList<ListNode> (${n} nodes on Heap)`,
    byteSize: n * 24,
    refCount: 1,
    gcStatus: mutatedIdx !== null ? 'mutated' : 'allocated',
    cells: vals.map((v, i) => ({
      index: i,
      label: `Node@${nodeAddrs[i]}`,
      value: v,
      addressOffset: nodeAddrs[i],
      nextAddress: nextLinks[i],
      status:
        i === mutatedIdx
          ? 'mutated'
          : i === activeIdx
          ? 'active'
          : i <= reversedUpTo
          ? 'visited'
          : 'idle',
      annotation: nextLinks[i] ? `next → ${nextLinks[i]}` : 'next → NULL'
    }))
  });

  // Step 0: Initialize prev = None, curr = head
  pointerOps += 2;
  steps.push({
    stepIndex: 0,
    title: 'Initialize Stack Pointers (prev = NULL, curr = head)',
    pythonLine: 7,
    javaLine: 4,
    operationType: 'INIT_POINTER',
    intuition: `Allocate stack pointer registers prev (initialized to 0x0000 NULL) and curr pointing to the first heap node at ${nodeAddrs[0]}.`,
    memoryMutation: `Stack frame reverseList() binds prev = NULL and curr = ${nodeAddrs[0]}.`,
    invariantCheck: 'Prefix [0..-1] is reversed (empty); suffix [0..n-1] retains original forward links.',
    stackFrames: [
      {
        id: 'frame-main',
        functionName: 'reverseList(head)',
        line: 7,
        returnAddress: '0x7FFF0010',
        isActive: true,
        variables: [
          { name: 'head', value: nodeAddrs[0], type: 'ListNode*', address: '0x7FFF0100', isPointer: true, pointsToAddress: nodeAddrs[0] },
          { name: 'prev', value: 'NULL (0x0000)', type: 'ListNode*', address: '0x7FFF0108', isPointer: true, changed: true },
          { name: 'curr', value: nodeAddrs[0], type: 'ListNode*', address: '0x7FFF0110', isPointer: true, pointsToAddress: nodeAddrs[0], changed: true }
        ]
      }
    ],
    heapObjects: [snapshotHeap(0, null, -1)],
    pointers: [
      { id: 'ptr-prev', name: 'prev', targetObjectId: 'heap-ll', targetIndex: null, targetAddress: '0x0000', role: 'anchor', deltaDescription: 'Initialized to NULL' },
      { id: 'ptr-curr', name: 'curr', targetObjectId: 'heap-ll', targetIndex: 0, targetAddress: nodeAddrs[0], role: 'primary', deltaDescription: `Points to head (${nodeAddrs[0]})` }
    ],
    metrics: { comparisons, pointerOps, heapBytesUsed: n * 24, timeStepO: 'O(1)' }
  });

  let prevIdx: number | null = null;
  for (let i = 0; i < n; i++) {
    const nxtIdx: number | null = i + 1 < n ? i + 1 : null;
    const nxtAddr = nxtIdx !== null ? nodeAddrs[nxtIdx] : '0x0000';
    const prevAddr = prevIdx !== null ? nodeAddrs[prevIdx] : '0x0000';
    comparisons += 1;
    pointerOps += 1;

    // Step A: Cache nxt = curr.next
    steps.push({
      stepIndex: steps.length,
      title: `Node ${vals[i]}: Cache Forward Reference (nxt = curr.next)`,
      pythonLine: 9,
      javaLine: 6,
      operationType: 'INIT_POINTER',
      intuition: `Before mutating Node(${vals[i]}).next, save its forward address (${nxtAddr}) into register nxt so we don't orphan the rest of the list.`,
      memoryMutation: `nxt register updated to ${nxtAddr}.`,
      invariantCheck: `Forward chain starting at ${nxtAddr} is safely anchored by nxt.`,
      stackFrames: [
        {
          id: 'frame-main',
          functionName: 'reverseList(head)',
          line: 9,
          returnAddress: '0x7FFF0010',
          isActive: true,
          variables: [
            { name: 'prev', value: prevAddr, type: 'ListNode*', address: '0x7FFF0108', isPointer: true, pointsToAddress: prevAddr },
            { name: 'curr', value: nodeAddrs[i], type: 'ListNode*', address: '0x7FFF0110', isPointer: true, pointsToAddress: nodeAddrs[i] },
            { name: 'nxt', value: nxtAddr, type: 'ListNode*', address: '0x7FFF0118', isPointer: true, pointsToAddress: nxtAddr, changed: true }
          ]
        }
      ],
      heapObjects: [snapshotHeap(i, null, i - 1)],
      pointers: [
        { id: 'ptr-prev', name: 'prev', targetObjectId: 'heap-ll', targetIndex: prevIdx, targetAddress: prevAddr, role: 'anchor' },
        { id: 'ptr-curr', name: 'curr', targetObjectId: 'heap-ll', targetIndex: i, targetAddress: nodeAddrs[i], role: 'primary' },
        { id: 'ptr-nxt', name: 'nxt', targetObjectId: 'heap-ll', targetIndex: nxtIdx, targetAddress: nxtAddr, role: 'fast', deltaDescription: `Saved curr.next (${nxtAddr})` }
      ],
      metrics: { comparisons, pointerOps, heapBytesUsed: n * 24, timeStepO: `Step ${i + 1}/${n}` }
    });

    // Step B: Flip curr.next = prev and advance pointers
    nextLinks[i] = prevIdx !== null ? nodeAddrs[prevIdx] : null;
    pointerOps += 3;
    steps.push({
      stepIndex: steps.length,
      title: `Node ${vals[i]}: Flip .next Backward & Advance Pointers`,
      pythonLine: 10,
      javaLine: 7,
      operationType: 'REWIRE_NEXT_PTR',
      intuition: `Mutate Node(${vals[i]}).next in heap memory to point backward to ${prevAddr}, then step prev to ${nodeAddrs[i]} and curr to ${nxtAddr}.`,
      memoryMutation: `Heap write at ${nodeAddrs[i]}+0x08: .next changed to ${prevAddr}.`,
      invariantCheck: `Nodes [0..${i}] are now fully reversed in-place.`,
      stackFrames: [
        {
          id: 'frame-main',
          functionName: 'reverseList(head)',
          line: 12,
          returnAddress: '0x7FFF0010',
          isActive: true,
          variables: [
            { name: 'prev', value: nodeAddrs[i], type: 'ListNode*', address: '0x7FFF0108', isPointer: true, pointsToAddress: nodeAddrs[i], changed: true },
            { name: 'curr', value: nxtAddr, type: 'ListNode*', address: '0x7FFF0110', isPointer: true, pointsToAddress: nxtAddr, changed: true },
            { name: 'nxt', value: nxtAddr, type: 'ListNode*', address: '0x7FFF0118', isPointer: true, pointsToAddress: nxtAddr }
          ]
        }
      ],
      heapObjects: [snapshotHeap(nxtIdx, i, i)],
      pointers: [
        { id: 'ptr-prev', name: 'prev', targetObjectId: 'heap-ll', targetIndex: i, targetAddress: nodeAddrs[i], role: 'anchor', deltaDescription: `Advanced to ${nodeAddrs[i]}` },
        { id: 'ptr-curr', name: 'curr', targetObjectId: 'heap-ll', targetIndex: nxtIdx, targetAddress: nxtAddr, role: 'primary', deltaDescription: `Advanced to ${nxtAddr}` },
        { id: 'ptr-nxt', name: 'nxt', targetObjectId: 'heap-ll', targetIndex: nxtIdx, targetAddress: nxtAddr, role: 'fast' }
      ],
      metrics: { comparisons, pointerOps, heapBytesUsed: n * 24, timeStepO: `Step ${i + 1}/${n}` }
    });

    prevIdx = i;
  }

  // Final Step: Return prev as new head
  steps.push({
    stepIndex: steps.length,
    title: `Return New Head (prev = ${nodeAddrs[n - 1]})`,
    pythonLine: 13,
    javaLine: 11,
    operationType: 'RETURN_RESULT',
    intuition: `curr has reached NULL (0x0000). Pointer prev sits at ${nodeAddrs[n - 1]} (value ${vals[n - 1]}), which is now the head of the completely reversed linked list.`,
    memoryMutation: `Function returns heap address ${nodeAddrs[n - 1]}; stack frame popped.`,
    invariantCheck: `Reversed order: ${[...vals].reverse().join(' -> ')} -> NULL.`,
    stdout: `New Head: Node(${vals[n - 1]}) @ ${nodeAddrs[n - 1]} | Chain: ${[...vals].reverse().join(' -> ')}`,
    stackFrames: [
      {
        id: 'frame-main',
        functionName: 'reverseList(head)',
        line: 13,
        returnAddress: '0x7FFF0010',
        isActive: true,
        variables: [
          { name: 'return', value: nodeAddrs[n - 1], type: 'ListNode*', address: '0x7FFF0120', isPointer: true, pointsToAddress: nodeAddrs[n - 1], changed: true },
          { name: 'prev', value: nodeAddrs[n - 1], type: 'ListNode*', address: '0x7FFF0108', isPointer: true, pointsToAddress: nodeAddrs[n - 1] },
          { name: 'curr', value: 'NULL (0x0000)', type: 'ListNode*', address: '0x7FFF0110', isPointer: true }
        ]
      }
    ],
    heapObjects: [snapshotHeap(n - 1, null, n - 1)],
    pointers: [
      { id: 'ptr-prev', name: 'prev (new head)', targetObjectId: 'heap-ll', targetIndex: n - 1, targetAddress: nodeAddrs[n - 1], role: 'primary', deltaDescription: 'Returned as new head' }
    ],
    metrics: { comparisons: comparisons + 1, pointerOps, heapBytesUsed: n * 24, timeStepO: 'O(N) Complete' }
  });

  return steps;
}

// 2. Trapping Rain Water
function traceTrappingRainWater(rawInput: string): ExecutionStep[] {
  const heights = parseNumberList(rawInput, [0, 2, 0, 3, 1, 0, 1, 3, 2, 1]).map((x) => Math.max(0, x));
  const n = heights.length;
  const waterAt = new Array(n).fill(0);
  let left = 0;
  let right = n - 1;
  let leftMax = heights[left];
  let rightMax = heights[right];
  let totalWater = 0;
  let comparisons = 0;
  let pointerOps = 2;

  const steps: ExecutionStep[] = [];
  const baseAddr = 0x2000;

  const makeHeap = (activeIdx: number, mutatedIdx: number | null): HeapObject => ({
    id: 'heap-heights',
    address: hexAddr(baseAddr, 0),
    type: 'Array',
    label: `int[] height (${n} contiguous 4-byte cells)`,
    byteSize: n * 4,
    refCount: 1,
    gcStatus: mutatedIdx !== null ? 'mutated' : 'allocated',
    cells: heights.map((h, idx) => ({
      index: idx,
      label: `[${idx}]`,
      value: h,
      addressOffset: hexAddr(baseAddr, idx * 4),
      status:
        idx === mutatedIdx
          ? 'mutated'
          : idx === left || idx === right
          ? 'active'
          : waterAt[idx] > 0
          ? 'visited'
          : 'idle',
      annotation: waterAt[idx] > 0 ? `+${waterAt[idx]}💧` : `h=${h}`
    }))
  });

  steps.push({
    stepIndex: 0,
    title: 'Initialize Boundary Pointers (left=0, right=n-1)',
    pythonLine: 2,
    javaLine: 3,
    operationType: 'INIT_POINTER',
    intuition: `Place left at index 0 (height ${heights[left]}) and right at index ${right} (height ${heights[right]}). Initialize left_max=${leftMax}, right_max=${rightMax}.`,
    memoryMutation: 'Allocated 5 scalar registers in stack frame; zero extra heap arrays.',
    invariantCheck: `left_max = ${leftMax}, right_max = ${rightMax}, water = 0`,
    stackFrames: [
      {
        id: 'frame-trap',
        functionName: 'trap(height)',
        line: 2,
        returnAddress: '0x7FFF0020',
        isActive: true,
        variables: [
          { name: 'left', value: String(left), type: 'int', address: '0x7FFF0200', isPointer: true, pointsToAddress: hexAddr(baseAddr, left * 4), changed: true },
          { name: 'right', value: String(right), type: 'int', address: '0x7FFF0204', isPointer: true, pointsToAddress: hexAddr(baseAddr, right * 4), changed: true },
          { name: 'left_max', value: String(leftMax), type: 'int', address: '0x7FFF0208', isPointer: false },
          { name: 'right_max', value: String(rightMax), type: 'int', address: '0x7FFF020C', isPointer: false },
          { name: 'water', value: '0', type: 'int', address: '0x7FFF0210', isPointer: false }
        ]
      }
    ],
    heapObjects: [makeHeap(0, null)],
    pointers: [
      { id: 'p-left', name: 'left', targetObjectId: 'heap-heights', targetIndex: left, targetAddress: hexAddr(baseAddr, left * 4), role: 'primary', deltaDescription: 'Start @ [0]' },
      { id: 'p-right', name: 'right', targetObjectId: 'heap-heights', targetIndex: right, targetAddress: hexAddr(baseAddr, right * 4), role: 'secondary', deltaDescription: `Start @ [${right}]` }
    ],
    metrics: { comparisons, pointerOps, heapBytesUsed: n * 4, timeStepO: 'O(1)' }
  });

  while (left < right) {
    comparisons++;
    if (leftMax <= rightMax) {
      left++;
      pointerOps++;
      const prevMax = leftMax;
      leftMax = Math.max(leftMax, heights[left]);
      const added = leftMax - heights[left];
      waterAt[left] = added;
      totalWater += added;

      steps.push({
        stepIndex: steps.length,
        title: `left_max (${prevMax}) <= right_max (${rightMax}) → Advance left to [${left}]`,
        pythonLine: 8,
        javaLine: 9,
        operationType: added > 0 ? 'MUTATE_MEMORY' : 'MOVE_POINTER',
        intuition:
          added > 0
            ? `Since left_max <= right_max, index [${left}] (height ${heights[left]}) traps ${added} unit(s) of water bounded by left_max=${leftMax}.`
            : `left stepped to [${left}] with height ${heights[left]}, raising left_max to ${leftMax} (0 water trapped on a peak).`,
        memoryMutation: `left → [${left}] (${hexAddr(baseAddr, left * 4)}), left_max = ${leftMax}, water = ${totalWater} (+${added}).`,
        invariantCheck: `min(left_max, right_max) = ${Math.min(leftMax, rightMax)} bounds current valley.`,
        stackFrames: [
          {
            id: 'frame-trap',
            functionName: 'trap(height)',
            line: 9,
            returnAddress: '0x7FFF0020',
            isActive: true,
            variables: [
              { name: 'left', value: String(left), type: 'int', address: '0x7FFF0200', isPointer: true, pointsToAddress: hexAddr(baseAddr, left * 4), changed: true },
              { name: 'right', value: String(right), type: 'int', address: '0x7FFF0204', isPointer: true, pointsToAddress: hexAddr(baseAddr, right * 4) },
              { name: 'left_max', value: String(leftMax), type: 'int', address: '0x7FFF0208', isPointer: false, changed: leftMax !== prevMax },
              { name: 'right_max', value: String(rightMax), type: 'int', address: '0x7FFF020C', isPointer: false },
              { name: 'water', value: String(totalWater), type: 'int', address: '0x7FFF0210', isPointer: false, changed: added > 0 }
            ]
          }
        ],
        heapObjects: [makeHeap(left, added > 0 ? left : null)],
        pointers: [
          { id: 'p-left', name: 'left', targetObjectId: 'heap-heights', targetIndex: left, targetAddress: hexAddr(baseAddr, left * 4), role: 'primary', deltaDescription: `left++ → [${left}]` },
          { id: 'p-right', name: 'right', targetObjectId: 'heap-heights', targetIndex: right, targetAddress: hexAddr(baseAddr, right * 4), role: 'secondary' }
        ],
        metrics: { comparisons, pointerOps, heapBytesUsed: n * 4, timeStepO: `Water = ${totalWater}` }
      });
    } else {
      right--;
      pointerOps++;
      const prevMax = rightMax;
      rightMax = Math.max(rightMax, heights[right]);
      const added = rightMax - heights[right];
      waterAt[right] = added;
      totalWater += added;

      steps.push({
        stepIndex: steps.length,
        title: `left_max (${leftMax}) > right_max (${prevMax}) → Step right to [${right}]`,
        pythonLine: 12,
        javaLine: 13,
        operationType: added > 0 ? 'MUTATE_MEMORY' : 'MOVE_POINTER',
        intuition:
          added > 0
            ? `Right wall is the bottleneck (${rightMax}). Stepping right to [${right}] (height ${heights[right]}) traps ${added} unit(s) of water.`
            : `right stepped to [${right}] with height ${heights[right]}, updating right_max to ${rightMax}.`,
        memoryMutation: `right → [${right}] (${hexAddr(baseAddr, right * 4)}), right_max = ${rightMax}, water = ${totalWater} (+${added}).`,
        invariantCheck: `Pointers converging: [${left}..${right}] remaining.`,
        stackFrames: [
          {
            id: 'frame-trap',
            functionName: 'trap(height)',
            line: 13,
            returnAddress: '0x7FFF0020',
            isActive: true,
            variables: [
              { name: 'left', value: String(left), type: 'int', address: '0x7FFF0200', isPointer: true, pointsToAddress: hexAddr(baseAddr, left * 4) },
              { name: 'right', value: String(right), type: 'int', address: '0x7FFF0204', isPointer: true, pointsToAddress: hexAddr(baseAddr, right * 4), changed: true },
              { name: 'left_max', value: String(leftMax), type: 'int', address: '0x7FFF0208', isPointer: false },
              { name: 'right_max', value: String(rightMax), type: 'int', address: '0x7FFF020C', isPointer: false, changed: rightMax !== prevMax },
              { name: 'water', value: String(totalWater), type: 'int', address: '0x7FFF0210', isPointer: false, changed: added > 0 }
            ]
          }
        ],
        heapObjects: [makeHeap(right, added > 0 ? right : null)],
        pointers: [
          { id: 'p-left', name: 'left', targetObjectId: 'heap-heights', targetIndex: left, targetAddress: hexAddr(baseAddr, left * 4), role: 'primary' },
          { id: 'p-right', name: 'right', targetObjectId: 'heap-heights', targetIndex: right, targetAddress: hexAddr(baseAddr, right * 4), role: 'secondary', deltaDescription: `right-- → [${right}]` }
        ],
        metrics: { comparisons, pointerOps, heapBytesUsed: n * 4, timeStepO: `Water = ${totalWater}` }
      });
    }
  }

  steps.push({
    stepIndex: steps.length,
    title: `Pointers Converged at [${left}] — Return Total Water = ${totalWater}`,
    pythonLine: 14,
    javaLine: 16,
    operationType: 'RETURN_RESULT',
    intuition: `left (${left}) == right (${right}). Every bar has been evaluated in a single O(N) pass using O(1) auxiliary memory.`,
    memoryMutation: `Return scalar value ${totalWater}.`,
    invariantCheck: `Total trapped water = ${totalWater} units.`,
    stdout: `Total Trapped Water: ${totalWater} units`,
    stackFrames: steps[steps.length - 1].stackFrames,
    heapObjects: [makeHeap(left, null)],
    pointers: [
      { id: 'p-left', name: 'left==right', targetObjectId: 'heap-heights', targetIndex: left, targetAddress: hexAddr(baseAddr, left * 4), role: 'primary', deltaDescription: 'Converged' }
    ],
    metrics: { comparisons, pointerOps, heapBytesUsed: n * 4, timeStepO: 'O(N) Complete' }
  });

  return steps;
}

// 3. LRU Cache (Doubly Linked List + HashMap Pointers)
function traceLRUCache(rawInput: string): ExecutionStep[] {
  const capMatch = rawInput.match(/cap\s*=\s*(\d+)/i);
  const cap = capMatch ? Math.max(1, Math.min(4, Number(capMatch[1]))) : 2;
  const opRegex = /(PUT|GET)\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/gi;
  const ops: { type: 'PUT' | 'GET'; key: number; val?: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = opRegex.exec(rawInput)) !== null) {
    ops.push({
      type: match[1].toUpperCase() as 'PUT' | 'GET',
      key: Number(match[2]),
      val: match[3] !== undefined ? Number(match[3]) : undefined
    });
  }
  if (ops.length === 0) {
    ops.push(
      { type: 'PUT', key: 1, val: 10 },
      { type: 'PUT', key: 2, val: 20 },
      { type: 'GET', key: 1 },
      { type: 'PUT', key: 3, val: 30 }
    );
  }

  interface DNode {
    key: number;
    val: number;
    addr: string;
  }
  const list: DNode[] = []; // MRU at front (index 0), LRU at back
  const steps: ExecutionStep[] = [];
  let nextAddrOffset = 0x40;
  let pointerOps = 2;

  const buildState = (activeKey: number | null, note: string): { dll: HeapObject; map: HeapObject; ptrs: PointerRef[] } => {
    const cells: HeapCell[] = [
      {
        index: 'HEAD',
        label: 'HEAD Sentinel',
        value: '[-1:-1]',
        addressOffset: '0x3000',
        nextAddress: list.length > 0 ? list[0].addr : '0x3020',
        status: 'idle',
        annotation: `next → ${list.length > 0 ? list[0].addr : 'TAIL'}`
      },
      ...list.map((node, idx) => ({
        index: idx,
        label: `Node(k=${node.key})`,
        value: `${node.key}:${node.val}`,
        addressOffset: node.addr,
        nextAddress: idx + 1 < list.length ? list[idx + 1].addr : '0x3020',
        status: (node.key === activeKey ? 'mutated' : 'active') as HeapCell['status'],
        annotation: idx === 0 ? 'MRU (Front)' : idx === list.length - 1 ? 'LRU (Tail-1)' : 'Cached'
      })),
      {
        index: 'TAIL',
        label: 'TAIL Sentinel',
        value: '[-1:-1]',
        addressOffset: '0x3020',
        nextAddress: null,
        status: 'idle',
        annotation: `prev → ${list.length > 0 ? list[list.length - 1].addr : 'HEAD'}`
      }
    ];

    const dll: HeapObject = {
      id: 'heap-dll',
      address: '0x3000',
      type: 'LinkedList',
      label: `DoublyLinkedList (MRU → LRU, cap=${cap})`,
      byteSize: cells.length * 32,
      refCount: 2,
      gcStatus: 'mutated',
      cells
    };

    const map: HeapObject = {
      id: 'heap-map',
      address: '0x4000',
      type: 'HashMap',
      label: `HashMap<Key, DLinkedNode*> (${list.length}/${cap} entries)`,
      byteSize: 64 + list.length * 16,
      refCount: 1,
      gcStatus: 'allocated',
      cells: list.map((n) => ({
        index: `k=${n.key}`,
        label: `key ${n.key}`,
        value: `→ ${n.addr}`,
        addressOffset: n.addr,
        status: n.key === activeKey ? 'target' : 'visited',
        annotation: `val=${n.val}`
      }))
    };

    const ptrs: PointerRef[] = [
      { id: 'ptr-head', name: 'head.next (MRU)', targetObjectId: 'heap-dll', targetIndex: list.length > 0 ? 0 : 'TAIL', targetAddress: list.length > 0 ? list[0].addr : '0x3020', role: 'primary', deltaDescription: note },
      { id: 'ptr-tail', name: 'tail.prev (LRU)', targetObjectId: 'heap-dll', targetIndex: list.length > 0 ? list.length - 1 : 'HEAD', targetAddress: list.length > 0 ? list[list.length - 1].addr : '0x3000', role: 'secondary' }
    ];

    return { dll, map, ptrs };
  };

  const init = buildState(null, 'Sentinels wired');
  steps.push({
    stepIndex: 0,
    title: `Initialize LRUCache(capacity=${cap}) with Dummy HEAD & TAIL Sentinels`,
    pythonLine: 10,
    javaLine: 11,
    operationType: 'ALLOCATE_HEAP',
    intuition: `Allocate HEAD (0x3000) and TAIL (0x3020) sentinel nodes wired together (head.next = tail, tail.prev = head) so every future splice has non-null neighbors.`,
    memoryMutation: 'Allocated HashMap @ 0x4000 and sentinel DLinkedNodes @ 0x3000, 0x3020.',
    invariantCheck: 'Cache size = 0; HEAD <-> TAIL.',
    stackFrames: [
      {
        id: 'frame-lru',
        functionName: `LRUCache(cap=${cap})`,
        line: 10,
        returnAddress: '0x7FFF0030',
        isActive: true,
        variables: [
          { name: 'cap', value: String(cap), type: 'int', address: '0x7FFF0300', isPointer: false },
          { name: 'head', value: '0x3000', type: 'Node*', address: '0x7FFF0308', isPointer: true, pointsToAddress: '0x3000' },
          { name: 'tail', value: '0x3020', type: 'Node*', address: '0x7FFF0310', isPointer: true, pointsToAddress: '0x3020' }
        ]
      }
    ],
    heapObjects: [init.dll, init.map],
    pointers: init.ptrs,
    metrics: { comparisons: 0, pointerOps, heapBytesUsed: 128, timeStepO: 'O(1)' }
  });

  ops.forEach((op, idx) => {
    if (op.type === 'PUT') {
      const existingIdx = list.findIndex((x) => x.key === op.key);
      if (existingIdx !== -1) {
        const [node] = list.splice(existingIdx, 1);
        node.val = op.val ?? node.val;
        list.unshift(node);
      } else {
        let evictedMsg = '';
        if (list.length >= cap) {
          const evicted = list.pop()!;
          pointerOps += 4;
          evictedMsg = ` Evicted LRU Node(k=${evicted.key}) @ ${evicted.addr} from tail.prev.`;
        }
        const newNode: DNode = {
          key: op.key,
          val: op.val ?? op.key * 10,
          addr: hexAddr(0x3000, nextAddrOffset)
        };
        nextAddrOffset += 0x20;
        list.unshift(newNode);
        pointerOps += 4;

        const st = buildState(op.key, `Spliced k=${op.key} at MRU front`);
        steps.push({
          stepIndex: steps.length,
          title: `PUT(${op.key}, ${newNode.val}) — Splice Node @ ${newNode.addr} after HEAD${evictedMsg ? ' & Evict Tail' : ''}`,
          pythonLine: 18,
          javaLine: 20,
          operationType: 'REWIRE_NEXT_PTR',
          intuition: `Insert Node(${op.key}:${newNode.val}) right after HEAD (MRU position) and store key ${op.key} → ${newNode.addr} in HashMap.${evictedMsg}`,
          memoryMutation: `Rewired head.next → ${newNode.addr}; HashMap[${op.key}] = ${newNode.addr}.${evictedMsg}`,
          invariantCheck: `MRU order: [${list.map((n) => `${n.key}:${n.val}`).join(' -> ')}] (size ${list.length}/${cap}).`,
          stackFrames: [
            {
              id: 'frame-lru',
              functionName: `put(${op.key}, ${newNode.val})`,
              line: 18,
              returnAddress: '0x7FFF0030',
              isActive: true,
              variables: [
                { name: 'key', value: String(op.key), type: 'int', address: '0x7FFF0320', isPointer: false },
                { name: 'val', value: String(newNode.val), type: 'int', address: '0x7FFF0324', isPointer: false },
                { name: 'node', value: newNode.addr, type: 'Node*', address: '0x7FFF0328', isPointer: true, pointsToAddress: newNode.addr, changed: true }
              ]
            }
          ],
          heapObjects: [st.dll, st.map],
          pointers: st.ptrs,
          metrics: { comparisons: idx + 1, pointerOps, heapBytesUsed: st.dll.byteSize + st.map.byteSize, timeStepO: 'O(1)' }
        });
      }
    } else {
      const existingIdx = list.findIndex((x) => x.key === op.key);
      if (existingIdx !== -1) {
        const [node] = list.splice(existingIdx, 1);
        list.unshift(node);
        pointerOps += 8;
        const st = buildState(op.key, `Promoted k=${op.key} to MRU`);
        steps.push({
          stepIndex: steps.length,
          title: `GET(${op.key}) → Cache Hit (${node.val}) — Detach & Promote ${node.addr} to MRU`,
          pythonLine: 26,
          javaLine: 29,
          operationType: 'REWIRE_NEXT_PTR',
          intuition: `HashMap lookup finds key ${op.key} at heap address ${node.addr} in O(1). _remove() bridges its old neighbors, and _insert_front() splices it immediately after HEAD.`,
          memoryMutation: `Detached ${node.addr} and rewired head.next = ${node.addr} (now MRU).`,
          invariantCheck: `Node(k=${op.key}) is now protected at MRU front; Node(k=${list[list.length - 1].key}) is now the LRU eviction candidate.`,
          stdout: `GET(${op.key}) => ${node.val}`,
          stackFrames: [
            {
              id: 'frame-lru',
              functionName: `get(${op.key})`,
              line: 26,
              returnAddress: '0x7FFF0030',
              isActive: true,
              variables: [
                { name: 'key', value: String(op.key), type: 'int', address: '0x7FFF0320', isPointer: false },
                { name: 'node', value: node.addr, type: 'Node*', address: '0x7FFF0328', isPointer: true, pointsToAddress: node.addr, changed: true },
                { name: 'return', value: String(node.val), type: 'int', address: '0x7FFF0330', isPointer: false, changed: true }
              ]
            }
          ],
          heapObjects: [st.dll, st.map],
          pointers: st.ptrs,
          metrics: { comparisons: idx + 1, pointerOps, heapBytesUsed: st.dll.byteSize + st.map.byteSize, timeStepO: 'O(1) Hit' }
        });
      }
    }
  });

  return steps;
}

// 4. Binary Tree Level Order Traversal (BFS)
function traceBinaryTreeBFS(rawInput: string): ExecutionStep[] {
  const tokens = rawInput
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const vals: (number | null)[] =
    tokens.length > 0
      ? tokens.slice(0, 7).map((t) => (t.toLowerCase() === 'null' || t === 'None' ? null : Number(t) || 0))
      : [3, 9, 20, null, null, 15, 7];

  const addrs = vals.map((v, i) => (v !== null ? hexAddr(0x5000, i * 0x28) : null));
  const steps: ExecutionStep[] = [];
  const visitedIndices = new Set<number>();
  const levelsOutput: number[][] = [];
  let pointerOps = 1;

  const buildTreeHeap = (activeIdx: number | null, queueIndices: number[]): HeapObject[] => {
    const treeCells: HeapCell[] = [];
    vals.forEach((v, i) => {
      if (v === null) return;
      const leftIdx = 2 * i + 1;
      const rightIdx = 2 * i + 2;
      treeCells.push({
        index: i,
        label: `TreeNode(${v})`,
        value: v,
        addressOffset: addrs[i]!,
        leftAddress: leftIdx < vals.length && addrs[leftIdx] ? addrs[leftIdx] : null,
        rightAddress: rightIdx < vals.length && addrs[rightIdx] ? addrs[rightIdx] : null,
        status:
          i === activeIdx
            ? 'active'
            : queueIndices.includes(i)
            ? 'target'
            : visitedIndices.has(i)
            ? 'visited'
            : 'idle',
        annotation: `depth=${Math.floor(Math.log2(i + 1))}`
      });
    });

    const queueObj: HeapObject = {
      id: 'heap-queue',
      address: '0x5400',
      type: 'GraphQueue',
      label: `FIFO Deque<TreeNode*> (${queueIndices.length} queued)`,
      byteSize: 64,
      refCount: 1,
      gcStatus: 'mutated',
      cells: queueIndices.map((qIdx, pos) => ({
        index: pos,
        label: pos === 0 ? 'FRONT' : `q[${pos}]`,
        value: `${vals[qIdx]} @ ${addrs[qIdx]}`,
        addressOffset: addrs[qIdx]!,
        status: pos === 0 ? 'target' : 'active',
        annotation: `Node(${vals[qIdx]})`
      }))
    };

    return [
      {
        id: 'heap-tree',
        address: addrs[0] || '0x5000',
        type: 'BinaryTree',
        label: `BinaryTree Heap Nodes (${treeCells.length} allocated)`,
        byteSize: treeCells.length * 32,
        refCount: 1,
        gcStatus: 'allocated',
        cells: treeCells
      },
      queueObj
    ];
  };

  const queue: number[] = vals[0] !== null ? [0] : [];

  steps.push({
    stepIndex: 0,
    title: `Enqueue Root Node(${vals[0]}) @ ${addrs[0]} into FIFO Deque`,
    pythonLine: 7,
    javaLine: 6,
    operationType: 'ALLOCATE_HEAP',
    intuition: `Initialize the BFS frontier queue with the root pointer (${addrs[0]}). Each iteration will snapshot level_size = len(queue) to process one complete depth level.`,
    memoryMutation: `queue = [${addrs[0]}], result = []`,
    invariantCheck: 'Queue holds all nodes at depth 0.',
    stackFrames: [
      {
        id: 'frame-bfs',
        functionName: 'levelOrder(root)',
        line: 7,
        returnAddress: '0x7FFF0040',
        isActive: true,
        variables: [
          { name: 'root', value: addrs[0] || 'NULL', type: 'TreeNode*', address: '0x7FFF0400', isPointer: true, pointsToAddress: addrs[0] || undefined },
          { name: 'level_size', value: '1', type: 'int', address: '0x7FFF0408', isPointer: false }
        ]
      }
    ],
    heapObjects: buildTreeHeap(0, [...queue]),
    pointers: [
      { id: 'ptr-root', name: 'root', targetObjectId: 'heap-tree', targetIndex: 0, targetAddress: addrs[0] || '0x5000', role: 'primary', deltaDescription: 'Enqueued at front' }
    ],
    metrics: { comparisons: 1, pointerOps, heapBytesUsed: 256, timeStepO: 'Depth 0' }
  });

  let depth = 0;
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: number[] = [];

    for (let i = 0; i < levelSize; i++) {
      const currIdx = queue.shift()!;
      visitedIndices.add(currIdx);
      currentLevel.push(vals[currIdx]!);
      pointerOps++;

      const leftIdx = 2 * currIdx + 1;
      const rightIdx = 2 * currIdx + 2;
      if (leftIdx < vals.length && vals[leftIdx] !== null) {
        queue.push(leftIdx);
        pointerOps++;
      }
      if (rightIdx < vals.length && vals[rightIdx] !== null) {
        queue.push(rightIdx);
        pointerOps++;
      }

      steps.push({
        stepIndex: steps.length,
        title: `Depth ${depth}: Pop Node(${vals[currIdx]}) @ ${addrs[currIdx]} & Enqueue Children`,
        pythonLine: 12,
        javaLine: 11,
        operationType: 'MOVE_POINTER',
        intuition: `Dequeue curr = Node(${vals[currIdx]}), append ${vals[currIdx]} to current_level, and push its non-null left/right child pointers into the back of the queue.`,
        memoryMutation: `curr = ${addrs[currIdx]}; current_level = [${currentLevel.join(', ')}].`,
        invariantCheck: `Completed ${i + 1}/${levelSize} nodes in Depth ${depth}.`,
        stdout: `Levels: ${JSON.stringify([...levelsOutput, currentLevel])}`,
        stackFrames: [
          {
            id: 'frame-bfs',
            functionName: 'levelOrder(root)',
            line: 12,
            returnAddress: '0x7FFF0040',
            isActive: true,
            variables: [
              { name: 'curr', value: addrs[currIdx]!, type: 'TreeNode*', address: '0x7FFF0410', isPointer: true, pointsToAddress: addrs[currIdx]!, changed: true },
              { name: 'level_size', value: String(levelSize), type: 'int', address: '0x7FFF0408', isPointer: false },
              { name: 'current_level', value: `[${currentLevel.join(', ')}]`, type: 'list[int]', address: '0x7FFF0418', isPointer: false, changed: true }
            ]
          }
        ],
        heapObjects: buildTreeHeap(currIdx, [...queue]),
        pointers: [
          { id: 'ptr-curr', name: 'curr', targetObjectId: 'heap-tree', targetIndex: currIdx, targetAddress: addrs[currIdx]!, role: 'primary', deltaDescription: `Dequeued depth ${depth}` }
        ],
        metrics: { comparisons: visitedIndices.size, pointerOps, heapBytesUsed: 256, timeStepO: `Depth ${depth}` }
      });
    }
    levelsOutput.push(currentLevel);
    depth++;
  }

  return steps;
}

// 5. Course Schedule — Directed Graph Cycle Detection (Kahn BFS)
function traceCourseScheduleDAG(rawInput: string): ExecutionStep[] {
  const vMatch = rawInput.match(/V\s*=\s*(\d+)/i);
  const V = vMatch ? Math.max(2, Math.min(6, Number(vMatch[1]))) : 4;
  const edgeRegex = /(\d+)\s*->\s*(\d+)/g;
  const edges: [number, number][] = [];
  let m: RegExpExecArray | null;
  while ((m = edgeRegex.exec(rawInput)) !== null) {
    const u = Number(m[1]);
    const v = Number(m[2]);
    if (u < V && v < V) edges.push([u, v]);
  }
  if (edges.length === 0) {
    edges.push([0, 1], [0, 2], [1, 3], [2, 3]);
  }

  const adj: number[][] = Array.from({ length: V }, () => []);
  const indegree = new Array(V).fill(0);
  edges.forEach(([u, v]) => {
    adj[u].push(v);
    indegree[v]++;
  });

  const visitedSet = new Set<number>();
  const queue: number[] = [];
  for (let i = 0; i < V; i++) {
    if (indegree[i] === 0) queue.push(i);
  }

  const steps: ExecutionStep[] = [];
  let pointerOps = edges.length;

  const buildGraphHeap = (activeNode: number | null, mutatedNeighbor: number | null): HeapObject[] => [
    {
      id: 'heap-graph',
      address: '0x6000',
      type: 'GraphQueue',
      label: `Directed Graph G(V=${V}, E=${edges.length}) & Indegree Table`,
      byteSize: V * 32,
      refCount: 1,
      gcStatus: 'mutated',
      cells: Array.from({ length: V }, (_, i) => ({
        index: i,
        label: `Vertex ${i}`,
        value: `in=${indegree[i]}`,
        addressOffset: hexAddr(0x6000, i * 0x20),
        nextAddress: adj[i].map((t) => String(t)).join(','),
        status:
          i === activeNode
            ? 'active'
            : i === mutatedNeighbor
            ? 'mutated'
            : visitedSet.has(i)
            ? 'visited'
            : queue.includes(i)
            ? 'target'
            : 'idle',
        annotation: adj[i].length > 0 ? `edges → [${adj[i].join(', ')}]` : 'sink (out=0)'
      }))
    }
  ];

  steps.push({
    stepIndex: 0,
    title: `Build Adjacency List & Enqueue 0-Indegree Vertices ([${queue.join(', ')}])`,
    pythonLine: 10,
    javaLine: 12,
    operationType: 'ALLOCATE_HEAP',
    intuition: `Compute in-degrees for all ${V} vertices. Vertices with indegree == 0 ([${queue.join(', ')}]) have no unmet prerequisites and enter the topological frontier queue.`,
    memoryMutation: `indegree = [${indegree.join(', ')}], queue = [${queue.join(', ')}].`,
    invariantCheck: `Queue contains all ready entry courses.`,
    stackFrames: [
      {
        id: 'frame-dag',
        functionName: `canFinish(V=${V})`,
        line: 10,
        returnAddress: '0x7FFF0050',
        isActive: true,
        variables: [
          { name: 'indegree', value: `[${indegree.join(', ')}]`, type: 'int[]', address: '0x7FFF0500', isPointer: true, pointsToAddress: '0x6000', changed: true },
          { name: 'queue', value: `[${queue.join(', ')}]`, type: 'Deque', address: '0x7FFF0508', isPointer: false, changed: true },
          { name: 'visited', value: '0', type: 'int', address: '0x7FFF0510', isPointer: false }
        ]
      }
    ],
    heapObjects: buildGraphHeap(queue[0] ?? null, null),
    pointers: queue.length > 0
      ? [{ id: 'ptr-q', name: 'front', targetObjectId: 'heap-graph', targetIndex: queue[0], targetAddress: hexAddr(0x6000, queue[0] * 0x20), role: 'primary', deltaDescription: 'indegree == 0' }]
      : [],
    metrics: { comparisons: V, pointerOps, heapBytesUsed: V * 32, timeStepO: 'Init O(V+E)' }
  });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedSet.add(curr);
    pointerOps++;

    for (const nxt of adj[curr]) {
      indegree[nxt]--;
      if (indegree[nxt] === 0) {
        queue.push(nxt);
      }
    }

    steps.push({
      stepIndex: steps.length,
      title: `Dequeue Vertex ${curr} — Decrement Outgoing Neighbors ([${adj[curr].join(', ') || 'none'}])`,
      pythonLine: 16,
      javaLine: 18,
      operationType: 'MUTATE_MEMORY',
      intuition: `Complete course ${curr} (visited=${visitedSet.size}/${V}). Relax all outgoing edges ${curr} → [${adj[curr].join(', ')}] by decrementing their in-degrees; push any vertex whose in-degree reaches 0.`,
      memoryMutation: `indegree = [${indegree.join(', ')}], queue = [${queue.join(', ')}].`,
      invariantCheck: `Visited ${visitedSet.size} of ${V} vertices.`,
      stackFrames: [
        {
          id: 'frame-dag',
          functionName: `canFinish(V=${V})`,
          line: 16,
          returnAddress: '0x7FFF0050',
          isActive: true,
          variables: [
            { name: 'curr', value: String(curr), type: 'int', address: '0x7FFF0518', isPointer: true, pointsToAddress: hexAddr(0x6000, curr * 0x20), changed: true },
            { name: 'indegree', value: `[${indegree.join(', ')}]`, type: 'int[]', address: '0x7FFF0500', isPointer: true, pointsToAddress: '0x6000', changed: true },
            { name: 'visited', value: String(visitedSet.size), type: 'int', address: '0x7FFF0510', isPointer: false, changed: true }
          ]
        }
      ],
      heapObjects: buildGraphHeap(curr, adj[curr][0] ?? null),
      pointers: [
        { id: 'ptr-curr', name: 'curr', targetObjectId: 'heap-graph', targetIndex: curr, targetAddress: hexAddr(0x6000, curr * 0x20), role: 'primary', deltaDescription: `Popped vertex ${curr}` }
      ],
      metrics: { comparisons: V + visitedSet.size, pointerOps, heapBytesUsed: V * 32, timeStepO: `Visited ${visitedSet.size}/${V}` }
    });
  }

  const isAcyclic = visitedSet.size === V;
  steps.push({
    stepIndex: steps.length,
    title: isAcyclic
      ? `Queue Empty: visited (${visitedSet.size}) == V (${V}) → Valid DAG (Return True)`
      : `Queue Empty: visited (${visitedSet.size}) < V (${V}) → Cycle Detected! (Return False)`,
    pythonLine: 19,
    javaLine: 22,
    operationType: 'RETURN_RESULT',
    intuition: isAcyclic
      ? `All ${V} vertices reached in-degree 0 and were topologically ordered. No circular dependency exists.`
      : `${V - visitedSet.size} vertices still have in-degree > 0 and are trapped in a directed cycle.`,
    memoryMutation: `Return boolean ${isAcyclic}.`,
    invariantCheck: `visited (${visitedSet.size}) == numCourses (${V}) is ${isAcyclic}.`,
    stdout: `canFinish => ${isAcyclic} (Visited ${visitedSet.size}/${V} vertices)`,
    stackFrames: steps[steps.length - 1].stackFrames,
    heapObjects: buildGraphHeap(null, null),
    pointers: [],
    metrics: { comparisons: V * 2, pointerOps, heapBytesUsed: V * 32, timeStepO: 'O(V+E) Complete' }
  });

  return steps;
}

// 6. Linked List Cycle Detection (Floyd Tortoise & Hare)
function traceCycleDetectionFloyd(rawInput: string): ExecutionStep[] {
  const cycleMatch = rawInput.match(/cycle\s*=\s*(-?\d+)/i);
  const nums = parseNumberList(rawInput.replace(/\(.*\)/, ''), [3, 2, 0, -4]).slice(0, 6);
  const n = nums.length;
  const cyclePos = cycleMatch ? Number(cycleMatch[1]) : rawInput.includes('index 1') ? 1 : 1;
  const validCycle = cyclePos >= 0 && cyclePos < n ? cyclePos : -1;

  const addrs = nums.map((_, i) => hexAddr(0x1800, i * 0x20));
  const steps: ExecutionStep[] = [];

  const makeHeap = (slowIdx: number | null, fastIdx: number | null, collided: boolean): HeapObject => ({
    id: 'heap-floyd',
    address: addrs[0],
    type: 'LinkedList',
    label: `LinkedList (${n} nodes, tail → ${validCycle >= 0 ? `Node[${validCycle}] @ ${addrs[validCycle]}` : 'NULL'})`,
    byteSize: n * 24,
    refCount: 1,
    gcStatus: 'allocated',
    cells: nums.map((v, i) => ({
      index: i,
      label: `Node@${addrs[i]}`,
      value: v,
      addressOffset: addrs[i],
      nextAddress: i + 1 < n ? addrs[i + 1] : validCycle >= 0 ? addrs[validCycle] : null,
      status:
        collided && i === slowIdx
          ? 'target'
          : i === slowIdx || i === fastIdx
          ? 'active'
          : i === validCycle
          ? 'visited'
          : 'idle',
      annotation: i === n - 1 && validCycle >= 0 ? `loops → ${addrs[validCycle]}` : `next → ${i + 1 < n ? addrs[i + 1] : 'NULL'}`
    }))
  });

  let slow = 0;
  let fast = 0;
  steps.push({
    stepIndex: 0,
    title: `Initialize Tortoise (slow) & Hare (fast) at Head (${addrs[0]})`,
    pythonLine: 2,
    javaLine: 3,
    operationType: 'INIT_POINTER',
    intuition: `Both slow (1x speed) and fast (2x speed) start at head ${addrs[0]}. Zero HashSet memory is allocated.`,
    memoryMutation: `slow = ${addrs[0]}, fast = ${addrs[0]}.`,
    invariantCheck: 'Distance between fast and slow is 0 at start.',
    stackFrames: [
      {
        id: 'frame-floyd',
        functionName: 'hasCycle(head)',
        line: 2,
        returnAddress: '0x7FFF0060',
        isActive: true,
        variables: [
          { name: 'slow', value: addrs[0], type: 'ListNode*', address: '0x7FFF0600', isPointer: true, pointsToAddress: addrs[0], changed: true },
          { name: 'fast', value: addrs[0], type: 'ListNode*', address: '0x7FFF0608', isPointer: true, pointsToAddress: addrs[0], changed: true }
        ]
      }
    ],
    heapObjects: [makeHeap(0, 0, false)],
    pointers: [
      { id: 'p-slow', name: 'slow (1x)', targetObjectId: 'heap-floyd', targetIndex: 0, targetAddress: addrs[0], role: 'primary' },
      { id: 'p-fast', name: 'fast (2x)', targetObjectId: 'heap-floyd', targetIndex: 0, targetAddress: addrs[0], role: 'fast' }
    ],
    metrics: { comparisons: 0, pointerOps: 2, heapBytesUsed: 16, timeStepO: 'O(1) Space' }
  });

  const nextIndex = (idx: number | null): number | null => {
    if (idx === null) return null;
    if (idx + 1 < n) return idx + 1;
    return validCycle >= 0 ? validCycle : null;
  };

  for (let step = 1; step <= n + 3; step++) {
    const f1 = nextIndex(fast);
    const f2 = nextIndex(f1);
    const s1 = nextIndex(slow);

    if (f1 === null || f2 === null || s1 === null) {
      steps.push({
        stepIndex: steps.length,
        title: 'fast Reached NULL (0x0000) — Acyclic List (Return False)',
        pythonLine: 9,
        javaLine: 12,
        operationType: 'RETURN_RESULT',
        intuition: 'fast pointer hit the end of the list (NULL), proving no cycle exists.',
        memoryMutation: 'Return False.',
        invariantCheck: 'fast == NULL',
        stdout: 'hasCycle => false',
        stackFrames: steps[steps.length - 1].stackFrames,
        heapObjects: [makeHeap(s1, null, false)],
        pointers: [],
        metrics: { comparisons: step, pointerOps: step * 3, heapBytesUsed: 16, timeStepO: 'O(N) Complete' }
      });
      break;
    }

    slow = s1;
    fast = f2;
    const collided = slow === fast;

    steps.push({
      stepIndex: steps.length,
      title: collided
        ? `Address Collision! slow == fast == ${addrs[slow]} (Return True)`
        : `Step ${step}: slow → ${addrs[slow]} (+1 hop), fast → ${addrs[fast]} (+2 hops)`,
      pythonLine: collided ? 8 : 6,
      javaLine: collided ? 9 : 7,
      operationType: collided ? 'RETURN_RESULT' : 'MOVE_POINTER',
      intuition: collided
        ? `Hare (fast) lapped Tortoise (slow) inside the cycle at heap address ${addrs[slow]} (Node value ${nums[slow]}). Cycle confirmed in O(1) memory!`
        : `slow advances 1 node to ${addrs[slow]}; fast advances 2 nodes to ${addrs[fast]}.`,
      memoryMutation: `slow = ${addrs[slow]}, fast = ${addrs[fast]}.`,
      invariantCheck: collided ? `slow (${addrs[slow]}) === fast (${addrs[fast]})` : `Pointers still distinct.`,
      stdout: collided ? `hasCycle => true (Collision at ${addrs[slow]}, val=${nums[slow]})` : undefined,
      stackFrames: [
        {
          id: 'frame-floyd',
          functionName: 'hasCycle(head)',
          line: collided ? 8 : 6,
          returnAddress: '0x7FFF0060',
          isActive: true,
          variables: [
            { name: 'slow', value: addrs[slow], type: 'ListNode*', address: '0x7FFF0600', isPointer: true, pointsToAddress: addrs[slow], changed: true },
            { name: 'fast', value: addrs[fast], type: 'ListNode*', address: '0x7FFF0608', isPointer: true, pointsToAddress: addrs[fast], changed: true }
          ]
        }
      ],
      heapObjects: [makeHeap(slow, fast, collided)],
      pointers: [
        { id: 'p-slow', name: 'slow (1x)', targetObjectId: 'heap-floyd', targetIndex: slow, targetAddress: addrs[slow], role: 'primary', deltaDescription: '+1 hop' },
        { id: 'p-fast', name: 'fast (2x)', targetObjectId: 'heap-floyd', targetIndex: fast, targetAddress: addrs[fast], role: 'fast', deltaDescription: collided ? 'COLLISION!' : '+2 hops' }
      ],
      metrics: { comparisons: step, pointerOps: step * 3, heapBytesUsed: 16, timeStepO: collided ? 'Cycle Found' : `Hop ${step}` }
    });

    if (collided) break;
  }

  return steps;
}

// 7. Longest Substring Without Repeating Characters
function traceLongestSubstring(rawInput: string): ExecutionStep[] {
  const s = (rawInput.trim() || 'abcabcbb').slice(0, 10);
  const chars = s.split('');
  const seenAt = new Map<string, number>();
  let left = 0;
  let maxLen = 0;
  const steps: ExecutionStep[] = [];

  for (let right = 0; right < chars.length; right++) {
    const ch = chars[right];
    let jumped = false;
    if (seenAt.has(ch) && seenAt.get(ch)! >= left) {
      left = seenAt.get(ch)! + 1;
      jumped = true;
    }
    seenAt.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);

    steps.push({
      stepIndex: steps.length,
      title: jumped
        ? `Duplicate '${ch}' at [${right}]! Jump left → [${left}], Window "${s.slice(left, right + 1)}"`
        : `Expand right → [${right}] ('${ch}'), Window "${s.slice(left, right + 1)}" (len=${right - left + 1})`,
      pythonLine: jumped ? 7 : 9,
      javaLine: jumped ? 8 : 11,
      operationType: jumped ? 'MOVE_POINTER' : 'MUTATE_MEMORY',
      intuition: jumped
        ? `'${ch}' was already inside the active window. Jump left directly past its previous occurrence to index ${left}.`
        : `'${ch}' is unique in window [${left}..${right}]. Record seen_at['${ch}'] = ${right} and update max_len = ${maxLen}.`,
      memoryMutation: `seen_at['${ch}'] = ${right}, left = ${left}, max_len = ${maxLen}.`,
      invariantCheck: `Active substring "${s.slice(left, right + 1)}" has all unique characters.`,
      stdout: `Window [${left}..${right}] = "${s.slice(left, right + 1)}" | max_len = ${maxLen}`,
      stackFrames: [
        {
          id: 'frame-sw',
          functionName: 'lengthOfLongestSubstring(s)',
          line: jumped ? 7 : 9,
          returnAddress: '0x7FFF0070',
          isActive: true,
          variables: [
            { name: 'left', value: String(left), type: 'int', address: '0x7FFF0700', isPointer: true, pointsToAddress: hexAddr(0x7000, left * 2), changed: jumped },
            { name: 'right', value: String(right), type: 'int', address: '0x7FFF0704', isPointer: true, pointsToAddress: hexAddr(0x7000, right * 2), changed: true },
            { name: 'max_len', value: String(maxLen), type: 'int', address: '0x7FFF0708', isPointer: false }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-str',
          address: '0x7000',
          type: 'Array',
          label: `char[] s ("${s}") — Sliding Window [${left}..${right}]`,
          byteSize: chars.length * 2,
          refCount: 1,
          gcStatus: 'allocated',
          cells: chars.map((c, idx) => ({
            index: idx,
            label: `[${idx}]`,
            value: `'${c}'`,
            addressOffset: hexAddr(0x7000, idx * 2),
            status: idx === right ? 'target' : idx >= left && idx <= right ? 'active' : 'discarded',
            annotation: idx >= left && idx <= right ? 'In Window' : 'Outside'
          }))
        }
      ],
      pointers: [
        { id: 'p-left', name: 'left', targetObjectId: 'heap-str', targetIndex: left, targetAddress: hexAddr(0x7000, left * 2), role: 'primary', deltaDescription: jumped ? `Jumped → [${left}]` : undefined },
        { id: 'p-right', name: 'right', targetObjectId: 'heap-str', targetIndex: right, targetAddress: hexAddr(0x7000, right * 2), role: 'secondary', deltaDescription: `Scan [${right}]` }
      ],
      metrics: { comparisons: right + 1, pointerOps: right + (jumped ? 2 : 1), heapBytesUsed: seenAt.size * 16, timeStepO: `max_len=${maxLen}` }
    });
  }

  return steps;
}

// 8. Search in Rotated Sorted Array
function traceRotatedBinarySearch(rawInput: string): ExecutionStep[] {
  const targetMatch = rawInput.match(/target\s*=\s*(-?\d+)/i);
  const cleaned = rawInput.replace(/target\s*=\s*-?\d+/i, '');
  const nums = parseNumberList(cleaned, [4, 5, 6, 7, 0, 1, 2]);
  const target = targetMatch ? Number(targetMatch[1]) : 0;

  let low = 0;
  let high = nums.length - 1;
  const steps: ExecutionStep[] = [];
  let iter = 0;

  while (low <= high && iter < 10) {
    iter++;
    const mid = Math.floor((low + high) / 2);
    const found = nums[mid] === target;
    const leftSorted = nums[low] <= nums[mid];

    steps.push({
      stepIndex: steps.length,
      title: found
        ? `Target Found at mid=[${mid}] (nums[${mid}] == ${target})`
        : `Bisect [${low}..${high}] at mid=[${mid}] (val=${nums[mid]}) — ${leftSorted ? 'Left Half Sorted' : 'Right Half Sorted'}`,
      pythonLine: found ? 6 : leftSorted ? 7 : 12,
      javaLine: found ? 6 : leftSorted ? 7 : 13,
      operationType: found ? 'RETURN_RESULT' : 'COMPARE_VALUES',
      intuition: found
        ? `nums[${mid}] equals target ${target}. Return index ${mid} in O(log N) time.`
        : leftSorted
        ? `Since nums[low]=${nums[low]} <= nums[mid]=${nums[mid]}, subarray [${low}..${mid}] is strictly sorted. Check if ${target} lies within [${nums[low]}..${nums[mid]}].`
        : `Pivot lies on the left, so right subarray [${mid}..${high}] (${nums[mid]}..${nums[high]}) is strictly sorted. Check if ${target} lies within (${nums[mid]}..${nums[high]}].`,
      memoryMutation: `low=${low}, mid=${mid}, high=${high}`,
      invariantCheck: `Active search window size = ${high - low + 1}.`,
      stdout: found ? `Found target ${target} at index ${mid}` : undefined,
      stackFrames: [
        {
          id: 'frame-bs',
          functionName: `search(nums, target=${target})`,
          line: found ? 6 : 7,
          returnAddress: '0x7FFF0080',
          isActive: true,
          variables: [
            { name: 'low', value: String(low), type: 'int', address: '0x7FFF0800', isPointer: true, pointsToAddress: hexAddr(0x8000, low * 4) },
            { name: 'mid', value: String(mid), type: 'int', address: '0x7FFF0804', isPointer: true, pointsToAddress: hexAddr(0x8000, mid * 4), changed: true },
            { name: 'high', value: String(high), type: 'int', address: '0x7FFF0808', isPointer: true, pointsToAddress: hexAddr(0x8000, high * 4) },
            { name: 'target', value: String(target), type: 'int', address: '0x7FFF080C', isPointer: false }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-bs',
          address: '0x8000',
          type: 'Array',
          label: `int[] nums (Rotated Sorted Array, target=${target})`,
          byteSize: nums.length * 4,
          refCount: 1,
          gcStatus: 'allocated',
          cells: nums.map((v, idx) => ({
            index: idx,
            label: `[${idx}]`,
            value: v,
            addressOffset: hexAddr(0x8000, idx * 4),
            status: idx === mid ? 'target' : idx >= low && idx <= high ? 'active' : 'discarded',
            annotation: idx < low || idx > high ? 'Pruned' : idx === mid ? 'MID' : 'Active'
          }))
        }
      ],
      pointers: [
        { id: 'p-low', name: 'low', targetObjectId: 'heap-bs', targetIndex: low, targetAddress: hexAddr(0x8000, low * 4), role: 'primary' },
        { id: 'p-mid', name: 'mid', targetObjectId: 'heap-bs', targetIndex: mid, targetAddress: hexAddr(0x8000, mid * 4), role: 'fast', deltaDescription: `nums[${mid}]=${nums[mid]}` },
        { id: 'p-high', name: 'high', targetObjectId: 'heap-bs', targetIndex: high, targetAddress: hexAddr(0x8000, high * 4), role: 'secondary' }
      ],
      metrics: { comparisons: iter, pointerOps: iter * 2, heapBytesUsed: nums.length * 4, timeStepO: `Log Step ${iter}` }
    });

    if (found) break;
    if (leftSorted) {
      if (nums[low] <= target && target < nums[mid]) high = mid - 1;
      else low = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[high]) low = mid + 1;
      else high = mid - 1;
    }
  }

  return steps;
}

// 9. Daily Temperatures (Monotonic Stack)
function traceDailyTemperatures(rawInput: string): ExecutionStep[] {
  const temps = parseNumberList(rawInput, [73, 74, 75, 71, 69, 72, 76, 73]).slice(0, 8);
  const n = temps.length;
  const ans = new Array(n).fill(0);
  const stack: number[] = [];
  const steps: ExecutionStep[] = [];

  for (let curr = 0; curr < n; curr++) {
    const poppedIndices: number[] = [];
    while (stack.length > 0 && temps[curr] > temps[stack[stack.length - 1]]) {
      const prevIdx = stack.pop()!;
      ans[prevIdx] = curr - prevIdx;
      poppedIndices.push(prevIdx);
    }
    stack.push(curr);

    steps.push({
      stepIndex: steps.length,
      title:
        poppedIndices.length > 0
          ? `Day ${curr} (${temps[curr]}°): Pop [${poppedIndices.join(', ')}] & Write Wait Days, Push ${curr}`
          : `Day ${curr} (${temps[curr]}°): Push Index ${curr} onto Monotonic Stack`,
      pythonLine: poppedIndices.length > 0 ? 7 : 8,
      javaLine: poppedIndices.length > 0 ? 9 : 11,
      operationType: poppedIndices.length > 0 ? 'MUTATE_MEMORY' : 'MOVE_POINTER',
      intuition:
        poppedIndices.length > 0
          ? `${temps[curr]}° is warmer than indices [${poppedIndices.join(', ')}] on the stack! Pop each and compute wait distance curr - prev_idx.`
          : `${temps[curr]}° does not exceed stack top; push index ${curr} to wait for a future warmer day.`,
      memoryMutation: `stack = [${stack.join(', ')}], ans = [${ans.join(', ')}].`,
      invariantCheck: `Stack temperatures [${stack.map((i) => temps[i] + '°').join(' >= ')}] remain strictly monotonic decreasing.`,
      stdout: `ans = [${ans.join(', ')}]`,
      stackFrames: [
        {
          id: 'frame-temp',
          functionName: 'dailyTemperatures(temps)',
          line: 7,
          returnAddress: '0x7FFF0090',
          isActive: true,
          variables: [
            { name: 'curr', value: String(curr), type: 'int', address: '0x7FFF0900', isPointer: true, pointsToAddress: hexAddr(0x8800, curr * 4), changed: true },
            { name: 'temp', value: `${temps[curr]}°`, type: 'int', address: '0x7FFF0904', isPointer: false },
            { name: 'stack', value: `[${stack.join(', ')}]`, type: 'list[int]', address: '0x7FFF0908', isPointer: true, pointsToAddress: '0x8900', changed: true }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-temps',
          address: '0x8800',
          type: 'Array',
          label: `int[] temperatures & ans[] wait days`,
          byteSize: n * 8,
          refCount: 1,
          gcStatus: 'mutated',
          cells: temps.map((t, i) => ({
            index: i,
            label: `Day ${i}`,
            value: `${t}°`,
            addressOffset: hexAddr(0x8800, i * 4),
            status: i === curr ? 'active' : poppedIndices.includes(i) ? 'mutated' : stack.includes(i) ? 'target' : ans[i] > 0 ? 'visited' : 'idle',
            annotation: `wait=${ans[i]}d`
          }))
        },
        {
          id: 'heap-monostack',
          address: '0x8900',
          type: 'Stack',
          label: `Monotonic Decreasing Stack (${stack.length} unresolved indices)`,
          byteSize: stack.length * 4,
          refCount: 1,
          gcStatus: 'mutated',
          cells: stack.map((sIdx, pos) => ({
            index: pos,
            label: pos === stack.length - 1 ? 'TOP' : `s[${pos}]`,
            value: `idx ${sIdx} (${temps[sIdx]}°)`,
            addressOffset: hexAddr(0x8900, pos * 4),
            status: pos === stack.length - 1 ? 'target' : 'active'
          }))
        }
      ],
      pointers: [
        { id: 'p-curr', name: 'curr', targetObjectId: 'heap-temps', targetIndex: curr, targetAddress: hexAddr(0x8800, curr * 4), role: 'primary' }
      ],
      metrics: { comparisons: curr + 1 + poppedIndices.length, pointerOps: curr + 1, heapBytesUsed: n * 8, timeStepO: 'Amortized O(1)' }
    });
  }

  return steps;
}

// 10. 3Sum
function traceThreeSum(rawInput: string): ExecutionStep[] {
  const nums = parseNumberList(rawInput, [-4, -1, -1, 0, 1, 2]).sort((a, b) => a - b);
  const n = nums.length;
  const triplets: number[][] = [];
  const steps: ExecutionStep[] = [];

  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1;
    let right = n - 1;
    while (left < right) {
      const total = nums[i] + nums[left] + nums[right];
      const match = total === 0;
      if (match) triplets.push([nums[i], nums[left], nums[right]]);

      steps.push({
        stepIndex: steps.length,
        title: match
          ? `Triplet Found! [${nums[i]}, ${nums[left]}, ${nums[right]}] == 0`
          : `Anchor i=[${i}] (${nums[i]}), left=[${left}] (${nums[left]}), right=[${right}] (${nums[right]}) → sum=${total}`,
        pythonLine: match ? 15 : total < 0 ? 11 : 13,
        javaLine: match ? 13 : total < 0 ? 10 : 11,
        operationType: match ? 'MUTATE_MEMORY' : 'COMPARE_VALUES',
        intuition: match
          ? `Sum is 0! Append [${nums[i]}, ${nums[left]}, ${nums[right]}] and advance both pointers inward.`
          : total < 0
          ? `Sum (${total}) < 0: we need a larger number, so advance left++ from [${left}].`
          : `Sum (${total}) > 0: we need a smaller number, so decrement right-- from [${right}].`,
        memoryMutation: `total = ${total}, res = ${JSON.stringify(triplets)}`,
        invariantCheck: `Array is sorted: [${nums.join(', ')}]`,
        stdout: `Triplets found: ${JSON.stringify(triplets)}`,
        stackFrames: [
          {
            id: 'frame-3sum',
            functionName: 'threeSum(nums)',
            line: match ? 15 : 10,
            returnAddress: '0x7FFF00A0',
            isActive: true,
            variables: [
              { name: 'i (anchor)', value: String(i), type: 'int', address: '0x7FFF0A00', isPointer: true, pointsToAddress: hexAddr(0x9000, i * 4) },
              { name: 'left', value: String(left), type: 'int', address: '0x7FFF0A04', isPointer: true, pointsToAddress: hexAddr(0x9000, left * 4), changed: true },
              { name: 'right', value: String(right), type: 'int', address: '0x7FFF0A08', isPointer: true, pointsToAddress: hexAddr(0x9000, right * 4), changed: true },
              { name: 'total', value: String(total), type: 'int', address: '0x7FFF0A0C', isPointer: false, changed: true }
            ]
          }
        ],
        heapObjects: [
          {
            id: 'heap-3sum',
            address: '0x9000',
            type: 'Array',
            label: `Sorted int[] nums (${n} elements)`,
            byteSize: n * 4,
            refCount: 1,
            gcStatus: 'allocated',
            cells: nums.map((v, idx) => ({
              index: idx,
              label: `[${idx}]`,
              value: v,
              addressOffset: hexAddr(0x9000, idx * 4),
              status: idx === i ? 'target' : idx === left || idx === right ? (match ? 'mutated' : 'active') : 'idle',
              annotation: idx === i ? 'Anchor i' : idx === left ? 'left' : idx === right ? 'right' : ''
            }))
          }
        ],
        pointers: [
          { id: 'p-i', name: 'i', targetObjectId: 'heap-3sum', targetIndex: i, targetAddress: hexAddr(0x9000, i * 4), role: 'anchor' },
          { id: 'p-l', name: 'left', targetObjectId: 'heap-3sum', targetIndex: left, targetAddress: hexAddr(0x9000, left * 4), role: 'primary' },
          { id: 'p-r', name: 'right', targetObjectId: 'heap-3sum', targetIndex: right, targetAddress: hexAddr(0x9000, right * 4), role: 'secondary' }
        ],
        metrics: { comparisons: steps.length + 1, pointerOps: steps.length + 3, heapBytesUsed: n * 4, timeStepO: `sum=${total}` }
      });

      if (total < 0) left++;
      else if (total > 0) right--;
      else {
        left++;
        right--;
        while (left < right && nums[left] === nums[left - 1]) left++;
      }
    }
  }

  return steps;
}

// 11. Coin Change (1D DP Table)
function traceCoinChangeDP(rawInput: string): ExecutionStep[] {
  const amtMatch = rawInput.match(/amount\s*=\s*(\d+)/i);
  const amount = amtMatch ? Math.min(10, Math.max(1, Number(amtMatch[1]))) : 6;
  const cleaned = rawInput.replace(/amount\s*=\s*\d+/i, '');
  const coins = parseNumberList(cleaned, [1, 3, 4]).filter((c) => c > 0);

  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  const steps: ExecutionStep[] = [];

  for (let a = 1; a <= amount; a++) {
    let bestCoin = -1;
    for (const coin of coins) {
      if (a - coin >= 0 && dp[a - coin] + 1 < dp[a]) {
        dp[a] = dp[a - coin] + 1;
        bestCoin = coin;
      }
    }

    steps.push({
      stepIndex: steps.length,
      title: `Sub-Amount a=${a}: Transition from dp[${a - (bestCoin > 0 ? bestCoin : coins[0])}] + 1 → dp[${a}] = ${dp[a] === INF ? 'INF' : dp[a]}`,
      pythonLine: 8,
      javaLine: 10,
      operationType: 'MUTATE_MEMORY',
      intuition:
        bestCoin > 0
          ? `Using coin=${bestCoin}, we look back at dp[${a - bestCoin}] (${dp[a - bestCoin]} coins) + 1 = ${dp[a]} coins for amount ${a}.`
          : `No coin can reach sub-amount ${a}; dp[${a}] remains INF.`,
      memoryMutation: `dp[${a}] updated to ${dp[a] === INF ? 'INF' : dp[a]}.`,
      invariantCheck: `Optimal min coins computed for all amounts [0..${a}].`,
      stdout: `dp[0..${a}] = [${dp.slice(0, a + 1).map((x) => (x === INF ? '∞' : x)).join(', ')}]`,
      stackFrames: [
        {
          id: 'frame-dp',
          functionName: `coinChange(coins=[${coins.join(',')}], amount=${amount})`,
          line: 8,
          returnAddress: '0x7FFF00B0',
          isActive: true,
          variables: [
            { name: 'a', value: String(a), type: 'int', address: '0x7FFF0B00', isPointer: true, pointsToAddress: hexAddr(0x9400, a * 4), changed: true },
            { name: 'coin', value: String(bestCoin > 0 ? bestCoin : coins[0]), type: 'int', address: '0x7FFF0B04', isPointer: false },
            { name: `dp[${a}]`, value: String(dp[a] === INF ? 'INF' : dp[a]), type: 'int', address: hexAddr(0x9400, a * 4), isPointer: false, changed: true }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-dp',
          address: '0x9400',
          type: 'DPTable',
          label: `int[] dp Table (length ${amount + 1}, coins=[${coins.join(', ')}])`,
          byteSize: (amount + 1) * 4,
          refCount: 1,
          gcStatus: 'mutated',
          cells: dp.map((v, idx) => ({
            index: idx,
            label: `dp[${idx}]`,
            value: v === INF ? '∞' : v,
            addressOffset: hexAddr(0x9400, idx * 4),
            status: idx === a ? 'mutated' : bestCoin > 0 && idx === a - bestCoin ? 'target' : idx < a ? 'visited' : 'idle',
            annotation: idx === a ? `= ${v} coins` : bestCoin > 0 && idx === a - bestCoin ? `lookback (-${bestCoin})` : ''
          }))
        }
      ],
      pointers: [
        { id: 'p-a', name: 'a (curr)', targetObjectId: 'heap-dp', targetIndex: a, targetAddress: hexAddr(0x9400, a * 4), role: 'primary' },
        ...(bestCoin > 0
          ? [{ id: 'p-lb', name: `a-${bestCoin}`, targetObjectId: 'heap-dp', targetIndex: a - bestCoin, targetAddress: hexAddr(0x9400, (a - bestCoin) * 4), role: 'secondary' as const, deltaDescription: 'Optimal subproblem' }]
          : [])
      ],
      metrics: { comparisons: a * coins.length, pointerOps: a * 2, heapBytesUsed: (amount + 1) * 4, timeStepO: `dp[${a}]=${dp[a]}` }
    });
  }

  return steps;
}

// 12. Kth Largest Element (Bounded Min-Heap)
function traceKthLargestHeap(rawInput: string): ExecutionStep[] {
  const kMatch = rawInput.match(/k\s*=\s*(\d+)/i);
  const cleaned = rawInput.replace(/k\s*=\s*\d+/i, '');
  const nums = parseNumberList(cleaned, [3, 2, 1, 5, 6, 4]);
  const k = kMatch ? Math.max(1, Math.min(nums.length, Number(kMatch[1]))) : 2;

  const heap: number[] = [];
  const steps: ExecutionStep[] = [];

  nums.forEach((num, idx) => {
    heap.push(num);
    heap.sort((a, b) => a - b);
    let evicted: number | null = null;
    if (heap.length > k) {
      evicted = heap.shift()!;
    }

    steps.push({
      stepIndex: steps.length,
      title:
        evicted !== null
          ? `Stream nums[${idx}]=${num}: Push ${num} & Evict Root Min (${evicted}) → Kth Largest = ${heap[0]}`
          : `Stream nums[${idx}]=${num}: Push ${num} into Min-Heap (size ${heap.length}/${k})`,
      pythonLine: evicted !== null ? 8 : 6,
      javaLine: evicted !== null ? 7 : 5,
      operationType: evicted !== null ? 'MUTATE_MEMORY' : 'ALLOCATE_HEAP',
      intuition:
        evicted !== null
          ? `Heap size exceeded K=${k}. Evict the smallest element at root[0] (${evicted}) so the heap retains the top ${k} largest elements seen so far.`
          : `Insert ${num} and sift up to maintain the Min-Heap invariant heap[0] <= children.`,
      memoryMutation: `min_heap = [${heap.join(', ')}]${evicted !== null ? ` (evicted ${evicted})` : ''}.`,
      invariantCheck: `Root min_heap[0] = ${heap[0]} is the gatekeeper.`,
      stdout: `Top-${k} Min-Heap: [${heap.join(', ')}] | Current Kth Largest = ${heap[0]}`,
      stackFrames: [
        {
          id: 'frame-heap',
          functionName: `findKthLargest(nums, k=${k})`,
          line: evicted !== null ? 8 : 6,
          returnAddress: '0x7FFF00C0',
          isActive: true,
          variables: [
            { name: 'num', value: String(num), type: 'int', address: '0x7FFF0C00', isPointer: false, changed: true },
            { name: 'min_heap[0]', value: String(heap[0]), type: 'int', address: '0x9800', isPointer: true, pointsToAddress: '0x9800', changed: true }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-pq',
          address: '0x9800',
          type: 'BinaryTree',
          label: `Min-Heap PriorityQueue (Capacity K=${k}, Root = ${heap[0]})`,
          byteSize: heap.length * 4,
          refCount: 1,
          gcStatus: 'mutated',
          cells: heap.map((v, i) => ({
            index: i,
            label: i === 0 ? 'ROOT [0]' : `heap[${i}]`,
            value: v,
            addressOffset: hexAddr(0x9800, i * 4),
            leftAddress: 2 * i + 1 < heap.length ? hexAddr(0x9800, (2 * i + 1) * 4) : null,
            rightAddress: 2 * i + 2 < heap.length ? hexAddr(0x9800, (2 * i + 2) * 4) : null,
            status: i === 0 ? 'target' : 'active',
            annotation: i === 0 ? 'Kth Largest' : `Member`
          }))
        }
      ],
      pointers: [
        { id: 'p-root', name: 'heap[0] (min)', targetObjectId: 'heap-pq', targetIndex: 0, targetAddress: '0x9800', role: 'primary', deltaDescription: `Gatekeeper = ${heap[0]}` }
      ],
      metrics: { comparisons: (idx + 1) * 2, pointerOps: idx + 1, heapBytesUsed: k * 4, timeStepO: `O(log ${k})` }
    });
  });

  return steps;
}

// 13. Valid Parentheses
function traceValidParentheses(rawInput: string): ExecutionStep[] {
  const s = (rawInput.trim() || '{[()]}').slice(0, 10);
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];
  const steps: ExecutionStep[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const isClose = ch in pairs;
    let valid = true;
    if (isClose) {
      if (stack.length === 0 || stack[stack.length - 1] !== pairs[ch]) {
        valid = false;
      } else {
        stack.pop();
      }
    } else {
      stack.push(ch);
    }

    steps.push({
      stepIndex: steps.length,
      title: !valid
        ? `Char [${i}] '${ch}': Mismatch on Stack Top! Return False`
        : isClose
        ? `Char [${i}] '${ch}': Matches Top '${pairs[ch]}' — Pop LIFO Stack`
        : `Char [${i}] '${ch}': Push Opening Delimiter onto LIFO Stack`,
      pythonLine: !valid ? 7 : isClose ? 8 : 10,
      javaLine: !valid ? 9 : 6,
      operationType: !valid ? 'RETURN_RESULT' : 'MUTATE_MEMORY',
      intuition: !valid
        ? `Closing bracket '${ch}' requires '${pairs[ch]}' at the top of the stack, violating LIFO nesting.`
        : isClose
        ? `Closing bracket '${ch}' resolves the most recent open delimiter '${pairs[ch]}' at stack[-1].`
        : `Push '${ch}' onto stack to await its matching closing delimiter.`,
      memoryMutation: `stack = [${stack.map((c) => `'${c}'`).join(', ')}]`,
      invariantCheck: `Stack depth = ${stack.length}`,
      stdout: `Stack: [${stack.join(', ')}] | Valid: ${valid}`,
      stackFrames: [
        {
          id: 'frame-paren',
          functionName: `isValid("${s}")`,
          line: isClose ? 8 : 10,
          returnAddress: '0x7FFF00D0',
          isActive: true,
          variables: [
            { name: 'ch', value: `'${ch}'`, type: 'char', address: '0x7FFF0D00', isPointer: false, changed: true },
            { name: 'stack_depth', value: String(stack.length), type: 'int', address: '0x7FFF0D04', isPointer: false, changed: true }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-pstack',
          address: '0x9A00',
          type: 'Stack',
          label: `LIFO Delimiter Stack (${stack.length} open brackets)`,
          byteSize: Math.max(1, stack.length) * 4,
          refCount: 1,
          gcStatus: 'mutated',
          cells:
            stack.length > 0
              ? stack.map((c, idx) => ({
                  index: idx,
                  label: idx === stack.length - 1 ? 'TOP' : `[${idx}]`,
                  value: `'${c}'`,
                  addressOffset: hexAddr(0x9A00, idx * 4),
                  status: idx === stack.length - 1 ? 'target' : 'active'
                }))
              : [{ index: 0, label: 'EMPTY', value: '∅', addressOffset: '0x9A00', status: 'visited', annotation: 'Balanced' }]
        }
      ],
      pointers: [
        { id: 'p-top', name: 'top', targetObjectId: 'heap-pstack', targetIndex: Math.max(0, stack.length - 1), targetAddress: hexAddr(0x9A00, Math.max(0, stack.length - 1) * 4), role: 'primary' }
      ],
      metrics: { comparisons: i + 1, pointerOps: i + 1, heapBytesUsed: stack.length * 4, timeStepO: `Depth ${stack.length}` }
    });

    if (!valid) break;
  }

  return steps;
}

// 14. Two Sum (Hash Table)
function traceTwoSumHash(rawInput: string): ExecutionStep[] {
  const targetMatch = rawInput.match(/target\s*=\s*(-?\d+)/i);
  const cleaned = rawInput.replace(/target\s*=\s*-?\d+/i, '');
  const nums = parseNumberList(cleaned, [2, 7, 11, 15]);
  const target = targetMatch ? Number(targetMatch[1]) : 9;

  const seen = new Map<number, number>();
  const steps: ExecutionStep[] = [];

  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    const hit = seen.has(comp);
    if (!hit) seen.set(nums[i], i);

    steps.push({
      stepIndex: steps.length,
      title: hit
        ? `Complement ${comp} Found in HashMap at Index ${seen.get(comp)}! Return [${seen.get(comp)}, ${i}]`
        : `Scan i=[${i}] (val=${nums[i]}): Need comp=${comp} (Miss) → Insert seen[${nums[i]}]=${i}`,
      pythonLine: hit ? 6 : 7,
      javaLine: hit ? 7 : 9,
      operationType: hit ? 'RETURN_RESULT' : 'MUTATE_MEMORY',
      intuition: hit
        ? `target (${target}) - nums[${i}] (${nums[i]}) = ${comp}, which is cached in seen{} at index ${seen.get(comp)}!`
        : `Complement ${comp} is not in seen{} yet. Cache value ${nums[i]} → index ${i} in O(1) time.`,
      memoryMutation: hit ? `Return [${seen.get(comp)}, ${i}]` : `seen[${nums[i]}] = ${i}`,
      invariantCheck: `HashMap holds ${seen.size} value→index entries.`,
      stdout: hit ? `Result Indices: [${seen.get(comp)}, ${i}]` : undefined,
      stackFrames: [
        {
          id: 'frame-2sum',
          functionName: `twoSum(nums, target=${target})`,
          line: hit ? 6 : 7,
          returnAddress: '0x7FFF00E0',
          isActive: true,
          variables: [
            { name: 'i', value: String(i), type: 'int', address: '0x7FFF0E00', isPointer: true, pointsToAddress: hexAddr(0x9C00, i * 4), changed: true },
            { name: 'num', value: String(nums[i]), type: 'int', address: '0x7FFF0E04', isPointer: false },
            { name: 'comp', value: String(comp), type: 'int', address: '0x7FFF0E08', isPointer: false, changed: true }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-2sum-arr',
          address: '0x9C00',
          type: 'Array',
          label: `int[] nums (target=${target})`,
          byteSize: nums.length * 4,
          refCount: 1,
          gcStatus: 'allocated',
          cells: nums.map((v, idx) => ({
            index: idx,
            label: `[${idx}]`,
            value: v,
            addressOffset: hexAddr(0x9C00, idx * 4),
            status: idx === i ? 'active' : hit && idx === seen.get(comp) ? 'target' : idx < i ? 'visited' : 'idle',
            annotation: hit && idx === seen.get(comp) ? 'Partner!' : ''
          }))
        },
        {
          id: 'heap-2sum-map',
          address: '0x9D00',
          type: 'HashMap',
          label: `HashMap seen (value → index)`,
          byteSize: seen.size * 16,
          refCount: 1,
          gcStatus: 'mutated',
          cells: Array.from(seen.entries()).map(([k, v]) => ({
            index: k,
            label: `key=${k}`,
            value: `idx ${v}`,
            addressOffset: hexAddr(0x9D00, v * 16),
            status: hit && k === comp ? 'target' : 'visited'
          }))
        }
      ],
      pointers: [
        { id: 'p-i', name: 'i', targetObjectId: 'heap-2sum-arr', targetIndex: i, targetAddress: hexAddr(0x9C00, i * 4), role: 'primary' }
      ],
      metrics: { comparisons: i + 1, pointerOps: i + 1, heapBytesUsed: nums.length * 4 + seen.size * 16, timeStepO: 'O(1) Lookup' }
    });

    if (hit) break;
  }

  return steps;
}

// 15. Container With Most Water
function traceContainerMostWater(rawInput: string): ExecutionStep[] {
  const heights = parseNumberList(rawInput, [1, 8, 6, 2, 5, 4, 8, 3, 7]).map((x) => Math.max(0, x));
  let left = 0;
  let right = heights.length - 1;
  let best = 0;
  const steps: ExecutionStep[] = [];

  while (left < right) {
    const w = right - left;
    const h = Math.min(heights[left], heights[right]);
    const area = w * h;
    best = Math.max(best, area);
    const moveLeft = heights[left] < heights[right];

    steps.push({
      stepIndex: steps.length,
      title: `Span [${left}..${right}]: Area = ${w} * min(${heights[left]}, ${heights[right]}) = ${area} (Max=${best})`,
      pythonLine: moveLeft ? 9 : 11,
      javaLine: moveLeft ? 10 : 12,
      operationType: 'MOVE_POINTER',
      intuition: `Current container width=${w}, limiting height=${h} → area=${area}. Since height[${moveLeft ? left : right}] is shorter, advance ${moveLeft ? 'left++' : 'right--'} in search of a taller boundary.`,
      memoryMutation: `best = ${best}; ${moveLeft ? `left → ${left + 1}` : `right → ${right - 1}`}.`,
      invariantCheck: `Max area seen so far = ${best}.`,
      stdout: `Area([${left}, ${right}]) = ${area} | Best = ${best}`,
      stackFrames: [
        {
          id: 'frame-area',
          functionName: 'maxArea(height)',
          line: 7,
          returnAddress: '0x7FFF00F0',
          isActive: true,
          variables: [
            { name: 'left', value: String(left), type: 'int', address: '0x7FFF0F00', isPointer: true, pointsToAddress: hexAddr(0x9E00, left * 4), changed: true },
            { name: 'right', value: String(right), type: 'int', address: '0x7FFF0F04', isPointer: true, pointsToAddress: hexAddr(0x9E00, right * 4), changed: true },
            { name: 'best', value: String(best), type: 'int', address: '0x7FFF0F08', isPointer: false, changed: area === best }
          ]
        }
      ],
      heapObjects: [
        {
          id: 'heap-area',
          address: '0x9E00',
          type: 'Array',
          label: `int[] height (Container Walls, Best Area = ${best})`,
          byteSize: heights.length * 4,
          refCount: 1,
          gcStatus: 'allocated',
          cells: heights.map((v, idx) => ({
            index: idx,
            label: `[${idx}]`,
            value: v,
            addressOffset: hexAddr(0x9E00, idx * 4),
            status: idx === left || idx === right ? 'active' : idx > left && idx < right ? 'visited' : 'discarded',
            annotation: idx === left ? 'Left Wall' : idx === right ? 'Right Wall' : ''
          }))
        }
      ],
      pointers: [
        { id: 'p-l', name: 'left', targetObjectId: 'heap-area', targetIndex: left, targetAddress: hexAddr(0x9E00, left * 4), role: 'primary' },
        { id: 'p-r', name: 'right', targetObjectId: 'heap-area', targetIndex: right, targetAddress: hexAddr(0x9E00, right * 4), role: 'secondary' }
      ],
      metrics: { comparisons: steps.length + 1, pointerOps: steps.length + 2, heapBytesUsed: heights.length * 4, timeStepO: `Best=${best}` }
    });

    if (moveLeft) left++;
    else right--;
  }

  return steps;
}
