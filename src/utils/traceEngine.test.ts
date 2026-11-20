import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPANIES } from '../data/companies';
import { CORE_TOPICS, PROBLEMS } from '../data/problems';
import { Language } from '../types/visualizer';
import { generateExecutionTrace } from './traceEngine';
import {
  buildPredictQuestion,
  buildRecursionCallTree,
  computeComplexityDiff,
  evaluateMockInterview,
  getBlindStarterCode,
  getBugChallenge,
  getMultiLanguageCode,
  LANGUAGE_LABELS,
  runLocalTestSuite,
  SYSTEMS_CONCURRENCY_SCENARIOS,
  updateSpacedRepetition,
} from './zeroCostEngines';
import { computeStepSoundProfile, DEFAULT_DSP_CONFIG } from './soundEngine';
import { CANVAS_THEMES } from './canvasThemes';
import { computeBinaryTreeLayout, computeDirectedGraphLayout } from './canvasLayout';
import { resolveActiveLine } from './traceLineMap';
import { stripComments, verifyCodeStructure } from './codeVerifier';
import { PREWRITTEN_LINE_GUIDES } from '../data/lineExplanations';
import { buildAllLinesWalkthrough, resolveLineExplanation } from './lineExplainer';

test('1. Company dataset contains at least 50 top tech firms with valid question references and metadata', () => {
  assert.ok(
    COMPANIES.length >= 50,
    `Expected at least 50 companies, found ${COMPANIES.length}`
  );
  const problemIds = new Set(PROBLEMS.map((p) => p.id));
  const companyIds = new Set<string>();

  for (const company of COMPANIES) {
    assert.ok(company.id.length > 0, 'Company id must be non-empty');
    assert.ok(!companyIds.has(company.id), `Duplicate company id: ${company.id}`);
    companyIds.add(company.id);

    assert.ok(company.name.length > 0, 'Company name must be non-empty');
    assert.ok(company.hq.length > 0, 'Company HQ must be non-empty');
    assert.ok(company.interviewBarSummary.length >= 20, 'Interview bar summary must be descriptive');
    assert.ok(company.preferredLanguages.includes('Python') || company.preferredLanguages.includes('Java'));
    assert.ok(
      company.featuredQuestions.length >= 3,
      `${company.name} should have at least 3 featured questions`
    );

    for (const q of company.featuredQuestions) {
      assert.ok(
        problemIds.has(q.problemId),
        `Company ${company.name} references unknown problemId: ${q.problemId}`
      );
      assert.ok(q.interviewerFocus.length > 0);
    }
  }
});

