import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Login from "./pages/auth/Login";
import Splash from "./pages/Splash";
import Layout from "./components/common/Layout";
import MyGoals from "./pages/employee/MyGoals";
import CreateGoal from "./pages/employee/CreateGoal";
import Approvals from "./pages/manager/Approvals";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import TeamGoals from "./pages/manager/TeamGoals";
import EmployeeCheckIns from "./pages/employee/CheckIns";
import ManagerCheckIns from "./pages/manager/ManagerCheckIns";
import SharedGoalView from "./pages/employee/SharedGoalView";
import AdminSharedGoals from "./pages/admin/SharedGoals";
import OrgDashboard from "./pages/admin/OrgDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Reports from "./pages/admin/Reports";

/* ── Loading spinner ─────────────────────────────────────────────────── */
function FullScreenLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <svg style={{ animation: "spin 1s linear infinite", width: 32, height: 32, color: "#7C5CF7" }} viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Loading…</span>
      </div>
    </div>
  );
}

/* ── Guards ──────────────────────────────────────────────────────────── */
const roleLanding = {
  employee: "/employee/goals",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={roleLanding[user.role] || "/"} replace />;
  return children;
}

/* ── Placeholder ─────────────────────────────────────────────────────── */
function Placeholder({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#E2E8F0", marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: 13, color: "#64748B" }}>Coming soon</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   APP ROUTES
   ══════════════════════════════════════════════════════════════════════════ */
function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Splash */}
        <Route path="/" element={<Splash />} />

        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to={roleLanding[user?.role] || "/"} replace /> : <Login />} />

        {/* Employee */}
        <Route path="/employee" element={<ProtectedRoute><RoleRoute roles={["employee"]}><Layout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="goals" replace />} />
          <Route path="goals"          element={<MyGoals />} />
          <Route path="goals/new"      element={<CreateGoal />} />
          <Route path="goals/:id/edit" element={<CreateGoal />} />
          <Route path="checkins"       element={<EmployeeCheckIns />} />
          <Route path="shared"         element={<SharedGoalView />} />
          <Route path="*"              element={<Navigate to="goals" replace />} />
        </Route>

        {/* Manager */}
        <Route path="/manager" element={<ProtectedRoute><RoleRoute roles={["manager"]}><Layout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="team"      element={<TeamGoals />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="checkins"  element={<ManagerCheckIns />} />
          <Route path="reports"   element={<Reports />} />
          <Route path="*"         element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute><RoleRoute roles={["admin"]}><Layout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<OrgDashboard />} />
          <Route path="users"        element={<UserManagement />} />
          <Route path="shared-goals" element={<AdminSharedGoals />} />
          <Route path="audit"        element={<AuditLogs />} />
          <Route path="reports"      element={<Reports />} />
          <Route path="*"            element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={isAuthenticated ? <Navigate to={roleLanding[user?.role] || "/login"} replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
