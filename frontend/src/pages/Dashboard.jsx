import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout title={`Hello, ${user?.name?.split(" ")[0] || "there"}`} subtitle="Your screening hub">
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold text-primary">Start prediction</h2>
          <p className="mt-2 text-sm text-slate-600">
            12 symptom questions, optional voice analysis, AI risk prediction.
          </p>
          <Link
            to="/chat"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
          >
            Begin chatbot
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="glass-card p-6">
          <h2 className="text-lg font-bold text-primary">Your history</h2>
          <p className="mt-2 text-sm text-slate-600">
            View past predictions, confidence scores, and download PDF reports.
          </p>
          <Link
            to="/history"
            className="mt-4 inline-block rounded-full border-2 border-primary px-6 py-2 text-sm font-semibold text-primary"
          >
            View history
          </Link>
        </motion.div>
      </div>

      <p className="mt-8 rounded-card border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        This AI system is for early screening and education only — not a medical diagnosis.
        Consult a healthcare professional for clinical evaluation.
      </p>
    </Layout>
  );
}
