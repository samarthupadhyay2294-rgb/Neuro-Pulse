import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import RiskDashboard from "../components/RiskDashboard";
import { useApp } from "../context/AppContext";
import { downloadReport } from "../services/api";

const DISCLAIMER =
  "This AI-based system is intended only for early screening and educational purposes and should not be considered a professional medical diagnosis.";

export default function Results() {
  const navigate = useNavigate();
  const { result, lastEntryId, resetSession } = useApp();

  if (!result) {
    return (
      <Layout>
        <p className="text-center">No results yet.</p>
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="mx-auto mt-4 block text-primary underline"
        >
          Start prediction
        </button>
      </Layout>
    );
  }

  const handleDownload = async (id) => {
    try {
      const res = await downloadReport(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neuro_pulse_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download report.");
    }
  };

  return (
    <Layout title="Your Results" subtitle="AI risk assessment dashboard">
      <RiskDashboard
        result={result}
        entryId={lastEntryId}
        onDownload={handleDownload}
      />
      <p className="mt-6 text-center text-xs text-slate-500">{DISCLAIMER}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => {
            resetSession();
            navigate("/chat");
          }}
          className="rounded-full border border-primary px-6 py-2 font-medium text-primary"
        >
          New Prediction
        </button>
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="rounded-full bg-primary px-6 py-2 font-medium text-white"
        >
          View History
        </button>
      </div>
    </Layout>
  );
}
