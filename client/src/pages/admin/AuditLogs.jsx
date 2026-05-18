import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
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

function AuditSkeleton() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><SkeletonBar width={120} height={18} /><SkeletonBar width={200} height={12} style={{ marginTop: 6 }} /></div>
      <GlowCard><SkeletonBar height={34} /></GlowCard>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 1 }}>
        {[0,1,2,3,4].map(i => <SkeletonBar key={i} height={44} style={{ borderRadius: 0 }} />)}
      </div>
    </PageWrapper>
  );
}

/* ── Error ────────────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <AlertCircle size={28} style={{ color: "var(--red)", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>Failed to load audit logs</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-2)",
        borderRadius: 5, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retry</button>
    </div>
  );
}

/* ── Action badge styles ──────────────────────────────────────────────── */
function getActionStyle(action) {
  const map = {
    approved:            { bg: "var(--green-bg)",  color: "var(--green)",  border: "var(--green-border)",  label: "Approved" },
    rejected:            { bg: "var(--red-bg)",    color: "var(--red)",    border: "var(--red-border)",    label: "Rejected" },
    inline_edit:         { bg: "var(--blue-bg)",   color: "var(--blue)",   border: "var(--blue-border)",   label: "Inline Edit" },
    achievement_updated: { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)",      label: "Achievement" },
    admin_unlock:        { bg: "var(--amber-bg)",  color: "var(--amber)",  border: "var(--amber-border)",  label: "Unlocked" },
    synced:              { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)",      label: "Synced" },
    submitted:           { bg: "var(--blue-bg)",   color: "var(--blue)",   border: "var(--blue-border)",   label: "Submitted" },
    goal_created:        { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)",      label: "Created" },
    goal_deleted:        { bg: "var(--red-bg)",    color: "var(--red)",    border: "var(--red-border)",    label: "Deleted" },
    goal_updated:        { bg: "var(--blue-bg)",   color: "var(--blue)",   border: "var(--blue-border)",   label: "Updated" },
    goal_submitted:      { bg: "var(--blue-bg)",   color: "var(--blue)",   border: "var(--blue-border)",   label: "Submitted" },
    user_created:        { bg: "var(--green-bg)",  color: "var(--green)",  border: "var(--green-border)",  label: "User Created" },
    user_updated:        { bg: "var(--blue-bg)",   color: "var(--blue)",   border: "var(--blue-border)",   label: "User Updated" },
  };
  return map[action] || { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)", label: action };
}

function isPositiveChange(action) {
  return ["approved", "achievement_updated", "synced", "goal_created", "user_created"].includes(action);
}

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtVal(v) {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  return String(v).slice(0, 60);
}

const selectStyle = {
  background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 5, padding: "6px 10px", color: "var(--text-2)", fontSize: 12,
  outline: "none", cursor: "pointer", fontFamily: "inherit", minWidth: 130, height: 34,
  appearance: "none", WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
};

const LIMIT = 20;

