import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Pencil, Trash2, AlertCircle } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
import { StatusBadge } from "../../components/common/Badge";
import API from "../../api/axios";
import { calcScore } from "../../utils/scoreCalculator";

/* ── Constants ────────────────────────────────────────────────────────── */
const SEGMENT_COLORS = ["#ededed", "#a0a0a0", "#525252", "#4ade80", "#fbbf24", "#60a5fa"];

const UOM_LABELS = { min: "Min", max: "Max", zero: "Zero", timeline: "Timeline" };

/* ── Helpers ──────────────────────────────────────────────────────────── */
function formatTarget(goal) {
  if (goal.uomType === "timeline") return `Due: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--"}`;
  return `Target: ${goal.target != null ? Number(goal.target).toLocaleString() : "--"}`;
}

function scoreColor(score) {
  if (score >= 80) return { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)" };
  if (score >= 50) return { color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)" };
  return { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-border)" };
}

/* ── Skeleton bar ─────────────────────────────────────────────────────── */
function SkeletonBar({ width = "100%", height = 16, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

/* ── Error state ──────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <AlertCircle size={32} style={{ color: "var(--red)", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>Failed to load data</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-2)",
        borderRadius: 5, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retry</button>
    </div>
  );
}

/* ── Weightage Ring SVG ───────────────────────────────────────────────── */
function WeightageRing({ value }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={34} height={34} viewBox="0 0 34 34">
      <circle cx="17" cy="17" r={r} fill="none" stroke="var(--border)" strokeWidth={2} />
      <circle cx="17" cy="17" r={r} fill="none" stroke="var(--text-2)" strokeWidth={2}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 17 17)" style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="17" y="18" textAnchor="middle" dominantBaseline="middle" fill="var(--text-2)" fontSize={8} fontWeight={500}>
        {value}%
      </text>
    </svg>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────────────── */
function GoalsSkeleton() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}>
        <SkeletonBar width={100} height={18} />
        <SkeletonBar width={200} height={12} style={{ marginTop: 6 }} />
      </div>
      <GlowCard><SkeletonBar height={36} /></GlowCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <GlowCard key={i}><SkeletonBar height={90} /></GlowCard>
        ))}
      </div>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MY GOALS PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function MyGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await API.get("/goals/my");
      setGoals(data.goals || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load goals");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  if (loading) return <GoalsSkeleton />;
  if (error) return <PageWrapper><ErrorState message={error} onRetry={fetchGoals} /></PageWrapper>;

  if (goals.length === 0) return (
    <PageWrapper>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "var(--text-4)" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
        <div style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 4 }}>No goals yet</div>
        <div style={{ fontSize: 12, color: "var(--text-4)" }}>Start by adding your first goal for FY 2025–26</div>
      </div>
    </PageWrapper>
  );

  const totalWeightage = goals.reduce((s, g) => s + (g.weightage || 0), 0);

  return (
    <PageWrapper>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>My Goals</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            FY 2025-26 · {goals.length} goals · {totalWeightage}% budget allocated
          </p>
        </div>
        <button style={{
          background: "#ededed", border: "none", color: "#0a0a0a", borderRadius: 5,
          padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#d4d4d4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ededed"; }}
        >
          + Add Goal
        </button>
      </div>

      {/* ── Weightage budget bar ──────────────────────────────────── */}
      <GlowCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-2)" }}>Goal Budget</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: totalWeightage === 100 ? "var(--green)" : "var(--red)" }}>
            {totalWeightage} / 100%
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 100, background: "var(--surface-3)", overflow: "hidden", display: "flex" }}>
          {goals.map((g, i) => (
            <motion.div
              key={g._id}
              initial={{ width: 0 }}
              animate={{ width: `${g.weightage || 0}%` }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              style={{ height: "100%", background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
          {goals.map((g, i) => (
            <div key={g._id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: SEGMENT_COLORS[i % SEGMENT_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "var(--text-3)", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.title}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-4)" }}>{g.weightage}%</span>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* ── Goal cards ────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {goals.map((goal, i) => {
          const q1 = goal.achievements?.find((a) => a.quarter === "Q1");
          const q1Score = q1 ? calcScore(goal.uomType, goal.target, q1.actual) : null;

          return (
            <motion.div
              key={goal._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <GlowCard>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 500,
                    background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text-2)",
                  }}>
                    {goal.thrustArea || "General"}
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <StatusBadge status={goal.status} />
                    {goal.isLocked && <Lock size={12} strokeWidth={1.5} style={{ color: "var(--text-4)" }} />}
                  </div>
                </div>

                {/* Title */}
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--text-1)", letterSpacing: -0.2 }}>
                  {goal.title}
                </div>

                {/* Meta row */}
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>
                    {UOM_LABELS[goal.uomType] || goal.uomType}
                  </span>
                  <span style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 10, padding: "2px 8px", borderRadius: 3, color: "var(--text-3)" }}>
                    {formatTarget(goal)}
                  </span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                    <WeightageRing value={goal.weightage || 0} />
                    {!goal.isLocked && (
                      <Pencil size={14} strokeWidth={1.5} style={{ color: "var(--text-4)", cursor: "pointer", transition: "color 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
                      />
                    )}
                    {goal.status === "draft" && (
                      <Trash2 size={14} strokeWidth={1.5} style={{ color: "var(--text-4)", cursor: "pointer", transition: "color 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm("Delete this goal? This cannot be undone.")) return;
                          try { await API.delete(`/goals/${goal._id}`); fetchGoals(); } catch {}
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Achievement strip */}
                {goal.status === "approved" && (
                  <div style={{ borderTop: "1px solid var(--surface-2)", marginTop: 12, paddingTop: 12 }}>
                    {q1 ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, color: "var(--text-4)" }}>Q1</span>
                          <span style={{
                            fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 3,
                            background: scoreColor(q1Score).bg, border: `1px solid ${scoreColor(q1Score).border}`, color: scoreColor(q1Score).color,
                          }}>
                            {q1Score}%
                          </span>
                        </div>
                        <div style={{ width: 80, height: 3, background: "var(--surface-3)", borderRadius: 100, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${Math.min(q1Score, 100)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                            style={{ height: "100%", borderRadius: 100, background: scoreColor(q1Score).color }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "var(--text-4)" }}>Q1 · Not submitted</span>
                        <span style={{ fontSize: 10, color: "var(--blue)", cursor: "pointer" }}>Add check-in</span>
                      </div>
                    )}
                  </div>
                )}
              </GlowCard>
            </motion.div>
          );
        })}
      </div>
    </PageWrapper>
  );
}
