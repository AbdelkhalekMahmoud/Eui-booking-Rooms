import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  login,
  register,
  loginWithMicrosoft,
} from "../../services/authService";
import euiLogo from "../../assets/eui-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await loginWithMicrosoft();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,150,69,0.20),transparent_28%),linear-gradient(135deg,#0f265c_0%,#163a7a_34%,#177c7a_100%)]" />
      <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.05))] lg:block" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(196,150,69,0.14)] blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden text-white lg:block">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.42em] text-[rgba(255,255,255,0.72)]">
              Egypt University of Informatics
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight">
              A campus-inspired booking portal for staff spaces and academic rooms.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[rgba(255,255,255,0.78)]">
              Reserve meeting rooms, follow approvals, and manage university spaces
              through one polished EUI experience.
            </p>
          </div>

          <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                Access
              </p>
              <p className="mt-3 text-lg font-semibold">Staff accounts only</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                Booking
              </p>
              <p className="mt-3 text-lg font-semibold">Rooms and labs</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,255,255,0.6)]">
                Workflow
              </p>
              <p className="mt-3 text-lg font-semibold">Approval ready</p>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_30px_90px_rgba(15,38,92,0.24)] ring-1 ring-[rgba(255,255,255,0.35)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white shadow-sm ring-1 ring-[rgba(23,95,184,0.12)]">
            <img
              src={euiLogo}
              alt="EUI logo"
              className="h-14 w-14 object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[var(--eui-gold)]">
              EUI Portal
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--eui-navy)]">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Egypt University of Informatics
            </p>
          </div>
        </div>

          <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(23,95,184,0.08),rgba(23,124,122,0.08))] p-4 text-sm text-slate-600 ring-1 ring-[rgba(23,95,184,0.08)]">
            Sign in with your institutional account to access room reservations,
            request approvals, and staff-only booking services.
          </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required={!isLogin}
                placeholder="Your full name"
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--eui-blue)] focus:ring-2 focus:ring-[rgba(23,95,184,0.18)]"
              />
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="username@eui.edu.eg"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--eui-blue)] focus:ring-2 focus:ring-[rgba(23,95,184,0.18)]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--eui-blue)] hover:text-[var(--eui-navy)]"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--eui-blue)] focus:ring-2 focus:ring-[rgba(23,95,184,0.18)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-[linear-gradient(135deg,var(--eui-navy),var(--eui-blue))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(15,38,92,0.22)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eui-blue)] focus-visible:ring-offset-2 disabled:brightness-90"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign in to Dashboard"
                : "Create Account"}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[var(--eui-blue)] hover:text-[var(--eui-navy)]"
          >
            {isLogin
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
          <span className="h-px w-14 bg-slate-200" />
          institutional sso
          <span className="h-px w-14 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[rgba(23,95,184,0.24)] hover:bg-[rgba(23,95,184,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eui-blue)] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="#F25022" d="M5 5h6v6H5V5z" />
            <path fill="#7FBA00" d="M13 5h6v6h-6V5z" />
            <path fill="#00A4EF" d="M5 13h6v6H5v-6z" />
            <path fill="#FFB900" d="M13 13h6v6h-6v-6z" />
          </svg>
          Sign in with Microsoft
        </button>

        <div className="rounded-3xl bg-slate-50 p-4 text-center text-sm text-slate-600 ring-1 ring-slate-200">
          Login is restricted to{" "}
          <span className="font-semibold text-slate-900">@eui.edu.eg</span>{" "}
          institutional accounts.
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
          <span>Security Policy</span>
          <span>•</span>
          <span>Portal Support</span>
          <span>•</span>
          <span>System Status</span>
        </div>
      </div>
    </div>
    </div>
  );
}
