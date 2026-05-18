import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { UomBadge, AchievementBadge } from "../../components/common/Badge";
import ProgressBar from "../../components/goals/ProgressBar";
import { calcScore, formatNumber } from "../../utils/scoreCalculator";

const LinkIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>);
const LockIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>);
const SyncIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>);

const QUARTERS = ["Q1","Q2","Q3","Q4"];
function currentQuarter() { const m = new Date().getMonth(); if(m<3)return"Q1";if(m<6)return"Q2";if(m<9)return"Q3";return"Q4"; }

export default function SharedGoalView() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [quarter, setQuarter] = useState(currentQuarter);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get("/shared-goals/my");
        setGoals(data.goals || []);
      } catch (err) { setError(err.response?.data?.message || "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Goals</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{goals.length} shared goal{goals.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}
            className="fixed top-4 right-4 z-50 bg-violet-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
            <SyncIcon className="w-4 h-4"/> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quarter tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 w-fit">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setQuarter(q)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${quarter===q?"bg-indigo-600 text-white shadow-sm":"text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
            {q}
          </button>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4"><LinkIcon className="w-8 h-8 text-violet-400"/></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No shared goals</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Your manager or admin hasn't assigned any shared KPIs to you yet.</p>
        </div>
      )}

      <div className="grid gap-4">
        {goals.map((goal, idx) => {
          const achievement = goal.achievements?.find(a => a.quarter === quarter);
          const score = achievement ? calcScore(goal.uomType, goal.target, achievement.actual) : null;

          return (
            <motion.div key={goal._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:idx*0.04}}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Header bar */}
              <div className="bg-violet-50 dark:bg-violet-900/10 border-b border-violet-100 dark:border-violet-800/30 px-5 py-2.5 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-violet-600 dark:text-violet-400"/>
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">Shared KPI</span>
                {goal.sharedGoalId?.department && <span className="text-[11px] text-violet-500 ml-auto">{goal.sharedGoalId.department}</span>}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {goal.thrustArea && <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400">{goal.thrustArea}</span>}
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {goal.title}
                      <LockIcon className="w-4 h-4 text-amber-500 flex-shrink-0" title="Title is synced and read-only"/>
                    </h3>
                    {goal.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{goal.description}</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <UomBadge uomType={goal.uomType}/>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        Target: <strong className="text-gray-700 dark:text-gray-300">{goal.uomType==="timeline" ? (goal.deadline ? new Date(goal.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—") : formatNumber(goal.target)}</strong>
                        <LockIcon className="w-3 h-3 text-gray-400"/>
                      </span>
                    </div>
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center flex-shrink-0">
                    <div className="text-center">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-none">{goal.weightage}</span>
                      <span className="block text-[10px] text-indigo-400 font-medium">%</span>
                    </div>
                  </div>
                </div>

                {/* Achievement for selected quarter */}
                {achievement ? (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">{quarter} Achievement</span>
                      <AchievementBadge status={achievement.status}/>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[11px] text-gray-400">Actual</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(achievement.actual)}</p>
                      </div>
                      <div className="flex-1"><ProgressBar target={goal.target} actual={achievement.actual} uomType={goal.uomType} score={score} height={8}/></div>
                    </div>
                    {achievement.updatedAt && (
                      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                        <SyncIcon className="w-3 h-3"/> Synced {new Date(achievement.updatedAt).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl px-4 py-6 text-center">
                    <p className="text-xs text-gray-400">No {quarter} data yet — achievements sync automatically from the primary owner.</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
