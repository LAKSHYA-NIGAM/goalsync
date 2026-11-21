const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const DeadlineDetector = require('../services/deadlineDetector');

describe('DeadlineDetector Unit Tests', () => {
  const baseDate = new Date('2026-11-20T00:00:00Z');

  test('classifies completed milestone regardless of date', () => {
    const res = DeadlineDetector.evaluateMilestone(
      { id: 'm1', dueDate: '2026-11-15T00:00:00Z', isCompleted: true },
      baseDate
    );
    assert.equal(res.status, 'COMPLETED');
    assert.equal(res.isEscalationRequired, false);
  });

  test('flags APPROACHING_DEADLINE with warning escalation when due within 7 days and low progress', () => {
    const res = DeadlineDetector.evaluateMilestone(
      { id: 'm2', title: 'Launch API Beta', dueDate: '2026-11-24T00:00:00Z', progressPercentage: 30 },
      baseDate
    );
    assert.equal(res.status, 'APPROACHING_DEADLINE');
    assert.equal(res.daysRemaining, 4);
    assert.equal(res.isEscalationRequired, true);
    assert.match(res.alert, /WARNING/);
  });

  test('flags OVERDUE with critical escalation when past deadline', () => {
    const res = DeadlineDetector.evaluateMilestone(
      { id: 'm3', title: 'Security Audit', dueDate: '2026-11-17T00:00:00Z', progressPercentage: 40 },
      baseDate
    );
    assert.equal(res.status, 'OVERDUE');
    assert.equal(res.daysRemaining, -3);
    assert.equal(res.isEscalationRequired, true);
    assert.match(res.alert, /CRITICAL/);
  });

  test('marks milestone ON_TRACK when far in future', () => {
    const res = DeadlineDetector.evaluateMilestone(
      { id: 'm4', dueDate: '2026-12-20T00:00:00Z', progressPercentage: 20 },
      baseDate
    );
    assert.equal(res.status, 'ON_TRACK');
    assert.ok(res.daysRemaining > 20);
    assert.equal(res.isEscalationRequired, false);
  });

  test('filters escalations correctly from collection', () => {
    const milestones = [
      { id: 'm1', dueDate: '2026-11-22T00:00:00Z', progressPercentage: 80 }, // approaching but high progress -> no escalation
      { id: 'm2', dueDate: '2026-11-22T00:00:00Z', progressPercentage: 20 }, // approaching & low progress -> escalate
      { id: 'm3', dueDate: '2026-11-10T00:00:00Z', progressPercentage: 10 }  // overdue -> escalate
    ];
    const escalations = DeadlineDetector.getEscalations(milestones, baseDate);
    assert.equal(escalations.length, 2);
    assert.equal(escalations[0].milestone.id, 'm2');
    assert.equal(escalations[1].milestone.id, 'm3');
  });
});
