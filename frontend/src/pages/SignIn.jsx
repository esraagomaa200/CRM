import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const HIGHLIGHTS = [
  { title: "Unified customer view", desc: "See orders, LTV and history in one place." },
  { title: "Live sales analytics", desc: "Track revenue and growth as it happens." },
  { title: "Real backend, not mock data", desc: "Everything is stored in a real database." },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function validate() {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate() || submitting) return;

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    const redirectTo = location.state?.from?.pathname || "/";
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="min-h-screen w-full flex bg-appbg">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand text-white flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center">
            <IconArrow />
          </span>
          <span className="font-bold text-[17px]">NexaCRM</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight mb-4">
            Run your customers, orders and stock from one dashboard.
          </h1>
          <div className="flex flex-col gap-4 mt-8">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <IconCheck />
                </span>
                <div>
                  <div className="text-sm font-semibold">{h.title}</div>
                  <div className="text-sm text-white/70">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm text-white/60">© 2026 NexaCRM. All rights reserved.</div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <span className="w-9 h-9 rounded-[10px] bg-brand text-white flex items-center justify-center">
              <IconArrow />
            </span>
            <span className="font-bold text-[17px] text-gray-900">NexaCRM</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue.</p>

          <div className="flex items-start gap-2.5 bg-brand-light text-brand text-xs rounded-[10px] px-3.5 py-2.5 mb-6">
            <span className="shrink-0 mt-0.5">
              <IconAlert />
            </span>
            <span>
              Demo account: <span className="font-semibold">demo@nexacrm.com</span> / <span className="font-semibold">demo1234</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div
                className={`flex items-center gap-2.5 bg-white border rounded-[10px] px-3.5 py-2.5 text-gray-400 focus-within:border-brand ${
                  errors.email ? "border-red-300" : "border-gray-200"
                }`}
              >
                <IconMail />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-none outline-none bg-transparent text-sm w-full text-gray-900"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-risk-text mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <button type="button" className="text-xs font-semibold text-brand hover:underline">
                  Forgot password?
                </button>
              </div>
              <div
                className={`flex items-center gap-2.5 bg-white border rounded-[10px] px-3.5 py-2.5 text-gray-400 focus-within:border-brand ${
                  errors.password ? "border-red-300" : "border-gray-200"
                }`}
              >
                <IconLock />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-none outline-none bg-transparent text-sm w-full text-gray-900"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-risk-text mt-1.5">{errors.password}</p>}
            </div>

            {formError && (
              <div className="text-sm text-risk-text bg-risk-bg border border-red-100 rounded-[10px] px-3.5 py-2.5">
                {formError}
              </div>
            )}

            <label className="flex items-center gap-2.5 text-sm text-gray-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              Remember me for 30 days
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 bg-brand text-white text-sm font-semibold py-2.5 rounded-[10px] hover:bg-brand/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting && <IconSpinner />}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
