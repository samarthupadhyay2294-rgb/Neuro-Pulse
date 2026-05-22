import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { saveGuestPrediction } from "../utils/guestHistory";
import {
  extractFeatures,
  predict,
  predictSymptomsOnly,
  uploadAudio,
} from "../services/api";

const PROMPT =
  "Today is a beautiful day and I feel healthy and energetic.";

export default function Voice() {
  const navigate = useNavigate();
  const {
    sessionId,
    symptoms,
    language,
    setVoiceFeatures,
    setResult,
    setLastEntryId,
  } = useApp();
  const { isAuthenticated } = useAuth();

  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const runPredict = async (voicePayload, symptomsOnly = false) => {
    const predRes = await predict({
      session_id: sessionId,
      symptoms,
      voice: voicePayload,
      language,
      symptoms_only: symptomsOnly,
    });
    setResult(predRes.data.result);
    setLastEntryId(predRes.data.id);
    if (!isAuthenticated) {
      saveGuestPrediction({
        id: predRes.data.id,
        result: predRes.data.result,
        symptoms_only: symptomsOnly,
        symptoms,
      });
    }
    navigate("/results");
  };

  const handleSkipVoice = async () => {
    if (!sessionId) {
      setStatus("Complete symptom questions first.");
      navigate("/chat");
      return;
    }
    setBusy(true);
    setStatus("Generating prediction from symptoms…");
    setVoiceFeatures(null);
    try {
      await runPredict(null, true);
      return;
    } catch (err) {
      setStatus(err.response?.data?.error || "Prediction failed.");
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob, "recording.webm");
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatus("Recording… speak for ~10 seconds");
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setRecording(false);
        }
      }, 10000);
    } catch {
      setStatus("Microphone access denied. Please upload a file instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (blob, filename) => {
    if (!sessionId) {
      setStatus("Complete symptom questions first.");
      navigate("/chat");
      return;
    }
    setBusy(true);
    setStatus("Uploading and analyzing voice…");
    try {
      await uploadAudio(sessionId, blob, filename);
      const featRes = await extractFeatures(sessionId);
      const features = featRes.data.features;
      setVoiceFeatures(features);

      await runPredict(
        {
          jitter: features.jitter,
          shimmer: features.shimmer,
          fo: features.fo,
          nhr: features.nhr,
          hnr: features.hnr,
        },
        false
      );
    } catch (err) {
      setStatus(err.response?.data?.error || "Voice analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processAudio(file, file.name);
  };

  return (
    <Layout title="Voice Sample (Optional)" subtitle="Enhance your screening — or skip">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card space-y-4 p-6"
      >
        <button
          type="button"
          disabled={busy}
          onClick={handleSkipVoice}
          className="w-full rounded-full bg-accent py-3 font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {busy ? "Please wait…" : "Skip voice — use symptoms only"}
        </button>

        <div className="relative py-2 text-center text-xs text-slate-400">
          <span className="bg-white/80 px-2 dark:bg-slate-900/80">or add voice</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200 dark:border-slate-700" />
        </div>

        <p className="text-sm font-medium text-secondary">Read aloud:</p>
        <p className="rounded-card bg-primary/5 p-4 text-lg font-medium italic text-primary">
          &ldquo;{PROMPT}&rdquo;
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {!recording ? (
            <button
              type="button"
              disabled={busy}
              onClick={startRecording}
              className="flex-1 rounded-full bg-primary py-3 font-semibold text-white disabled:opacity-50"
            >
              Record Voice (10s)
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 rounded-full bg-red-500 py-3 font-semibold text-white"
            >
              Stop Recording
            </button>
          )}
          <label className="flex-1 cursor-pointer rounded-full border-2 border-primary py-3 text-center font-semibold text-primary hover:bg-primary/5">
            Upload WAV / MP3 / M4A
            <input
              type="file"
              accept=".wav,.mp3,.m4a,audio/*"
              className="hidden"
              disabled={busy}
              onChange={onFileChange}
            />
          </label>
        </div>

        {status && (
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">{status}</p>
        )}
        {busy && (
          <p className="text-center text-xs text-secondary">
            Extracting jitter, shimmer, fo, nhr, hnr…
          </p>
        )}
      </motion.div>
    </Layout>
  );
}
