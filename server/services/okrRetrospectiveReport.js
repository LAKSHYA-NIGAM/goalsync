/**
 * GoalSync OKR Retrospective Scorecard Generator
 * Evaluates final quarter OKR achievement percentages, assigns standard Andy Grove / Doerr grade bands:
 * A (0.8 - 1.0), B (0.6 - 0.79), C (0.4 - 0.59), F (< 0.4).
 */

export function generateRetrospectiveScorecard(objectiveResults = []) {
  if (!Array.isArray(objectiveResults) || objectiveResults.length === 0) {
    return { overallScore: 0, overallGrade: 'F', objectivesGraded: 0, breakdown: [] };
  }

  const breakdown = objectiveResults.map((obj) => {
    const rawScore = Number(obj.achievementScore) || 0;
    const score = Math.max(0, Math.min(1.0, rawScore));

    let grade = 'F';
    let assessment = 'Failed to make meaningful progress';

    if (score >= 0.8) {
      grade = 'A';
      assessment = 'Exceptional goal achievement';
    } else if (score >= 0.6) {
      grade = 'B';
      assessment = 'Solid delivery (ideal sweet-spot for stretch OKRs)';
    } else if (score >= 0.4) {
      grade = 'C';
      assessment = 'Substantial progress made, but critical gaps remain';
    }

    return {
      id: obj.id,
      title: obj.title,
      score: Number(score.toFixed(2)),
      grade,
      assessment,
    };
  });

  const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
  const overallScore = Number((totalScore / breakdown.length).toFixed(2));

  let overallGrade = 'F';
  if (overallScore >= 0.8) overallGrade = 'A';
  else if (overallScore >= 0.6) overallGrade = 'B';
  else if (overallScore >= 0.4) overallGrade = 'C';

  return {
    overallScore,
    overallGrade,
    objectivesGraded: breakdown.length,
    breakdown,
  };
}
