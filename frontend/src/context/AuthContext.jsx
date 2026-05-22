import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signInWithPopup } from "firebase/auth";
import {
  auth,
  firebaseEnabled,
  googleProvider,
} from "../config/firebase";
import {
  clearSession,
  getProfile,
  getStoredUser,
  getToken,
  googleAuth,
  login as apiLogin,
  logout as apiLogout,
  setSession,
  signup as apiSignup,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getProfile();
      setUser(res.data.user);
      localStorage.setItem("neuro_pulse_user", JSON.stringify(res.data.user));
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const handler = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener("neuro_pulse_unauthorized", handler);
    return () => window.removeEventListener("neuro_pulse_unauthorized", handler);
  }, []);

  const signup = async (payload) => {
    setError(null);
    const res = await apiSignup(payload);
    setSession(res.data.access_token || res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data;
  };

  const login = async (email, password) => {
    setError(null);
    const res = await apiLogin({ email, password });
    setSession(res.data.access_token || res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data;
  };

  const loginWithGoogle = async () => {
    if (!firebaseEnabled || !auth) {
      throw new Error(
        "Google sign-in is not configured. Add Firebase keys to frontend/.env"
      );
    }
    setError(null);
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const res = await googleAuth(idToken);
    setSession(res.data.access_token || res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      if (getToken()) await apiLogout();
    } catch {
      /* ignore */
    }
    clearSession();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setError,
      isAuthenticated: !!user && !!getToken(),
      signup,
      login,
      loginWithGoogle,
      logout,
      refreshProfile,
    }),
    [user, loading, error, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
