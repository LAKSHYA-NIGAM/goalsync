/**
 * GoalSync Check-in Cadence & Overdue Reminder Service
 * Evaluates days since last check-in against expected frequency (weekly: 7d, biweekly: 14d, monthly: 30d).
 */

export const CADENCE_DAYS = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export function evaluateCheckInStatus(keyResult, currentDateStr = new Date().toISOString()) {
  if (!keyResult) {
    return { isOverdue: false, daysElapsed: 0, status: 'UNKNOWN' };
  }

  const cadence = (keyResult.cadence || 'weekly').toLowerCase();
  const maxDays = CADENCE_DAYS[cadence] || 7;

  const lastCheckIn = keyResult.lastCheckInDate ? new Date(keyResult.lastCheckInDate) : null;
  if (!lastCheckIn || isNaN(lastCheckIn.getTime())) {
    return {
      keyResultId: keyResult.id,
      title: keyResult.title,
      isOverdue: true,
      daysElapsed: 999,
      status: 'NEVER_CHECKED_IN',
      message: 'Key result has never received a check-in update.',
    };
  }

  const now = new Date(currentDateStr);
  const diffTime = Math.max(0, now.getTime() - lastCheckIn.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysElapsed > maxDays;

  return {
    keyResultId: keyResult.id,
    title: keyResult.title,
    isOverdue,
    daysElapsed,
    maxAllowedDays: maxDays,
    status: isOverdue ? 'OVERDUE' : 'ON_TRACK',
    message: isOverdue
      ? `Check-in overdue by ${daysElapsed - maxDays} day(s)`
      : `Last updated ${daysElapsed} day(s) ago (next due in ${maxDays - daysElapsed} days)`,
  };
}