test('2. Topic Curriculum has 8 Core Topics with zero duplicate IDs/titles and explicit native vs pattern-template classification', () => {
  assert.equal(CORE_TOPICS.length, 8, 'Expected 8 Core Topics');
  assert.ok(PROBLEMS.length >= 150, `Expected deduplicated curriculum >= 150 problems, found ${PROBLEMS.length}`);

  const nativeProblems = PROBLEMS.filter((p) => p.traceMode === 'native');
  assert.equal(nativeProblems.length, 18, `Expected exactly 18 native 1:1 traced problems, found ${nativeProblems.length}`);

  for (const topicMeta of CORE_TOPICS) {
    const topicProblems = PROBLEMS.filter((p) => p.topic === topicMeta.id);
    assert.ok(
      topicProblems.length >= 18,
      `Expected >= 18 unique questions for topic ${topicMeta.id}, found ${topicProblems.length}`
    );
    topicProblems.forEach((p, idx) => {
      assert.equal(p.topicIndex, idx + 1);
      assert.ok(
        p.topicCode?.startsWith(`${topicMeta.codePrefix}-`),
        `Expected topicCode to start with ${topicMeta.codePrefix}-, got ${p.topicCode}`
      );
    });
  }

  const seenIds = new Set<string>();
  const seenNumbers = new Set<number>();
  const seenCodes = new Set<string>();
  const seenNormalizedTitles = new Set<string>();
  const languages: Language[] = ['python', 'java', 'cpp', 'go', 'typescript', 'rust'];

  for (const problem of PROBLEMS) {
    assert.ok(!seenIds.has(problem.id), `Duplicate problem id: ${problem.id}`);
    seenIds.add(problem.id);
    assert.ok(!seenNumbers.has(problem.number), `Duplicate problem number: ${problem.number}`);
    seenNumbers.add(problem.number);
    assert.ok(problem.topicCode && !seenCodes.has(problem.topicCode), `Duplicate topicCode: ${problem.topicCode}`);
    if (problem.topicCode) seenCodes.add(problem.topicCode);

    const normTitle = problem.title.split('(')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    assert.ok(!seenNormalizedTitles.has(normTitle), `Duplicate normalized problem title: "${normTitle}" (${problem.id})`);
    seenNormalizedTitles.add(normTitle);

    assert.ok(
      problem.traceMode === 'native' || problem.traceMode === 'pattern-template',
      `Problem ${problem.id} must declare traceMode`
    );
    if (problem.traceMode === 'pattern-template') {
      assert.ok(
        problem.traceTemplateTitle && problem.traceTemplateTitle.length > 0,
        `Pattern-template problem ${problem.id} must declare traceTemplateTitle`
      );
    }

    for (const lang of languages) {
      const code = getMultiLanguageCode(problem, lang);
      assert.ok(code.length > 30, `Missing ${LANGUAGE_LABELS[lang]} solution for ${problem.id}`);
      const blindStarter = getBlindStarterCode(problem, lang);
      assert.ok(blindStarter.includes('TODO'), `Missing blind starter template for ${lang}`);
    }

    assert.ok(problem.python.timeComplexity.startsWith('O('));
    assert.ok(problem.python.spaceComplexity.startsWith('O('));
    assert.ok(problem.java.timeComplexity.startsWith('O('));
    assert.ok(problem.java.spaceComplexity.startsWith('O('));
    assert.ok(problem.sampleInputs.length >= 2, `${problem.id} must have at least 2 sample inputs`);
    assert.ok(problem.companies.length >= 4, `${problem.id} must be tagged with at least 4 companies`);
  }
});

test('3. TraceEngine generates valid multi-step memory, stack, and pointer traces starting at Line 1 for all 200 problems', () => {
  for (const problem of PROBLEMS) {
    const steps = generateExecutionTrace(problem.id, problem.defaultInput);
    assert.ok(
      steps.length >= 6,
      `Problem ${problem.id} should produce >= 6 line-by-line execution steps, got ${steps.length}`
    );
    assert.equal(
      steps[0].pythonLine,
      1,
      `Problem ${problem.id} Step 1 must start at Line 1, got Line ${steps[0].pythonLine}`
    );

    steps.forEach((step, idx) => {
      assert.equal(step.stepIndex, idx, `Step index mismatch in ${problem.id}`);
      assert.ok(step.title.length > 0);
      assert.ok(step.intuition.length > 0);
      assert.ok(step.memoryMutation.length > 0);
      assert.ok(step.invariantCheck.length > 0);
      assert.ok(step.pythonLine >= 1);
      assert.ok(step.javaLine >= 1);
      assert.ok(step.stackFrames.length >= 1, `Missing stack frame at step ${idx} of ${problem.id}`);
      assert.ok(step.heapObjects.length >= 1, `Missing heap object at step ${idx} of ${problem.id}`);

      const heapIds = new Set(step.heapObjects.map((h) => h.id));
      for (const ptr of step.pointers) {
        assert.ok(
          heapIds.has(ptr.targetObjectId),
          `Pointer ${ptr.name} targets unknown heap object ${ptr.targetObjectId} in ${problem.id}`
        );
      }
    });
  }
});

test('4. Linked List Reversal trace accurately mutates .next pointers and reverses custom node sequences', () => {
  const customSteps = generateExecutionTrace('reverse-linked-list', '7 -> 14 -> 21');
  const firstStep = customSteps[0];
  const lastStep = customSteps[customSteps.length - 1];

  assert.equal(firstStep.heapObjects[0].cells.length, 3);
  assert.equal(firstStep.heapObjects[0].cells[0].nextAddress, '0x1060');
  assert.equal(firstStep.heapObjects[0].cells[1].nextAddress, '0x1080');
  assert.equal(firstStep.heapObjects[0].cells[2].nextAddress, null);

  assert.ok(lastStep.stdout?.includes('21 -> 14 -> 7'));
  assert.equal(lastStep.heapObjects[0].cells[0].nextAddress, null);
  assert.equal(lastStep.heapObjects[0].cells[1].nextAddress, '0x1040');
  assert.equal(lastStep.heapObjects[0].cells[2].nextAddress, '0x1060');
});

