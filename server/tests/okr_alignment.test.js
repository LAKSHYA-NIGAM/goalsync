import assert from 'node:assert';
import test from 'node:test';
import { resolveOkrHierarchy } from '../services/okrAlignmentCascade.js';

test('resolveOkrHierarchy: builds parent-child tree and computes alignment score', () => {
  const objectives = [
    { id: 'obj-1', title: 'Grow Annual Revenue by 30%', isCompanyLevel: true },
    { id: 'obj-2', title: 'Expand Enterprise Sales Pipeline', parentId: 'obj-1', isCompanyLevel: false },
    { id: 'obj-3', title: 'Launch Self-Service Onboarding', parentId: 'obj-1', isCompanyLevel: false },
  ];

  const result = resolveOkrHierarchy(objectives);
  assert.strictEqual(result.rootObjectives.length, 1);
  assert.strictEqual(result.rootObjectives[0].children.length, 2);
  assert.strictEqual(result.alignedCount, 2);
  assert.strictEqual(result.orphanedCount, 0);
  assert.strictEqual(result.alignmentScore, 100);
});

test('resolveOkrHierarchy: detects orphaned departmental objectives', () => {
  const objectives = [
    { id: 'obj-1', title: 'Company Mission', isCompanyLevel: true },
    { id: 'obj-2', title: 'Rogue Department Project', parentId: null, isCompanyLevel: false },
  ];

  const result = resolveOkrHierarchy(objectives);
  assert.strictEqual(result.orphanedCount, 1);
  assert.strictEqual(result.alignedCount, 0);
  assert.strictEqual(result.alignmentScore, 0);
});
