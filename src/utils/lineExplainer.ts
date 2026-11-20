import { PREWRITTEN_LINE_GUIDES, LineExplanationEntry, LineRole } from '../data/lineExplanations';
import { AlgorithmProblem, Language } from '../types/visualizer';

export interface ResolvedLineExplanation extends LineExplanationEntry {
  lineNumber: number;
  source: 'prewritten' | 'language-syntax' | 'ai';
  matchedPythonLine?: number;
}

export const LINE_ROLE_META: Record<LineRole, { label: string; toneClass: string }> = {
  setup: {
    label: 'Setup',
    toneClass: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/80',
  },
  loop: {
    label: 'Loop',
    toneClass: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800/80',
  },
  condition: {
    label: 'Check',
    toneClass: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80',
  },
  mutate: {
    label: 'Update',
    toneClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80',
  },
  return: {
    label: 'Return',
    toneClass: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/80',
  },
  helper: {
    label: 'Structure',
    toneClass: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700',
  },
};

function stripInlineComment(line: string): string {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/#.*$/, '')
    .trim();
}

function detectLanguageBoilerplate(rawLine: string, language: Language): LineExplanationEntry | null {
  const trimmed = rawLine.trim();

  if (!trimmed) {
    return {
      role: 'helper',
      summary: 'Blank separator line for readability.',
      why: 'Groups setup, loop logic, and helper sections visually without affecting execution.',
    };
  }

  if (trimmed === '}' || trimmed === '};' || trimmed === '{' || trimmed === '});') {
    return {
      role: 'helper',
      summary: trimmed === '{' ? 'Opens a new code block.' : 'Closes the current code block.',
      why: 'Defines scope boundaries in brace-delimited languages (no runtime work on its own).',
    };
  }

  if (/^(\/\/|#|\/\*|\*)/.test(trimmed)) {
    return {
      role: 'helper',
      summary: 'Developer comment explaining the nearby code.',
      why: 'Ignored by the compiler/interpreter — exists purely to clarify intent for readers.',
    };
  }

  if (/^#include\b|^import\b|^use\s+|^using\s+namespace\b|^package\s+/.test(trimmed)) {
    if (/unordered_map|HashMap|collections::HashMap/.test(trimmed)) {
      return {
        role: 'helper',
        summary: 'Imports the hash map data structure from the standard library.',
        why: 'Gives us O(1) average-time key lookups and insertions.',
      };
    }
    if (/queue|deque|VecDeque|ArrayDeque|container\/list|<list>/.test(trimmed)) {
      return {
        role: 'helper',
        summary: 'Imports the queue / doubly-linked list container from the standard library.',
        why: 'Supports O(1) pops from the front and O(1) pushes/splices without shifting elements.',
      };
    }
    if (/BinaryHeap|PriorityQueue|container\/heap|heapq/.test(trimmed)) {
      return {
        role: 'helper',
        summary: 'Imports the binary heap (priority queue) utility from the standard library.',
        why: 'Maintains the smallest (or largest) element at the root in O(log K) per operation.',
      };
    }
    if (/algorithm|sort|cmp/.test(trimmed)) {
      return {
        role: 'helper',
        summary: 'Imports standard sorting and comparison helpers (`sort`, `min`, `max`, `Reverse`).',
        why: 'Provides battle-tested O(N log N) sorting and comparison primitives.',
      };
    }
    return {
      role: 'helper',
      summary: `Standard ${language.toUpperCase()} package/module declaration (\`${trimmed}\`).`,
      why: 'Makes required standard-library collections and types available to the algorithm.',
    };
  }

  if (/^(public|private|protected):$/.test(trimmed) || /^#\[derive\(/.test(trimmed)) {
    return {
      role: 'helper',
      summary: trimmed.startsWith('#[')
        ? 'Rust derive attribute that auto-generates equality, cloning, and debug formatting.'
        : `Sets member visibility (\`${trimmed}\`) for the fields and methods below.`,
      why: 'Language-specific type annotation with zero runtime overhead.',
    };
  }

  if (/^(public\s+)?(export\s+)?class\s+Solution\b/.test(trimmed)) {
    return {
      role: 'helper',
      summary: 'Declares the outer `Solution` wrapper class.',
      why: 'Standard container required by Java and C++ interview platforms to host the algorithm method.',
    };
  }

  if (/^(pub\s+)?(struct|class|type)\s+(ListNode|TreeNode|Node|entry|MinHeap)\b/.test(trimmed)) {
    return {
      role: 'helper',
      summary: `Defines the custom \`${trimmed.match(/(ListNode|TreeNode|Node|entry|MinHeap)/)?.[1] ?? 'Node'}\` data structure layout.`,
      why: 'Specifies the exact fields stored together in each heap-allocated object.',
    };
  }

  if (
    /^(pub\s+)?(int|val|number|i32|ListNode|TreeNode|Node|Option|Val|Next|Left|Right|Key|Cap|Order|Cache)\b.*[:;]?$/.test(trimmed) &&
    !/[=()]/.test(trimmed) &&
    trimmed.length < 48
  ) {
    return {
      role: 'helper',
      summary: `Declares a struct/class field (\`${trimmed}\`).`,
      why: 'Reserves typed memory inside each node or container instance.',
    };
  }

  if (/^(ListNode|TreeNode|Node|constructor)\s*\([^)]*\)/.test(trimmed) && !trimmed.includes('def ')) {
    return {
      role: 'helper',
      summary: 'Constructor that initializes a newly allocated node’s fields.',
      why: 'Ensures every node starts with valid value and null child/next links.',
    };
  }

  // Go heap.Interface boilerplate methods (Len, Less, Swap, Push, Pop)
  if (language === 'go' && /^func\s+\(h\s+\*?MinHeap\)/.test(trimmed)) {
    return {
      role: 'helper',
      summary: 'Implements one of Go’s `heap.Interface` methods on `MinHeap`.',
      why: 'Go’s `container/heap` requires `Len`, `Less`, `Swap`, `Push`, and `Pop` to maintain min-heap order.',
    };
  }

  return null;
}

