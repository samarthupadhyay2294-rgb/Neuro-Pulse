import { motion } from "framer-motion";

const riskColors = {
  "Low Risk": "text-accent",
  "Medium Risk": "text-amber-500",
  "High Risk": "text-red-500",
};

export default function RiskDashboard({ result, onDownload, entryId }) {
  const pct = result?.confidence_percent ?? 0;
  const risk = result?.risk_level ?? "—";
  const color = riskColors[risk] || "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="glass-card flex flex-col items-center p-8 text-center sm:flex-row sm:text-left">
        <div className="relative mb-4 h-36 w-36 sm:mb-0 sm:mr-8">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#10B981"
              strokeWidth="10"
              strokeDasharray={`${(pct / 100) * 327} 327`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-primary">{pct}%</span>
            <span className="text-xs text-slate-500">Confidence</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">Assessment Result</p>
          {result?.assessment_type === "symptoms_only" && (
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              Based on 12 symptom questions only
            </span>
          )}
          <h2 className={`mt-1 text-2xl font-bold ${color}`}>
            {risk} of Parkinson Disease
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {result?.recommendation}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-primary">Symptom Summary</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {result?.symptom_summary}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Symptom score: {result?.symptom_score} / 36
          </p>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold text-primary">Voice Analysis</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {result?.voice_summary}
          </p>
        </div>
      </div>

      {entryId && (
        <button
          type="button"
          onClick={() => onDownload(entryId)}
          className="w-full rounded-full bg-accent py-3 font-semibold text-white shadow-glow transition hover:opacity-90"
        >
          Download PDF Health Report
        </button>
      )}
    </motion.div>
  );
}
