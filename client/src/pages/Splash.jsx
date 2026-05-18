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
          const landing = { admin: "/admin/dashboard", manager: "/manager/dashboard", employee: "/employee/dashboard" };
          navigate(landing[user.role] || "/login", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 400);
    }, 1200);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, navigate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50 animate-pulse" />
              <h1 className="text-5xl font-bold text-white tracking-tight">
                Goal<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-400">Sync</span>
              </h1>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-400 tracking-widest uppercase"
            >
              Enterprise Goal Setting &amp; Tracking Portal
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              className="h-0.5 bg-gradient-to-r from-sky-400 to-teal-400 mx-auto mt-6 rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
