"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FormField,
  FormInput,
  FormPasswordInput,
  FormCheckbox,
  FormErrorBanner,
} from "@/components/forms/ModernForm";

type Screen = "login" | "forgot" | "forgot-sent";

interface LoginCfg {
  logoUrl: string;
  logoSize: number;
  showLogo: boolean;
  showSiteName: boolean;
  bgType: string;
  bgColor: string;
  bgImageUrl: string;
  bgOverlay: number;
  bgGradient: string;
  cardBg: string;
  cardBorder: string;
  showPattern: boolean;
  welcomeTitle: string;
  welcomeSubtitle: string;
  allowRememberMe: boolean;
  siteName: string;
}

const DEFAULTS: LoginCfg = {
  logoUrl: "",
  logoSize: 64,
  showLogo: true,
  showSiteName: true,
  bgType: "color",
  bgColor: "#07060F",
  bgImageUrl: "",
  bgOverlay: 0.7,
  bgGradient: "linear-gradient(135deg, #07060F 0%, #1A0A0A 100%)",
  cardBg: "rgba(12,10,20,0.95)",
  cardBorder: "rgba(198,168,75,0.2)",
  showPattern: true,
  welcomeTitle: "ADMIN PANEL",
  welcomeSubtitle: "Arsenal Supporters Club Ghana",
  allowRememberMe: true,
  siteName: "Arsenal Supporters Club Ghana",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [cfg, setCfg] = useState<LoginCfg>(DEFAULTS);
  const [cfgLoaded, setCfgLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("auth-page");
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      document.documentElement.classList.remove("auth-page");
    };
  }, []);

  useEffect(() => {
    fetch("/api/app-state?key=settings", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const s = d?.value || {};
        setCfg({
          logoUrl: s.logoUrl || DEFAULTS.logoUrl,
          logoSize: s.loginLogoSize ?? DEFAULTS.logoSize,
          showLogo: s.loginShowLogo !== false,
          showSiteName: s.loginShowSiteName !== false,
          bgType: s.loginBgType || DEFAULTS.bgType,
          bgColor: s.loginBgColor || DEFAULTS.bgColor,
          bgImageUrl: s.loginBgImage || DEFAULTS.bgImageUrl,
          bgOverlay: s.loginBgOverlay ?? DEFAULTS.bgOverlay,
          bgGradient: s.loginBgGradient || DEFAULTS.bgGradient,
          cardBg: s.loginCardBg || DEFAULTS.cardBg,
          cardBorder: s.loginCardBorder || DEFAULTS.cardBorder,
          showPattern: s.loginShowPattern !== false,
          welcomeTitle: s.loginWelcomeTitle || DEFAULTS.welcomeTitle,
          welcomeSubtitle: s.loginWelcomeSubtitle || s.siteName || DEFAULTS.welcomeSubtitle,
          allowRememberMe: s.loginAllowRememberMe !== false,
          siteName: s.siteName || DEFAULTS.siteName,
        });
      })
      .catch(() => {})
      .finally(() => setCfgLoaded(true));
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const payload = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !payload.success) {
      setError(
        payload.error ||
          (res.status === 503
            ? "Database unavailable. Check DATABASE_URL and run Backup & Database → Upgrade to v1.9.0."
            : "Invalid username or password.")
      );
      return;
    }
    toast.success(`Welcome back, ${payload.session?.name || username}!`);
    router.push("/admin");
  };

  const handleForgot = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setScreen("forgot-sent");
  };

  const bgStyle: React.CSSProperties = (() => {
    if (cfg.bgType === "gradient") return { background: cfg.bgGradient };
    if (cfg.bgType === "image" && cfg.bgImageUrl) {
      return {
        backgroundImage: `url(${cfg.bgImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return { background: cfg.bgColor };
  })();

  if (!cfgLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07060F" }}>
        <div className="w-6 h-6 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative auth-scope" style={bgStyle}>
      {cfg.bgType === "image" && cfg.bgImageUrl && (
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${cfg.bgOverlay})` }} />
      )}
      {cfg.showPattern && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              "repeating-linear-gradient(45deg,rgba(239,1,7,0.3) 0,rgba(239,1,7,0.3) 1px,transparent 0,transparent 50%)",
            backgroundSize: "10px 10px",
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-sm mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors hover:text-white"
          style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-heading)" }}
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Return to Homepage
        </Link>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-7">
          {cfg.showLogo && cfg.logoUrl && (
            <img
              src={cfg.logoUrl}
              alt="Logo"
              className="object-contain mx-auto mb-3"
              style={{ width: cfg.logoSize, height: cfg.logoSize }}
            />
          )}
          {cfg.showLogo && !cfg.logoUrl && (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(239,1,7,0.12)", border: "2px solid rgba(239,1,7,0.3)" }}
            >
              <i className="fa-solid fa-lock text-xl" style={{ color: "rgba(239,1,7,0.8)" }} />
            </div>
          )}
          <h1
            className="text-2xl font-black text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
          >
            {screen === "login" ? cfg.welcomeTitle || "ADMIN PANEL" : "RESET PASSWORD"}
          </h1>
          {cfg.showSiteName && (
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>
              {cfg.welcomeSubtitle || cfg.siteName}
            </p>
          )}
        </div>

        <div
          className="rounded-lg p-7 shadow-2xl"
          style={{
            background: cfg.cardBg,
            border: `1px solid ${cfg.cardBorder}`,
            backdropFilter: "blur(16px)",
          }}
        >
          {error && <div className="mb-5"><FormErrorBanner message={error} /></div>}

          {screen === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <FormField label="Username" icon="fa-solid fa-user" required>
                <FormInput
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                />
              </FormField>

              <FormField label="Password" icon="fa-solid fa-lock" required>
                <div className="flex justify-end -mt-8 mb-1.5 relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setScreen("forgot");
                      setError("");
                    }}
                    className="text-xs font-bold hover:text-white transition-colors"
                    style={{ color: "var(--color-red)", fontFamily: "var(--font-heading)" }}
                  >
                    Forgot password?
                  </button>
                </div>
                <FormPasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </FormField>

              {cfg.allowRememberMe && (
                <FormCheckbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-arsenal w-full py-3.5 text-sm rounded-lg disabled:opacity-60"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin" />
                    Authenticating…
                  </span>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {screen === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-5">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body)" }}>
                Enter your email address and we&apos;ll send reset instructions.
              </p>
              <FormField label="Email" icon="fa-solid fa-envelope" required>
                <FormInput
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="admin@arsenalghana.com"
                  autoComplete="email"
                />
              </FormField>
              <button
                type="submit"
                disabled={loading}
                className="btn-arsenal w-full py-3.5 text-sm rounded-lg disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScreen("login");
                  setError("");
                }}
                className="w-full text-xs text-center transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                ← Back to login
              </button>
            </form>
          )}

          {screen === "forgot-sent" && (
            <div className="text-center space-y-4 py-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)" }}
              >
                <i className="fa-solid fa-check text-green-400" />
              </div>
              <p className="text-sm font-bold text-white">Check your email</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Reset instructions sent to <strong className="text-white">{resetEmail}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setScreen("login");
                  setError("");
                  setResetEmail("");
                }}
                className="btn-arsenal w-full py-3 text-sm rounded-lg"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        <p
          className="text-center text-[10px] mt-5"
          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}
        >
          Arsenal Supporters Club Ghana © {new Date().getFullYear()} — Admin Access Only
        </p>
      </div>
    </div>
  );
}
