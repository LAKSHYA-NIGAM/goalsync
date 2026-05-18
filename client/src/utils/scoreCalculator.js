/**
 * Score calculator for different UoM types.
 *
 * @param {'min'|'max'|'zero'|'timeline'} uomType
 * @param {number|Date} target
 * @param {number|Date} actual
 * @returns {number} Score as a percentage (0-100+), rounded to 2 decimal places.
 */
export function calcScore(uomType, target, actual) {
  try {
    switch (uomType) {
      case "min": {
        // Higher is better — (actual / target) * 100
        if (!target || target === 0) return 0;
        return round((actual / target) * 100);
      }

      case "max": {
        // Lower is better — (target / actual) * 100
        if (!actual || actual === 0) return 0;
        return round((target / actual) * 100);
      }

      case "zero": {
        // Zero is success
        return actual === 0 ? 100 : 0;
      }

      case "timeline": {
        // Date-based — completed on or before deadline = 100
        const targetDate = new Date(target);
        const actualDate = new Date(actual);
        if (isNaN(targetDate.getTime()) || isNaN(actualDate.getTime())) return 0;
        return actualDate <= targetDate ? 100 : 0;
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

/**
 * Get a human-readable label for a UoM type.
 */
export function uomLabel(uomType) {
  const labels = {
    min: "Higher is better",
    max: "Lower is better",
    zero: "Zero is success",
    timeline: "Date-based target",
  };
  return labels[uomType] || uomType;
}

/**
 * Format a number with commas (Indian style).
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return "—";
  return Number(num).toLocaleString("en-IN");
}
