/**
 * Server-side score calculator — mirrors client/src/utils/scoreCalculator.js
 */

function calcScore(uomType, target, actual) {
  try {
    switch (uomType) {
      case "min": {
        if (!target || target === 0) return 0;
        return round((actual / target) * 100);
      }
      case "max": {
        if (!actual || actual === 0) return 0;
        return round((target / actual) * 100);
      }
      case "zero": {
        return actual === 0 ? 100 : 0;
      }
      case "timeline": {
        const t = new Date(target);
        const a = new Date(actual);
        if (isNaN(t.getTime()) || isNaN(a.getTime())) return 0;
        return a <= t ? 100 : 0;
      }
      default:
        return 0;
    }
  } catch {
    return 0;
  }
}

function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { calcScore };
