import { motion } from "framer-motion";
import Logo from "./Logo";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto max-w-md"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        <div className="glass-card rounded-card p-8 shadow-glass">{children}</div>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </motion.div>
    </div>
  );
}
