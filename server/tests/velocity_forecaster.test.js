import assert from 'node:assert';
import test from 'node:test';
import { forecastKeyResultCompletion } from '../services/velocityForecaster.js';

test('forecastKeyResultCompletion: on schedule when velocity is sufficient', () => {
  // Goal: 0 to 100 in 60 days. In 30 days, we reached 60 (velocity 2.0/day).
  // Remaining 30 days * 2 = +60 -> projected 120 (>= 100)
  const result = forecastKeyResultCompletion({
    startValue: 0,
    currentValue: 60,
    targetValue: 100,
    startDateStr: '2026-01-01',
    currentDateStr: '2026-01-31',
    targetDateStr: '2026-03-02',
  });

  assert.strictEqual(result.isProjectedToFinish, true);
  assert.strictEqual(result.status, 'ON_SCHEDULE');
  assert.strictEqual(result.dailyVelocity, 2.0);
  assert.strictEqual(result.confidence, 1.0);
});

test('forecastKeyResultCompletion: at risk when velocity is lagging', () => {
  // Goal: 0 to 100 in 60 days. In 30 days, only reached 20 (velocity ~0.67/day).
  // In remaining 30 days, will only reach ~40.
  const result = forecastKeyResultCompletion({
    startValue: 0,
    currentValue: 20,
    targetValue: 100,
    startDateStr: '2026-01-01',
    currentDateStr: '2026-01-31',
    targetDateStr: '2026-03-02',
  });

  assert.strictEqual(result.isProjectedToFinish, false);
  assert.strictEqual(result.status, 'AT_RISK');
  assert.ok(result.projectedFinalValue < 100);
});
