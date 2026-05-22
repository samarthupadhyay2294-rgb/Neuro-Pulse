import { motion } from "framer-motion";
import Logo from "./Logo";

export function BotBubble({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3"
    >
      <Logo size="md" className="shrink-0" />
      <div className="glass-card max-w-[85%] px-5 py-4 text-base leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}

export function UserBubble({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-end"
    >
      <div className="max-w-[75%] rounded-card rounded-tr-sm bg-primary px-5 py-3 text-sm font-medium text-white shadow-glass">
        {children}
      </div>
    </motion.div>
  );
}
