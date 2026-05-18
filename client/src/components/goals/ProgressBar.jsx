import { motion } from "framer-motion";

/**
 * ProgressBar — visual target-vs-actual with score coloring.
 *
 * @param {{ target: number, actual: number, uomType: string, score: number, showLabel?: boolean, height?: number }} props
 */
export default function ProgressBar({ target, actual, uomType, score, showLabel = true, height = 8 }) {
  /* Compute fill percentage (capped at 100 for the bar) */
  let fillPct = 0;

  if (uomType === "zero") {
    fillPct = score === 100 ? 100 : 10; // visual: thin red sliver if non-zero
  } else if (uomType === "timeline") {
    fillPct = score === 100 ? 100 : 0;
  } else if (uomType === "max") {
    // Lower is better: target is the ideal, actual should be <= target
    if (actual != null && target) {
      fillPct = Math.min(100, (target / Math.max(actual, 1)) * 100);
    }
  } else {
    // min: Higher is better
    if (actual != null && target) {
      fillPct = Math.min(100, (actual / target) * 100);
    }
  }

  /* Score-based color */
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-500"
      : "bg-red-500";

  const textColor =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-bold min-w-[42px] text-right ${textColor}`}>
          {score}%
        </span>
      )}
    </div>
  );
}
