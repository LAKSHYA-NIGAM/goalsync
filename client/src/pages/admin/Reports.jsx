import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
import { StatusBadge } from "../../components/common/Badge";
import useCountUp from "../../hooks/useCountUp";
import API from "../../api/axios";

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function SkeletonBar({ width = "100%", height = 16, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

function ReportsSkeleton() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><SkeletonBar width={140} height={18} /><SkeletonBar width={100} height={12} style={{ marginTop: 6 }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[0, 1, 2].map(i => <GlowCard key={i}><SkeletonBar height={50} /></GlowCard>)}
      </div>
      <GlowCard><SkeletonBar height={34} /></GlowCard>
      <div style={{ marginTop: 12 }}>
        <SkeletonBar height={200} style={{ borderRadius: 7 }} />
      </div>
    </PageWrapper>
  );
}

/* ── Error ────────────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <AlertCircle size={28} style={{ color: "var(--red)", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>Failed to load report</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-2)",
        borderRadius: 5, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retry</button>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 80) return { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)" };
  if (score >= 50) return { color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)" };
  return { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-border)" };
}

const selectStyle = {
  background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 5, padding: "6px 10px", color: "var(--text-2)", fontSize: 12,
  outline: "none", cursor: "pointer", fontFamily: "inherit", minWidth: 120, height: 34,
  appearance: "none", WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
};

/* ── CSV export helper ────────────────────────────────────────────────── */
function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const UOM_LABELS = { min: "Min", max: "Max", zero: "Zero", timeline: "Timeline" };

