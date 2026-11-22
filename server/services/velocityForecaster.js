/**
 * GoalSync Key Result Velocity Forecaster
 * Computes average daily progress velocity and projects whether key results
 * will reach target values by their assigned target end date.
 */

export function forecastKeyResultCompletion({
  startValue = 0,
  currentValue = 0,
  targetValue = 100,
  startDateStr,
  targetDateStr,
  currentDateStr = new Date().toISOString(),
} = {}) {
  const start = Number(startValue) || 0;
  const current = Number(currentValue) || 0;
  const target = Number(targetValue) || 100;

  const totalNeeded = target - start;
  const progressMade = current - start;

  if (totalNeeded <= 0) {
    return { isProjectedToFinish: true, confidence: 1.0, reason: 'Already reached or target invalid' };
  }

  const startDate = new Date(startDateStr);
  const targetDate = new Date(targetDateStr);
  const currentDate = new Date(currentDateStr);

  const daysElapsed = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.floor((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));

  const dailyVelocity = progressMade / daysElapsed;
  const projectedFutureProgress = dailyVelocity * daysRemaining;
  const projectedFinalValue = current + projectedFutureProgress;

  const isProjectedToFinish = projectedFinalValue >= target;
  const projectedCompletionRatio = projectedFinalValue / target;
  const confidence = Number(Math.max(0, Math.min(1.0, projectedCompletionRatio)).toFixed(2));

  return {
    isProjectedToFinish,
    confidence,
    dailyVelocity: Number(dailyVelocity.toFixed(2)),
    daysElapsed,
    daysRemaining,
    projectedFinalValue: Number(projectedFinalValue.toFixed(1)),
    status: isProjectedToFinish ? 'ON_SCHEDULE' : 'AT_RISK',
  };
}
