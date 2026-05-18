import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: { Icon: Check,       borderColor: "var(--green)", iconColor: "var(--green)" },
  error:   { Icon: AlertCircle, borderColor: "var(--red)",   iconColor: "var(--red)" },
  info:    { Icon: Info,        borderColor: "var(--blue)",  iconColor: "var(--blue)" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 6, pointerEvents: "none", maxWidth: 320 }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const cfg = TOAST_CONFIG[t.type] || TOAST_CONFIG.success;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ duration: 0.2 }}
                style={{
                  pointerEvents: "auto",
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", minWidth: 200,
                  background: "var(--surface-2)", border: "1px solid var(--border-2)",
                  borderRadius: 6, borderLeft: `3px solid ${cfg.borderColor}`,
                }}
              >
                <cfg.Icon size={14} style={{ color: cfg.iconColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-1)", flex: 1 }}>{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
