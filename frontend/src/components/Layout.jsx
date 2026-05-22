import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

/** Page body only — header comes from AppHeader in AppShell */
export default function Layout({ children, title, subtitle }) {
  const { darkMode, language, setLanguage } = useApp();

  return (
    <div
      className={`min-h-[calc(100vh-73px)] transition-colors ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-surface text-ink"
      }`}
    >
      {(title || subtitle) && (
        <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-3 border-b border-primary/10 px-4 py-4">
          <div>
            {title && (
              <h1 className="text-lg font-semibold text-primary">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs dark:bg-slate-900"
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="te">Telugu</option>
            <option value="mr">Marathi</option>
            <option value="ta">Tamil</option>
          </select>
        </div>
      )}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl px-4 py-6 pb-24"
      >
        {children}
      </motion.main>
    </div>
  );
}