test('5. Floyd Cycle Detection trace converges slow and fast tortoise/hare pointers', () => {
  const steps = generateExecutionTrace('cycle-detection-floyd', '3 -> 2 -> 0 -> -4 (cycle=1)');
  assert.ok(steps.length >= 3);
  const lastStep = steps[steps.length - 1];
  assert.ok(lastStep.stdout?.toLowerCase().includes('true'));
  const slowPtr = lastStep.pointers.find((p) => p.name.startsWith('slow'));
  const fastPtr = lastStep.pointers.find((p) => p.name.startsWith('fast'));
  assert.ok(slowPtr && fastPtr);
  assert.equal(slowPtr.targetIndex, fastPtr.targetIndex);
});

test('6. Two Sum Hash Map trace resolves target indices and handles custom targets', () => {
  const steps = generateExecutionTrace('two-sum-hash', '4, 9, 11, 15 | 20');
  const lastStep = steps[steps.length - 1];
  assert.ok(lastStep.stdout?.includes('[1, 2]'));
});

test('7. Trapping Rain Water trace computes exact trapped water units for custom elevation profiles', () => {
  const steps = generateExecutionTrace('trapping-rain-water', '3, 0, 2, 0, 4');
  const lastStep = steps[steps.length - 1];
  assert.ok(
    lastStep.stdout?.includes('7 units'),
    `Expected 7 units of water, got ${lastStep.stdout}`
  );
});

test('8. Sliding Window Longest Substring trace tracks unique window span across duplicate characters', () => {
  const steps = generateExecutionTrace('longest-substring-unique', 'pwwkew');
  const lastStep = steps[steps.length - 1];
  assert.ok(lastStep.stdout?.includes('max_len = 3'));
});

test('9. Binary Search in Rotated Sorted Array handles both target found and target missing (-1)', () => {
  const foundSteps = generateExecutionTrace('search-rotated-sorted', '4,5,6,7,0,1,2 | 0');
  assert.ok(foundSteps[foundSteps.length - 1].stdout?.includes('index 4'));

  const missingSteps = generateExecutionTrace('search-rotated-sorted', '4,5,6,7,0,1,2 | 3');
  assert.ok(missingSteps[missingSteps.length - 1].stdout?.includes('-1'));
});

test('10. Valid Parentheses Stack trace distinguishes balanced and unbalanced bracket sequences', () => {
  const validSteps = generateExecutionTrace('valid-parentheses-stack', '{[()]}');
  assert.ok(validSteps[validSteps.length - 1].stdout?.includes('Valid: true'));

  const invalidSteps = generateExecutionTrace('valid-parentheses-stack', '([)]');
  assert.ok(invalidSteps[invalidSteps.length - 1].stdout?.includes('Valid: false'));
});

