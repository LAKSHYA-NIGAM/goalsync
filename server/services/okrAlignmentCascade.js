/**
 * GoalSync OKR Alignment Cascade Resolver
 * Traverses parent-child objective hierarchies, calculates weighted organizational alignment,
 * and detects orphaned objectives without strategic parents.
 */

export function resolveOkrHierarchy(objectives = []) {
  if (!Array.isArray(objectives) || objectives.length === 0) {
    return { rootObjectives: [], orphanedCount: 0, alignmentScore: 0 };
  }

  const map = new Map();
  for (const obj of objectives) {
    if (obj && obj.id) {
      map.set(obj.id, { ...obj, children: [] });
    }
  }

  const roots = [];
  let alignedCount = 0;
  let orphanedCount = 0;

  for (const obj of map.values()) {
    if (obj.parentId && map.has(obj.parentId)) {
      map.get(obj.parentId).children.push(obj);
      alignedCount++;
    } else if (obj.isCompanyLevel) {
      roots.push(obj);
    } else {
      // Not company level and missing parent -> orphaned
      orphanedCount++;
      roots.push(obj);
    }
  }

  const nonRootsTotal = objectives.filter((o) => !o.isCompanyLevel).length;
  const alignmentScore = nonRootsTotal > 0
    ? Number(((alignedCount / nonRootsTotal) * 100).toFixed(1))
    : 100;

  return {
    rootObjectives: roots,
    totalObjectives: objectives.length,
    alignedCount,
    orphanedCount,
    alignmentScore,
  };
}
