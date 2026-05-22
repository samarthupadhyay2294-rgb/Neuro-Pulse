import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import AppHeader from "../components/AppHeader";
import Logo from "../components/Logo";

const DISCLAIMER =
  "This AI-based system is intended only for early screening and educational purposes and should not be considered a professional medical diagnosis. Users should consult certified healthcare professionals for proper medical evaluation and treatment.";

export default function Welcome() {
  const { loading } = useAuth();
  const { resetSession, darkMode } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-primary">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-slate-950 text-slate-100" : "bg-surface"}`}
    >
      <AppHeader />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg px-4 pb-16 text-center"
      >
        <div className="mx-auto mb-6 flex justify-center">
          <Logo size="2xl" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Parkinson Disease Prediction Assistant
        </h1>
        <p className="mx-auto mt-3 text-slate-600 dark:text-slate-400">
          AI-powered early screening — symptom assessment, optional voice biomarkers, and
          machine learning risk analysis.
        </p>

        <div className="mx-auto mt-10">
          <Link
            to="/chat"
            onClick={resetSession}
            className="block w-full rounded-full bg-accent py-4 font-semibold text-white shadow-glow"
          >
            Start prediction
          </Link>
        </div>

        <p className="mx-auto mt-10 rounded-card border border-amber-200/80 bg-amber-50/80 p-4 text-left text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {DISCLAIMER}
        </p>
      </motion.section>
    </div>
  );
}