test('11. Binary Tree, DAG Course Schedule, Coin Change DP, Heap, and LRU Cache traces maintain valid heap cells & SVG topology', () => {
  const treeSteps = generateExecutionTrace('binary-tree-level-order', '3, 9, 20, null, null, 15, 7');
  assert.equal(treeSteps[0].heapObjects[0].type, 'BinaryTree');
  assert.equal(treeSteps[0].heapObjects[1].type, 'Queue', 'BFS queue must use Queue type, not GraphQueue');
  assert.ok(treeSteps[treeSteps.length - 1].stdout?.includes('[[3],[9,20],[15,7]]'));

  // Verify sparse Binary Tree layout aligns 15 (slot 5) and 7 (slot 6) under 20 (slot 2), NOT under 9 (slot 1)
  const treeLayout = computeBinaryTreeLayout(treeSteps[0].heapObjects[0].cells);
  assert.equal(treeLayout.nodes.length, 5);
  assert.equal(treeLayout.edges.length, 4);
  const edgePairs = treeLayout.edges.map((e) => `${e.fromSlot}->${e.toSlot}`).sort();
  assert.deepEqual(edgePairs, ['0->1', '0->2', '2->5', '2->6']);
  const node9 = treeLayout.nodes.find((n) => n.slot === 1)!;
  const node20 = treeLayout.nodes.find((n) => n.slot === 2)!;
  const node15 = treeLayout.nodes.find((n) => n.slot === 5)!;
  const node7 = treeLayout.nodes.find((n) => n.slot === 6)!;
  assert.ok(node15.x > node9.x && node15.x < node20.x, 'Node 15 must sit to the left of parent 20 and right of 9');
  assert.ok(node7.x > node20.x, 'Node 7 must sit to the right of parent 20');

  const dagSteps = generateExecutionTrace('course-schedule-cycle', 'V=4 | 0->1, 0->2, 1->3, 2->3');
  assert.equal(dagSteps[0].heapObjects[0].type, 'GraphQueue');
  assert.ok(dagSteps[dagSteps.length - 1].stdout?.toLowerCase().includes('true'));

  // Verify Directed Graph SVG layout parses all 4 vertices and 4 directed edges
  const graphLayout = computeDirectedGraphLayout(dagSteps[0].heapObjects[0].cells);
  assert.equal(graphLayout.nodes.length, 4);
  assert.equal(graphLayout.edges.length, 4);
  const dagEdgePairs = graphLayout.edges.map((e) => `${e.from}->${e.to}`).sort();
  assert.deepEqual(dagEdgePairs, ['0->1', '0->2', '1->3', '2->3']);

  const dpSteps = generateExecutionTrace('coin-change-dp', 'coins=[1, 2, 5] | amount=6');
  assert.equal(dpSteps[0].heapObjects[0].type, 'DPTable');
  assert.ok(dpSteps[dpSteps.length - 1].stdout?.includes('dp[0..6]'));

  const heapSteps = generateExecutionTrace('kth-largest-heap', 'nums=[3,2,1,5,6,4] | k=2');
  assert.equal(heapSteps[0].heapObjects[0].type, 'BinaryTree');
  assert.ok(heapSteps[heapSteps.length - 1].stdout?.includes('5'));

  const lruSteps = generateExecutionTrace('lru-cache-pointers', 'cap=2 | PUT(1,10), PUT(2,20), GET(1), PUT(3,30)');
  assert.equal(lruSteps[0].heapObjects[0].type, 'LinkedList');
  assert.equal(lruSteps[0].heapObjects[1].type, 'HashMap');
});

test('12. Advanced Engines: Diff Mode, Active Recall, 16-Case Test Runner, Recursion Flamegraph, 5-Dim Rubric, Systems & DSP Sound Engine', () => {
  const problem = PROBLEMS[0];
  const steps = generateExecutionTrace(problem.id, problem.defaultInput);

  // Side-by-Side Brute-Force vs Optimal Diff Mode
  const diff = computeComplexityDiff(problem, steps, 1);
  assert.ok(diff.bruteForce.estimatedOps > diff.optimal.actualOps);
  assert.ok(diff.optimal.speedupFactor.includes('x fewer ops'));
  assert.ok(diff.bruteForce.scannedCellsAtStep >= diff.optimal.scannedCellsAtStep);

  // Predict Next Step Quiz + Heap Node Target
  const q = buildPredictQuestion(steps, 0);
  assert.ok(q !== null);
  assert.equal(q.options.length, 4);
  assert.ok(q.nodeClickPrompt.length > 0);
  assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);

  // Bug Hunter + Domain-Specific Verification Suite across languages
  const bug = getBugChallenge(problem);
  const canonicalSuite = runLocalTestSuite(problem, problem.python.code, 'python');
  assert.ok(canonicalSuite.length >= 6 && canonicalSuite.length <= 8, 'Expected 6-8 family-specific test cases');
  assert.ok(canonicalSuite.every((tc) => tc.passed));

  const buggySuite = runLocalTestSuite(problem, bug.buggyCodeByLang.python, 'python');
  assert.ok(buggySuite.every((tc) => !tc.passed));

  // Recursion Call-Tree & Backtracking Flamegraph
  const callTree = buildRecursionCallTree(problem, steps, 1);
  assert.ok(callTree.length >= 2);
  assert.ok(callTree.some((n) => n.status === 'active'));

  // Spaced Repetition SM-2
  const sr1 = updateSpacedRepetition(undefined, problem.id, 'Good');
  assert.equal(sr1.intervalDays, 3);
  const sr2 = updateSpacedRepetition(sr1, problem.id, 'Easy');
  assert.ok(sr2.intervalDays > sr1.intervalDays);

  // 5-Dimension Mock Interview Rubric Scorecard
  const scorecard = evaluateMockInterview({
    companyName: 'Google',
    problem,
    language: 'cpp',
    code: getMultiLanguageCode(problem, 'cpp'),
    approachNotes:
      'Rotate .next pointers in-place in O(N) time and O(1) auxiliary heap space, handling empty and single-node edge cases.',
    elapsedSeconds: 1200,
    quizCorrectCount: 3,
  });
  assert.equal(scorecard.verdict, 'Strong Hire');
  assert.ok(scorecard.overallScore >= 85);
  assert.equal(scorecard.dimensions.length, 5);

  // System Design & OS Concurrency Visualizer Scenarios
  assert.equal(SYSTEMS_CONCURRENCY_SCENARIOS.length, 5);
  for (const scen of SYSTEMS_CONCURRENCY_SCENARIOS) {
    assert.ok(scen.nodes.length >= 4);
    assert.ok(scen.steps.length >= 2);
    assert.ok(scen.steps[0].stateTable.length >= 2);
  }

  // Sound Engineering & DSP Sonification Profile
  const dspProfile = computeStepSoundProfile(steps[0], {
    ...DEFAULT_DSP_CONFIG,
    enabled: true,
    masterGainDb: -6,
  });
  assert.ok(dspProfile.baseFrequencyHz >= 220);
  assert.ok(dspProfile.harmonicFrequencyHz > dspProfile.baseFrequencyHz);
  assert.ok(dspProfile.stereoPan >= -1 && dspProfile.stereoPan <= 1);
  assert.ok(dspProfile.linearGain > 0 && dspProfile.linearGain < 1);
});

