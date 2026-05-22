import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthCard from "../components/AuthCard";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setDevToken("");
    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message);
      if (res.data.dev_reset_token) {
        setDevToken(res.data.dev_reset_token);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We'll send reset instructions to your email"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
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
            className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3"
          />
        </div>
        {message && (
          <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-slate-700">{message}</p>
        )}
        {devToken && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Dev mode:{" "}
            <Link to={`/reset-password?token=${devToken}`} className="underline">
              Reset password
            </Link>
          </p>
        )}
        <motion.button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary py-3 font-semibold text-white"
        >
          {busy ? "Sending…" : "Send reset link"}
        </motion.button>
      </form>
    </AuthCard>
  );
}
