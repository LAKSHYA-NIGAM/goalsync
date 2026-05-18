import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, Users, Target, RefreshCw } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
import useCountUp from "../../hooks/useCountUp";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function Skel({ w = "100%", h = 16, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 4,
      background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

function DashSkeleton() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><Skel w={160} h={20} /><Skel w={220} h={12} style={{ marginTop: 6 }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[0,1,2,3].map(i => <GlowCard key={i}><Skel h={70} /></GlowCard>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10 }}>
        <GlowCard><Skel h={230} /></GlowCard>
        <GlowCard><Skel h={230} /></GlowCard>
      </div>
    </PageWrapper>
  );
}

/* ── Error ─────────────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <AlertCircle size={28} style={{ color: "var(--red)", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>Failed to load dashboard</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)",
        borderRadius: 6, padding: "7px 18px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retry</button>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const ttStyle = { backgroundColor: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "8px 12px" };
const ttLabel = { color: "var(--text-2)", fontSize: 11 };
const ttItem  = { color: "var(--text-1)", fontSize: 11 };

function ini(name = "") { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

function statusColor(status) {
  if (status === "approved") return { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)", label: "Approved" };
  if (status === "submitted") return { color: "var(--blue)",  bg: "var(--blue-bg)",  border: "var(--blue-border)",  label: "Pending" };
  if (status === "rejected")  return { color: "var(--red)",   bg: "var(--red-bg)",   border: "var(--red-border)",   label: "Rejected" };
  return { color: "var(--text-3)", bg: "var(--surface-3)", border: "var(--border-2)", label: "Draft" };
}

/* ══════════════════════════════════════════════════════════════════════════
   MANAGER DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [team,    setTeam]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await API.get("/goals/team");
      setTeam(data.team || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  /* ── Derived metrics ──────────────────────────────────────────────── */
  const allGoals      = team.flatMap(e => e.goals);
  const totalGoals    = allGoals.length;
  const pendingCount  = allGoals.filter(g => g.status === "submitted").length;
  const approvedCount = allGoals.filter(g => g.status === "approved").length;
  const teamSize      = team.length;

  // Avg score from achievements
  const scores = allGoals.flatMap(g => (g.achievements || []).map(a => a.score)).filter(s => s != null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

  // Bar chart: goals per employee
  const barData = team.map(e => ({
    name: (e.employee?.name || "").split(" ")[0],
    approved: e.goals.filter(g => g.status === "approved").length,
    pending:  e.goals.filter(g => g.status === "submitted").length,
    draft:    e.goals.filter(g => g.status === "draft").length,
  }));

  // Count-ups
  const cTeamSize   = useCountUp(teamSize);
  const cPending    = useCountUp(pendingCount);
  const cApproved   = useCountUp(approvedCount);
  const cAvgScore   = useCountUp(avgScore);

  if (loading) return <DashSkeleton />;
  if (error)   return <PageWrapper><ErrorState message={error} onRetry={fetchTeam} /></PageWrapper>;

  return (
    <PageWrapper>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>
            Manager Dashboard
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Welcome back, {user?.name?.split(" ")[0]} · FY 2025-26 overview
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/manager/approvals")} style={{
            background: "#ededed", border: "none", color: "#0a0a0a", borderRadius: 6,
            padding: "7px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#d4d4d4"}
            onMouseLeave={e => e.currentTarget.style.background = "#ededed"}
          >
            {pendingCount > 0 ? `Review ${pendingCount} Pending` : "Approvals"}
          </button>
          <button onClick={fetchTeam} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)",
            borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";   e.currentTarget.style.color = "var(--text-2)"; }}
          >
            <RefreshCw size={13} strokeWidth={1.5} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 16 }}>
        {[
          {
            label: "Team Size", value: cTeamSize,
            icon: <Users size={16} strokeWidth={1.5} style={{ color: "var(--blue)" }} />,
            sub: "Direct reports",
          },
          {
            label: "Pending Approvals", value: cPending,
            icon: <Clock size={16} strokeWidth={1.5} style={{ color: "var(--amber)" }} />,
            sub: pendingCount > 0 ? "Needs attention" : "All clear",
            badge: pendingCount > 0 ? { text: "!", color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)" } : null,
          },
          {
            label: "Goals Approved", value: cApproved,
            icon: <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: "var(--green)" }} />,
            sub: `of ${totalGoals} total`,
          },
          {
            label: "Avg Team Score", value: `${cAvgScore}%`,
            icon: <Target size={16} strokeWidth={1.5} style={{ color: "var(--text-3)" }} />,
            sub: avgScore >= 80 ? "On track 🎯" : avgScore > 0 ? "Needs focus" : "No check-ins",
          },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlowCard>
              <div style={{ position: "relative" }}>
                {kpi.badge && (
                  <span style={{
                    position: "absolute", top: -2, right: -2, fontSize: 10, fontWeight: 600, padding: "2px 7px",
                    borderRadius: 4, background: kpi.badge.bg, color: kpi.badge.color, border: `1px solid ${kpi.badge.border}`,
                  }}>{kpi.badge.text}</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                  {kpi.icon}
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 500 }}>
                    {kpi.label}
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-1)", letterSpacing: -0.5, lineHeight: 1 }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 6 }}>{kpi.sub}</div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10, marginBottom: 16 }}>

        {/* Bar chart */}
        <GlowCard>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>Goals by Employee</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>Approved · Pending · Draft</div>
          {barData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: "var(--text-4)" }}>No goals data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={ttItem} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="approved" name="Approved" fill="#4ade80" radius={[4,4,0,0]} />
                <Bar dataKey="pending"  name="Pending"  fill="#60a5fa" radius={[4,4,0,0]} />
                <Bar dataKey="draft"    name="Draft"    fill="#71717a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {[["#4ade80","Approved"],["#60a5fa","Pending"],["#71717a","Draft"]].map(([c,l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{l}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Team member list */}
        <GlowCard>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>Team Members</span>
            <span onClick={() => navigate("/manager/team")} style={{ marginLeft: "auto", fontSize: 11, color: "var(--blue)", cursor: "pointer" }}>View all</span>
          </div>
          {team.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-4)", padding: "20px 0" }}>No team members yet</div>
          )}
          {team.map((emp, i) => {
            const approved = emp.goals.filter(g => g.status === "approved").length;
            const total    = emp.goals.length;
            const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
            return (
              <div key={emp.employee?._id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
                borderBottom: i < team.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", background: "var(--surface-3)",
                  border: "1px solid var(--border)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--text-2)", fontWeight: 500, fontSize: 10, flexShrink: 0,
                }}>{ini(emp.employee?.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", marginBottom: 3 }}>{emp.employee?.name}</div>
                  <div style={{ width: "100%", height: 3, background: "var(--surface-3)", borderRadius: 100, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                      style={{ height: "100%", borderRadius: 100, background: pct >= 80 ? "var(--green)" : pct > 0 ? "var(--amber)" : "var(--surface-3)" }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>{approved}/{total}</span>
              </div>
            );
          })}
        </GlowCard>
      </div>

      {/* ── Pending Approvals Table ────────────────────────────────── */}
      <GlowCard>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
            Pending Approvals
            {pendingCount > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)",
              }}>{pendingCount}</span>
            )}
          </span>
          {pendingCount > 0 && (
            <span onClick={() => navigate("/manager/approvals")} style={{ marginLeft: "auto", fontSize: 11, color: "var(--blue)", cursor: "pointer" }}>
              Review all →
            </span>
          )}
        </div>

        {pendingCount === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", gap: 8 }}>
            <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: "var(--green)" }} />
            <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>All caught up!</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>No goals pending approval</div>
          </div>
        ) : (
          <div style={{ margin: -16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Employee", "Goal Title", "Thrust Area", "Weightage", "Status"].map(h => (
                    <th key={h} style={{
                      padding: "8px 16px", textAlign: "left", fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-4)", fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.flatMap(emp =>
                  emp.goals
                    .filter(g => g.status === "submitted")
                    .slice(0, 5)
                    .map(g => {
                      const sc = statusColor(g.status);
                      return (
                        <tr key={g._id}
                          style={{ borderBottom: "1px solid var(--surface-2)", transition: "background 0.1s", cursor: "pointer" }}
                          onClick={() => navigate("/manager/approvals")}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%", background: "var(--surface-3)",
                                border: "1px solid var(--border-2)", display: "flex", alignItems: "center",
                                justifyContent: "center", color: "var(--text-2)", fontWeight: 500, fontSize: 8, flexShrink: 0,
                              }}>{ini(emp.employee?.name)}</div>
                              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{emp.employee?.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-1)", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.title}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase" }}>
                            {g.thrustArea || "—"}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-2)" }}>
                            {g.weightage}%
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                            }}>{sc.label}</span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>
    </PageWrapper>
  );
}
