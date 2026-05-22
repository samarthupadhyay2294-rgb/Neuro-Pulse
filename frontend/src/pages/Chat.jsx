import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { BotBubble, UserBubble } from "../components/ChatBubble";
import AnswerOptions from "../components/AnswerOptions";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { saveGuestPrediction } from "../utils/guestHistory";
import {
  getQuestions,
  predictSymptomsOnly,
  saveChatMessages,
  saveSymptoms,
} from "../services/api";

const LABELS = ["Never / No", "Rarely / Slightly", "Sometimes / Moderate", "Often / Severe"];

export default function Chat() {
  const navigate = useNavigate();
  const {
    language,
    sessionId,
    setSessionId,
    symptoms,
    setSymptoms,
    chatHistory,
    setChatHistory,
    chatSessionId,
    setChatSessionId,
    setResult,
    setLastEntryId,
    setVoiceFeatures,
  } = useApp();
  const { isAuthenticated } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getQuestions(language)
      .then((res) => {
        setQuestions(res.data.questions || []);
        setOptions(res.data.answer_options || []);
      })
      .finally(() => setLoading(false));
  }, [language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, step, complete]);

  const current = complete ? null : questions[step];

  const handleAnswer = async (value) => {
    if (!current) return;
    const label = options.find((o) => o.value === value)?.label || LABELS[value];
    const feature = current.feature;

    setChatHistory((h) => [
      ...h,
      { type: "bot", text: current.text },
      { type: "user", text: label },
    ]);

    const updated = { ...symptoms, [feature]: value };
    setSymptoms(updated);

    let sid = sessionId;
    const newMessages = [
      { sender: "bot", message: current.text },
      { sender: "user", message: label },
    ];

    try {
      const res = await saveSymptoms(sessionId, updated, chatSessionId);
      if (res.data.session_id) {
        sid = res.data.session_id;
        setSessionId(sid);
      }
      if (res.data.chat_session_id) {
        setChatSessionId(res.data.chat_session_id);
      }
      const csid = res.data.chat_session_id || chatSessionId;
      if (isAuthenticated && csid) {
        saveChatMessages(csid, newMessages).catch(() => {});
      }
    } catch {
      /* continue with local state */
    }

    if (step + 1 >= questions.length) {
      setComplete(true);
      setChatHistory((h) => [
        ...h,
        {
          type: "bot",
          text: "Thank you — all 12 questions are complete. You can get your risk estimate now from symptoms alone, or optionally add a voice sample for a combined assessment.",
        },
      ]);
    } else {
      setStep(step + 1);
    }
  };

  const handleSymptomsOnlyPredict = async () => {
    if (Object.keys(symptoms).length < 12) {
      return;
    }
    setPredicting(true);
    setVoiceFeatures(null);
    try {
      const res = await predictSymptomsOnly(sessionId, symptoms, language);
      setResult(res.data.result);
      setLastEntryId(res.data.id);
      if (!isAuthenticated) {
        saveGuestPrediction({
          id: res.data.id,
          result: res.data.result,
          symptoms_only: true,
          symptoms,
        });
      }
      navigate("/results");
    } catch (err) {
      setChatHistory((h) => [
        ...h,
        {
          type: "bot",
          text: err.response?.data?.error || "Prediction failed. Please try again.",
        },
      ]);
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Screening" subtitle="Loading questions…">
        <p className="text-center text-slate-500">Preparing assessment…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title="Parkinson Disease Prediction Assistant"
      subtitle="AI-powered early screening chatbot"
    >
      <div className="space-y-6">
        {chatHistory.map((msg, i) =>
          msg.type === "bot" ? (
            <BotBubble key={i}>{msg.text}</BotBubble>
          ) : (
            <UserBubble key={i}>{msg.text}</UserBubble>
          )
        )}

        {current && (
          <BotBubble>
            <span className="text-xs font-medium text-secondary">
              Question {step + 1} of {questions.length}
            </span>
            <p className="mt-2 text-lg font-medium">{current.text}</p>
            <AnswerOptions
              options={options}
              selected={symptoms[current.feature]}
              onSelect={handleAnswer}
            />
          </BotBubble>
        )}

        {complete && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card space-y-3 p-5"
          >
            <p className="text-sm font-medium text-secondary">Next step (optional voice)</p>
            <button
              type="button"
              disabled={predicting}
              onClick={handleSymptomsOnlyPredict}
              className="w-full rounded-full bg-accent py-3 font-semibold text-white shadow-glow disabled:opacity-50"
            >
              {predicting ? "Analyzing…" : "Get risk result (symptoms only)"}
            </button>
            <button
              type="button"
              disabled={predicting}
              onClick={() => navigate("/voice")}
              className="w-full rounded-full border-2 border-primary py-3 font-semibold text-primary hover:bg-primary/5"
            >
              Add voice analysis (optional)
            </button>
            <p className="text-center text-xs text-slate-500">
              Voice improves screening accuracy but is not required.
            </p>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>
    </Layout>
  );
}