test('13. Visualizer Canvas Theme Templates & Scenario Input Templates', () => {
  const themeKeys = Object.keys(CANVAS_THEMES);
  assert.equal(themeKeys.length, 4);
  assert.deepEqual(themeKeys.sort(), ['blueprint', 'glass', 'neon', 'paper']);

  for (const key of themeKeys as (keyof typeof CANVAS_THEMES)[]) {
    const theme = CANVAS_THEMES[key];
    assert.ok(theme.name.length > 0);
    assert.ok(theme.icon.length > 0);
    assert.ok(theme.containerClass.length > 0);
    assert.ok(theme.cardBaseClass.length > 0);
    assert.ok(theme.svgArrowColor.startsWith('#'));
  }

  // Verify problems run sample input scenarios cleanly
  for (const problem of PROBLEMS.slice(0, 10)) {
    for (const sample of problem.sampleInputs) {
      const trace = generateExecutionTrace(problem.id, sample.value);
      assert.ok(trace.length >= 2, `${problem.id} sample ${sample.label} must generate >=2 steps`);
      assert.ok(trace[0].heapObjects.length >= 1);
    }
  }
});

test('14. P1/P2 Code-to-Trace Alignment: all 18 native traces stay within line bounds and skip untaken guard returns', () => {
  const nativeProblems = PROBLEMS.filter((p) => p.traceMode === 'native');
  assert.equal(nativeProblems.length, 18);

  for (const p of nativeProblems) {
    const pyLines = p.python.code.split('\n');
    const javaLines = p.java.code.split('\n');
    const trace = generateExecutionTrace(p.id, p.defaultInput);

    for (const step of trace) {
      assert.ok(
        step.pythonLine >= 1 && step.pythonLine <= pyLines.length,
        `${p.id} step ${step.stepIndex} pythonLine ${step.pythonLine} out of bounds (1..${pyLines.length})`
      );
      assert.ok(
        step.javaLine >= 1 && step.javaLine <= javaLines.length,
        `${p.id} step ${step.stepIndex} javaLine ${step.javaLine} out of bounds (1..${javaLines.length})`
      );
      assert.ok(
        pyLines[step.pythonLine - 1].trim().length > 0,
        `${p.id} step ${step.stepIndex} landed on blank Python line ${step.pythonLine}`
      );
    }
  }

  // Regression check: Binary Tree BFS on non-empty root must NEVER execute dead `return []` line
  const btreeTrace = generateExecutionTrace('binary-tree-level-order', '3, 9, 20, null, null, 15, 7');
  assert.ok(
    btreeTrace.every((s) => !s.title.includes('return []')),
    'Binary Tree BFS must not execute untaken early-return `return []` on non-empty tree'
  );

  // Regression check: Course Schedule DAG return step stays within 17-line Python code
  const dagProblem = PROBLEMS.find((p) => p.id === 'course-schedule-cycle')!;
  const dagTrace = generateExecutionTrace(dagProblem.id, dagProblem.defaultInput);
  const dagLast = dagTrace[dagTrace.length - 1];
  assert.ok(dagLast.pythonLine <= dagProblem.python.code.split('\n').length);
});

