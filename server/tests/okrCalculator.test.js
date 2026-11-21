const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const OKRCalculator = require('../services/okrCalculator');

describe('OKRCalculator Unit Tests', () => {
  describe('calculateObjectiveProgress', () => {
    test('calculates equal-weighted progress across multiple key results', () => {
      const keyResults = [
        { id: 'kr1', target: 100, current: 50 },  // 50%
        { id: 'kr2', target: 200, current: 200 }, // 100%
        { id: 'kr3', target: 50, current: 0 }     // 0%
      ];
      const res = OKRCalculator.calculateObjectiveProgress(keyResults);
      // (50 + 100 + 0) / 3 = 50%
      assert.equal(res.progressPercentage, 50);
      assert.equal(res.isCompleted, false);
      assert.equal(res.keyResultsCount, 3);
    });

    test('respects customized importance weights', () => {
      const keyResults = [
        { id: 'kr1', target: 10, current: 10, weight: 3 }, // 100% * 3 = 300
        { id: 'kr2', target: 10, current: 0, weight: 1 }   // 0% * 1 = 0
      ];
      const res = OKRCalculator.calculateObjectiveProgress(keyResults);
      // 300 / 4 = 75%
      assert.equal(res.progressPercentage, 75);
    });

    test('caps over-performing key results at 100% to prevent masking deficiencies', () => {
      const keyResults = [
        { id: 'kr1', target: 10, current: 50, weight: 1 }, // 500% capped to 100%
        { id: 'kr2', target: 10, current: 0, weight: 1 }   // 0%
      ];
      const res = OKRCalculator.calculateObjectiveProgress(keyResults);
      // (100 + 0) / 2 = 50%
      assert.equal(res.progressPercentage, 50);
    });

    test('handles empty key results gracefully', () => {
      const res = OKRCalculator.calculateObjectiveProgress([]);
      assert.equal(res.progressPercentage, 0);
      assert.equal(res.isCompleted, false);
    });
  });

  describe('evaluateHealthStatus', () => {
    test('flags ON_TRACK when progress is keeping pace with elapsed timeline', () => {
      // 60% progress with 60% elapsed timeline
      const health = OKRCalculator.evaluateHealthStatus(60, 60, 5);
      assert.equal(health.status, 'ON_TRACK');
      assert.ok(health.confidenceScore >= 0.85);
    });

    test('flags AT_RISK when progress severely lags elapsed timeline', () => {
      // 15% progress with 75% elapsed timeline (pacing ratio = 0.20)
      const health = OKRCalculator.evaluateHealthStatus(15, 75, 4);
      assert.equal(health.status, 'AT_RISK');
      assert.ok(health.confidenceScore < 0.5);
    });

    test('applies penalty when check-in frequency is stale (>50% elapsed with <2 checkins)', () => {
      // 55% progress with 60% elapsed timeline -> normally ON_TRACK (0.91 ratio), but only 1 check-in
      const health = OKRCalculator.evaluateHealthStatus(55, 60, 1);
      assert.equal(health.status, 'NEEDS_ATTENTION');
    });

    test('marks 100% completed goals as COMPLETED with 1.0 confidence', () => {
      const health = OKRCalculator.evaluateHealthStatus(100, 80, 2);
      assert.equal(health.status, 'COMPLETED');
      assert.equal(health.confidenceScore, 1.0);
    });
  });
});
