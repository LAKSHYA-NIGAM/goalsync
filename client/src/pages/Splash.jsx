import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Splash() {
  const [show, setShow] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        if (isAuthenticated && user) {
          const landing = { admin: "/admin/dashboard", manager: "/manager/dashboard", employee: "/employee/goals" };
          navigate(landing[user.role] || "/login", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 400);
    }, 1800);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, navigate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg)",
          }}
        >
          {/* Glow orbs */}
          <div style={{
            position: "absolute", top: "20%", left: "15%",
            width: 340, height: 340, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "20%", right: "15%",
            width: 260, height: 260, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 70%)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            style={{ textAlign: "center", position: "relative" }}
          >
            {/* Logo mark */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 14, marginBottom: 18,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #14b8a6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 32px rgba(99,102,241,0.45)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h1 style={{
                fontSize: 42, fontWeight: 700, letterSpacing: -1.5,
                color: "var(--text-1)", margin: 0, fontFamily: "inherit",
              }}>
                Goal<span style={{
                  background: "linear-gradient(135deg, #6366f1, #14b8a6)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Sync</span>
              </h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                fontSize: 12, color: "var(--text-4)", letterSpacing: "0.14em",
                textTransform: "uppercase", fontWeight: 500, marginBottom: 28,
              }}
            >
              Enterprise Goal Setting &amp; Tracking
            </motion.p>

            {/* Animated progress bar */}
            <div style={{
              width: 160, height: 2, background: "var(--surface-3)",
              borderRadius: 100, margin: "0 auto", overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
                style={{
                  height: "100%", borderRadius: 100,
                  background: "linear-gradient(90deg, #6366f1, #14b8a6)",
                }}
              />
            </div>

            {/* Dots loader */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20 }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-4)" }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
