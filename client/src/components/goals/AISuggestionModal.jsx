import { motion } from "framer-motion";

const SparkleIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.272 1.278L21 12l-5.816 1.91a2 2 0 00-1.278 1.272L12 21l-1.91-5.818a2 2 0 00-1.272-1.272L3 12l5.818-1.91a2 2 0 001.272-1.278L12 3z"/></svg>);
const CheckIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>);
const XIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const BrainIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A5.5 5.5 0 005 7.5c0 .96.246 1.863.678 2.651A5.5 5.5 0 005 15.5a5.502 5.502 0 004.262 5.356M14.5 2A5.5 5.5 0 0119 7.5c0 .96-.246 1.863-.678 2.651A5.5 5.5 0 0119 15.5a5.502 5.502 0 01-4.262 5.356M12 2v20"/></svg>);

/**
 * AISuggestionModal — premium side-by-side comparison.
 *
 * @param {{ open, onClose, onApply, original: {title,description}, suggestion: {improvedTitle,improvedDescription,reasoning}, source }} props
 */
export default function AISuggestionModal({ open, onClose, onApply, original, suggestion, source }) {
  if (!open || !suggestion) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-50 via-indigo-50 to-sky-50 dark:from-violet-900/10 dark:via-indigo-900/10 dark:to-sky-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <SparkleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Goal Enhancement</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by {source === "openai" ? "GPT-3.5" : "GoalSync SMART Engine"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Original</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 line-through decoration-gray-300 dark:decoration-gray-600">
                {original?.title || "—"}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {original?.description || "No description provided"}
              </p>
            </div>

            {/* AI Suggestion */}
            <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 relative">
              <div className="absolute -top-2.5 right-3">
                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">
                  <SparkleIcon className="w-3 h-3" /> SMART
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">AI Suggestion</span>
              </div>
              <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                {suggestion.improvedTitle}
              </h4>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                {suggestion.improvedDescription}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-800/50 bg-sky-50/60 dark:bg-sky-900/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BrainIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Why this improvement?</span>
            </div>
            <p className="text-sm text-sky-800/80 dark:text-sky-300/80 leading-relaxed">
              {suggestion.reasoning}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            Keep Original
          </button>
          <button
            onClick={() => {
              onApply(suggestion.improvedTitle, suggestion.improvedDescription);
              onClose();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 transition"
          >
            <CheckIcon className="w-4 h-4" /> Apply Suggestion
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
