import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AuthCard from "../components/AuthCard";
import { resetPassword, passwordStrength } from "../services/authService";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await resetPassword({
        token,
        password,
        confirm_password: confirm,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Reset password" subtitle="Choose a new secure password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">New password</label>
          <div className="relative mt-1">
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-primary/20 px-4 py-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          {password && (
            <p className="mt-1 text-xs text-slate-500">Strength: {strength.label}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Confirm password</label>
          <input
            type={showPass ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-primary/20 px-4 py-3"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-accent py-3 font-semibold text-white"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
        <Link to="/login" className="block text-center text-sm text-primary">
          Back to login
        </Link>
      </form>
    </AuthCard>
  );
}