const STOP_TOKENS = new Set([
  'let', 'mut', 'const', 'var', 'int', 'void', 'bool', 'boolean', 'string', 'str', 'usize', 'i32', 'f64',
  'auto', 'final', 'private', 'public', 'static', 'export', 'function', 'func', 'pub', 'fn', 'def', 'new',
  'the', 'and', 'or', 'is', 'in', 'of', 'to', 'as', 'self', 'this', 'vec', 'vector', 'list', 'array',
  'integer', 'number', 'override', 'virtual', 'return', 'math', 'std',
]);

function normalizeToken(raw: string): string {
  const t = raw.toLowerCase();
  if (t === 'nullptr' || t === 'nil' || t === 'null' || t === 'none') return 'null';
  if (t === 'length' || t === 'size' || t === 'len') return 'len';
  if (t === 'append' || t === 'push' || t === 'emplace' || t === 'offer' || t === 'add' || t === 'heappush') return 'push';
  if (t === 'popleft' || t === 'poll' || t === 'remove' || t === 'heappop' || t === 'popfront') return 'pop';
  if (t === 'elif' || t === 'elseif') return 'elif';
  if (t === 'while' || t === 'for') return 'loop';
  if (t === 'swap') return 'swap';
  if (t === 'max' || t === 'math') return t;
  if (t === 'containskey' || t === 'count' || t === 'has' || t === 'find' || t === 'contains') return 'has';
  if (t === 'isempty' || t === 'empty') return 'empty';
  if (t === 'hashmap' || t === 'unordered' || t === 'map' || t === 'dict') return 'map';
  if (t === 'deque' || t === 'arraydeque' || t === 'vecdeque' || t === 'queue') return 'queue';
  if (t === 'priorityqueue' || t === 'binaryheap' || t === 'heap') return 'heap';
  if (t === 'val' || t === 'value') return 'val';
  if (t === 'next' || t === 'nxt') return 'next';
  if (t === 'prev' || t === 'previous') return 'prev';
  if (t === 'curr' || t === 'cur' || t === 'current') return 'curr';
  if (t === 'res' || t === 'result' || t === 'ans' || t === 'out') return 'res';
  return t;
}

function tokenizeLine(rawLine: string): string[] {
  const codeOnly = stripInlineComment(rawLine);
  // Split camelCase before lowercasing so `leftMax` -> `left`, `max`
  const spaced = codeOnly.replace(/([a-z])([A-Z])/g, '$1 $2');
  const words = spaced.match(/[A-Za-z_][A-Za-z0-9_]*|[<>!=]=|<=|>=|\+=|-=|\+\+|--|-1/g) || [];
  const tokens: string[] = [];
  for (const w of words) {
    for (const part of w.split('_')) {
      if (!part) continue;
      const norm = normalizeToken(part);
      if (!STOP_TOKENS.has(norm)) {
        tokens.push(norm);
      }
    }
  }
  return tokens;
}

type LineKind = 'sig' | 'loop' | 'if' | 'elif' | 'else' | 'return' | 'stmt';

