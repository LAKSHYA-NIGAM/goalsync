const test = require('node:test');
const assert = require('node:assert/strict');
const { calcScore } = require('../services/scoreService');

test('calcScore: calculates minimum target score (actual / target * 100)', () => {
  // 80 achieved against target of 100 = 80%
  assert.equal(calcScore('min', 100, 80), 80);
  // Exceeded target: 120 against 100 = 120%
  assert.equal(calcScore('min', 100, 120), 120);
  // 0 target guard prevents division by zero
  assert.equal(calcScore('min', 0, 50), 0);
  assert.equal(calcScore('min', null, 50), 0);
});

test('calcScore: calculates maximum limit score (target / actual * 100)', () => {
  // Bug budget of 10, actual was 10 = 100%
  assert.equal(calcScore('max', 10, 10), 100);
  // Bug budget of 10, actual was 20 (worse) = 50%
  assert.equal(calcScore('max', 10, 20), 50);
  // Bug budget of 10, actual was 5 (better) = 200%
  assert.equal(calcScore('max', 10, 5), 200);
  // 0 actual guard prevents division by zero
  assert.equal(calcScore('max', 10, 0), 0);
});

test('calcScore: zero incident target score (0 = 100%, >0 = 0%)', () => {
  assert.equal(calcScore('zero', 0, 0), 100);
  assert.equal(calcScore('zero', 0, 1), 0);
  assert.equal(calcScore('zero', 0, 5), 0);
});

test('calcScore: timeline target score evaluates completion against deadline', () => {
  const targetDeadline = '2025-06-30';

  // Completed on or before deadline
  assert.equal(calcScore('timeline', targetDeadline, '2025-06-25'), 100);
  assert.equal(calcScore('timeline', targetDeadline, '2025-06-30'), 100);

  // Completed after deadline
  assert.equal(calcScore('timeline', targetDeadline, '2025-07-01'), 0);

  // Invalid date inputs return 0
  assert.equal(calcScore('timeline', 'invalid-date', '2025-06-25'), 0);
  assert.equal(calcScore('timeline', targetDeadline, 'bad-date'), 0);
});

test('calcScore: unsupported UOM types gracefully return 0', () => {
  assert.equal(calcScore('unsupported_type', 100, 100), 0);
  assert.equal(calcScore(null, 100, 100), 0);
});
