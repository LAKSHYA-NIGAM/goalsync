import { motion } from "framer-motion";

export default function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
