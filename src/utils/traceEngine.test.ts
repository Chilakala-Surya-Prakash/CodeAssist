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

test('2. Topic Curriculum has 8 Core Topics with 20 authentic questions each (160 total) across all 6 languages', () => {
  assert.equal(CORE_TOPICS.length, 8, 'Expected 8 Core Topics');
  assert.equal(PROBLEMS.length, 160, `Expected 160 total problems (8 topics x 20), found ${PROBLEMS.length}`);

  for (const topicMeta of CORE_TOPICS) {
    const topicProblems = PROBLEMS.filter((p) => p.topic === topicMeta.id);
    assert.equal(
      topicProblems.length,
      20,
      `Expected 20 questions for topic ${topicMeta.id}, found ${topicProblems.length}`
    );
    topicProblems.forEach((p, idx) => {
      assert.equal(p.topicIndex, idx + 1);
      assert.ok(
        p.topicCode?.startsWith(`${topicMeta.codePrefix}-`),
        `Expected topicCode to start with ${topicMeta.codePrefix}-, got ${p.topicCode}`
      );
    });
  }

  const seenNumbers = new Set<number>();
  const seenCodes = new Set<string>();
  const languages: Language[] = ['python', 'java', 'cpp', 'go', 'typescript', 'rust'];

  for (const problem of PROBLEMS) {
    assert.ok(!seenNumbers.has(problem.number), `Duplicate problem number: ${problem.number}`);
    seenNumbers.add(problem.number);
    assert.ok(problem.topicCode && !seenCodes.has(problem.topicCode), `Duplicate topicCode: ${problem.topicCode}`);
    if (problem.topicCode) seenCodes.add(problem.topicCode);

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

test('3. TraceEngine generates valid multi-step memory, stack, and pointer traces starting at Line 1 for all 160 problems', () => {
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

test('11. Binary Tree, DAG Course Schedule, Coin Change DP, Heap, and LRU Cache traces maintain valid heap cells', () => {
  const treeSteps = generateExecutionTrace('binary-tree-level-order', '3, 9, 20, null, null, 15, 7');
  assert.equal(treeSteps[0].heapObjects[0].type, 'BinaryTree');
  assert.ok(treeSteps[treeSteps.length - 1].stdout?.includes('[[3],[9,20],[15,7]]'));

  const dagSteps = generateExecutionTrace('course-schedule-cycle', 'V=4 | 0->1, 0->2, 1->3, 2->3');
  assert.equal(dagSteps[0].heapObjects[0].type, 'GraphQueue');
  assert.ok(dagSteps[dagSteps.length - 1].stdout?.toLowerCase().includes('true'));

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

  // Bug Hunter + 16-Test-Case Verification Suite across languages
  const bug = getBugChallenge(problem);
  const canonicalSuite = runLocalTestSuite(problem, problem.python.code, 'python');
  assert.equal(canonicalSuite.length, 16, 'Expected 16 edge-case test cases');
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
