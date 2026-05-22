import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

/**
 * Shared top bar: Neuro Pulse (left) · Dark · Login · Sign up (right)
 * Used on welcome and all screening pages after Start prediction.
 */
export default function AppHeader() {
  const { isAuthenticated, loading } = useAuth();
  const { darkMode, setDarkMode } = useApp();

  if (loading) {
    return (
      <header className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="h-6" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="text-lg font-bold text-primary">
          Neuro Pulse
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