/* ══════════════════════════════════════════════════════════════════════════
   REPORTS PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Reports() {
  const [activeTab, setActiveTab] = useState("achievement");
  const [deptFilter, setDeptFilter] = useState("All");
  const [quarterFilter, setQuarterFilter] = useState("Q1");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [lastExported, setLastExported] = useState(null);

  // Achievement report
  const [achRows, setAchRows] = useState([]);
  const [achLoading, setAchLoading] = useState(true);
  const [achError, setAchError] = useState(null);

  // Completion report
  const [compRows, setCompRows] = useState([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compError, setCompError] = useState(null);

  const fetchAchievement = useCallback(async (dept = deptFilter, quarter = quarterFilter, year = yearFilter) => {
    setAchLoading(true); setAchError(null);
    try {
      const params = new URLSearchParams({ cycleYear: year });
      if (quarter && quarter !== "All") params.set("quarter", quarter);
      if (dept && dept !== "All") params.set("department", dept);
      const { data } = await API.get(`/reports/achievement?${params}`);
      setAchRows(data.rows || []);
    } catch (err) {
      setAchError(err.response?.data?.message || err.message || "Failed to load achievement report");
    } finally {
      setAchLoading(false);
    }
  }, [deptFilter, quarterFilter, yearFilter]);

  const fetchCompletion = useCallback(async (year = yearFilter) => {
    setCompLoading(true); setCompError(null);
    try {
      const { data } = await API.get(`/reports/completion?cycleYear=${year}`);
      setCompRows(data.rows || []);
    } catch (err) {
      setCompError(err.response?.data?.message || err.message || "Failed to load completion report");
    } finally {
      setCompLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => { fetchAchievement(); fetchCompletion(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = () => {
    if (activeTab === "achievement") fetchAchievement(deptFilter, quarterFilter, yearFilter);
    else fetchCompletion(yearFilter);
  };

  const handleExport = () => {
    if (activeTab === "achievement") {
      exportCSV(achRows, `achievement_report_${quarterFilter}_${yearFilter}.csv`);
    } else {
      exportCSV(compRows, `completion_report_${yearFilter}.csv`);
    }
    const now = new Date();
    setLastExported(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
  };

  // Summary KPIs derived from achievement data
  const achAvg = achRows.length > 0
    ? Math.round(achRows.filter(r => r.score > 0).reduce((s, r) => s + r.score, 0) / (achRows.filter(r => r.score > 0).length || 1))
    : 0;
  const onTrackCount = achRows.filter(r => r.status === "on_track" || r.status === "completed").length;
  const checkInsDone = achRows.filter(r => r.actual != null).length;
  const orgAvg = useCountUp(achAvg);

  const isLoading = activeTab === "achievement" ? achLoading : compLoading;
  const isError = activeTab === "achievement" ? achError : compError;
  const onRetry = activeTab === "achievement"
    ? () => fetchAchievement(deptFilter, quarterFilter, yearFilter)
    : () => fetchCompletion(yearFilter);

  const TABS = [
    { key: "achievement", label: "Achievement Report" },
    { key: "completion", label: "Completion Report" },
  ];

  return (
    <PageWrapper>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>Reports &amp; Analytics</h1>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <button onClick={handleExport} style={{
            background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-2)",
            borderRadius: 5, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; }}
          >Export CSV</button>
          {lastExported && (
            <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 10, color: "var(--text-4)" }}>Last exported at {lastExported}</motion.span>
          )}
        </div>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "ORG AVG SCORE", value: achLoading ? "—" : `${orgAvg}%` },
          { label: "GOALS ON TRACK", value: achLoading ? "—" : `${onTrackCount} / ${achRows.length}` },
          { label: "CHECK-INS COMPLETE", value: achLoading ? "—" : `${checkInsDone} / ${achRows.length}` },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <GlowCard>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3)", marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.5 }}>{kpi.value}</div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: "6px 14px", borderRadius: 5, fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s", border: "none",
            background: activeTab === tab.key ? "var(--surface-3)" : "transparent",
            color: activeTab === tab.key ? "var(--text-1)" : "var(--text-3)",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <GlowCard>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {activeTab === "achievement" && (
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Product">Product</option>
              <option value="Engineering">Engineering</option>
              <option value="Operations">Operations</option>
            </select>
          )}
          {activeTab === "achievement" && (
            <select value={quarterFilter} onChange={(e) => setQuarterFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Quarters</option>
              <option value="Q1">Q1</option><option value="Q2">Q2</option>
              <option value="Q3">Q3</option><option value="Q4">Q4</option>
            </select>
          )}
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={selectStyle}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <button onClick={handleGenerate} style={{
            background: "#ededed", border: "none", color: "#0a0a0a", borderRadius: 5,
            padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", height: 34, transition: "background 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d4d4d4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ededed")}
          >Generate</button>
        </div>
      </GlowCard>

      {/* ── Tables ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 12 }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
            {[0,1,2,3,4].map(i => <SkeletonBar key={i} height={44} style={{ borderRadius: 0 }} />)}
          </div>
        ) : isError ? (
          <ErrorState message={isError} onRetry={onRetry} />
        ) : activeTab === "achievement" ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Employee", "Department", "Goal Title", "Thrust Area", "UoM", "Target", "Actual", "Score", "Status"].map((h) => (
                    <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-4)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {achRows.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px 16px", fontSize: 12, color: "var(--text-4)" }}>No achievement data for the selected filters</td></tr>
                )}
                {achRows.map((row, i) => {
                  const sc = scoreColor(row.score || 0);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--surface-2)", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 16px", fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>{row.employeeName}</td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: "var(--text-3)" }}>{row.department}</td>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-2)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.goalTitle}</td>
                      <td style={{ padding: "11px 16px", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase" }}>{row.thrustArea}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 10, color: "var(--text-3)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 3 }}>{UOM_LABELS[row.uomType] || row.uomType}</span>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{row.target != null ? String(row.target) : "—"}</td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: "var(--text-2)", fontFamily: "monospace" }}>{row.actual != null ? String(row.actual) : "—"}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 3,
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                        }}>{row.score != null ? `${row.score}%` : "—"}</span>
                      </td>
                      <td style={{ padding: "11px 16px" }}><StatusBadge status={row.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
              {achRows.length > 0 && (
                <tfoot>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <td colSpan={7} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>Organization Average</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 3,
                        background: scoreColor(achAvg).bg, border: `1px solid ${scoreColor(achAvg).border}`, color: scoreColor(achAvg).color,
                      }}>{achAvg}%</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Employee", "Manager", "Department", "Goals", "Approved", "Check-ins", "Avg Score"].map((h) => (
                    <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-4)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compRows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", fontSize: 12, color: "var(--text-4)" }}>No completion data available</td></tr>
                )}
                {compRows.map((row, i) => {
                  const sc = row.overallScore > 0 ? scoreColor(row.overallScore) : { color: "var(--text-4)", bg: "var(--surface-3)", border: "var(--border-2)" };
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--surface-2)", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 16px", fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>{row.employeeName}</td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: "var(--text-2)" }}>{row.manager || "—"}</td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: "var(--text-3)" }}>{row.department}</td>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{row.totalGoals}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: row.approvedGoals === row.totalGoals && row.totalGoals > 0 ? "var(--green)" : "var(--amber)" }}>
                          {row.approvedGoals}/{row.totalGoals}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: row.checkInsCompleted > 0 ? "var(--blue)" : "var(--text-4)" }}>{row.checkInsCompleted}</span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 3,
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                        }}>{row.overallScore > 0 ? `${row.overallScore}%` : "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
