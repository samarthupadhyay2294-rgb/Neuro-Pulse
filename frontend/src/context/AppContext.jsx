import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

const STORAGE_KEY = "neuro_pulse_state";

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [sessionId, setSessionId] = useState(null);
  const [symptoms, setSymptoms] = useState({});
  const [voiceFeatures, setVoiceFeatures] = useState(null);
  const [result, setResult] = useState(null);
  const [lastEntryId, setLastEntryId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setLanguage(data.language || "en");
      setSessionId(data.sessionId || null);
      setSymptoms(data.symptoms || {});
      setDarkMode(!!data.darkMode);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, sessionId, symptoms, darkMode })
    );
    document.documentElement.classList.toggle("dark", darkMode);
  }, [language, sessionId, symptoms, darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      sessionId,
      setSessionId,
      symptoms,
      setSymptoms,
      voiceFeatures,
      setVoiceFeatures,
      result,
      setResult,
      lastEntryId,
      setLastEntryId,
      chatHistory,
      setChatHistory,
      chatSessionId,
      setChatSessionId,
      resetSession: () => {
        setSessionId(null);
        setSymptoms({});
        setVoiceFeatures(null);
        setResult(null);
        setLastEntryId(null);
        setChatHistory([]);
        setChatSessionId(null);
      },
    }),
    [
      darkMode,
      language,
      sessionId,
      symptoms,
      voiceFeatures,
      result,
      lastEntryId,
      chatHistory,
      chatSessionId,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
