import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";
import { passwordStrength } from "../services/authService";
import { firebaseEnabled } from "../config/firebase";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, setError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [localError, setLocalError] = useState("");

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setNotice("");
    if (password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await signup({ name, email, password, confirm_password: confirm });
      setNotice("Account created! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Signup failed.";
      setLocalError(msg);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setLocalError("");
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setLocalError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Neuro Pulse for secure screening & history"
      footer={
        <p>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="you@email.com"
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
              className="w-full rounded-xl border border-primary/20 px-4 py-3 pr-12 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Min. 8 chars, letters & numbers"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= strength.score ? "bg-accent" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">{strength.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Confirm Password</label>
          <input
            type={showPass ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <AnimatePresence>
          {(localError || notice) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-lg px-3 py-2 text-sm ${
                localError
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {localError || notice}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-primary to-secondary py-3 font-semibold text-white shadow-glow disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create Account"}
        </motion.button>

        {firebaseEnabled && (
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 py-3 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <span className="text-lg">G</span> Continue with Google
          </button>
        )}
      </form>
    </AuthCard>
  );
}
