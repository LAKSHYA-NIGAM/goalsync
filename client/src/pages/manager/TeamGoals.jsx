import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { StatusBadge, UomBadge, LockedBadge, AchievementBadge, QuarterBadge } from "../../components/common/Badge";
import { formatNumber, calcScore } from "../../utils/scoreCalculator";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const ChevDown = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>);
const LockIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>);
const FilterIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>);

function Avatar({ name, size = 32 }) {
  const ini = (name || "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex items-center justify-center rounded-full font-semibold select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "linear-gradient(135deg,#6366F1,#38BDF8)", color: "#fff" }}>
      {ini}
    </div>
  );
}

export default function TeamGoals() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [thrustFilter, setThrustFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get("/goals/team");
        setTeam(data.team || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Flatten goals with employee info ── */
  const allGoals = team.flatMap(g =>
    g.goals.map(goal => ({ ...goal, empName: g.employee.name, empDept: g.employee.department, empId: g.employee._id }))
  );

  /* ── Derive filter options ── */
  const employees = [...new Map(team.map(t => [t.employee._id, t.employee.name])).entries()];
  const thrustAreas = [...new Set(allGoals.map(g => g.thrustArea).filter(Boolean))];

  /* ── Apply filters ── */
  const filtered = allGoals.filter(g => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (employeeFilter !== "all" && g.empId !== employeeFilter) return false;
    if (thrustFilter !== "all" && g.thrustArea !== thrustFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      </div>
    );
  }

  if (!loading && team.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', color: '#3a3a3a'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
      <div style={{ fontSize: '14px', color: '#525252', marginBottom: '4px' }}>
        No team goals found
      </div>
      <div style={{ fontSize: '12px', color: '#3a3a3a' }}>
        Start by adding your first goal for FY 2025–26
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Goals</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{allGoals.length} total goals across {team.length} team member{team.length !== 1 ? "s" : ""}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
        <FilterIcon className="w-4 h-4 text-gray-400" />

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Employees</option>
          {employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>

        <select value={thrustFilter} onChange={e => setThrustFilter(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Thrust Areas</option>
          {thrustAreas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {(statusFilter !== "all" || employeeFilter !== "all" || thrustFilter !== "all") && (
          <button onClick={() => { setStatusFilter("all"); setEmployeeFilter("all"); setThrustFilter("all"); }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Clear filters</button>
        )}

        <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Goals table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3 w-8"></th>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Goal Title</th>
                <th className="px-5 py-3">Thrust Area</th>
                <th className="px-5 py-3">UoM</th>
                <th className="px-5 py-3 text-right">Target</th>
                <th className="px-5 py-3 text-right">Wt %</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filtered.map((goal) => {
                const expanded = expandedId === goal._id;
                const hasAchievements = goal.achievements && goal.achievements.length > 0;
                const latestScore = hasAchievements
                  ? calcScore(goal.uomType, goal.target, goal.achievements[goal.achievements.length - 1].actual)
                  : null;

                return (
                  <motion.tr key={goal._id} layout className="group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                    onClick={() => setExpandedId(expanded ? null : goal._id)}>
                    {/* Expand chevron */}
                    <td className="px-5 py-3">
                      {hasAchievements && (
                        <ChevDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={goal.empName} size={28} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{goal.empName}</p>
                          <p className="text-[11px] text-gray-400">{goal.empDept}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 dark:text-white">{goal.title}</span>
                        {goal.isLocked && <LockIcon className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{goal.thrustArea || "—"}</td>
                    <td className="px-5 py-3"><UomBadge uomType={goal.uomType} /></td>

                    <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">
                      {goal.uomType === "timeline"
                        ? (goal.deadline ? new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—")
                        : formatNumber(goal.target)}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center justify-center w-10 h-6 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                        {goal.weightage}%
                      </span>
                    </td>

                    <td className="px-5 py-3"><StatusBadge status={goal.status} /></td>

                    <td className="px-5 py-3 text-right">
                      {latestScore !== null ? (
                        <span className={`text-sm font-bold ${latestScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : latestScore >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500"}`}>
                          {latestScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}

              {/* Expanded achievement rows */}
              {filtered.map((goal) => {
                if (expandedId !== goal._id || !goal.achievements?.length) return null;
                return (
                  <tr key={`${goal._id}-exp`}>
                    <td colSpan={9} className="px-0 py-0">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50/80 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800"
                      >
                        <div className="px-8 py-4">
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quarterly Achievements</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {goal.achievements.map((a) => {
                              const score = calcScore(goal.uomType, goal.target, a.actual);
                              return (
                                <div key={a.quarter} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <QuarterBadge quarter={a.quarter} />
                                    <AchievementBadge status={a.status} />
                                  </div>
                                  <div className="flex items-end justify-between">
                                    <div>
                                      <p className="text-[11px] text-gray-400">Actual</p>
                                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(a.actual)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[11px] text-gray-400">Score</p>
                                      <p className={`text-lg font-bold ${score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 50 ? "text-amber-500" : "text-red-500"}`}>{score}%</p>
                                    </div>
                                  </div>
                                  {a.updatedAt && (
                                    <p className="text-[10px] text-gray-400 mt-2">Updated {new Date(a.updatedAt).toLocaleDateString("en-IN")}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', color: '#3a3a3a'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
            <div style={{ fontSize: '14px', color: '#525252', marginBottom: '4px' }}>
              No team goals found
            </div>
            <div style={{ fontSize: '12px', color: '#3a3a3a' }}>
              Start by adding your first goal for FY 2025–26
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
