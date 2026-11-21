/**
 * OKR Weighted Progress and Confidence Score Aggregator
 * Computes aggregate objective completion, weighted key results,
 * and forecast confidence indices.
 */

class OKRCalculator {
  /**
   * Calculates overall progress for an Objective based on its Key Results.
   * If weights are not provided, key results are weighted equally.
   * @param {Array} keyResults - [{ id, title, target, current, weight }]
   * @returns {Object} { progressPercentage, isCompleted, keyResultsCount }
   */
  static calculateObjectiveProgress(keyResults) {
    if (!Array.isArray(keyResults) || keyResults.length === 0) {
      return { progressPercentage: 0, isCompleted: false, keyResultsCount: 0 };
    }

    const totalWeight = keyResults.reduce((sum, kr) => sum + (Number(kr.weight) || 1), 0);
    if (totalWeight <= 0) {
      return { progressPercentage: 0, isCompleted: false, keyResultsCount: keyResults.length };
    }

    let weightedSum = 0;
    for (const kr of keyResults) {
      const target = Number(kr.target) || 1;
      const current = Number(kr.current) || 0;
      const weight = Number(kr.weight) || 1;

      // Cap individual KR progress at 100% to prevent one over-performing KR from masking others
      const krProgress = Math.min(100, Math.max(0, (current / target) * 100));
      weightedSum += krProgress * weight;
    }

    const progressPercentage = Math.round((weightedSum / totalWeight) * 10) / 10;

    return {
      progressPercentage,
      isCompleted: progressPercentage >= 100,
      keyResultsCount: keyResults.length
    };
  }

  /**
   * Calculates an OKR Confidence Score (0.0 to 1.0) based on progress vs elapsed timeline.
   * @param {number} progressPercentage - (0 to 100)
   * @param {number} elapsedTimelinePercentage - (0 to 100)
   * @param {number} checkInCount - Number of check-ins recorded
   */
  static evaluateHealthStatus(progressPercentage, elapsedTimelinePercentage, checkInCount = 1) {
    const progress = Math.min(100, Math.max(0, progressPercentage));
    const elapsed = Math.min(100, Math.max(1, elapsedTimelinePercentage));

    // Ratio of progress made compared to timeline elapsed
    const pacingRatio = progress / elapsed;

    let status = 'ON_TRACK';
    let confidenceScore = 1.0;

    if (progress >= 100) {
      status = 'COMPLETED';
      confidenceScore = 1.0;
    } else if (pacingRatio >= 0.85) {
      status = 'ON_TRACK';
      confidenceScore = Math.min(1.0, Math.round(pacingRatio * 100) / 100);
    } else if (pacingRatio >= 0.5) {
      status = 'NEEDS_ATTENTION';
      confidenceScore = Math.round(pacingRatio * 100) / 100;
    } else {
      status = 'AT_RISK';
      confidenceScore = Math.max(0.1, Math.round(pacingRatio * 100) / 100);
    }

    // Penalize stale goals that lack frequent check-ins
    if (checkInCount < 2 && elapsed > 50) {
      confidenceScore = Math.max(0.1, Math.round((confidenceScore * 0.8) * 100) / 100);
      if (status === 'ON_TRACK') status = 'NEEDS_ATTENTION';
    }

    return {
      status,
      confidenceScore,
      pacingRatio: Math.round(pacingRatio * 100) / 100
    };
  }
}

module.exports = OKRCalculator;