/* ══════════════════════════════════════════════════════════════════════════
   AUDIT LOGS PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters (applied on "Apply" click)
  const [entityFilter, setEntityFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Active (submitted) filter state
  const [activeFilters, setActiveFilters] = useState({ entity: "All", action: "All", fromDate: "", toDate: "" });

  const fetchLogs = useCallback(async (page = 1, filters = activeFilters) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filters.entity !== "All") params.set("entityType", filters.entity.toLowerCase());
      if (filters.action !== "All") params.set("action", filters.action);
      if (filters.fromDate) params.set("fromDate", filters.fromDate);
      if (filters.toDate) params.set("toDate", filters.toDate);

      const { data } = await API.get(`/admin/audit-logs?${params}`);
      setLogs(data.logs || []);
      setTotalCount(data.totalCount || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => { fetchLogs(1, activeFilters); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => {
    const f = { entity: entityFilter, action: actionFilter, fromDate, toDate };
    setActiveFilters(f);
    fetchLogs(1, f);
  };

  const handleClear = () => {
    setEntityFilter("All"); setActionFilter("All"); setFromDate(""); setToDate("");
    const f = { entity: "All", action: "All", fromDate: "", toDate: "" };
    setActiveFilters(f);
    fetchLogs(1, f);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));
  const pageStart = (currentPage - 1) * LIMIT + 1;
  const pageEnd = Math.min(currentPage * LIMIT, totalCount);

  if (loading) return <AuditSkeleton />;
  if (error) return <PageWrapper><ErrorState message={error} onRetry={() => fetchLogs(currentPage)} /></PageWrapper>;

  return (
    <PageWrapper>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>Audit Trail</h1>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Full change history across the organization</p>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <GlowCard>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Entities</option>
            <option value="goal">Goal</option>
            <option value="user">User</option>
            <option value="cycle">Cycle</option>
          </select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Actions</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="inline_edit">Inline Edit</option>
            <option value="achievement_updated">Achievement</option>
            <option value="admin_unlock">Unlocked</option>
            <option value="goal_created">Created</option>
            <option value="goal_submitted">Submitted</option>
            <option value="user_created">User Created</option>
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...selectStyle, color: fromDate ? "var(--text-2)" : "var(--text-3)" }} />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...selectStyle, color: toDate ? "var(--text-2)" : "var(--text-3)" }} />
          <button onClick={handleApply} style={{
            background: "#ededed", border: "none", color: "#0a0a0a", borderRadius: 5,
            padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", height: 34, transition: "background 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d4d4d4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ededed")}
          >Apply</button>
          <button onClick={handleClear}
            style={{
              background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-2)",
              borderRadius: 5, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", height: 34, transition: "all 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; }}
          >Clear</button>
        </div>
      </GlowCard>

      <p style={{ fontSize: 11, color: "var(--text-4)", margin: "10px 0" }}>
        {totalCount === 0 ? "No entries" : `Showing ${pageStart}–${pageEnd} of ${totalCount} audit entries`}
      </p>

      {/* ── Empty state ────────────────────────────────────────────── */}
      {logs.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 20px', color: '#3a3a3a'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
          <div style={{ fontSize: '14px', color: '#525252', marginBottom: '4px' }}>
            No audit entries match your filters
          </div>
          <div style={{ fontSize: '12px', color: '#3a3a3a' }}>
            Try adjusting the filters or clear them to see all entries
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      {logs.length > 0 && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Timestamp", "Action", "Entity", "Performed By", "Old Value", "New Value"].map((h) => (
                  <th key={h} style={{
                    padding: "9px 16px", textAlign: "left", fontSize: 10,
                    textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-4)", fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const style = getActionStyle(log.action);
                const performer = log.performedBy;
                const performerName = typeof performer === "object" ? performer?.name : "System";
                return (
                  <tr key={log._id} style={{ borderBottom: "1px solid var(--surface-2)", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "11px 16px", fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", whiteSpace: "nowrap" }}>{formatTs(log.timestamp)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{
                        background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                        fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 500, whiteSpace: "nowrap",
                      }}>{style.label}</span>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-2)", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.entityType || "—"}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border-2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--text-2)", fontWeight: 500, fontSize: 8, flexShrink: 0,
                        }}>{getInitials(performerName)}</div>
                        <span style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap" }}>{performerName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{
                        fontSize: 10, color: "var(--text-3)", fontFamily: "monospace",
                        background: "var(--surface-2)", padding: "2px 6px", borderRadius: 3,
                        maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block",
                      }}>{fmtVal(log.oldValue)}</span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{
                        fontSize: 10, fontFamily: "monospace",
                        color: isPositiveChange(log.action) ? "var(--green)" : "var(--text-2)",
                        background: "var(--surface-2)", padding: "2px 6px", borderRadius: 3,
                        maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block",
                      }}>{fmtVal(log.newValue)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--surface-2)" }}>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>
              {totalCount > 0 ? `Showing ${pageStart}–${pageEnd} of ${totalCount}` : "No entries"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <button onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ background: "none", border: "none", color: currentPage === 1 ? "var(--text-4)" : "var(--text-2)", fontSize: 11, cursor: currentPage === 1 ? "default" : "pointer", padding: "4px 8px", fontFamily: "inherit" }}>
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => fetchLogs(p)}
                  style={{
                    background: currentPage === p ? "var(--surface-3)" : "none", color: currentPage === p ? "var(--text-1)" : "var(--text-4)",
                    border: "none", borderRadius: 3, padding: "4px 8px", fontSize: 11,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>{p}</button>
              ))}
              <button onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{ background: "none", border: "none", color: currentPage >= totalPages ? "var(--text-4)" : "var(--text-2)", fontSize: 11, cursor: currentPage >= totalPages ? "default" : "pointer", padding: "4px 8px", fontFamily: "inherit" }}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
