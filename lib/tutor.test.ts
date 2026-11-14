import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, isAllowedOrigin, parseChatBody, parseTraceBody, parseTraceSteps, sendTutorError } from './tutor.js';

test('chat: rejects missing/oversized message and code', () => {
  assert.ok('error' in parseChatBody({}));
  assert.ok('error' in parseChatBody({ message: 'x'.repeat(LIMITS.message + 1) }));
  assert.ok('error' in parseChatBody({ message: 'hi', code: 'x'.repeat(LIMITS.code + 1) }));
});

test('chat: sanitises malformed history and language', () => {
  const r: any = parseChatBody({ message: 'hi', language: '<script>', history: [null, { role: 'x', content: 5 }, { role: 'assistant', content: 'ok' }] });
  assert.equal(r.value.language, 'python');
  assert.deepEqual(r.value.history, [{ role: 'assistant', content: 'ok' }]);
});

test('trace: validates code and parseTraceSteps rejects non-arrays', () => {
  assert.ok('error' in parseTraceBody({ code: 'x'.repeat(LIMITS.code + 1) }));
  assert.throws(() => parseTraceSteps('{"a":1}'));
  assert.equal(parseTraceSteps('```json\n[{"title":"a"},1]\n```').length, 1);
});

test('origin allowlist', () => {
  assert.equal(isAllowedOrigin(undefined, 'a.com'), false);
  assert.equal(isAllowedOrigin('https://a.com', 'a.com'), true);
  assert.equal(isAllowedOrigin('https://evil.com', 'a.com'), false);
  assert.equal(isAllowedOrigin('https://evil.com', 'a.com', 'https://evil.com'), true);
});

test('errors are generic and status is clamped', () => {
  let out: any;
  const res: any = { status(n: number) { out = { n }; return { json: (b: any) => (out.b = b) }; } };
  sendTutorError(res, { status: 99999, message: 'secret key abc' }, 'test');
  assert.equal(out.n, 500);
  assert.ok(!JSON.stringify(out.b).includes('secret'));
});
