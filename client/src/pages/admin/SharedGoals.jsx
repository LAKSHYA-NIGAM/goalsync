import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Link2, RefreshCw, AlertCircle } from "lucide-react";
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

function SharedGoalsSkeleton() {
  return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><SkeletonBar width={120} height={18} /><SkeletonBar width={200} height={12} style={{ marginTop: 6 }} /></div>
      {[0, 1, 2].map(i => <GlowCard key={i} style={{ marginBottom: 12 }}><SkeletonBar height={100} /></GlowCard>)}
    </PageWrapper>
  );
}

/* ── Error ────────────────────────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <AlertCircle size={28} style={{ color: "var(--red)", marginBottom: 12 }} />
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 4 }}>Failed to load shared goals</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{message}</div>
      <button onClick={onRetry} style={{
        background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-2)",
        borderRadius: 5, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>Retry</button>
    </div>
  );
}

const UOM_LABELS = { min: "Min", max: "Max", zero: "Zero", timeline: "Timeline" };

const inputStyle = {
  width: "100%", background: "var(--surface-2)", border: "1px solid var(--border-2)",
  borderRadius: 5, padding: "0 10px", height: 34, color: "var(--text-1)", fontSize: 13,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const UOM_OPTIONS = [
  { key: "min", label: "Min", desc: "Higher is better" },
  { key: "max", label: "Max", desc: "Lower is better" },
  { key: "zero", label: "Zero", desc: "Zero target" },
  { key: "timeline", label: "Timeline", desc: "Date-based" },
];

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDeadline(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ══════════════════════════════════════════════════════════════════════════
   SHARED GOALS PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function SharedGoals() {
  const [sharedGoals, setSharedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDept, setFormDept] = useState("Sales");
  const [formUom, setFormUom] = useState("min");
  const [formTarget, setFormTarget] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formWeightage, setFormWeightage] = useState(20);
  const [formError, setFormError] = useState("");

  const fetchSharedGoals = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await API.get("/shared-goals");
      setSharedGoals(data.sharedGoals || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load shared goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSharedGoals(); }, [fetchSharedGoals]);

  const handleCreate = async () => {
    if (!formTitle.trim()) { setFormError("Title is required"); return; }
    setSaving(true); setFormError("");
    try {
      await API.post("/shared-goals", {
        title: formTitle.trim(),
        department: formDept,
        uomType: formUom,
        target: formUom === "timeline" ? null : Number(formTarget),
        deadline: formDeadline || null,
        weightage: Number(formWeightage),
      });
      setShowModal(false);
      setFormTitle(""); setFormDept("Sales"); setFormUom("min");
      setFormTarget(""); setFormDeadline(""); setFormWeightage(20);
      fetchSharedGoals();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleFocus = (e) => { e.target.style.borderColor = "var(--border-3)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)"; };
  const handleBlur = (e) => { e.target.style.borderColor = "var(--border-2)"; e.target.style.boxShadow = "none"; };

  if (loading) return <SharedGoalsSkeleton />;
  if (error) return <PageWrapper><ErrorState message={error} onRetry={fetchSharedGoals} /></PageWrapper>;

  return (
    <PageWrapper>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>Shared Goals</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Department KPIs cascaded to individuals</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: "#ededed", border: "none", color: "#0a0a0a", borderRadius: 5,
          padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d4d4d4")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ededed")}
        >+ Create Shared KPI</button>
      </div>

      {/* ── Empty state ────────────────────────────────────────── */}
      {sharedGoals.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 20px', color: '#3a3a3a'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
          <div style={{ fontSize: '14px', color: '#525252', marginBottom: '4px' }}>No shared goals yet</div>
          <div style={{ fontSize: '12px', color: '#3a3a3a' }}>Create a shared KPI to cascade it across your team</div>
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      {sharedGoals.map((goal, gi) => {
        const linked = goal.linkedGoalIds || [];
        const assignedCount = linked.length;

        // Compute avg achievement from linked goals' achievements
        const scores = [];
        for (const g of linked) {
          if (g.achievements?.length) {
            const last = g.achievements[g.achievements.length - 1];
            if (last?.score != null) scores.push(last.score);
          }
        }
        const avgAchievement = scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : null;

        const assignedEmps = linked
          .map(g => g.employeeId)
          .filter(Boolean)
          .filter((e, i, arr) => arr.findIndex(x => (x?._id || x) === (e?._id || e)) === i);

        return (
          <motion.div key={goal._id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05, duration: 0.3 }}
            style={{ marginBottom: 12 }}
          >
            <GlowCard>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{
                    background: "var(--surface-3)", border: "1px solid var(--border-2)",
                    color: "var(--text-2)", fontSize: 10, padding: "2px 7px", borderRadius: 3,
                    display: "inline-block", marginBottom: 6, fontWeight: 500,
                  }}>{goal.department || "All"}</span>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", letterSpacing: -0.2 }}>{goal.title}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, color: "var(--text-3)", border: "1px solid var(--border)",
                    padding: "2px 7px", borderRadius: 3, background: "var(--surface-2)",
                  }}>{assignedCount} assigned</span>
                  <button style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 2, display: "flex", transition: "color 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
                  ><Pencil size={14} strokeWidth={1.5} /></button>
                  <button style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 2, display: "flex", transition: "color 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--blue)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
                  ><Link2 size={14} strokeWidth={1.5} /></button>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <span style={{ border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>
                  {UOM_LABELS[goal.uomType] || goal.uomType}
                </span>
                <span style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 10, padding: "2px 8px", borderRadius: 3, color: "var(--text-3)" }}>
                  Target: {goal.target != null ? Number(goal.target).toLocaleString() : "—"}
                </span>
                <span style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 10, padding: "2px 8px", borderRadius: 3, color: "var(--text-3)" }}>
                  Due: {formatDeadline(goal.deadline)}
                </span>
              </div>

              {/* Assigned + progress */}
              <div style={{ borderTop: "1px solid var(--surface-2)", marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 6 }}>Assigned to:</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {assignedEmps.slice(0, 4).map((emp, ai) => {
                    const name = typeof emp === "object" ? emp?.name : String(emp);
                    return (
                      <div key={ai} title={name} style={{
                        width: 24, height: 24, borderRadius: "50%", background: "var(--surface-3)",
                        border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-2)", fontWeight: 500, fontSize: 8,
                        marginLeft: ai === 0 ? 0 : -6, zIndex: 4 - ai, position: "relative",
                      }}>{getInitials(name)}</div>
                    );
                  })}
                  {assignedEmps.length > 4 && (
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", background: "var(--surface-3)",
                      border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-3)", fontWeight: 500, fontSize: 8, marginLeft: -6, position: "relative",
                    }}>+{assignedEmps.length - 4}</div>
                  )}
                  {assignedEmps.length === 0 && <span style={{ fontSize: 11, color: "var(--text-4)" }}>None yet</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {avgAchievement !== null && (
                      <>
                        <div style={{ width: 100, height: 3, background: "var(--surface-3)", borderRadius: 100, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${Math.min(avgAchievement, 100)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                            style={{ height: "100%", borderRadius: 100, background: avgAchievement >= 80 ? "var(--green)" : "var(--amber)" }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>Avg: {avgAchievement}%</span>
                      </>
                    )}
                    {avgAchievement === null && <span style={{ fontSize: 10, color: "var(--text-4)" }}>No check-ins yet</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <RefreshCw size={10} strokeWidth={1.5} style={{ color: "var(--text-4)" }} />
                    <span style={{ fontSize: 10, color: "var(--text-4)" }}>
                      {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString("en-IN") : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        );
      })}

      {/* ── Create modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 480, width: "100%", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 24, maxHeight: "85vh", overflowY: "auto" }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", margin: 0, marginBottom: 16 }}>Create Shared KPI</h3>

              <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>Goal Title</label>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Achieve 95% Customer Satisfaction"
                style={{ ...inputStyle, marginBottom: 12 }} onFocus={handleFocus} onBlur={handleBlur} />

              <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>Department</label>
              <select value={formDept} onChange={(e) => setFormDept(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12, cursor: "pointer", appearance: "none", WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
                }}
              >
                <option value="Sales">Sales</option>
                <option value="Product">Product</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
                <option value="All Departments">All Departments</option>
              </select>

              <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>Unit of Measurement</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
                {UOM_OPTIONS.map((u) => (
                  <button key={u.key} onClick={() => setFormUom(u.key)} style={{
                    background: formUom === u.key ? "var(--surface-3)" : "var(--surface-2)",
                    border: `1px solid ${formUom === u.key ? "var(--border-3)" : "var(--border)"}`,
                    borderRadius: 5, padding: "8px 4px", textAlign: "center",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: formUom === u.key ? "var(--text-1)" : "var(--text-2)" }}>{u.label}</div>
                    <div style={{ fontSize: 9, color: "var(--text-4)", marginTop: 2 }}>{u.desc}</div>
                  </button>
                ))}
              </div>

              {formUom !== "timeline" && (
                <>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>Target</label>
                  <input value={formTarget} onChange={(e) => setFormTarget(e.target.value)} type="number"
                    placeholder="e.g. 95"
                    style={{ ...inputStyle, marginBottom: 12 }} onFocus={handleFocus} onBlur={handleBlur} />
                </>
              )}

              <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>Deadline</label>
              <input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12, color: "var(--text-3)" }} onFocus={handleFocus} onBlur={handleBlur} />

              <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>Default Weightage (%)</label>
              <input value={formWeightage} onChange={(e) => setFormWeightage(e.target.value)} type="number" min={10} max={100}
                placeholder="e.g. 20"
                style={{ ...inputStyle, marginBottom: 14 }} onFocus={handleFocus} onBlur={handleBlur} />

              {formError && <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 10 }}>{formError}</p>}

              <button onClick={handleCreate} disabled={saving} style={{
                width: "100%", background: saving ? "var(--surface-3)" : "#ededed", border: "none", color: saving ? "var(--text-3)" : "#0a0a0a",
                padding: "8px 16px", borderRadius: 5, fontWeight: 500, fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.15s",
              }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#d4d4d4"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#ededed"; }}
              >{saving ? "Creating…" : "Create & Save"}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
