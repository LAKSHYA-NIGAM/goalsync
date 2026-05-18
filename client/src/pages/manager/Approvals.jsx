import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Pencil } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
import API from "../../api/axios";

/* ── Constants ────────────────────────────────────────────────────────── */
const UOM_LABELS = { min: "Min", max: "Max", zero: "Zero", timeline: "Timeline" };

/* ── Helpers ──────────────────────────────────────────────────────────── */
function getInitials(name) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

function SkeletonBar({ width = "100%", height = 16, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

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

/* ── Toast system ─────────────────────────────────────────────────────── */
function useLocalToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const addToast = useCallback((message, type = "success") => {
    const id = ++idRef.current;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, addToast };
}

const TOAST_STYLES = {
  success: { borderColor: "var(--green)", Icon: Check, iconColor: "var(--green)" },
  error:   { borderColor: "var(--red)",   Icon: X,     iconColor: "var(--red)" },
  info:    { borderColor: "var(--blue)",  Icon: AlertCircle, iconColor: "var(--blue)" },
};

function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 6, zIndex: 100 }}>
      <AnimatePresence>
        {toasts.map(t => {
          const cfg = TOAST_STYLES[t.type] || TOAST_STYLES.success;
          return (
            <motion.div key={t.id} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", minWidth: 200,
                background: "var(--surface-2)", border: "1px solid var(--border-2)",
                borderRadius: 6, borderLeft: `3px solid ${cfg.borderColor}`, fontSize: 12, color: "var(--text-1)", fontFamily: "inherit",
              }}>
              <cfg.Icon size={14} style={{ color: cfg.iconColor, flexShrink: 0 }} />
              {t.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── Inline editable cell ─────────────────────────────────────────────── */
function EditableCell({ value, onSave, goalId, field, editingCell, setEditingCell }) {
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  const isEditing = editingCell?.goalId === goalId && editingCell?.field === field;

  useEffect(() => { if (isEditing && ref.current) ref.current.focus(); }, [isEditing]);
  useEffect(() => { setVal(value); }, [value]);

  const save = () => {
    setEditingCell(null);
    const parsed = typeof value === "number" ? Number(val) : val;
    if (parsed !== value) onSave(parsed);
  };

  if (isEditing) {
    return (
      <input ref={ref} type={typeof value === "number" ? "number" : "text"} value={val}
        onChange={e => setVal(e.target.value)} onBlur={save}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(value); setEditingCell(null); } }}
        style={{
          width: 80, height: 28, background: "var(--surface-3)", border: "1px solid var(--border-3)",
          borderRadius: 5, padding: "0 8px", fontSize: 12, color: "var(--text-1)", outline: "none", fontFamily: "inherit",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.04)",
        }}
      />
    );
  }

  return (
    <div onClick={() => setEditingCell({ goalId, field })} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
      onMouseEnter={e => { const icon = e.currentTarget.querySelector(".edit-icon"); if (icon) icon.style.opacity = "1"; }}
      onMouseLeave={e => { const icon = e.currentTarget.querySelector(".edit-icon"); if (icon) icon.style.opacity = "0"; }}
    >
      <span style={{ fontSize: 12, color: "var(--text-2)" }}>{typeof value === "number" ? value.toLocaleString() : value}</span>
      <Pencil className="edit-icon" size={11} strokeWidth={1.5} style={{ color: "var(--text-4)", opacity: 0, transition: "opacity 0.1s" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   APPROVALS PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function Approvals() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [approvedGoals, setApprovedGoals] = useState(new Set());
  const [rejectedGoals, setRejectedGoals] = useState(new Set());
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError] = useState(false);
  const { toasts, addToast } = useLocalToast();

  const fetchTeam = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await API.get("/goals/team");
      setTeam(data.team || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load team");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  /* ── Actions ─────────────────────────────────────────────────────── */
  const handleEditSave = async (goalId, field, value) => {
    try {
      await API.put(`/goals/${goalId}/inline-edit`, { [field]: value });
      setTeam(prev => prev.map(emp => ({
        ...emp, goals: emp.goals.map(g => g._id === goalId ? { ...g, [field]: value } : g),
      })));
      addToast("Updated", "success");
    } catch (err) { addToast(err.response?.data?.message || "Update failed", "error"); }
  };

  const handleApprove = async (goalId) => {
    try {
      await API.put(`/goals/${goalId}/approve`);
      setApprovedGoals(prev => new Set(prev).add(goalId));
      addToast("Goal approved", "success");
    } catch (err) { addToast(err.response?.data?.message || "Approval failed", "error"); }
  };

  const handleApproveAllForEmployee = async (emp) => {
    try {
      await API.post(`/goals/approve-all/${emp.employee._id}`);
      const newSet = new Set(approvedGoals);
      emp.goals.forEach(g => { if (g.status === "submitted" && !rejectedGoals.has(g._id)) newSet.add(g._id); });
      setApprovedGoals(newSet);
      addToast(`All goals for ${emp.employee.name} approved`, "success");
    } catch (err) { addToast(err.response?.data?.message || "Bulk approve failed", "error"); }
  };

  const handleApproveAll = async () => {
    for (const emp of team) {
      const submitted = emp.goals.filter(g => g.status === "submitted" && !rejectedGoals.has(g._id));
      if (submitted.length > 0) {
        try {
          await API.post(`/goals/approve-all/${emp.employee._id}`);
          const newSet = new Set(approvedGoals);
          submitted.forEach(g => newSet.add(g._id));
          setApprovedGoals(new Set(newSet));
        } catch { /* continue */ }
      }
    }
    addToast("All pending goals approved", "success");
  };

  const handleRejectConfirm = async () => {
    if (!rejectComment.trim()) { setRejectError(true); return; }
    try {
      await API.put(`/goals/${rejectModal}/reject`, { comment: rejectComment.trim() });
      setRejectedGoals(prev => new Set(prev).add(rejectModal));
      addToast("Goal rejected", "info");
    } catch (err) { addToast(err.response?.data?.message || "Reject failed", "error"); }
    setRejectModal(null); setRejectComment(""); setRejectError(false);
  };

  const getGoalTitle = (goalId) => {
    for (const emp of team) { const g = emp.goals.find(g => g._id === goalId); if (g) return g.title; }
    return "";
  };

  const totalGoals = team.reduce((s, e) => s + e.goals.length, 0);

  if (loading) return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><SkeletonBar width={140} height={18} /><SkeletonBar width={180} height={12} style={{ marginTop: 6 }} /></div>
      {[0, 1].map(i => <GlowCard key={i}><SkeletonBar height={180} style={{ marginBottom: 12 }} /></GlowCard>)}
    </PageWrapper>
  );

  if (error) return <PageWrapper><ErrorState message={error} onRetry={fetchTeam} /></PageWrapper>;

  if (!loading && team.length === 0) return (
    <PageWrapper>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 20px', color: '#3a3a3a'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
        <div style={{ fontSize: '14px', color: '#525252', marginBottom: '4px' }}>
          No pending approvals · all caught up
        </div>
        <div style={{ fontSize: '12px', color: '#3a3a3a' }}>
          Start by adding your first goal for FY 2025–26
        </div>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <ToastContainer toasts={toasts} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>Approval Queue</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{team.length} employees · {totalGoals} goals</p>
        </div>
        <button onClick={handleApproveAll} style={{
          background: "#ededed", border: "none", color: "#0a0a0a", borderRadius: 5,
          padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d4d4d4")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ededed")}
        >
          Approve All Pending
        </button>
      </div>

      {/* ── Employee sections ─────────────────────────────────────── */}
      {team.map(emp => {
        const employee = emp.employee;
        const totalWeight = emp.goals.reduce((s, g) => s + (g.weightage || 0), 0);

        return (
          <div key={employee._id} style={{ marginBottom: 12 }}>
            <GlowCard>
              <div style={{ margin: -16 }}>
                {/* Employee header */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--surface-2)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: "var(--surface-3)",
                    border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-2)", fontWeight: 500, fontSize: 11, flexShrink: 0,
                  }}>{getInitials(employee.name)}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{employee.name}</span>
                  <span style={{
                    background: "var(--surface-3)", border: "1px solid var(--border-2)",
                    color: "var(--text-2)", fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 500,
                  }}>{employee.department}</span>
                  <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 4 }}>{emp.goals.length} goals</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: totalWeight === 100 ? "var(--green)" : "var(--red)" }}>
                    {totalWeight}%
                  </span>
                  <button onClick={() => handleApproveAllForEmployee(emp)} style={{
                    background: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green)",
                    fontSize: 11, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s", marginLeft: 8,
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#122a12")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--green-bg)")}
                  >Approve All</button>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {["Thrust Area", "Goal Title", "UoM", "Target", "Weightage", "Actions"].map(h => (
                        <th key={h} style={{
                          padding: "9px 16px", textAlign: h === "Actions" ? "right" : "left",
                          fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em",
                          color: "var(--text-4)", fontWeight: 500,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emp.goals.map((goal, gi) => {
                      const isApproved = approvedGoals.has(goal._id) || goal.status === "approved";
                      const isRejected = rejectedGoals.has(goal._id) || goal.status === "rejected";
                      const isPending = goal.status === "submitted" && !isApproved && !isRejected;
                      const rowOpacity = (isApproved || isRejected) ? 0.5 : 1;

                      return (
                        <tr key={goal._id} style={{
                          opacity: rowOpacity, transition: "background 0.1s",
                          borderBottom: "1px solid var(--surface-2)",
                        }}
                          onMouseEnter={(e) => { if (isPending) e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "11px 16px", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase" }}>
                            {goal.thrustArea || "--"}
                          </td>
                          <td style={{ padding: "11px 16px", fontSize: 12, fontWeight: 500, color: "var(--text-2)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {goal.title}
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{ fontSize: 10, color: "var(--text-3)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 3 }}>
                              {UOM_LABELS[goal.uomType] || goal.uomType}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            {isPending ? (
                              <EditableCell value={goal.target ?? 0} onSave={v => handleEditSave(goal._id, "target", v)} goalId={goal._id} field="target" editingCell={editingCell} setEditingCell={setEditingCell} />
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{goal.target != null ? (typeof goal.target === "number" ? goal.target.toLocaleString() : goal.target) : "--"}</span>
                            )}
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            {isPending ? (
                              <EditableCell value={goal.weightage ?? 0} onSave={v => handleEditSave(goal._id, "weightage", v)} goalId={goal._id} field="weightage" editingCell={editingCell} setEditingCell={setEditingCell} />
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{goal.weightage}%</span>
                            )}
                          </td>
                          <td style={{ padding: "11px 16px", textAlign: "right" }}>
                            {isApproved ? (
                              <span style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 500 }}>Approved</span>
                            ) : isRejected ? (
                              <span style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)", fontSize: 10, padding: "2px 7px", borderRadius: 3, fontWeight: 500 }}>Rejected</span>
                            ) : isPending ? (
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <button onClick={() => handleApprove(goal._id)} style={{
                                  background: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green)",
                                  fontSize: 11, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s",
                                }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#122a12")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--green-bg)")}
                                >Approve</button>
                                <button onClick={() => { setRejectModal(goal._id); setRejectComment(""); setRejectError(false); }} style={{
                                  background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)",
                                  fontSize: 11, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s",
                                }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#2a1414")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--red-bg)")}
                                >Reject</button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 10, color: "var(--text-4)" }}>{goal.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlowCard>
          </div>
        );
      })}

      {/* ── Reject modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {rejectModal !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => { setRejectModal(null); setRejectComment(""); setRejectError(false); }}
          >
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 420, width: "100%", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 24 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Reject Goal</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, marginBottom: 16 }}>{getGoalTitle(rejectModal)}</p>
              <textarea value={rejectComment} onChange={e => { setRejectComment(e.target.value); if (e.target.value.trim()) setRejectError(false); }}
                rows={4} placeholder="Reason for rejection (required)..."
                style={{
                  width: "100%", background: "var(--surface-2)", border: "1px solid var(--border-2)",
                  borderRadius: 5, padding: "8px 10px", color: "var(--text-1)", fontSize: 13,
                  outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box", minHeight: 80,
                }}
                onFocus={e => { e.target.style.borderColor = "var(--border-3)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-2)"; e.target.style.boxShadow = "none"; }}
              />
              {rejectError && <p style={{ fontSize: 10, color: "var(--red)", marginTop: 4 }}>Comment is required</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={handleRejectConfirm} disabled={!rejectComment.trim()} style={{
                  background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)",
                  padding: "6px 14px", borderRadius: 5, fontWeight: 500,
                  cursor: rejectComment.trim() ? "pointer" : "not-allowed",
                  opacity: rejectComment.trim() ? 1 : 0.45,
                  fontFamily: "inherit", fontSize: 12,
                }}>Confirm Reject</button>
                <button onClick={() => { setRejectModal(null); setRejectComment(""); setRejectError(false); }} style={{
                  background: "transparent", border: "1px solid var(--border-2)", color: "var(--text-3)",
                  padding: "6px 14px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
