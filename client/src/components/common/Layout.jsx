import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ParticleBackground from "./ParticleBackground";
import GlowOrbs from "./GlowOrbs";
import {
  LayoutDashboard, Target, Users, CheckSquare,
  Share2, Shield, BarChart2, LogOut, Search, Bell,
} from "lucide-react";

/* ── Avatar ────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 26 }) {
  const ini = (name || "").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--surface-3)", border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-2)", fontWeight: 500, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {ini}
    </div>
  );
}

/* ── Nav item ──────────────────────────────────────────────────────────── */
function SideNavItem({ to, icon: Icon, label }) {
  const loc = useLocation();
  const active = loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <NavLink to={to} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 10px", marginBottom: 1, borderRadius: 6, cursor: "pointer", fontSize: 13,
        color: active ? "var(--text-1)" : "var(--text-3)",
        background: active ? "var(--surface-2)" : "transparent",
        fontWeight: active ? 500 : 400,
        transition: "all 0.12s",
      }}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; } }}
      >
        <Icon size={16} strokeWidth={1.6} />
        <span>{label}</span>
      </div>
    </NavLink>
  );
}

/* ── Section header ────────────────────────────────────────────────────── */
function SectionHeader({ label }) {
  return (
    <div style={{
      fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em",
      color: "var(--text-4)", padding: "14px 10px 4px", fontWeight: 600,
    }}>
      {label}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LAYOUT
   ══════════════════════════════════════════════════════════════════════════ */
export default function Layout() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const loc = useLocation();
  const role = user?.role || "employee";

  const handleLogout = () => {
    logout();
    toast("Logged out", "info");
    navigate("/login", { replace: true });
  };

  const titles = {
    "/admin/dashboard": "Dashboard",
    "/admin/users": "Users",
    "/admin/shared-goals": "Shared KPIs",
    "/admin/audit": "Audit Logs",
    "/admin/reports": "Reports",
    "/employee/goals": "My Goals",
    "/manager/approvals": "Approvals",
    "/manager/dashboard": "Dashboard",
    "/manager/reports": "Reports",
  };
  const pageTitle = Object.entries(titles).find(([k]) => loc.pathname.startsWith(k))?.[1] || "GoalSync";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <ParticleBackground />
      <GlowOrbs />

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: "fixed", left: 0, top: 0, height: "100vh", width: 200,
        background: "var(--bg)", borderRight: "1px solid var(--border)",
        zIndex: 50, display: "flex", flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ padding: "16px 14px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5, background: "var(--text-1)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", letterSpacing: -0.3 }}>
              GoalSync
            </span>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={user?.name} size={28} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "User"}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "capitalize" }}>{role}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
          <SectionHeader label="Overview" />
          {role === "admin" && <SideNavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />}
          {role === "manager" && <SideNavItem to="/manager/dashboard" icon={LayoutDashboard} label="Dashboard" />}
          {role === "employee" && <SideNavItem to="/employee/goals" icon={LayoutDashboard} label="Dashboard" />}

          {role === "employee" && (
            <>
              <SectionHeader label="Goals" />
              <SideNavItem to="/employee/goals" icon={Target} label="My Goals" />
              <SideNavItem to="/employee/shared" icon={Share2} label="Shared Goals" />
            </>
          )}

          {role === "manager" && (
            <>
              <SectionHeader label="Approvals" />
              <SideNavItem to="/manager/approvals" icon={CheckSquare} label="Queue" />
            </>
          )}

          {role === "admin" && (
            <>
              <SectionHeader label="Manage" />
              <SideNavItem to="/admin/users" icon={Users} label="Users" />
              <SideNavItem to="/admin/shared-goals" icon={Share2} label="Shared KPIs" />
              <SideNavItem to="/admin/audit" icon={Shield} label="Audit logs" />
            </>
          )}

          <SectionHeader label="Reports" />
          <SideNavItem to={role === "admin" ? "/admin/reports" : role === "manager" ? "/manager/reports" : "/employee/reports"} icon={BarChart2} label="Reports" />
        </nav>

        {/* Logout */}
        <div
          onClick={handleLogout}
          style={{
            padding: "14px 14px", borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 8, color: "var(--text-4)", cursor: "pointer",
            fontSize: 13, transition: "color 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-4)"; }}
        >
          <LogOut size={16} strokeWidth={1.5} /> Sign out
        </div>
      </aside>

      {/* ── TOPBAR ── */}
      <header style={{
        marginLeft: 200, height: 48, position: "sticky", top: 0, zIndex: 40,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
        padding: "0 20px", display: "flex", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>{pageTitle}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, color: "var(--text-4)", background: "var(--surface-2)",
            border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 4, fontWeight: 500,
          }}>
            FY 2025–26
          </span>
          <button style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: 6, color: "var(--text-4)", cursor: "pointer", transition: "all 0.12s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-4)"; }}
          >
            <Search size={14} strokeWidth={1.5} />
          </button>
          <button style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: 6, color: "var(--text-4)", cursor: "pointer", position: "relative", transition: "all 0.12s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-4)"; }}
          >
            <Bell size={14} strokeWidth={1.5} />
            <span style={{ position: "absolute", top: 3, right: 3, width: 5, height: 5, borderRadius: "50%", background: "var(--red)" }} />
          </button>
          <Avatar name={user?.name} size={28} />
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ marginLeft: 200, padding: "16px 20px", minHeight: "calc(100vh - 48px)", position: "relative", zIndex: 1, background: "var(--bg)" }}>
        <Outlet />
      </main>
    </div>
  );
}
