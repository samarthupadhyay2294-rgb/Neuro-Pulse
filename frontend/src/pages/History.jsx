import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getHistory, downloadReport } from "../services/api";
import { loadGuestHistory } from "../utils/guestHistory";

export default function History() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      getHistory()
        .then((res) => {
          setItems(res.data.history || []);
          setGuestMode(false);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setItems(loadGuestHistory());
      setGuestMode(true);
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <Layout
      title="Prediction History"
      subtitle={
        guestMode
          ? "Saved on this device — sign in to sync across devices"
          : "Your cloud screening history"
      }
    >
      {guestMode && (
        <p className="mb-4 rounded-card bg-primary/5 px-4 py-3 text-sm text-slate-600">
          You are browsing as a guest.{" "}
          <Link to="/signup" className="font-semibold text-primary underline">
            Create an account
          </Link>{" "}
          to store history in MongoDB and access it anywhere.
        </p>
      )}

      {loading && <p className="text-slate-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="glass-card p-6 text-center text-slate-500">
          No predictions yet.{" "}
          <Link to="/chat" className="text-primary underline">
            Start a prediction
          </Link>
        </p>
      )}
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="glass-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-primary">
                  {item.result?.risk_level || item.prediction?.risk || "—"}
                </p>
                <p className="text-xs text-slate-500">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : ""}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Confidence:{" "}
                  {item.result?.confidence_percent ?? item.prediction?.confidence}%
                  {item.symptoms_only && (
                    <span className="ml-1 text-xs text-amber-600">(symptoms only)</span>
                  )}
                </p>
              </div>
              {item.id && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await downloadReport(item.id);
                      const url = URL.createObjectURL(res.data);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `neuro_pulse_${item.id}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      alert("Could not download report.");
                    }
                  }}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
                >
                  PDF
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