test('15. P1 Multi-Language Fidelity: all 15 native problems have real 6-language implementations and semantic line mapping', () => {
  const nativeProblems = PROBLEMS.filter((p) => p.traceMode === 'native');
  const langs = ['python', 'java', 'cpp', 'go', 'typescript', 'rust'] as const;

  for (const p of nativeProblems) {
    const trace = generateExecutionTrace(p.id, p.defaultInput);
    for (const lang of langs) {
      const code = getMultiLanguageCode(p, lang);
      assert.ok(
        !code.includes('acc += nums[mid]') && !code.includes('result += nums[mid]'),
        `${p.id} (${lang}) still returned placeholder stub!`
      );
      const lines = code.split('\n');
      for (const step of trace) {
        const resolved = resolveActiveLine(step, lang, p.python.code, code);
        assert.ok(
          resolved >= 1 && resolved <= lines.length,
          `${p.id} (${lang}) resolved line ${resolved} out of bounds 1..${lines.length}`
        );
        assert.ok(
          lines[resolved - 1].trim().length > 0,
          `${p.id} (${lang}) resolved blank line ${resolved}`
        );
      }
    }
  }
});

test('16. P1 Real Structural Verification & Domain-Specific Test Suites (comment deletion cannot bypass Bug Hunter)', () => {
  const nativeProblems = PROBLEMS.filter((p) => p.traceMode === 'native');
  for (const p of nativeProblems) {
    const bug = getBugChallenge(p);
    const bugWithoutComments = stripComments(bug.buggyCodeByLang.python);
    const checkBuggyNoComments = verifyCodeStructure(p, bugWithoutComments, 'python');
    assert.equal(
      checkBuggyNoComments.passed,
      false,
      `${p.id}: stripping comments must NOT bypass structural Bug Hunter verification`
    );
    const checkFixed = verifyCodeStructure(p, p.python.code, 'python');
    assert.equal(checkFixed.passed, true, `${p.id}: canonical code must pass structural verification`);
  }

  // Verify domain-specific test inputs (no linked-list arrows fed to bracket or DAG problems!)
  const parens = PROBLEMS.find((p) => p.id === 'valid-parentheses-stack')!;
  const parensSuite = runLocalTestSuite(parens, parens.python.code, 'python');
  assert.ok(parensSuite.every((tc) => !tc.input.includes('->')), 'Valid Parentheses must not receive linked-list inputs');

  const dag = PROBLEMS.find((p) => p.id === 'course-schedule-cycle')!;
  const dagSuite = runLocalTestSuite(dag, dag.python.code, 'python');
  assert.ok(dagSuite.every((tc) => tc.input.startsWith('V=')), 'Course Schedule DAG must receive graph inputs');

  const lru = PROBLEMS.find((p) => p.id === 'lru-cache-pointers')!;
  const lruSuite = runLocalTestSuite(lru, lru.python.code, 'python');
  assert.ok(lruSuite.every((tc) => tc.input.startsWith('cap=')), 'LRU Cache must receive cap= PUT/GET inputs');
});

