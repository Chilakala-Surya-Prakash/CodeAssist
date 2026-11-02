import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPANIES } from '../data/companies';
import { PROBLEMS } from '../data/problems';
import { generateExecutionTrace } from './traceEngine';

test('company dataset contains at least 50 top tech firms with valid question references', () => {
  assert.ok(
    COMPANIES.length >= 50,
    `Expected at least 50 companies, found ${COMPANIES.length}`
  );
  const problemIds = new Set(PROBLEMS.map((p) => p.id));

  for (const company of COMPANIES) {
    assert.ok(company.id.length > 0);
    assert.ok(company.name.length > 0);
    assert.ok(company.featuredQuestions.length >= 3, `${company.name} should have at least 3 featured questions`);
    for (const q of company.featuredQuestions) {
      assert.ok(
        problemIds.has(q.problemId),
        `Company ${company.name} references unknown problemId: ${q.problemId}`
      );
    }
  }
});

test('every problem provides both Python and Java solutions with non-empty code and complexity notes', () => {
  assert.ok(PROBLEMS.length >= 12);
  for (const problem of PROBLEMS) {
    assert.ok(problem.python.code.includes('def ') || problem.python.code.includes('class '));
    assert.ok(problem.java.code.includes('class '));
    assert.ok(problem.python.timeComplexity.length > 0);
    assert.ok(problem.java.timeComplexity.length > 0);
  }
});

test('traceEngine generates multi-step memory, stack, and pointer traces for all problems', () => {
  for (const problem of PROBLEMS) {
    const steps = generateExecutionTrace(problem.id, problem.defaultInput);
    assert.ok(steps.length >= 2, `Problem ${problem.id} should produce >= 2 execution steps`);
    const first = steps[0];
    assert.ok(first.stackFrames.length >= 1, `Problem ${problem.id} step 0 must have stack frame`);
    assert.ok(first.heapObjects.length >= 1, `Problem ${problem.id} step 0 must have heap object`);
    assert.ok(first.pythonLine >= 1);
    assert.ok(first.javaLine >= 1);
  }
});

test('traceEngine dynamically recomputes linked list pointer reversal for custom inputs', () => {
  const customSteps = generateExecutionTrace('reverse-linked-list', '7 -> 14 -> 21');
  const lastStep = customSteps[customSteps.length - 1];
  assert.ok(lastStep.stdout?.includes('21 -> 14 -> 7'));
  assert.equal(lastStep.heapObjects[0].cells.length, 3);
});

test('traceEngine dynamically computes Trapping Rain Water for custom elevation arrays', () => {
  const steps = generateExecutionTrace('trapping-rain-water', '3, 0, 2, 0, 4');
  const lastStep = steps[steps.length - 1];
  assert.ok(lastStep.stdout?.includes('7 units'), `Expected 7 units of water, got ${lastStep.stdout}`);
});
