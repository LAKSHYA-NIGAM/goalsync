import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { UomBadge, AchievementBadge } from "../../components/common/Badge";
import ProgressBar from "../../components/goals/ProgressBar";
import { calcScore, formatNumber } from "../../utils/scoreCalculator";

/* ── Helpers ───────────────────────────────────────────────────────────── */
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
function currentQuarter() {
  const m = new Date().getMonth();
  if (m < 3) return "Q1"; if (m < 6) return "Q2"; if (m < 9) return "Q3"; return "Q4";
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
const MsgIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>);
const DownloadIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>);
const CheckIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>);

function Avatar({ name, size = 28 }) {
  const ini = (name || "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex items-center justify-center rounded-full font-semibold select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "linear-gradient(135deg,#6366F1,#38BDF8)", color: "#fff" }}>
      {ini}
    </div>
  );
}

/* ── Comment Cell ──────────────────────────────────────────────────────── */
function CommentCell({ goalId, quarter, initialComment, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialComment || "");
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  useEffect(() => { setText(initialComment || ""); }, [initialComment]);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await API.post("/checkins/manager-comment", { goalId, quarter, comment: text.trim() });
      setEditing(false);
      if (onSaved) onSaved(text.trim());
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <textarea ref={ref} value={text} onChange={e => setText(e.target.value)} rows={1}
          className="flex-1 rounded-md border border-indigo-400 bg-white dark:bg-gray-950 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-w-[120px]"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") setEditing(false); }}
        />
        <button onClick={save} disabled={saving || !text.trim()} className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"><CheckIcon className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition" title="Add comment">
      {initialComment ? (
        <span className="text-gray-600 dark:text-gray-300 max-w-[150px] truncate">{initialComment}</span>
      ) : (
        <><MsgIcon className="w-3.5 h-3.5" /> Add</>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ManagerCheckIns() {
  const [quarter, setQuarter] = useState(currentQuarter);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (q) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get(`/checkins/team/${q}`);
      setResults(data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(quarter); }, [quarter]);

  /* ── Export CSV ── */
  const exportCSV = () => {
    const header = "Employee,Department,Goal,Thrust Area,UoM,Target,Actual,Score,Status,Manager Comment\n";
    const rows = results.map(r => {
      const a = r.achievement;
      const score = a ? calcScore(r.uomType, r.target, a.actual) : "";
      return [
        r.employee.name, r.employee.department || "", r.title, r.thrustArea || "", r.uomType,
        r.target ?? "", a?.actual ?? "", score, a?.status || "not_started", (r.managerComment || "").replace(/,/g, ";"),
      ].map(v => `"${v}"`).join(",");
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `team-checkins-${quarter}-FY2025.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      </div>
    );
  }

  const withAchievement = results.filter(r => r.achievement);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Check-ins</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {withAchievement.length} of {results.length} goals have {quarter} data
          </p>
        </div>
        <button onClick={exportCSV} disabled={results.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition disabled:opacity-50">
          <DownloadIcon className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Quarter tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 w-fit">
        {QUARTERS.map(q => {
          const active = quarter === q;
          const isCurrent = q === currentQuarter();
          return (
            <button key={q} onClick={() => setQuarter(q)}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition
                ${active ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {q}
              {isCurrent && !active && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Goal</th>
                <th className="px-5 py-3 text-right">Target</th>
                <th className="px-5 py-3 text-right">Actual</th>
                <th className="px-5 py-3 w-36">Progress</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {results.map((r) => {
                const a = r.achievement;
                const score = a ? calcScore(r.uomType, r.target, a.actual) : null;

                return (
                  <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.employee.name} size={28} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.employee.name}</p>
                          <p className="text-[11px] text-gray-400">{r.employee.department}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{r.title}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <UomBadge uomType={r.uomType} />
                          <span className="text-[11px] text-gray-400">{r.weightage}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">
                      {r.uomType === "timeline"
                        ? (r.deadline ? new Date(r.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—")
                        : formatNumber(r.target)}
                    </td>

                    <td className="px-5 py-3 text-right font-medium">
                      {a ? (
                        <span className="text-gray-900 dark:text-white">{r.uomType === "timeline" ? new Date(a.actual).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : formatNumber(a.actual)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      {score !== null ? (
                        <ProgressBar target={r.target} actual={a.actual} uomType={r.uomType} score={score} height={6} />
                      ) : (
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
                      )}
                    </td>

                    <td className="px-5 py-3">
                      {a ? <AchievementBadge status={a.status} /> : <span className="text-xs text-gray-400">Pending</span>}
                    </td>

                    <td className="px-5 py-3">
                      <CommentCell
                        goalId={r._id}
                        quarter={quarter}
                        initialComment={r.managerComment}
                        onSaved={(c) => {
                          setResults(prev => prev.map(x => x._id === r._id ? { ...x, managerComment: c } : x));
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No approved goals found for your team.</div>
        )}
      </div>
    </div>
  );
}
