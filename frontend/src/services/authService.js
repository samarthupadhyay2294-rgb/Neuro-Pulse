import api from "./api";

const TOKEN_KEY = "neuro_pulse_token";
const USER_KEY = "neuro_pulse_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const signup = (data) => api.post("/signup", data);
export const login = (data) => api.post("/login", data);
export const logout = () => api.post("/logout");
export const getProfile = () => api.get("/profile");
export const forgotPassword = (email) => api.post("/forgot-password", { email });
export const resetPassword = (data) => api.post("/reset-password", data);
export const googleAuth = (idToken) => api.post("/google", { id_token: idToken });

export function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)] };
}
