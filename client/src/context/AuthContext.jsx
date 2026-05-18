import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("gs_token"));
  const [loading, setLoading] = useState(true);

  // ── Hydrate user from stored token on mount ────────────────────────────
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // Check expiration (exp is in seconds)
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("gs_token");
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
        department: decoded.department,
        managerId: decoded.managerId,
      });
    } catch {
      localStorage.removeItem("gs_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    localStorage.setItem("gs_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("gs_token");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
