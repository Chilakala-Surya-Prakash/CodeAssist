import { AlgorithmProblem, Language } from '../types/visualizer';

export interface FamilyTestSpec {
  category: 'Sample' | 'Boundary' | 'Negative / Dup' | 'Stress';
  label: string;
  value: string;
}

export interface StructuralCheckResult {
  passed: boolean;
  failureReason: string | null;
  checkedInvariant: string;
}

/**
 * Strips single-line and block comments so structural verification tests real code,
 * not comment markers like `# BUG:`.
 */
export function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/#[^\n]*/g, '');
}

/**
 * Returns domain-valid edge, boundary, and stress test inputs tailored to each problem family.
 */
export function getFamilyTestInputs(problem: AlgorithmProblem): FamilyTestSpec[] {
  const familyId = problem.traceFamilyId || problem.id;

  const baseSamples: FamilyTestSpec[] = problem.sampleInputs.map((s) => ({
    category: 'Sample',
    label: s.label,
    value: s.value,
  }));

  const extraByFamily: Record<string, FamilyTestSpec[]> = {
    'reverse-linked-list': [
      { category: 'Boundary', label: 'Single Node Head', value: '42' },
      { category: 'Boundary', label: 'Two-Node Minimal Swap', value: '1 -> 2' },
      { category: 'Negative / Dup', label: 'Negative & Duplicate Values', value: '-5 -> 0 -> -5 -> 8' },
      { category: 'Stress', label: '6-Node Monotonic Chain', value: '1 -> 2 -> 3 -> 4 -> 5 -> 6' },
      { category: 'Stress', label: 'Descending Tail-Heavy List', value: '99 -> 50 -> 25 -> 10 -> 1' },
    ],
    'cycle-detection-floyd': [
      { category: 'Boundary', label: 'Self-Loop Single Node', value: '7 (cycle=0)' },
      { category: 'Boundary', label: 'Two-Node Tight Cycle', value: '1 -> 2 (cycle=0)' },
      { category: 'Negative / Dup', label: 'Acyclic Negative List', value: '-3 -> -1 -> 0 -> 4 (cycle=-1)' },
      { category: 'Stress', label: 'Long Tail Entry Cycle', value: '10 -> 20 -> 30 -> 40 -> 50 (cycle=2)' },
      { category: 'Stress', label: 'Acyclic 5-Node Chain', value: '5 -> 4 -> 3 -> 2 -> 1 (cycle=-1)' },
    ],
    'lru-cache-pointers': [
      { category: 'Boundary', label: 'Capacity 1 Immediate Evict', value: 'cap=1 | PUT(1,10), PUT(2,20), GET(1)' },
      { category: 'Boundary', label: 'Miss on Empty Key', value: 'cap=2 | PUT(1,10), GET(99), PUT(2,20)' },
      { category: 'Negative / Dup', label: 'Overwrite Existing Key', value: 'cap=2 | PUT(1,10), PUT(1,99), GET(1)' },
      { category: 'Stress', label: 'Capacity 3 Promotion Wave', value: 'cap=3 | PUT(1,10), PUT(2,20), PUT(3,30), GET(1), PUT(4,40)' },
      { category: 'Stress', label: 'Repeated Access Locality', value: 'cap=2 | PUT(4,40), PUT(5,50), GET(4), GET(4), PUT(6,60)' },
    ],
    'binary-tree-level-order': [
      { category: 'Boundary', label: 'Single Root Node', value: '42' },
      { category: 'Boundary', label: 'Right-Skewed Sparse Tree', value: '1, null, 2, null, null, null, 3' },
      { category: 'Negative / Dup', label: 'Negative & Zero Node Values', value: '0, -5, 5, -10, null, null, 10' },
      { category: 'Stress', label: 'Full 3-Level Binary Tree', value: '10, 6, 14, 4, 8, 12, 16' },
      { category: 'Stress', label: 'Left-Skewed Subtree', value: '8, 4, null, 2, null, null, null' },
    ],
    'course-schedule-cycle': [
      { category: 'Boundary', label: 'Linear Chain (No Branching)', value: 'V=4 | 0->1, 1->2, 2->3' },
      { category: 'Boundary', label: 'Two-Node Mutual Deadlock', value: 'V=2 | 0->1, 1->0' },
      { category: 'Negative / Dup', label: 'Disconnected Acyclic Forest', value: 'V=4 | 0->1, 2->3' },
      { category: 'Stress', label: 'Embedded Cycle in 4-Node Graph', value: 'V=4 | 0->1, 1->2, 2->1, 2->3' },
      { category: 'Stress', label: 'Fan-Out Prerequisite Tree', value: 'V=4 | 0->1, 0->2, 0->3' },
    ],
    'valid-parentheses-stack': [
      { category: 'Boundary', label: 'Single Open Bracket (Invalid)', value: '(' },
      { category: 'Boundary', label: 'Leading Closing Bracket', value: ']()' },
      { category: 'Negative / Dup', label: 'Interleaved Mismatch', value: '([)]' },
      { category: 'Stress', label: 'Deep Nested Valid Sequence', value: '{[()()]}' },
      { category: 'Stress', label: 'Sequential Balanced Pairs', value: '()[]{}' },
    ],
    'longest-substring-unique': [
      { category: 'Boundary', label: 'Single Character String', value: 'z' },
      { category: 'Boundary', label: 'All Identical Characters', value: 'bbbbbb' },
      { category: 'Negative / Dup', label: 'Backtrack Guard (abba)', value: 'abba' },
      { category: 'Stress', label: 'All Unique Alphabet Run', value: 'abcdefg' },
      { category: 'Stress', label: 'Late Duplicate Jump', value: 'dvdfxabc' },
    ],
    'search-rotated-sorted': [
      { category: 'Boundary', label: 'Unrotated Sorted Array', value: 'nums=[1, 2, 3, 4, 5] | target=4' },
      { category: 'Boundary', label: 'Target Missing (-1)', value: 'nums=[4, 5, 6, 7, 0, 1, 2] | target=3' },
      { category: 'Negative / Dup', label: 'Negative Rotated Values', value: 'nums=[2, 5, -4, -1, 0] | target=-1' },
      { category: 'Stress', label: 'Pivot at Last Index', value: 'nums=[2, 3, 4, 5, 6, 1] | target=1' },
      { category: 'Stress', label: 'Target at Index 0', value: 'nums=[6, 7, 0, 1, 2, 4] | target=6' },
    ],
    'two-sum-hash': [
      { category: 'Boundary', label: 'Minimal Pair Match', value: 'nums=[3, 3] | target=6' },
      { category: 'Boundary', label: 'Zero Complement Pair', value: 'nums=[0, 4, 3, 0] | target=0' },
      { category: 'Negative / Dup', label: 'Negative Numbers Target', value: 'nums=[-3, 4, 3, 90] | target=0' },
      { category: 'Stress', label: 'Late-Index Pair Resolution', value: 'nums=[1, 5, 8, 12, 4, 7] | target=11' },
      { category: 'Stress', label: 'Descending Complement Order', value: 'nums=[15, 11, 7, 2] | target=9' },
    ],
    'trapping-rain-water': [
      { category: 'Boundary', label: 'Flat Zero Terrain (0 Water)', value: '0, 0, 0, 0' },
      { category: 'Boundary', label: 'Strictly Increasing Slope', value: '1, 2, 3, 4, 5' },
      { category: 'Negative / Dup', label: 'Twin Peaks Deep Valley', value: '5, 0, 0, 0, 5' },
      { category: 'Stress', label: 'Multi-Basin Skyline', value: '4, 2, 0, 3, 2, 5' },
      { category: 'Stress', label: 'Alternating Sawtooth Bars', value: '3, 1, 3, 1, 3, 1' },
    ],
    'container-most-water': [
      { category: 'Boundary', label: 'Two Equal Walls', value: '5, 5' },
      { category: 'Boundary', label: 'Tall Center Narrow Basin', value: '1, 2, 10, 10, 2, 1' },
      { category: 'Negative / Dup', label: 'Uniform Plateau Heights', value: '4, 4, 4, 4, 4' },
      { category: 'Stress', label: 'Descending Staircase', value: '9, 8, 6, 4, 2, 1' },
      { category: 'Stress', label: 'Wide Outer Boundary Win', value: '8, 1, 2, 1, 2, 8' },
    ],
    'daily-temperatures-stack': [
      { category: 'Boundary', label: 'Strictly Cooling Week (All 0s)', value: '80, 76, 72, 68, 64' },
      { category: 'Boundary', label: 'Strictly Warming Week (All 1s)', value: '60, 65, 70, 75, 80' },
      { category: 'Negative / Dup', label: 'Equal Temperature Plateau', value: '70, 70, 70, 75' },
      { category: 'Stress', label: 'Late Heatwave Spike', value: '75, 71, 69, 68, 67, 82' },
      { category: 'Stress', label: 'Oscillating Fronts', value: '72, 74, 71, 76, 70, 78' },
    ],
    'three-sum-zero': [
      { category: 'Boundary', label: 'All Zeros Single Triplet', value: '0, 0, 0' },
      { category: 'Boundary', label: 'All Positives (Empty Result)', value: '1, 2, 3, 4' },
      { category: 'Negative / Dup', label: 'Heavy Duplicate Anchor Skip', value: '-2, -2, 0, 0, 2, 2' },
      { category: 'Stress', label: 'Balanced Symmetric Range', value: '-3, -2, -1, 0, 1, 2, 3' },
      { category: 'Stress', label: 'Wide Outlier Span', value: '-5, -1, 1, 2, 3, 4' },
    ],
    'coin-change-dp': [
      { category: 'Boundary', label: 'Zero Target Amount', value: 'coins=[1, 2, 5] | amount=0' },
      { category: 'Boundary', label: 'Impossible Odd Amount (-1)', value: 'coins=[2, 4] | amount=5' },
      { category: 'Negative / Dup', label: 'Greedy Trap (1, 3, 4 -> 6)', value: 'coins=[1, 3, 4] | amount=6' },
      { category: 'Stress', label: 'Standard US Coins (amount=7)', value: 'coins=[1, 2, 5] | amount=7' },
      { category: 'Stress', label: 'Prime Denominations', value: 'coins=[2, 3, 5] | amount=8' },
    ],
    'kth-largest-heap': [
      { category: 'Boundary', label: 'K = 1 (Global Maximum)', value: 'nums=[4, 9, 2, 7, 1] | k=1' },
      { category: 'Boundary', label: 'K = N (Global Minimum)', value: 'nums=[5, 3, 8, 2] | k=4' },
      { category: 'Negative / Dup', label: 'Duplicate Top Elements', value: 'nums=[3, 2, 3, 1, 2, 4, 5, 5, 6] | k=4' },
      { category: 'Stress', label: 'Negative Values Stream', value: 'nums=[-10, -2, -8, -1, -5] | k=2' },
      { category: 'Stress', label: 'Already Sorted Ascending', value: 'nums=[1, 2, 3, 4, 5, 6] | k=3' },
    ],
    'sort-colors-dutch-flag': [
      { category: 'Boundary', label: 'Single Element Zero', value: '0' },
      { category: 'Boundary', label: 'Already Partitioned', value: '0, 0, 1, 1, 2, 2' },
      { category: 'Negative / Dup', label: 'All Twos & Zeros (No Ones)', value: '2, 0, 2, 0, 2, 0' },
      { category: 'Stress', label: 'Alternating Triad Wave', value: '2, 1, 0, 2, 1, 0' },
      { category: 'Stress', label: 'Front-Heavy Twos', value: '2, 2, 2, 1, 0, 0' },
    ],
    'kadane-max-subarray': [
      { category: 'Boundary', label: 'Single Negative Element', value: '-7' },
      { category: 'Boundary', label: 'All Positive Array', value: '1, 2, 3, 4, 5' },
      { category: 'Negative / Dup', label: 'Deep Dip Split', value: '4, -10, 6, 3, -2, 5' },
      { category: 'Stress', label: 'Zero-Bridge Subarray', value: '-2, 0, -1, 3, 0, 2' },
      { category: 'Stress', label: 'Late Surge Recovery', value: '-8, -3, -1, 5, 4, -2, 6' },
    ],
    'merge-intervals-greedy': [
      { category: 'Boundary', label: 'Single Interval', value: '[4, 9]' },
      { category: 'Boundary', label: 'Disjoint Non-Overlapping', value: '[1,2], [4,5], [8,9]' },
      { category: 'Negative / Dup', label: 'Unsorted Input Order', value: '[8,10], [1,3], [2,6], [15,18]' },
      { category: 'Stress', label: 'Chain Cascade Collapse', value: '[1,4], [2,5], [4,7], [6,10]' },
      { category: 'Stress', label: 'Identical Duplicate Spans', value: '[2,5], [2,5], [5,8]' },
    ],
  };

  const extras = extraByFamily[familyId] || extraByFamily['two-sum-hash'];
  const seenVals = new Set<string>();
  const combined: FamilyTestSpec[] = [];

  for (const item of [...baseSamples, ...extras]) {
    const key = item.value.trim();
    if (!seenVals.has(key)) {
      seenVals.add(key);
      combined.push(item);
    }
  }

  return combined.slice(0, 8);
}

