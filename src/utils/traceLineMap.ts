import { ExecutionStep, Language } from '../types/visualizer';

function isTrivialLine(trimmed: string): boolean {
  return (
    trimmed.length === 0 ||
    trimmed === '{' ||
    trimmed === '}' ||
    trimmed === '};' ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('using ') ||
    trimmed.startsWith('package ') ||
    trimmed.startsWith('import ') ||
    trimmed.startsWith('use ') ||
    trimmed === 'public:' ||
    trimmed === 'private:'
  );
}

/**
 * Clamps a 1-indexed line number into [1, lines.length] and snaps off blank or brace-only lines.
 */
export function clampToExecutableLine(lineNumber: number, lines: string[]): number {
  if (lines.length === 0) return 1;
  const clamped = Math.min(lines.length, Math.max(1, Math.round(lineNumber || 1)));
  if (!isTrivialLine(lines[clamped - 1].trim())) {
    return clamped;
  }
  // Search upward first (common when raw line overshot past return/closing brace), then downward
  for (let offset = 1; offset < lines.length; offset++) {
    if (clamped - offset >= 1 && !isTrivialLine(lines[clamped - offset - 1].trim())) {
      return clamped - offset;
    }
    if (clamped + offset <= lines.length && !isTrivialLine(lines[clamped + offset - 1].trim())) {
      return clamped + offset;
    }
  }
  return clamped;
}

/**
 * Finds the 1-indexed line where the primary algorithm function begins in targetCode,
 * skipping headers, imports, and data-structure helper declarations.
 */
function findPrimaryFunctionBounds(lines: string[], language: Language): { start: number; end: number } {
  let start = 1;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (language === 'python' && /^def\s+\w+\s*\(/.test(t)) {
      start = i + 1;
      break;
    }
    if (language === 'go' && /^func\s+/.test(t) && !/^func\s+\(h\s+\*?MinHeap\)/.test(t)) {
      start = i + 1;
      break;
    }
    if (language === 'typescript' && /^(export\s+)?(function|class)\s+/.test(t)) {
      start = i + 1;
      break;
    }
    if (language === 'rust' && /^(pub\s+)?fn\s+/.test(t)) {
      start = i + 1;
      break;
    }
    if (
      language === 'cpp' &&
      /\b(ListNode\*|int|bool|vector<|void)\s+\w+\s*\(/.test(t) &&
      !t.startsWith('struct ') &&
      !t.startsWith('ListNode(')
    ) {
      start = i + 1;
      break;
    }
  }

  let end = lines.length;
  for (let i = lines.length - 1; i >= start - 1; i--) {
    if (!isTrivialLine(lines[i].trim())) {
      end = i + 1;
      break;
    }
  }

  return { start, end: Math.max(start, end) };
}

function findMatchingLoopLine(lines: string[], start: number, end: number): number | null {
  for (let ln = start; ln <= end; ln++) {
    const t = lines[ln - 1].trim();
    if (/^(while|for)\b/.test(t)) {
      return ln;
    }
  }
  return null;
}

function findReturnLine(lines: string[], start: number, end: number): number | null {
  for (let ln = end; ln >= start; ln--) {
    const t = lines[ln - 1].trim();
    if (/\breturn\b/.test(t)) {
      return ln;
    }
  }
  // Rust tail expression fallback (last non-trivial line in function)
  for (let ln = end; ln >= start; ln--) {
    if (!isTrivialLine(lines[ln - 1].trim())) return ln;
  }
  return null;
}

/**
 * Resolves the accurate 1-indexed active line for a given ExecutionStep across all 6 languages.
 * Used identically by CodeEditorPanel, Breakpoint pausing, and the Timeline status badge.
 */
export function resolveActiveLine(
  step: ExecutionStep,
  language: Language,
  pythonCode: string,
  targetCode: string
): number {
  const targetLines = targetCode.split('\n');
  if (targetLines.length === 0) return 1;

  if (language === 'python') {
    return clampToExecutableLine(step.pythonLine, targetLines);
  }

  if (language === 'java') {
    return clampToExecutableLine(step.javaLine, targetLines);
  }

  const pyLines = pythonCode.split('\n');
  const pyTotal = Math.max(1, pyLines.length);
  const pyLine = Math.min(pyTotal, Math.max(1, step.pythonLine || 1));
  const pySource = (pyLines[pyLine - 1] || '').trim();
  const bounds = findPrimaryFunctionBounds(targetLines, language);

  // 1. Function entry
  if (step.operationType === 'PUSH_STACK_FRAME' || pyLine === 1) {
    return clampToExecutableLine(bounds.start, targetLines);
  }

  // 2. Final return statement
  if (step.operationType === 'RETURN_RESULT' || /^return\b/.test(pySource)) {
    const retLine = findReturnLine(targetLines, bounds.start, bounds.end);
    if (retLine !== null) return retLine;
  }

  // 3. Main loop header evaluation
  if (/^(while|for)\b/.test(pySource)) {
    const loopLine = findMatchingLoopLine(targetLines, bounds.start, bounds.end);
    if (loopLine !== null) return loopLine;
  }

  // 4. Proportional mapping within primary function body + identifier affinity
  const ratio = Math.min(1, Math.max(0, (pyLine - 1) / Math.max(1, pyTotal - 1)));
  const approxLine = Math.round(bounds.start + ratio * (bounds.end - bounds.start));

  const changedVars = (step.stackFrames?.[0]?.variables || [])
    .filter((v) => v.changed)
    .map((v) => v.name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())
    .filter((n) => n.length >= 2);

  if (changedVars.length > 0) {
    let bestLine = approxLine;
    let bestScore = -1;
    const windowStart = Math.max(bounds.start + 1, approxLine - 4);
    const windowEnd = Math.min(bounds.end, approxLine + 4);
    for (let ln = windowStart; ln <= windowEnd; ln++) {
      const trimmed = targetLines[ln - 1].trim();
      if (isTrivialLine(trimmed)) continue;
      const lower = trimmed.toLowerCase();
      let score = 0;
      for (const v of changedVars) {
        if (lower.includes(v)) score += 3;
      }
      // Slight preference for proximity to proportional line
      score -= Math.abs(ln - approxLine) * 0.25;
      if (score > bestScore) {
        bestScore = score;
        bestLine = ln;
      }
    }
    if (bestScore > 0) {
      return clampToExecutableLine(bestLine, targetLines);
    }
  }

  return clampToExecutableLine(approxLine, targetLines);
}
