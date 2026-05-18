import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import ParticleBackground from "../../components/common/ParticleBackground";
import PageWrapper from "../../components/common/PageWrapper";

const PWD = "Demo@1234";
const roleLanding = { employee: "/employee/goals", manager: "/manager/approvals", admin: "/admin/dashboard" };
const QUICK_ROLES = [
  { label: "Employee", email: "arjun@goalsync.com", initials: "AM" },
  { label: "Manager",  email: "priya@goalsync.com", initials: "PS" },
  { label: "Admin",    email: "riya@goalsync.com",  initials: "RS" },
];

function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 11-4.24-4.24"/></svg>;
}
function Spinner() {
  return <svg style={{ animation: "spin 1s linear infinite", width: 16, height: 16, marginRight: 6 }} viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="var(--bg)" strokeWidth="3" fill="none"/><path style={{ opacity: 0.85 }} fill="var(--bg)" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/></svg>;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async (e, p) => {
    setError(""); setLoading(true);
    try { const data = await login(e, p); navigate(roleLanding[data.user.role] || "/"); }
    catch (err) { setError(err.response?.data?.message || "Invalid email or password"); }
    finally { setLoading(false); }
  };

  const handleSubmit = (ev) => { ev.preventDefault(); doLogin(email.trim(), password); };
  const handleQuick = (role) => { setEmail(role.email); setPassword(PWD); doLogin(role.email, PWD); };

  const inputStyle = {
    width: "100%", height: 38, background: "var(--surface-2)",
    border: "1px solid var(--border)", borderRadius: 6,
    padding: "0 12px", color: "var(--text-1)", fontSize: 13,
    outline: "none", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box",
  };
  const handleFocus = (e) => { e.target.style.borderColor = "var(--border-3)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)"; };
  const handleBlur = (e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; };

  return (
    <PageWrapper>
      <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
        <ParticleBackground />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          maxWidth: 400, width: "92%", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "36px 32px", zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3 }}>GoalSync</span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)" }}>Sign in</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, marginBottom: 24 }}>Welcome back. Enter your details.</div>

          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
              style={{ ...inputStyle, marginBottom: 16 }} onFocus={handleFocus} onBlur={handleBlur} />

            <label style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginBottom: 5, fontWeight: 500 }}>Password</label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter password" required style={{ ...inputStyle, paddingRight: 38 }} onFocus={handleFocus} onBlur={handleBlur} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 0, display: "flex",
              }}>{showPwd ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", height: 40, borderRadius: 6, border: "none",
              background: "var(--text-1)", color: "var(--bg)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading ? 0.7 : 1, fontFamily: "Inter, system-ui, sans-serif", transition: "opacity 0.15s",
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = loading ? "0.7" : "1"; }}
            >
              {loading ? <><Spinner /> Signing in...</> : "Sign in"}
            </button>
          </form>

          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "var(--red)", fontSize: 12, marginTop: 8, fontWeight: 500 }}>{error}</motion.p>}

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 18px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>or continue as</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {QUICK_ROLES.map(role => (
              <button key={role.email} onClick={() => handleQuick(role)} disabled={loading} style={{
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "12px 8px", textAlign: "center",
                cursor: "pointer", transition: "all 0.12s", opacity: loading ? 0.5 : 1, fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.background = "var(--surface-3)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface-2)"; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-2)", fontWeight: 500, fontSize: 11, margin: "0 auto 8px",
                }}>{role.initials}</div>
                <div style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 500 }}>{role.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{role.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