test('17. P2 New Native Trace Families: Dutch National Flag, Kadane Max Subarray, and Merge Overlapping Intervals', () => {
  // Dutch National Flag 3-way in-place partition
  const dutchSteps = generateExecutionTrace('sort-colors-dutch-flag', '2, 0, 2, 1, 1, 0');
  const dutchLast = dutchSteps[dutchSteps.length - 1];
  assert.ok(dutchLast.stdout?.includes('[0, 0, 1, 1, 2, 2]'), `Unexpected Dutch Flag output: ${dutchLast.stdout}`);
  assert.deepEqual(
    dutchLast.heapObjects[0].cells.map((c) => c.value),
    [0, 0, 1, 1, 2, 2]
  );

  // Kadane Maximum Subarray
  const kadaneSteps = generateExecutionTrace('kadane-max-subarray', '-2, 1, -3, 4, -1, 2, 1, -5, 4');
  const kadaneLast = kadaneSteps[kadaneSteps.length - 1];
  assert.ok(kadaneLast.stdout?.includes('Max Sum: 6'), `Unexpected Kadane output: ${kadaneLast.stdout}`);

  const allNegKadane = generateExecutionTrace('kadane-max-subarray', '-5, -2, -8, -1, -4');
  assert.ok(
    allNegKadane[allNegKadane.length - 1].stdout?.includes('Max Sum: -1'),
    'Kadane must handle all-negative arrays accurately'
  );

  // Merge Overlapping Intervals (including unsorted + touching boundary intervals)
  const mergeSteps = generateExecutionTrace('merge-intervals-greedy', '[8,10], [1,3], [2,6], [15,18]');
  const mergeLast = mergeSteps[mergeSteps.length - 1];
  assert.ok(
    mergeLast.stdout?.includes('[[1, 6], [8, 10], [15, 18]]'),
    `Unexpected Merge Intervals output: ${mergeLast.stdout}`
  );
  assert.equal(mergeLast.heapObjects[1].cells.length, 3);

  const touchingSteps = generateExecutionTrace('merge-intervals-greedy', '[1,4], [4,5]');
  assert.ok(
    touchingSteps[touchingSteps.length - 1].stdout?.includes('[[1, 5]]'),
    'Touching intervals [1,4] and [4,5] must merge into [1,5]'
  );
});

test('18. P2 Calibrated Mock Interview Scoring: rejects untouched Blind stubs honestly and rewards complete solutions', () => {
  const dutch = PROBLEMS.find((p) => p.id === 'sort-colors-dutch-flag')!;
  const blindStub = getBlindStarterCode(dutch, 'python');

  // Submitting untouched blind starter stub with empty notes MUST be No Hire with low score (<= 35)
  const stubCard = evaluateMockInterview({
    companyName: 'Google',
    problem: dutch,
    language: 'python',
    code: blindStub,
    approachNotes: '',
    elapsedSeconds: 300,
    quizCorrectCount: 0,
  });
  assert.equal(stubCard.verdict, 'No Hire');
  assert.equal(stubCard.isStubSubmission, true);
  assert.ok(stubCard.overallScore <= 35, `Expected stub score <= 35, got ${stubCard.overallScore}`);

  // Submitting buggy code with good notes MUST NOT receive Hire / Strong Hire
  const bug = getBugChallenge(dutch);
  const buggyCard = evaluateMockInterview({
    companyName: 'Google',
    problem: dutch,
    language: 'python',
    code: stripComments(bug.buggyCodeByLang.python),
    approachNotes: 'Use three pointers low/mid/high in O(N) time and O(1) space.',
    elapsedSeconds: 900,
    quizCorrectCount: 1,
  });
  assert.ok(buggyCard.verdict === 'No Hire' || buggyCard.verdict === 'Lean Hire', `Unexpected verdict for buggy code: ${buggyCard.verdict}`);
  assert.ok(buggyCard.overallScore < 76);

  // Submitting working canonical solution with Big-O & invariant notes earns Strong Hire
  const passingCard = evaluateMockInterview({
    companyName: 'Google',
    problem: dutch,
    language: 'rust',
    code: getMultiLanguageCode(dutch, 'rust'),
    approachNotes:
      'Maintain three-way Dutch National Flag pointer invariant ([0..low-1]=0, [low..mid-1]=1, [high+1..n-1]=2) in O(N) time and O(1) auxiliary space, handling single-element edge cases.',
    elapsedSeconds: 1100,
    quizCorrectCount: 2,
  });
  assert.equal(passingCard.verdict, 'Strong Hire');
  assert.ok(passingCard.overallScore >= 88);
});

