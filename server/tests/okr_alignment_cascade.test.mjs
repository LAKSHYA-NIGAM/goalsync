/**
 * Tests for OKR Alignment Cascade Resolver
 * Covers: empty input, root detection, hierarchy building, alignment scoring, orphan detection
 */
import { resolveOkrHierarchy } from '../services/okrAlignmentCascade.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('resolveOkrHierarchy - empty / degenerate input', () => {
  it('returns zero values for empty array', () => {
    const result = resolveOkrHierarchy([]);
    assert.deepEqual(result, { rootObjectives: [], orphanedCount: 0, alignmentScore: 0 });
  });

  it('handles undefined / null input gracefully', () => {
    const result = resolveOkrHierarchy(undefined);
    assert.deepEqual(result, { rootObjectives: [], orphanedCount: 0, alignmentScore: 0 });
    const result2 = resolveOkrHierarchy(null);
    assert.deepEqual(result2, { rootObjectives: [], orphanedCount: 0, alignmentScore: 0 });
  });

  it('handles non-array input', () => {
    const result = resolveOkrHierarchy('invalid');
    assert.deepEqual(result, { rootObjectives: [], orphanedCount: 0, alignmentScore: 0 });
  });
});

describe('resolveOkrHierarchy - single company-level objective', () => {
  it('a company-level objective with no parent becomes a root', () => {
    const objectives = [{ id: 'o1', isCompanyLevel: true, title: 'Grow Revenue' }];
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.rootObjectives.length, 1);
    assert.equal(result.rootObjectives[0].id, 'o1');
    assert.equal(result.orphanedCount, 0);
    assert.equal(result.alignmentScore, 100);
  });
});

describe('resolveOkrHierarchy - parent-child alignment', () => {
  const objectives = [
    { id: 'parent', isCompanyLevel: true, title: 'Company OKR' },
    { id: 'child1', parentId: 'parent', title: 'Team OKR 1' },
    { id: 'child2', parentId: 'parent', title: 'Team OKR 2' },
  ];

  it('children are nested under parent in rootObjectives', () => {
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.rootObjectives.length, 1);
    const root = result.rootObjectives[0];
    assert.equal(root.children.length, 2);
  });

  it('alignedCount equals number of children with valid parent', () => {
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.alignedCount, 2);
  });

  it('orphanedCount is 0 when all children have valid parents', () => {
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.orphanedCount, 0);
  });

  it('alignmentScore is 100 when all non-company objectives are aligned', () => {
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.alignmentScore, 100);
  });
});

describe('resolveOkrHierarchy - orphan detection', () => {
  const objectives = [
    { id: 'parent', isCompanyLevel: true, title: 'Company OKR' },
    { id: 'aligned', parentId: 'parent', title: 'Aligned Team OKR' },
    { id: 'orphan', parentId: 'nonexistent', title: 'Lost OKR' },
  ];

  it('detects orphaned objectives with missing parents', () => {
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.orphanedCount, 1);
  });

  it('orphaned objective still appears in rootObjectives', () => {
    const result = resolveOkrHierarchy(objectives);
    const orphanInRoots = result.rootObjectives.find(o => o.id === 'orphan');
    assert.ok(orphanInRoots, 'Orphan should appear in rootObjectives');
  });

  it('alignmentScore accounts for orphan (1 of 2 non-company are aligned = 50%)', () => {
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.alignmentScore, 50);
  });
});

describe('resolveOkrHierarchy - totalObjectives', () => {
  it('returns correct total count', () => {
    const objectives = [
      { id: 'o1', isCompanyLevel: true },
      { id: 'o2', parentId: 'o1' },
      { id: 'o3', parentId: 'o1' },
    ];
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.totalObjectives, 3);
  });
});

describe('resolveOkrHierarchy - ignores entries without id', () => {
  it('skips objectives with no id field', () => {
    const objectives = [
      { isCompanyLevel: true, title: 'No ID obj' }, // should be skipped
      { id: 'valid', isCompanyLevel: true, title: 'Valid' },
    ];
    const result = resolveOkrHierarchy(objectives);
    assert.equal(result.rootObjectives.length, 1);
    assert.equal(result.rootObjectives[0].id, 'valid');
  });
});
