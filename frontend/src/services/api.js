import axios from "axios";
import { getToken } from "./authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err.config?.url?.includes("/login") ||
      err.config?.url?.includes("/signup");
    if (
      err.response?.status === 401 &&
      getToken() &&
      !isAuthRoute
    ) {
      window.dispatchEvent(new Event("neuro_pulse_unauthorized"));
    }
    return Promise.reject(err);
  }
);

export const getQuestions = (lang = "en") =>
  api.get("/questions", { params: { lang } });

export const saveSymptoms = (sessionId, symptoms, chatSessionId) =>
  api.post("/predict-symptoms", {
    session_id: sessionId,
    symptoms,
    chat_session_id: chatSessionId,
  });

export const saveChatMessages = (chatSessionId, messages) =>
  api.post("/chat/messages", { chat_session_id: chatSessionId, messages });

export const uploadAudio = (sessionId, blob, filename = "recording.webm") => {
  const form = new FormData();
  form.append("audio", blob, filename);
  form.append("session_id", sessionId);
  return api.post("/upload-audio", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const extractFeatures = (sessionId) =>
  api.post("/extract-features", { session_id: sessionId });

export const predict = (payload) => api.post("/predict", payload);

export const predictSymptomsOnly = (sessionId, symptoms, language = "en") =>
  api.post("/predict", {
    session_id: sessionId,
    symptoms,
    symptoms_only: true,
    language,
  });

export const getHistory = () => api.get("/history");

export const downloadReport = (id) =>
  api.get(`/download-report/${id}`, { responseType: "blob" });

export default api;