test('19. Prewritten Line-by-Line Guides: 100% coverage for all 18 native families, all 200 problems, and all 6 languages', () => {
  const nativeProblems = PROBLEMS.filter((p) => !p.traceFamilyId || p.traceFamilyId === p.id);
  assert.equal(nativeProblems.length, 18, `Expected 18 native problems, got ${nativeProblems.length}`);

  // 1. Every non-blank Python line of all 18 native families has a dedicated prewritten guide entry
  for (const problem of nativeProblems) {
    const guide = PREWRITTEN_LINE_GUIDES[problem.id];
    assert.ok(guide, `Missing prewritten guide for native problem ${problem.id}`);
    const pyLines = problem.python.code.split('\n');
    pyLines.forEach((raw, idx) => {
      if (!raw.trim()) return;
      const ln = idx + 1;
      const entry = guide[ln];
      assert.ok(entry, `Missing prewritten guide for ${problem.id} Python line ${ln}: "${raw.trim()}"`);
      assert.ok(entry.summary.length >= 12, `Summary too short on ${problem.id} L${ln}`);
      assert.ok(entry.why.length >= 12, `Why too short on ${problem.id} L${ln}`);
    });
  }

  // 2. Every single problem (all 200) resolves a complete walkthrough across all 6 languages
  const allLangs: Language[] = ['python', 'java', 'cpp', 'go', 'typescript', 'rust'];
  for (const problem of PROBLEMS) {
    for (const lang of allLangs) {
      const code = getMultiLanguageCode(problem, lang);
      const walkthrough = buildAllLinesWalkthrough(problem, lang, code);
      assert.ok(
        walkthrough.length >= 5,
        `Walkthrough too short (${walkthrough.length}) for ${problem.id} (${lang})`
      );
      for (const item of walkthrough) {
        assert.ok(item.explanation.summary.length > 0);
        assert.ok(item.explanation.why.length > 0);
      }
    }
  }

  // 3. Cross-language semantic alignment accuracy spot-checks
  const reverseProb = PROBLEMS.find((p) => p.id === 'reverse-linked-list')!;
  const cppReverse = getMultiLanguageCode(reverseProb, 'cpp');
  const cppNxtLine = cppReverse.split('\n').findIndex((l) => l.includes('curr->next')) + 1;
  const cppNxtExp = resolveLineExplanation(reverseProb, 'cpp', cppReverse, cppNxtLine);
  assert.equal(cppNxtExp.matchedPythonLine, 5, 'C++ nxt = curr->next must map to Python line 5');
  assert.ok(cppNxtExp.watchOut && cppNxtExp.watchOut.length > 10, 'Must preserve watch-out tip on critical line');

  const dutchProb = PROBLEMS.find((p) => p.id === 'sort-colors-dutch-flag')!;
  const rustDutch = getMultiLanguageCode(dutchProb, 'rust');
  const rustHighLine = rustDutch.split('\n').findIndex((l) => l.includes('high -= 1') || l.includes('high = high.saturating_sub')) + 1;
  if (rustHighLine > 0) {
    const rustHighExp = resolveLineExplanation(dutchProb, 'rust', rustDutch, rustHighLine);
    assert.equal(rustHighExp.matchedPythonLine, 12, 'Rust high decrement must map to Python line 12');
    assert.ok(rustHighExp.watchOut?.includes('mid'), 'Must preserve Dutch Flag mid-hold watch-out in Rust');
  }

  const mergeProb = PROBLEMS.find((p) => p.id === 'merge-intervals-greedy')!;
  const tsMerge = getMultiLanguageCode(mergeProb, 'typescript');
  const tsMaxLine = tsMerge.split('\n').findIndex((l) => l.includes('Math.max')) + 1;
  const tsMaxExp = resolveLineExplanation(mergeProb, 'typescript', tsMerge, tsMaxLine);
  assert.equal(tsMaxExp.matchedPythonLine, 7, 'TS Math.max merge line must map to Python line 7');
  assert.ok(tsMaxExp.watchOut?.includes('nested'), 'Must preserve nested-interval watch-out in TS');

  // 4. Explicit AI override still wins when provided
  const aiRes = resolveLineExplanation(reverseProb, 'python', reverseProb.python.code, 2, 'Custom AI mentor note.');
  assert.equal(aiRes.source, 'ai');
  assert.equal(aiRes.summary, 'Custom AI mentor note.');
});



