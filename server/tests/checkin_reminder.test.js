import assert from 'node:assert';
import test from 'node:test';
import { evaluateCheckInStatus } from '../services/checkInReminderService.js';

test('evaluateCheckInStatus: flags overdue weekly check-in', () => {
  const kr = {
    id: 'kr-1',
    title: 'Acquire 500 New Enterprise Users',
    cadence: 'weekly', // 7 days max
    lastCheckInDate: '2026-01-01',
  };

  const status = evaluateCheckInStatus(kr, '2026-01-12'); // 11 days elapsed
  assert.strictEqual(status.isOverdue, true);
  assert.strictEqual(status.status, 'OVERDUE');
  assert.strictEqual(status.daysElapsed, 11);
  assert.ok(status.message.includes('overdue by 4 day(s)'));
});

test('evaluateCheckInStatus: healthy on-track check-in', () => {
  const kr = {
    id: 'kr-2',
    title: 'Increase NPS to 65',
    cadence: 'weekly',
    lastCheckInDate: '2026-01-05',
  };

  const status = evaluateCheckInStatus(kr, '2026-01-08'); // 3 days elapsed
  assert.strictEqual(status.isOverdue, false);
  assert.strictEqual(status.status, 'ON_TRACK');
});

test('evaluateCheckInStatus: flags never checked in', () => {
  const kr = { id: 'kr-3', title: 'New Initiative', lastCheckInDate: null };
  const status = evaluateCheckInStatus(kr, '2026-01-08');
  assert.strictEqual(status.isOverdue, true);
  assert.strictEqual(status.status, 'NEVER_CHECKED_IN');
});
