import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { AlertCircle, RefreshCw } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
import useCountUp from "../../hooks/useCountUp";
import API from "../../api/axios";

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

/* ── Error ─────────────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <AlertCircle size={28} style={{ color: "var(--red)", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>Failed to load data</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)",
        borderRadius: 6, padding: "7px 18px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retry</button>
    </div>
  );
}

/* ── Chart tooltip ────────────────────────────────────────────────────── */
const ttStyle = { backgroundColor: "var(--surface-2)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "8px 12px" };
const ttLabel = { color: "var(--text-2)", fontSize: 11 };
const ttItem = { color: "var(--text-1)", fontSize: 11 };

/* ── Initials ─────────────────────────────────────────────────────────── */
function ini(name) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

/* ── Loading skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><Skel w={160} h={20} /><Skel w={220} h={12} style={{ marginTop: 6 }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[0, 1, 2, 3].map(i => <GlowCard key={i}><Skel h={70} /></GlowCard>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10 }}>
        <GlowCard><Skel h={230} /></GlowCard>
        <GlowCard><Skel h={230} /></GlowCard>
      </div>
    </PageWrapper>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ORG DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
export default function OrgDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try { const { data: res } = await API.get("/admin/dashboard-stats"); setData(res); }
    catch (err) { setError(err.response?.data?.message || err.message || "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalEmp = useCountUp(data?.totalEmployees ?? 0);
  const goalsApproved = useCountUp(data?.approvedGoals ?? 0);
  const pendingApprovals = useCountUp(data?.pendingApprovals ?? 0);
  const avgCompletion = useCountUp(data?.overallCompletionPct ?? 0);

  if (loading) return <DashboardSkeleton />;
  if (error) return <PageWrapper><ErrorState message={error} onRetry={fetchData} /></PageWrapper>;
  if (!data) return null;

  const barData = (data.departmentBreakdown || []).map(d => ({ dept: d.dept, planned: d.totalGoals, actual: d.completedGoals }));
  const goalsByStatus = data.goalsByStatus || {};
  const pieColors = { Approved: "#4ade80", Submitted: "#60a5fa", Draft: "#fbbf24", Rejected: "#f87171" };
  const pieData = [
    { name: "Approved", value: goalsByStatus.approved || 0 },
    { name: "Submitted", value: goalsByStatus.submitted || 0 },
    { name: "Draft", value: goalsByStatus.draft || 0 },
    { name: "Rejected", value: goalsByStatus.rejected || 0 },
  ];
  const performers = (data.topPerformers || []).map((p, i) => ({ rank: String(i + 1).padStart(2, "0"), name: p.name, dept: p.department, initials: ini(p.name), score: p.avgScore }));
  const pending = (data.pendingCheckIns || []).slice(0, 3);

  return (
    <PageWrapper>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>Organization Dashboard</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>FY 2025-26 · Real-time performance overview</p>
        </div>
        <button onClick={fetchData} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)",
          borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
        >
          <RefreshCw size={13} strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Employees", value: totalEmp, sub: `Across ${barData.length} departments` },
          { label: "Goals Approved", value: goalsApproved, sub: `of ${data.totalGoals} total`,
            badge: { text: `${data.totalGoals > 0 ? Math.round((data.approvedGoals / data.totalGoals) * 100) : 0}%`, color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)" } },
          { label: "Pending Approvals", value: pendingApprovals, sub: data.pendingApprovals > 0 ? "Needs attention" : "All clear",
            badge: data.pendingApprovals > 0 ? { text: "!", color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)" } : null },
          { label: "Avg Completion", value: `${avgCompletion}%`, sub: "Check-in progress" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.25 }}>
            <GlowCard>
              <div style={{ position: "relative" }}>
                {kpi.badge && (
                  <span style={{
                    position: "absolute", top: -2, right: -2, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                    background: kpi.badge.bg, color: kpi.badge.color, border: `1px solid ${kpi.badge.border}`,
                  }}>{kpi.badge.text}</span>
                )}
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", marginBottom: 8, fontWeight: 500 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-1)", lineHeight: 1, letterSpacing: -0.5 }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{kpi.sub}</div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10, marginBottom: 16 }}>
        <GlowCard>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>Planned vs Actual</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>By department</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={barData} barGap={6}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dept" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={ttItem} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="planned" fill="#71717a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#e4e4e7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, background: "#71717a", borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>Planned</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, background: "#e4e4e7", borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>Actual</span>
            </div>
          </div>
        </GlowCard>

        <GlowCard>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>Goal Status</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>All employees</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} stroke="none">
                {pieData.map((entry, i) => <Cell key={i} fill={pieColors[entry.name]} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={ttItem} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {pieData.map(item => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: pieColors[item.name] }} />
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <GlowCard>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>Top Performers</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--blue)", cursor: "pointer" }}>View all</span>
          </div>
          {performers.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", padding: "16px 0" }}>No data yet</div>}
          {performers.map((p, i) => (
            <div key={p.rank} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: i < performers.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-4)", width: 18 }}>{p.rank}</span>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "var(--surface-3)",
                border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-2)", fontWeight: 500, fontSize: 10, flexShrink: 0,
              }}>{p.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{p.dept}</div>
              </div>
              <div style={{ width: 64, height: 4, background: "var(--surface-3)", borderRadius: 100, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(p.score, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  style={{ height: "100%", borderRadius: 100, background: p.score >= 80 ? "var(--green)" : p.score >= 50 ? "var(--amber)" : "var(--red)" }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", width: 40, textAlign: "right" }}>{p.score}%</span>
            </div>
          ))}
        </GlowCard>

        <GlowCard>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", marginBottom: 12 }}>Pending Check-ins</div>
          {pending.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", padding: "16px 0" }}>All check-ins complete</div>}
          {pending.map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: i < pending.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "var(--surface-3)",
                border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-2)", fontWeight: 500, fontSize: 10, flexShrink: 0,
              }}>{ini(p.name || "?")}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--text-1)" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{p.department} · {p.quarter}</div>
              </div>
              <span style={{
                background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)",
                fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 4,
              }}>Pending</span>
            </div>
          ))}
        </GlowCard>
      </div>
    </PageWrapper>
  );
}
