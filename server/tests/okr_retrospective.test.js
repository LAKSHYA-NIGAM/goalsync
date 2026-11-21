import assert from 'node:assert';
import test from 'node:test';
import { generateRetrospectiveScorecard } from '../services/okrRetrospectiveReport.js';

test('generateRetrospectiveScorecard: grades OKRs according to standard Grove/Doerr thresholds', () => {
  const results = [
    { id: '1', title: 'Q1 Scale Database', achievementScore: 0.85 }, // A
    { id: '2', title: 'Q1 Launch Webhooks', achievementScore: 0.65 }, // B
    { id: '3', title: 'Q1 Hire 5 Engineers', achievementScore: 0.50 }, // C
  ];

  const report = generateRetrospectiveScorecard(results);
  assert.strictEqual(report.objectivesGraded, 3);
  assert.strictEqual(report.overallScore, 0.67); // (0.85+0.65+0.50)/3 = 0.666... -> 0.67
  assert.strictEqual(report.overallGrade, 'B');

  assert.strictEqual(report.breakdown[0].grade, 'A');
  assert.strictEqual(report.breakdown[1].grade, 'B');
  assert.strictEqual(report.breakdown[2].grade, 'C');
});

test('generateRetrospectiveScorecard: empty list defaults cleanly', () => {
  const report = generateRetrospectiveScorecard([]);
  assert.strictEqual(report.overallScore, 0);
  assert.strictEqual(report.overallGrade, 'F');
  assert.strictEqual(report.objectivesGraded, 0);
});