function classifyLineKind(rawLine: string): LineKind {
  const t = stripInlineComment(rawLine);
  if (/^(def |public .*?\(|func |export function |pub fn |ListNode\*|TreeNode\*|int |bool |vector<|void )/.test(t) && !/^(if|while|for)\b/.test(t) && !t.includes(';')) {
    return 'sig';
  }
  if (/^(while|for)\b/.test(t)) return 'loop';
  if (/^(}\s*)?(elif|else\s+if)\b/.test(t)) return 'elif';
  if (/^(}\s*)?else\b/.test(t)) return 'else';
  if (/^if\b/.test(t)) return 'if';
  if (/^return\b/.test(t)) return 'return';
  return 'stmt';
}

/**
 * Find the vertical span [startIdx, endIdx] (0-based) of the main algorithm function
 * so relative-position scoring aligns Python lines with Java/C++/Go/TS/Rust bodies.
 */
function findBodyBounds(lines: string[], language: Language): { start: number; end: number } {
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (language === 'python' && /^(def|class)\s+/.test(t)) {
      start = i;
      break;
    }
    if (language === 'java' && /^public\s+.*\(/.test(t) && !t.includes('class ')) {
      start = i;
      break;
    }
    if (language === 'go' && /^func\s+/.test(t) && !/^func\s+\(h\s+\*?MinHeap\)/.test(t)) {
      start = i;
      break;
    }
    if (language === 'typescript' && /^(export\s+)?(function|class)\s+/.test(t) && !/class\s+(ListNode|TreeNode)/.test(t)) {
      start = i;
      break;
    }
    if (language === 'rust' && /^(pub\s+)?fn\s+/.test(t)) {
      start = i;
      break;
    }
    if (
      language === 'cpp' &&
      /\b(ListNode\*|TreeNode\*|int|bool|vector<|void)\s+\w+\s*\(/.test(t) &&
      !t.startsWith('struct ') &&
      !t.startsWith('ListNode(') &&
      !t.startsWith('TreeNode(')
    ) {
      start = i;
      break;
    }
  }
  let end = lines.length - 1;
  while (end > start && detectLanguageBoilerplate(lines[end], language) !== null) {
    end--;
  }
  return { start, end: Math.max(start, end) };
}

/**
 * Resolves a prewritten plain-English explanation for any 1-based lineNumber
 * across all 200 problems and all 6 supported languages.
 */
export function resolveLineExplanation(
  problem: AlgorithmProblem,
  language: Language,
  code: string,
  lineNumber: number,
  aiOverride?: string | null
): ResolvedLineExplanation {
  const lines = code.split('\n');
  const clampedLine = Math.min(Math.max(1, lineNumber), Math.max(1, lines.length));
  const targetText = lines[clampedLine - 1] ?? '';

  // 1. If the user explicitly ran AI Explain for custom/edited code, honor it first
  if (aiOverride && aiOverride.trim().length > 0) {
    return {
      lineNumber: clampedLine,
      role: 'helper',
      summary: aiOverride.trim(),
      why: 'Generated on-demand by the AI mentor for your current editor code.',
      source: 'ai',
    };
  }

  const familyId = problem.traceFamilyId || problem.id;
  const guide = PREWRITTEN_LINE_GUIDES[familyId];
  const pyLines = problem.python.code.split('\n');

  // 2. Direct exact lookup for canonical Python lines
  if (language === 'python' && guide && guide[clampedLine]) {
    const pyCanonical = (pyLines[clampedLine - 1] ?? '').trim();
    if (!pyCanonical || targetText.trim() === pyCanonical || !targetText.trim().startsWith('#')) {
      return {
        lineNumber: clampedLine,
        ...guide[clampedLine],
        source: 'prewritten',
        matchedPythonLine: clampedLine,
      };
    }
  }

  // 3. Language-specific structural / boilerplate lines (imports, braces, struct definitions)
  const boilerplate = detectLanguageBoilerplate(targetText, language);
  if (boilerplate) {
    return {
      lineNumber: clampedLine,
      ...boilerplate,
      source: 'language-syntax',
    };
  }

  // 4. Semantic cross-language mapping into the prewritten Python family guide
  if (guide) {
    const guideLineNums = Object.keys(guide)
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= pyLines.length);

    if (guideLineNums.length > 0) {
      const targetKind = classifyLineKind(targetText);
      const targetTokens = new Set(tokenizeLine(targetText));
      const targetBounds = findBodyBounds(lines, language);
      const targetRelPos =
        targetBounds.end > targetBounds.start
          ? Math.min(1, Math.max(0, (clampedLine - 1 - targetBounds.start) / (targetBounds.end - targetBounds.start)))
          : 0;

      // Exact function-signature match for the primary method line
      if (targetKind === 'sig' && clampedLine - 1 === targetBounds.start && guide[1]) {
        return {
          lineNumber: clampedLine,
          ...guide[1],
          source: 'prewritten',
          matchedPythonLine: 1,
        };
      }

      // Rust tail-expression return (last line inside body without `return` keyword)
      const isRustTailReturn =
        language === 'rust' &&
        clampedLine - 1 === targetBounds.end &&
        !targetText.trim().endsWith(';');

      let bestLine = guideLineNums[0];
      let bestScore = -Infinity;

      for (const pyNum of guideLineNums) {
        const pyText = pyLines[pyNum - 1] ?? '';
        const pyKind = classifyLineKind(pyText);
        const pyTokens = new Set(tokenizeLine(pyText));
        const pyRelPos = (pyNum - 1) / Math.max(1, pyLines.length - 1);

        let score = 0;

        // Control-flow kind affinity
        if (isRustTailReturn && pyKind === 'return') {
          score += 8;
        } else if (targetKind === pyKind) {
          score += 4;
        } else if (
          (targetKind === 'if' && pyKind === 'elif') ||
          (targetKind === 'elif' && pyKind === 'if')
        ) {
          score += 2.5;
        } else if (
          (targetKind === 'return' && pyKind !== 'return') ||
          (targetKind === 'else' && pyKind !== 'else')
        ) {
          score -= 3;
        }

        // Token overlap
        let shared = 0;
        for (const tok of targetTokens) {
          if (pyTokens.has(tok)) shared += 1;
        }
        const union = Math.max(1, targetTokens.size + pyTokens.size - shared);
        score += shared * 2.4 + (shared / union) * 3.0;

        // Specific operator/pattern boosts
        if (targetText.includes('++') && pyText.includes('+= 1')) score += 2.2;
        if (targetText.includes('--') && pyText.includes('-= 1')) score += 2.2;
        if (/swap\s*\(/i.test(targetText) && /,\s*[^=]+=\s*[^,]+,/.test(pyText)) score += 3.5;
        if (/\bmax\s*\(/i.test(targetText) && /\bmax\s*\(/i.test(pyText)) score += 4.0;
        if (/\bmin\s*\(/i.test(targetText) && /\bmin\s*\(/i.test(pyText)) score += 4.0;
        if (/\.sort\b|sort\s*\(/i.test(targetText) && /\.sort\b/.test(pyText)) score += 4.0;
        if (targetText.includes('-1') && pyText.includes('-1')) score += 1.5;
        if (targetText.includes('<=') && pyText.includes('<=')) score += 1.2;
        if (targetText.includes('>=') && pyText.includes('>=')) score += 1.2;

        // Relative vertical position tiebreaker
        score -= Math.abs(targetRelPos - pyRelPos) * 2.8;

        if (score > bestScore) {
          bestScore = score;
          bestLine = pyNum;
        }
      }

      return {
        lineNumber: clampedLine,
        ...guide[bestLine],
        source: 'prewritten',
        matchedPythonLine: bestLine,
      };
    }
  }

  // 5. Fallback for completely custom user code that doesn't match a known family
  const trimmed = targetText.trim();
  return {
    lineNumber: clampedLine,
    role: 'helper',
    summary: `Executes \`${trimmed}\`.`,
    why: 'Part of the custom solution logic — click "AI Explain" to generate custom notes for edited lines.',
    source: 'language-syntax',
  };
}

/**
 * Builds the full annotated line-by-line walkthrough for the active code & language,
 * skipping blank lines and lone braces so learners can read the entire algorithm cleanly.
 */
export function buildAllLinesWalkthrough(
  problem: AlgorithmProblem,
  language: Language,
  code: string,
  aiOverrides?: Record<number, string> | null
): Array<{ lineNumber: number; codeText: string; explanation: ResolvedLineExplanation }> {
  const lines = code.split('\n');
  const items: Array<{ lineNumber: number; codeText: string; explanation: ResolvedLineExplanation }> = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}' || trimmed === '};' || trimmed === '});') {
      continue;
    }
    const lineNumber = i + 1;
    const explanation = resolveLineExplanation(
      problem,
      language,
      code,
      lineNumber,
      aiOverrides?.[lineNumber] ?? null
    );
    items.push({
      lineNumber,
      codeText: trimmed,
      explanation,
    });
  }

  return items;
}
