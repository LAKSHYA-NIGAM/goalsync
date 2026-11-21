/**
 * Milestone Deadline Health & Escalation Detector
 * Computes calendar day deltas, classifies urgency levels,
 * and triggers managerial escalation alerts for high-risk goals.
 */

class DeadlineDetector {
  /**
   * Evaluates milestone deadline health.
   * @param {Object} milestone - { id, title, dueDate, progressPercentage, isCompleted }
   * @param {Date|number} [currentDate] - optional current date override for testing
   */
  static evaluateMilestone(milestone, currentDate = new Date()) {
    if (!milestone || !milestone.dueDate) {
      return {
        status: 'UNKNOWN',
        daysRemaining: null,
        isEscalationRequired: false,
        alert: null
      };
    }

    if (milestone.isCompleted || Number(milestone.progressPercentage) >= 100) {
      return {
        status: 'COMPLETED',
        daysRemaining: null,
        isEscalationRequired: false,
        alert: null
      };
    }

    const now = new Date(currentDate).getTime();
    const due = new Date(milestone.dueDate).getTime();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.floor((due - now) / msPerDay);
    const progress = Number(milestone.progressPercentage) || 0;

    let status = 'ON_TRACK';
    let isEscalationRequired = false;
    let alert = null;

    if (daysRemaining < 0) {
      const daysOverdue = Math.abs(daysRemaining);
      status = 'OVERDUE';
      // Escalate if overdue by more than 2 days or progress is below 60%
      if (daysOverdue >= 2 || progress < 60) {
        isEscalationRequired = true;
        alert = `CRITICAL: Milestone '${milestone.title || milestone.id}' is ${daysOverdue} day(s) overdue with only ${progress}% progress.`;
      }
    } else if (daysRemaining <= 7) {
      status = 'APPROACHING_DEADLINE';
      if (progress < 50) {
        isEscalationRequired = true;
        alert = `WARNING: Milestone '${milestone.title || milestone.id}' is due in ${daysRemaining} day(s) but progress is only ${progress}%.`;
      }
    }

    return {
      status,
      daysRemaining,
      progressPercentage: progress,
      isEscalationRequired,
      alert
    };
  }

  /**
   * Scans a list of milestones and returns all that require manager escalation.
   */
  static getEscalations(milestones, currentDate = new Date()) {
    if (!Array.isArray(milestones)) return [];
    return milestones
      .map(m => ({ milestone: m, evaluation: DeadlineDetector.evaluateMilestone(m, currentDate) }))
      .filter(item => item.evaluation.isEscalationRequired);
  }
}

module.exports = DeadlineDetector;