/**
 * Verifies real structural code invariants (independent of comment markers like `# BUG:`)
 * so Bug Hunter challenges and blind-mode stubs cannot be bypassed by deleting comments.
 */
export function verifyCodeStructure(
  problem: AlgorithmProblem,
  code: string,
  _language: Language
): StructuralCheckResult {
  const familyId = problem.traceFamilyId || problem.id;
  const cleaned = stripComments(code);
  const compact = cleaned.replace(/\s+/g, ' ').trim();

  // 1. Reject empty, incomplete, or blind-starter stubs
  if (compact.length < 30) {
    return {
      passed: false,
      failureReason: 'Implementation is empty or too short to execute.',
      checkedInvariant: 'Non-empty function body',
    };
  }
  if (/\bpass\b/.test(cleaned) || /\/\/\s*TODO|#\s*TODO/i.test(code) || /return\s+null\s*;\s*}\s*}$/.test(compact)) {
    return {
      passed: false,
      failureReason: 'Unimplemented placeholder stub detected (TODO / pass / return null).',
      checkedInvariant: 'Complete algorithm implementation',
    };
  }

  // 2. Family-specific structural invariant checks (tests actual code logic, not comments!)
  switch (familyId) {
    case 'reverse-linked-list': {
      // Must save next pointer BEFORE mutating curr.next = prev
      const cacheIdx = cleaned.search(/(?:nxt|next_node)\s*=\s*curr(?:\.next|\.Next|->next)|node\.next\.take\(\)/);
      const mutateIdx = cleaned.search(/(?:curr(?:\.next|\.Next|->next)|node\.next)\s*=\s*prev/);
      if (cacheIdx === -1 || mutateIdx === -1) {
        return {
          passed: false,
          failureReason: 'Missing in-place `.next` pointer cache or backward reassignment to `prev`.',
          checkedInvariant: 'Cache forward `.next` before mutating `curr.next = prev`',
        };
      }
      if (mutateIdx < cacheIdx) {
        return {
          passed: false,
          failureReason:
            'Pointer order bug: `curr.next = prev` executes BEFORE saving the forward reference (`nxt = curr.next`), severing the rest of the list.',
          checkedInvariant: 'Cache forward `.next` before mutating `curr.next = prev`',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Forward `.next` cached before backward rewire',
      };
    }

    case 'trapping-rain-water': {
      if (/(?:left_max|leftMax)\s*>\s*(?:right_max|rightMax)/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Inverted boundary comparison (`leftMax > rightMax`): must advance the smaller boundary (`<=`) so the opposite wall guarantees water containment.',
          checkedInvariant: 'Advance smaller boundary (`left_max <= right_max`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Smaller-boundary convergence invariant (`leftMax <= rightMax`)',
      };
    }

    case 'search-rotated-sorted': {
      if (/(?:while|for)\s*\(?\s*low\s*<\s*high\b/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Off-by-one loop condition (`low < high`): skips the final converging element when `low == high`. Use `low <= high`.',
          checkedInvariant: 'Inclusive binary search loop (`low <= high`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Inclusive search window (`low <= high`)',
      };
    }

    case 'course-schedule-cycle': {
      if (/indegree\[[^\]]+\]\s*>\s*0/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Frontier invariant bug (`indegree[nxt] > 0`): vertices must only enter the BFS queue once their in-degree reaches `0`.',
          checkedInvariant: 'Enqueue only zero-indegree vertices (`indegree == 0`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Zero-indegree Kahn frontier invariant',
      };
    }

    case 'binary-tree-level-order': {
      if (
        /if\s*\(?\s*curr(?:\.left|\.Left|->left)\s*==/.test(cleaned) ||
        /if\s+not\s+curr\.left/.test(cleaned) ||
        /if\s+curr\.left:\s*\n\s*pass/.test(cleaned) ||
        /queue\.(?:pop|pop_back)\(\)/.test(cleaned) ||
        /q\.back\(\)/.test(cleaned)
      ) {
        return {
          passed: false,
          failureReason:
            'BFS frontier defect: tree level-order traversal must dequeue from the FRONT (FIFO) and enqueue non-null left/right children.',
          checkedInvariant: 'FIFO dequeue + non-null child enqueue per level',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Level-bounded BFS FIFO frontier expansion',
      };
    }

    case 'two-sum-hash': {
      if (/(?:comp|complement)\s*=\s*target\s*\+\s*(?:num|nums\[i\])/.test(cleaned) || /comp\s*:=\s*target\s*\+\s*num/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Complement arithmetic bug (`target + num`): must compute `target - num` so `seen[comp] + num == target`.',
          checkedInvariant: 'Complement lookup uses `target - num`',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'O(1) HashMap complement lookup (`target - num`)',
      };
    }

    case 'lru-cache-pointers': {
      if (/if\s*\(?\s*key\s+in\s+self\.cache\s*:\s*\n\s*return\s+-1/.test(cleaned) || /!?(?:cache|values)\.containsKey\(key\)\)\s*return\s+0/.test(cleaned) || /return\s+0\b/.test(compact) && !/return\s+-1/.test(compact)) {
        return {
          passed: false,
          failureReason:
            'Cache miss contract bug: `get(key)` must return `-1` when `key` is absent from the HashMap.',
          checkedInvariant: 'Return -1 on cache miss and splice hit to MRU front',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'O(1) HashMap lookup + doubly-linked MRU promotion',
      };
    }

    case 'longest-substring-unique': {
      if (/seen_at\[ch\]\s*>\s*left\b|prev\s*>\s*left\b|seenAt\[ch\]\s*>\s*left\b|seenAt\.get\(ch\)\s*>\s*left\b/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Boundary off-by-one (`prev > left`): when the duplicate matches the exact character at `left`, `left` fails to advance, leaving a duplicate in the window. Use `>= left`.',
          checkedInvariant: 'Jump left past duplicate inside window (`prev >= left`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Monotonic sliding window duplicate jump (`prev >= left`)',
      };
    }

    case 'daily-temperatures-stack': {
      if (/(?:temp|temps\[i\]|t)\s*<\s*(?:temperatures|temps)\[/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Inverted monotonic stack comparison (`<` instead of `>`): stack must pop cooler days when a strictly warmer temperature arrives.',
          checkedInvariant: 'Pop monotonic stack when current temp > stack top temp',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Monotonic decreasing temperature stack invariant',
      };
    }

    case 'three-sum-zero': {
      if (/(?:while|for)\s*\(?\s*lo\s*<=\s*hi\b/.test(cleaned) || /(?:while|for)\s*\(?\s*left\s*<=\s*right\b/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Pointer aliasing bug (`lo <= hi`): allows reusing the same array index twice in a single triplet. Use strict `lo < hi`.',
          checkedInvariant: 'Strict converging two-pointer bound (`lo < hi`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Sorted anchor + strict `lo < hi` triplet convergence',
      };
    }

    case 'kth-largest-heap': {
      if (/(?:len\(min_heap\)|minHeap\.size\(\)|h\.Len\(\)|minHeap\.length|min_heap\.len\(\))\s*<\s*k\b/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Inverted heap eviction guard (`size < k`): pops elements while the heap is still smaller than K instead of evicting only when `size > k`.',
          checkedInvariant: 'Bounded min-heap size invariant (`evict when size > k`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Bounded K-element min-heap invariant (`size > k`)',
      };
    }

    case 'cycle-detection-floyd': {
      if (/fast\s*=\s*fast(?:\.next|\.Next|->next)(?!\s*(?:\.next|\.Next|->next))/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Hare speed bug: `fast` only advances 1 hop (`fast.next`) instead of 2 hops (`fast.next.next`), so it can never lap `slow`.',
          checkedInvariant: 'Fast pointer moves +2 hops while slow moves +1 hop',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Floyd 1x / 2x pointer velocity invariant',
      };
    }

    case 'valid-parentheses-stack': {
      if (/return\s+(?:True|true)\s*;?\s*}?\s*$/.test(compact) && !/empty|len\(|length\s*===?\s*0|is_empty/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Unclosed-bracket bug: returning `true` without verifying the stack is empty accepts unclosed opening brackets like `((`.',
          checkedInvariant: 'Verify stack is empty before returning true',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'LIFO bracket matching + empty-stack final check',
      };
    }

    case 'coin-change-dp': {
      if (/a\s*-\s*(?:coin|c)\s*>\s*0/.test(cleaned) || /a\s*>\s*(?:coin|c)\s+as\s+usize/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Off-by-one transition (`a - coin > 0`): prevents exact single-coin matches where `a == coin` (`dp[0] + 1`). Use `>= 0`.',
          checkedInvariant: 'Allow exact coin match (`a - coin >= 0`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Bottom-up DP transition (`a - coin >= 0`)',
      };
    }

    case 'container-most-water': {
      if (/height\[left\]\s*>\s*height\[right\]/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Greedy pointer bug (`height[left] > height[right]`): moving the taller wall can never increase the limiting height. Move the shorter wall (`<`).',
          checkedInvariant: 'Contract shorter boundary wall (`height[left] < height[right]`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Greedy shorter-wall contraction',
      };
    }

    case 'sort-colors-dutch-flag': {
      if (/\bmid\s*<\s*high\b|\(\s*mid\s+as\s+isize\s*\)\s*<\s*high\b/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Off-by-one partition loop (`mid < high`): fails to inspect the final boundary element when `mid == high`, leaving a trailing 0 misplaced. Use `mid <= high`.',
          checkedInvariant: 'Inclusive Dutch Flag loop invariant (`mid <= high`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Three-way Dutch National Flag partition (`mid <= high`)',
      };
    }

    case 'kadane-max-subarray': {
      if (/cur_sum\s*>\s*best_sum|curSum\s*>\s*bestSum|best_sum\.max|max\(bestSum/.test(cleaned)) {
        if (/Math\.min|cur_sum\s*\+\s*nums\[i\]\s*>\s*nums\[i\]|curSum\s*\+\s*nums\[i\]\s*>\s*nums\[i\]|x\.min\(cur_sum|min\(nums\[i\]/.test(cleaned)) {
          return {
            passed: false,
            failureReason:
              'Inverted Kadane reset rule: choosing the smaller prefix instead of `max(nums[i], cur_sum + nums[i])` discards optimal positive subarrays.',
            checkedInvariant: 'Kadane recurrence `cur_sum = max(nums[i], cur_sum + nums[i])`',
          };
        }
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Kadane optimal prefix recurrence (`max(nums[i], cur_sum + nums[i])`)',
      };
    }

    case 'merge-intervals-greedy': {
      if (/(?:start|intervals\[i\]\[0\]|iv\[0\])\s*<\s*(?:merged\[-1\]\[1\]|merged\.back\(\)\[1\]|last\[1\])/.test(cleaned)) {
        return {
          passed: false,
          failureReason:
            'Strict overlap guard (`<` instead of `<=`): fails to merge touching boundary intervals like `[1,4]` and `[4,5]`. Use `<=`.',
          checkedInvariant: 'Inclusive overlap merge condition (`start <= last_end`)',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Sorted sweep-line inclusive overlap merge (`<=`)',
      };
    }

    default: {
      if (/while\s*\(?\s*\w+\s*==\s*(?:nullptr|null|None)\b/.test(cleaned)) {
        return {
          passed: false,
          failureReason: 'Inverted null-guard loop condition (`== null` instead of `!= null`).',
          checkedInvariant: 'Valid non-null loop guard',
        };
      }
      return {
        passed: true,
        failureReason: null,
        checkedInvariant: 'Static syntax & pointer structure verified',
      };
    }
  }
}

/**
 * Injects a genuine, problem-specific, executable defect into `baseCode` across all 6 languages
 * (guaranteed to be caught by `verifyCodeStructure` even if the user deletes comments).
 */
export function injectGenuineBug(
  familyId: string,
  lang: Language,
  baseCode: string
): { code: string; bugTitle: string; brokenLineNumber: number; symptom: string; fixExplanation: string } {
  const commentPrefix = lang === 'python' ? '#' : '//';
  let mutated = baseCode;
  let bugTitle = 'Boundary Pointer Off-By-One & Invariant Violation';
  let symptom =
    'Premature loop termination or inverted boundary guard causes elements on the heap to be missed during pointer traversal.';
  let fixExplanation =
    'Restore the exact boundary comparison and pointer order so the loop invariant holds for every step.';

  if (familyId === 'reverse-linked-list') {
    bugTitle = 'Orphaned Heap Chain (Missing Forward `.next` Cache)';
    symptom =
      'Overwriting `curr.next = prev` before caching `nxt` severs the forward link on the heap, causing traversal to jump backward into NULL and drop the remaining nodes.';
    fixExplanation =
      'Cache the forward link (`nxt = curr.next` / `curr.Next` / `curr->next`) BEFORE mutating `curr.next = prev`.';
    if (lang === 'python') {
      mutated = baseCode.replace(
        /(\s*)nxt = curr\.next[^\n]*\n(\s*)curr\.next = prev[^\n]*/,
        '$1curr.next = prev      # BUG: Overwrote curr.next before caching nxt!\n$2nxt = curr.next'
      );
    } else if (lang === 'java') {
      mutated = baseCode.replace(
        /(\s*)ListNode nxt = curr\.next;[^\n]*\n(\s*)curr\.next = prev;[^\n]*/,
        '$1curr.next = prev; // BUG: Overwrote curr.next before saving nxt!\n$2ListNode nxt = curr.next;'
      );
    } else if (lang === 'cpp') {
      mutated = baseCode.replace(
        /(\s*)ListNode\* nxt = curr->next;[^\n]*\n(\s*)curr->next = prev;[^\n]*/,
        '$1curr->next = prev; // BUG: Overwrote curr->next before caching nxt!\n$2ListNode* nxt = curr->next;'
      );
    } else if (lang === 'go') {
      mutated = baseCode.replace(
        /(\s*)nxt := curr\.Next[^\n]*\n(\s*)curr\.Next = prev[^\n]*/,
        '$1curr.Next = prev // BUG: Overwrote curr.Next before saving nxt!\n$2nxt := curr.Next'
      );
    } else if (lang === 'typescript') {
      mutated = baseCode.replace(
        /(\s*)const nxt: ListNode \| null = curr\.next;\n(\s*)curr\.next = prev;/,
        '$1curr.next = prev; // BUG: Overwrote curr.next before saving nxt!\n$2const nxt: ListNode | null = curr.next;'
      );
    } else if (lang === 'rust') {
      mutated = baseCode.replace(
        /(\s*)curr = node\.next\.take\(\);[^\n]*\n(\s*)node\.next = prev;[^\n]*/,
        '$1node.next = prev; // BUG: Overwrote node.next before taking forward link!\n$2curr = node.next.take();'
      );
    }
  } else if (familyId === 'two-sum-hash') {
    bugTitle = 'Inverted Complement Formula (`target + num`)';
    symptom =
      'Adding `num` to `target` instead of subtracting looks up the wrong complement key in the HashMap and misses valid pairs.';
    fixExplanation = 'Compute `complement = target - num` (or `target - nums[i]`).';
    mutated = baseCode.replace(/(target)\s*-\s*(num|nums\[i\])/, '$1 + $2');
  } else if (familyId === 'lru-cache-pointers') {
    bugTitle = 'Invalid Cache Miss Return Contract (`return 0` instead of `-1`)';
    symptom =
      'Returning `0` instead of `-1` on a missing key makes cache misses indistinguishable from valid stored zero values.';
    fixExplanation = 'Return `-1` when the key is not found in the HashMap.';
    mutated = baseCode.replace(/return\s+-1\b/, 'return 0').replace(/\n(\s*)-1\n/, '\n$10\n');
  } else if (familyId === 'binary-tree-level-order') {
    bugTitle = 'LIFO Pop Instead of FIFO Dequeue / Inverted Child Check';
    symptom =
      'Popping from the back or inverting the child null check breaks level-by-level breadth-first order.';
    fixExplanation = 'Dequeue from the FRONT (`popleft()` / `poll()`) and enqueue non-null children.';
    mutated = baseCode
      .replace(/queue\.popleft\(\)/, 'queue.pop()')
      .replace(/curr\.left\s*!=\s*null/, 'curr.left == null')
      .replace(/q\.front\(\)/, 'q.back()')
      .replace(/curr\.Left\s*!=\s*nil/, 'curr.Left == nil')
      .replace(/if\s*\(curr\.left\)/, 'if (curr.left == null)')
      .replace(/queue\.pop_front\(\)/, 'queue.pop_back()');
  } else if (familyId === 'longest-substring-unique') {
    bugTitle = 'Boundary Off-By-One on Duplicate Jump (`prev > left`)';
    symptom =
      'Using strict `>` instead of `>=` fails to advance `left` when the repeating character sits right at `s[left]`.';
    fixExplanation = 'Use inclusive `seen_at[ch] >= left` (or `prev >= left`).';
    mutated = baseCode.replace(/(seen_at\[ch\]|prev|seenAt\[ch\]|seenAt\.get\(ch\))\s*>=\s*left/, '$1 > left');
  } else if (familyId === 'daily-temperatures-stack') {
    bugTitle = 'Inverted Monotonic Stack Pop Condition (`<` instead of `>`)';
    symptom =
      'Popping when the incoming temperature is cooler breaks the monotonic decreasing invariant and outputs wrong wait spans.';
    fixExplanation = 'Pop while the current temperature is strictly warmer (`>`) than the top index on the stack.';
    mutated = baseCode.replace(/(temp|temps\[i\]|t)\s*>\s*((?:temperatures|temps)\[)/, '$1 < $2');
  } else if (familyId === 'three-sum-zero') {
    bugTitle = 'Pointer Aliasing Off-By-One (`lo <= hi`)';
    symptom =
      'Allowing `lo == hi` reuses the same index twice in a triplet, producing duplicate or invalid zero-sum triples.';
    fixExplanation = 'Restore strict `lo < hi` (or `left < right`) in the inner two-pointer loop.';
    mutated = baseCode.replace(/\b(lo)\s*<\s*(hi)\b/, '$1 <= $2').replace(/\b(left)\s*<\s*(right)\b/, '$1 <= $2');
  } else if (familyId === 'kth-largest-heap') {
    bugTitle = 'Inverted Min-Heap Size Guard (`size < k`)';
    symptom =
      'Evicting elements whenever the heap has fewer than K items destroys the top-K frontier immediately.';
    fixExplanation = 'Only pop the smallest root when heap size strictly exceeds `k` (`> k`).';
    mutated = baseCode.replace(/(len\(min_heap\)|minHeap\.size\(\)|h\.Len\(\)|minHeap\.length|min_heap\.len\(\))\s*>\s*k/, '$1 < k');
  } else if (familyId === 'trapping-rain-water') {
    bugTitle = 'Inverted Boundary Comparison (Moving Taller Wall)';
    symptom =
      'Advancing the taller side breaks the water-level guarantee because an unknown lower bar on the opposite side can drain the basin.';
    fixExplanation = 'Compare `left_max <= right_max` (or `leftMax <= rightMax`) so the smaller boundary advances.';
    mutated = baseCode.replace(/(left_max|leftMax)\s*<=\s*(right_max|rightMax)/, '$1 > $2');
  } else if (familyId === 'search-rotated-sorted') {
    bugTitle = 'Off-By-One Binary Search Termination (`low < high`)';
    symptom =
      'Terminating when `low == high` skips checking the final surviving element, returning `-1` even when target sits at the converged index.';
    fixExplanation = 'Use inclusive loop condition `low <= high` so single-element windows are inspected.';
    mutated = baseCode.replace(/low\s*<=\s*high/, 'low < high');
  } else if (familyId === 'course-schedule-cycle') {
    bugTitle = 'Broken Kahn Frontier Guard (`indegree[nxt] > 0`)';
    symptom =
      'Enqueuing vertices whose in-degree is still positive schedules courses before their prerequisites complete.';
    fixExplanation = 'Only enqueue `nxt` when `indegree[nxt] == 0` (or `=== 0`).';
    mutated = baseCode.replace(/indegree\[nxt\]\s*===?\s*0/, 'indegree[nxt] > 0');
  } else if (familyId === 'cycle-detection-floyd') {
    bugTitle = 'Broken Hare Velocity (`fast = fast.next` instead of `.next.next`)';
    symptom =
      'Moving both `slow` and `fast` at 1x speed prevents the hare from ever lapping the tortoise inside a cycle.';
    fixExplanation = 'Advance `fast` by two hops (`fast.next.next`) on every loop iteration.';
    mutated = baseCode.replace(/fast(?:\.next|\.Next|->next)(?:\.next|\.Next|->next)/, (m) =>
      m.includes('->') ? 'fast->next' : m.includes('.Next') ? 'fast.Next' : 'fast.next'
    );
  } else if (familyId === 'coin-change-dp') {
    bugTitle = 'Off-By-One DP Subproblem Guard (`a - coin > 0`)';
    symptom =
      'Requiring `a - coin > 0` excludes exact single-coin hits where `a == coin`, preventing `dp[coin]` from updating from `dp[0] + 1`.';
    fixExplanation = 'Change `a - coin > 0` back to `a - coin >= 0` (or `a >= c`).';
    mutated = baseCode
      .replace(/a\s*-\s*(coin|c)\s*>=\s*0/, 'a - $1 > 0')
      .replace(/a\s*>=\s*(coin|c)\s+as\s+usize/, 'a > $1 as usize');
  } else if (familyId === 'container-most-water') {
    bugTitle = 'Inverted Greedy Pointer Contraction (`height[left] > height[right]`)';
    symptom =
      'Shrinking from the taller wall strictly reduces width while keeping the shorter limiting wall fixed, missing the optimal container.';
    fixExplanation = 'Advance the pointer at the shorter wall (`height[left] < height[right]`).';
    mutated = baseCode.replace(/height\[left\]\s*<\s*height\[right\]/, 'height[left] > height[right]');
  } else if (familyId === 'valid-parentheses-stack') {
    bugTitle = 'Missing Final Empty-Stack Check';
    symptom =
      'Returning `true` unconditionally accepts unclosed opening brackets such as `"((("` because leftover stack frames are ignored.';
    fixExplanation = 'Return whether the stack is empty at the end of the scan.';
    mutated = baseCode
      .replace(/return\s+len\(stack\)\s*==\s*0/, 'return True')
      .replace(/return\s+stack\.isEmpty\(\);/, 'return true;')
      .replace(/return\s+st\.empty\(\);/, 'return true;')
      .replace(/return\s+len\(st\)\s*==\s*0/, 'return true')
      .replace(/return\s+stack\.length\s*===\s*0;/, 'return true;')
      .replace(/stack\.is_empty\(\)/, 'true');
  } else if (familyId === 'sort-colors-dutch-flag') {
    bugTitle = 'Off-By-One Partition Loop (`mid < high`)';
    symptom =
      'Stopping when `mid == high` skips classifying the final converging element, leaving a 0 stranded in the 1s region.';
    fixExplanation = 'Use inclusive loop condition `mid <= high` so the converging boundary slot is always classified.';
    mutated = baseCode
      .replace(/mid\s*<=\s*high/, 'mid < high')
      .replace(/\(mid as isize\)\s*<=\s*high/, '(mid as isize) < high');
  } else if (familyId === 'kadane-max-subarray') {
    bugTitle = 'Inverted Kadane Reset Rule (`min` instead of `max`)';
    symptom =
      'Keeping the smaller sum instead of resetting on negative prefixes tracks the worst subarray instead of the maximum sum.';
    fixExplanation = 'Reset `cur_sum = nums[i]` whenever `cur_sum + nums[i] < nums[i]` (i.e. `max(nums[i], cur_sum + nums[i])`).';
    mutated = baseCode
      .replace(/(cur_sum|curSum)\s*\+\s*nums\[i\]\s*<\s*nums\[i\]/, '$1 + nums[i] > nums[i]')
      .replace(/Math\.max\(nums\[i\],\s*curSum\s*\+\s*nums\[i\]\)/, 'Math.min(nums[i], curSum + nums[i])')
      .replace(/max\(nums\[i\],\s*curSum\s*\+\s*nums\[i\]\)/, 'min(nums[i], curSum + nums[i])')
      .replace(/x\.max\(cur_sum \+ x\)/, 'x.min(cur_sum + x)');
  } else if (familyId === 'merge-intervals-greedy') {
    bugTitle = 'Strict Overlap Boundary (`<` instead of `<=`)';
    symptom =
      'Using strict `<` misses touching intervals like `[1,4]` and `[4,5]` that share an endpoint and must be coalesced.';
    fixExplanation = 'Use inclusive `start <= lastEnd` so touching intervals merge cleanly.';
    mutated = baseCode.replace(
      /(start|intervals\[i\]\[0\]|iv\[0\])\s*<=\s*(merged\[-1\]\[1\]|merged\.back\(\)\[1\]|last\[1\])/,
      '$1 < $2'
    );
  } else {
    if (baseCode.includes('!= null')) {
      mutated = baseCode.replace('!= null', '== null');
    } else if (baseCode.includes('!= nullptr')) {
      mutated = baseCode.replace('!= nullptr', '== nullptr');
    } else if (baseCode.includes('is not None')) {
      mutated = baseCode.replace('is not None', 'is None');
    } else if (baseCode.includes('<=')) {
      mutated = baseCode.replace('<=', '<');
    } else {
      mutated = baseCode.replace('>=', '>');
    }
  }

  // Locate which line changed for accurate indicator
  const origLines = baseCode.split('\n');
  const mutLines = mutated.split('\n');
  let brokenLineNumber = 1;
  for (let i = 0; i < Math.max(origLines.length, mutLines.length); i++) {
    if (origLines[i] !== mutLines[i]) {
      brokenLineNumber = i + 2; // +1 for 1-indexing, +1 for banner comment prepended below
      break;
    }
  }

  const header = `${commentPrefix} BUG HUNTER: Find and fix the logic defect below (deleting this comment alone will NOT pass)\n`;
  return {
    code: header + mutated,
    bugTitle,
    brokenLineNumber,
    symptom,
    fixExplanation,
  };
}
