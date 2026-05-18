import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Search, X } from "lucide-react";
import GlowCard from "../../components/common/GlowCard";
import PageWrapper from "../../components/common/PageWrapper";
import API from "../../api/axios";

const ROLES = ["employee", "manager", "admin"];
const DEPARTMENTS = ["Sales", "Product", "Marketing", "HR", "Finance", "Operations"];

/* ── Helpers ──────────────────────────────────────────────────────────── */
function ini(name) { return (name || "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

function Avatar({ name, size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "var(--surface-3)",
      border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-2)", fontWeight: 500, fontSize: size * 0.36, flexShrink: 0,
    }}>{ini(name)}</div>
  );
}

function RoleBadge({ role }) {
  const map = {
    admin:    { bg: "var(--red-bg)",   color: "var(--red)",   border: "var(--red-border)" },
    manager:  { bg: "var(--blue-bg)",  color: "var(--blue)",  border: "var(--blue-border)" },
    employee: { bg: "var(--surface-3)", color: "var(--text-2)", border: "var(--border-2)" },
  };
  const s = map[role] || map.employee;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em",
      padding: "2px 7px", borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{role}</span>
  );
}

function Skel({ w = "100%", h = 16, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 4,
      background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

const inputStyle = {
  width: "100%", height: 36, background: "var(--surface-2)",
  border: "1px solid var(--border)", borderRadius: 6,
  padding: "0 10px", color: "var(--text-1)", fontSize: 13,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
};

const handleFocus = (e) => { e.target.style.borderColor = "var(--border-3)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)"; };
const handleBlur = (e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; };

/* ══════════════════════════════════════════════════════════════════════════
   USER MANAGEMENT PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee", department: "", managerId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/admin/users");
      setUsers(data.users || []);
      setManagers((data.users || []).filter(u => u.role === "manager" || u.role === "admin"));
    } catch { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (panel && nameRef.current) setTimeout(() => nameRef.current?.focus(), 200); }, [panel]);

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "employee", department: "", managerId: "" });
    setError(""); setPanel("create");
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: "", role: user.role, department: user.department || "", managerId: user.manager?._id || "" });
    setError(""); setPanel(user._id);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (panel === "create" && !form.password) { setError("Password is required for new users"); return; }
    setSaving(true); setError("");
    try {
      if (panel === "create") {
        await API.post("/admin/users", { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role, department: form.department, managerId: form.managerId || null });
      } else {
        await API.put(`/admin/users/${panel}`, { name: form.name.trim(), role: form.role, department: form.department, managerId: form.managerId || null });
      }
      setPanel(null); await fetchUsers();
    } catch (err) { setError(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || "").toLowerCase().includes(q);
  });

  if (loading) return (
    <PageWrapper>
      <div style={{ marginBottom: 20 }}><Skel w={180} h={20} /><Skel w={120} h={12} style={{ marginTop: 6 }} /></div>
      <GlowCard><Skel h={300} /></GlowCard>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3, margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{users.length} user{users.length !== 1 ? "s" : ""} in system</p>
        </div>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--text-1)", border: "none", color: "var(--bg)",
          borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={14} strokeWidth={2} /> Add User
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", maxWidth: 320, marginBottom: 16 }}>
        <Search size={14} strokeWidth={1.5} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, department…"
          style={{ ...inputStyle, paddingLeft: 32 }} onFocus={handleFocus} onBlur={handleBlur} />
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {["User", "Role", "Department", "Manager", "Goals", ""].map(h => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: h === "" ? "right" : "left",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: "var(--text-4)", fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "10px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.name} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 16px" }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-2)" }}>{u.department || "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-3)" }}>{u.manager?.name || "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>{u.goalCount ?? 0}</td>
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  <button onClick={() => openEdit(u)} title="Edit" style={{
                    width: 28, height: 28, borderRadius: 6, border: "none",
                    background: "transparent", color: "var(--text-4)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-4)"; }}
                  >
                    <Pencil size={14} strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: "var(--text-3)" }}>No users found.</div>}
      </div>

      {/* ── Side Panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }}
              onClick={() => setPanel(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              style={{
                position: "fixed", top: 0, right: 0, zIndex: 50, width: "100%", maxWidth: 400,
                height: "100%", background: "var(--bg)", borderLeft: "1px solid var(--border)",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Panel header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>{panel === "create" ? "Add User" : "Edit User"}</h3>
                <button onClick={() => setPanel(null)} style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 4, display: "flex" }}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Panel form */}
              <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                {error && (
                  <div style={{
                    background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 6,
                    padding: "8px 12px", fontSize: 12, color: "var(--red)",
                  }}>{error}</div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Name *</label>
                  <input ref={nameRef} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                    disabled={panel !== "create"} style={{ ...inputStyle, opacity: panel !== "create" ? 0.5 : 1 }} onFocus={handleFocus} onBlur={handleBlur} />
                </div>

                {panel === "create" && (
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                      style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={selectStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={selectStyle}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Reporting Manager</label>
                  <select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} style={selectStyle}>
                    <option value="">None</option>
                    {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                  </select>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: "auto" }}>
                  <button type="submit" disabled={saving} style={{
                    width: "100%", height: 38, borderRadius: 6, border: "none",
                    background: "var(--text-1)", color: "var(--bg)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    opacity: saving ? 0.5 : 1, transition: "opacity 0.15s",
                  }}
                    onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = saving ? "0.5" : "1"; }}
                  >
                    {saving ? "Saving…" : panel === "create" ? "Create User" : "Update User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
