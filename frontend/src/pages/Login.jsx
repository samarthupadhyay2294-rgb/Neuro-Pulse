import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";
import { firebaseEnabled } from "../config/firebase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/chat";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      if (remember) localStorage.setItem("neuro_pulse_remember", "1");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Secure login to your Parkinson screening assistant"
      footer={
        <p>
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <div className="relative mt-1">
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-primary/20 px-4 py-3 pr-12 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-3 font-semibold text-white shadow-glow disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Login"}
        </motion.button>

        {firebaseEnabled && (
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="w-full rounded-full border-2 border-slate-200 py-3 font-semibold hover:bg-slate-50"
          >
            Continue with Google
          </button>
        )}
      </form>
    </AuthCard>
  );
}
