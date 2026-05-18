import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import API from "../../api/axios";
import { UomBadge, AchievementBadge } from "../../components/common/Badge";
import ProgressBar from "../../components/goals/ProgressBar";
import { calcScore, formatNumber } from "../../utils/scoreCalculator";

/* ── Quarter helpers ───────────────────────────────────────────────────── */
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

function currentQuarter() {
  const m = new Date().getMonth(); // 0-11
  if (m < 3) return "Q1";
  if (m < 6) return "Q2";
  if (m < 9) return "Q3";
  return "Q4";
}

/* ── Status options ────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", color: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
  { value: "on_track",    label: "On Track",    color: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" },
  { value: "completed",   label: "Completed",   color: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
];

/* ── Icons ─────────────────────────────────────────────────────────────── */
const SaveIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>);
const CheckCircle = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>);

export default function CheckIns() {
  const [quarter, setQuarter] = useState(currentQuarter);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState({}); // { goalId: true }
  const [saved, setSaved] = useState({}); // { goalId: true } — flash feedback
  const [formData, setFormData] = useState({}); // { goalId: { actual, status } }

  /* ── Fetch approved goals ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get("/goals/my");
        const approved = (data.goals || []).filter(g => g.status === "approved" && g.isLocked);
        setGoals(approved);

        // Pre-fill form data from existing achievements
        const fd = {};
        for (const g of approved) {
          const existing = g.achievements?.find(a => a.quarter === quarter);
          fd[g._id] = {
            actual: existing?.actual ?? "",
            status: existing?.status ?? "not_started",
          };
        }
        setFormData(fd);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load goals");
      } finally {
        setLoading(false);
      }
    })();
  }, [quarter]);

  /* ── Update form ── */
  const updateField = (goalId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value },
    }));
  };

  /* ── Save check-in ── */
  const handleSave = async (goalId) => {
    const fd = formData[goalId];
    if (fd.actual === "" || fd.actual === undefined) return;

    setSaving(s => ({ ...s, [goalId]: true }));
    setError("");
    try {
      await API.post(`/goals/${goalId}/checkin`, {
        quarter,
        actual: Number(fd.actual),
        status: fd.status,
      });
      setSaved(s => ({ ...s, [goalId]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [goalId]: false })), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(s => ({ ...s, [goalId]: false }));
    }
  };

  /* ── Derived ── */
  const updatedCount = useMemo(() => {
    return goals.filter(g => {
      const a = g.achievements?.find(a => a.quarter === quarter);
      return !!a;
    }).length;
  }, [goals, quarter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quarterly Check-ins</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {updatedCount} of {goals.length} goals updated for {quarter}
          </p>
        </div>
      </div>

      {/* Quarter tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 w-fit">
        {QUARTERS.map(q => {
          const active = quarter === q;
          const isCurrent = q === currentQuarter();
          return (
            <button key={q} onClick={() => setQuarter(q)}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition
                ${active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {q}
              {isCurrent && !active && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No approved goals yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Check-ins are available once your goals are approved and locked by your manager.</p>
        </div>
      )}

      {/* Check-in cards */}
      <div className="grid gap-4">
        {goals.map((goal, idx) => {
          const fd = formData[goal._id] || { actual: "", status: "not_started" };
          const liveScore = fd.actual !== "" && fd.actual !== undefined
            ? calcScore(goal.uomType, goal.target, Number(fd.actual))
            : null;
          const isSaving = saving[goal._id];
          const isSaved = saved[goal._id];

          return (
            <motion.div key={goal._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">

              {/* Goal header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{goal.weightage}%</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <UomBadge uomType={goal.uomType} />
                      <span className="text-xs text-gray-400">
                        Target: <strong className="text-gray-600 dark:text-gray-300">
                          {goal.uomType === "timeline"
                            ? (goal.deadline ? new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—")
                            : formatNumber(goal.target)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live score */}
                {liveScore !== null && (
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <ProgressBar target={goal.target} actual={Number(fd.actual)} uomType={goal.uomType} score={liveScore} height={6} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  {/* Actual value */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      {goal.uomType === "timeline" ? "Completion Date" : "Actual Achievement"}
                    </label>
                    {goal.uomType === "timeline" ? (
                      <input type="date"
                        value={fd.actual || ""}
                        onChange={e => updateField(goal._id, "actual", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <input type="number"
                        value={fd.actual}
                        onChange={e => updateField(goal._id, "actual", e.target.value)}
                        placeholder="Enter value"
                        min={0}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => updateField(goal._id, "status", opt.value)}
                          className={`flex-1 text-[11px] font-semibold py-2 rounded-lg border-2 transition
                            ${fd.status === opt.value ? opt.color : "border-transparent bg-gray-50 dark:bg-gray-800 text-gray-400"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end">
                    <button onClick={() => handleSave(goal._id)}
                      disabled={isSaving || fd.actual === "" || fd.actual === undefined}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50
                        ${isSaved
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
                      {isSaved ? (
                        <><CheckCircle className="w-4 h-4" /> Saved</>
                      ) : isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                          Saving…
                        </>
                      ) : (
                        <><SaveIcon className="w-4 h-4" /> Save</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
