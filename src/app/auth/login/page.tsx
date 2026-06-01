"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ArsenalLogo from "@/components/ArsenalLogo";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FormField,
  FormInput,
  FormPasswordInput,
  FormCheckbox,
  FormErrorBanner,
} from "@/components/forms/ModernForm";

type Step = "credentials" | "2fa" | "frozen" | "forgot" | "forgot-sent";

export default function MemberLoginPage() {
  const { login, isLoggedIn, user } = useAuth();
  const { settings } = useApp();
  const router = useRouter();
  const s = settings as any;

  const [step, setStep]           = useState<Step>("credentials");
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword]   = useState("");
  const [otp, setOtp]             = useState(["","","","","",""]);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [resetMN, setResetMN]     = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Pending user — credentials verified but 2FA not done yet
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [otpSent, setOtpSent]     = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("auth-page");
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      document.documentElement.classList.remove("auth-page");
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.status === "Frozen") { setStep("frozen"); return; }
      router.push("/members/dashboard");
    }
  }, [isLoggedIn, user, router]);

  // Step 1 — verify credentials via API (no session created yet)
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberNumber || !password) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);

    try {
      // Call a "pre-auth" check — verifies creds but does NOT set session cookie
      const res = await fetch("/api/auth/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNumber, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      const member = data.user;

      if (member.status === "Frozen") {
        setPendingUser(member);
        setStep("frozen");
        setLoading(false);
        return;
      }

      // Check if 2FA is enabled (either globally or for this member)
      const twoFaGlobal = s.twoFaEnabled && s.memberTwoFaEnabled;
      const memberTwoFa = member.two_factor_enabled;

      if (twoFaGlobal || memberTwoFa) {
        // Send OTP
        setPendingUser(member);
        const otpRes = await fetch("/api/auth/2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id, email: member.email, name: member.firstName, purpose: "login" }),
        });
        const otpData = await otpRes.json();
        setOtpSent(true);
        setStep("2fa");
        if (otpData.dev) {
          // Dev mode — show code in toast
          toast.success(`DEV: Your OTP is ${otpData.dev}`, { duration: 30000, icon: "🔐" });
        } else {
          toast.success(`Verification code sent to ${member.email}`);
        }
      } else {
        // No 2FA — complete login immediately
        const loginRes = await login(memberNumber, password);
        if (!loginRes.success) { setError(loginRes.error || "Login failed."); }
        else if (loginRes.user?.status === "Frozen") { setStep("frozen"); }
        // useEffect handles redirect
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the complete 6-digit code."); return; }
    if (!pendingUser) { setError("Session expired. Please start over."); setStep("credentials"); return; }

    setError(""); setLoading(true);

    try {
      // Verify OTP
      const res = await fetch("/api/auth/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: pendingUser.id, code, purpose: "login" }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid or expired code. Please try again.");
        setLoading(false);
        return;
      }

      // OTP verified — now create the real session
      const loginRes = await login(memberNumber, password);
      if (!loginRes.success) {
        setError(loginRes.error || "Login failed after verification.");
      } else {
        toast.success(`Welcome back, ${pendingUser.firstName}!`);
        router.push("/members/dashboard");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
    if (e.key === "Enter") handleVerifyOTP(e as any);
  };

  const resendOTP = async () => {
    if (!pendingUser) return;
    setOtp(["","","","","",""]);
    const res = await fetch("/api/auth/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: pendingUser.id, email: pendingUser.email, name: pendingUser.firstName, purpose: "login" }),
    });
    const d = await res.json();
    if (d.dev) toast.success(`DEV: New OTP is ${d.dev}`, { duration: 30000 });
    else toast.success("New code sent!");
  };

  // Forgot password
  const handleForgot = async () => {
    if (!resetMN || resetMN.length !== 5) { setError("Enter your 5-digit membership number."); return; }
    setError(""); setLoading(true);
    // Call forgot-password API
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber: resetMN }),
    }).catch(() => {});
    setLoading(false);
    setStep("forgot-sent");
  };

  const bgImage = settings.loginBgImage;
  const bgOverlay = settings.loginBgOverlay ?? 0.6;

  return (
    <div className="min-h-screen flex auth-scope" style={{ background: "#0F0D13" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[45%] relative overflow-hidden">
        {bgImage
          ? <><div className="absolute inset-0" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${bgOverlay})`, backdropFilter: "blur(2px)" }} /></>
          : <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #9B0000 0%, #EF0107 50%, #C8001A 100%)" }} />
        }
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 40px)" }} />
        <div className="relative z-10 p-10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3">
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain" /> : <ArsenalLogo size={48} />}
            <div>
              <p className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>{settings.siteName?.toUpperCase() || "ARSENAL"}</p>
              <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-heading)", fontSize: "10px" }}>SUPPORTERS CLUB GHANA</p>
            </div>
          </Link>
        </div>
        <div className="relative z-10 p-12 flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-5xl font-black text-white leading-none mb-4" style={{ fontFamily: "var(--font-display)" }}>MEMBER<br />PORTAL</p>
            <p className="text-white/65 text-sm leading-relaxed max-w-xs" style={{ fontFamily: "var(--font-body)" }}>
              Access exclusive benefits, book events, track your tickets, and connect with Gunners across Ghana.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            {["10% discount on events & shop", "Emirates Stadium ticket requests", "Members-only community forum", "Manage your membership profile"].map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <i className="fa-solid fa-check text-[9px] text-white" />
                </div>
                <p className="text-sm text-white/70" style={{ fontFamily: "var(--font-body)" }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col relative">
        {bgImage && <div className="lg:hidden absolute inset-0"><div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }} /><div className="absolute inset-0" style={{ background: `rgba(0,0,0,${bgOverlay})` }} /></div>}
        <div className="relative z-10 lg:hidden flex items-center justify-between px-6 py-5" style={{ background: "var(--color-red)" }}>
          <Link href="/" className="flex items-center gap-2">
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="h-8 object-contain" /> : <ArsenalLogo size={32} />}
            <span className="text-white text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>ASC GHANA</span>
          </Link>
          <Link href="/" className="text-white/70 hover:text-white transition-colors"><i className="fa-solid fa-arrow-left text-sm" /></Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div className="w-full max-w-md" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Link href="/" className="hidden lg:flex items-center gap-2 mb-8 text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>
              <i className="fa-solid fa-arrow-left text-xs" />Return to Homepage
            </Link>

            <AnimatePresence mode="wait">

              {/* ── CREDENTIALS ── */}
              {step === "credentials" && (
                <motion.div key="creds" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-3xl font-black text-white mb-1.5" style={{ fontFamily: "var(--font-display)" }}>Sign In</h1>
                  <p className="text-sm mb-8" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Use your membership number and password</p>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                      <FormErrorBanner message={error} />
                    </motion.div>
                  )}

                  <form onSubmit={handleCredentials} className="space-y-5">
                    <FormField label="Membership Number" icon="fa-solid fa-id-badge" required>
                      <FormInput
                        type="text"
                        inputMode="numeric"
                        value={memberNumber}
                        onChange={e => setMemberNumber(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        placeholder="5-digit number"
                        className="tracking-widest text-base"
                        autoFocus
                        autoComplete="username"
                      />
                    </FormField>
                    <FormField
                      label="Password"
                      icon="fa-solid fa-lock"
                      required
                    >
                      <div className="flex items-center justify-end -mt-8 mb-1.5 relative z-10">
                        <button
                          type="button"
                          onClick={() => { setStep("forgot"); setError(""); }}
                          className="text-xs font-bold hover:text-white transition-colors"
                          style={{ color: "var(--color-red)", fontFamily: "var(--font-heading)" }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <FormPasswordInput
                        value={password}
                        onChange={setPassword}
                        placeholder="Your password"
                        autoComplete="current-password"
                      />
                    </FormField>
                    <FormCheckbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
                    <button type="submit" disabled={loading} className="w-full btn-arsenal py-3.5 text-sm mt-2 rounded-lg">
                      {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Verifying…</> : <><i className="fa-solid fa-right-to-bracket mr-2" />Sign In</>}
                    </button>
                  </form>

                  {/* Social login */}
                  {(settings.googleClientId || settings.facebookAppId) && (
                    <div className="mt-6">
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-heading)" }}>OR</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                      </div>
                      <div className={`grid gap-3 ${settings.googleClientId && settings.facebookAppId ? "grid-cols-2" : "grid-cols-1"}`}>
                        {settings.googleClientId && (
                          <button className="flex items-center justify-center gap-2 py-3 rounded-sm hover:bg-white/5 transition-all"
                            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                            <i className="fa-brands fa-google" style={{ color: "var(--text-secondary)" }} />
                            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}>Google</span>
                          </button>
                        )}
                        {settings.facebookAppId && (
                          <button className="flex items-center justify-center gap-2 py-3 rounded-sm hover:bg-white/5 transition-all"
                            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                            <i className="fa-brands fa-facebook-f" style={{ color: "var(--text-secondary)" }} />
                            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}>Facebook</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-center mt-6 text-sm" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)" }}>
                    Not a member?{" "}<Link href="/membership/register" className="font-medium hover:underline" style={{ color: "var(--color-red)" }}>Join ASC Ghana</Link>
                  </p>
                </motion.div>
              )}

              {/* ── 2FA OTP ── */}
              {step === "2fa" && (
                <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(239,1,7,0.12)", border: "1px solid rgba(239,1,7,0.25)" }}>
                    <i className="fa-solid fa-mobile-screen-button text-2xl" style={{ color: "var(--color-red)" }} />
                  </div>
                  <h1 className="text-3xl font-black text-white mb-1.5" style={{ fontFamily: "var(--font-display)" }}>Verify Identity</h1>
                  <p className="text-sm mb-8" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                    Enter the 6-digit code sent to <strong className="text-white">{pendingUser?.email}</strong>
                  </p>

                  {error && <div className="mb-5"><FormErrorBanner message={error} /></div>}

                  <form onSubmit={handleVerifyOTP}>
                    <div className="flex gap-2 mb-6">
                      {otp.map((d, i) => (
                        <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                          onChange={e => handleOtpInput(i, e.target.value)}
                          onKeyDown={e => handleOtpKey(i, e)}
                          className="otp-input flex-1 min-w-0" style={{ height: "52px" }} />
                      ))}
                    </div>
                    <button type="submit" disabled={loading} className="w-full btn-arsenal py-3.5 text-sm">
                      {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Verifying…</> : <><i className="fa-solid fa-shield-check mr-2" />Verify & Sign In</>}
                    </button>
                  </form>

                  <div className="flex items-center justify-between mt-4">
                    <button onClick={() => { setStep("credentials"); setOtp(["","","","","",""]); setError(""); setPendingUser(null); }}
                      className="text-xs hover:text-white transition-colors" style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>
                      <i className="fa-solid fa-arrow-left mr-1" />Back
                    </button>
                    <button onClick={resendOTP} className="text-xs hover:text-white transition-colors" style={{ color: "var(--color-red)", fontFamily: "var(--font-heading)" }}>
                      Resend code
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── FROZEN ── */}
              {step === "frozen" && (
                <motion.div key="frozen" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto" style={{ background: "rgba(52,152,219,0.15)", border: "2px solid #3498DB" }}>
                    <i className="fa-solid fa-snowflake text-2xl" style={{ color: "#3498DB" }} />
                  </div>
                  <h1 className="text-3xl font-black text-white text-center mb-3" style={{ fontFamily: "var(--font-display)" }}>Account Frozen</h1>
                  <div className="p-5 rounded-sm mb-5" style={{ background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.25)" }}>
                    <p className="text-sm text-center" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                      Your account has been frozen. Contact the Membership Coordinator to reactivate.
                    </p>
                  </div>
                  <Link href="/members/membership" className="w-full btn-arsenal py-3.5 text-sm flex items-center justify-center">
                    <i className="fa-solid fa-rotate mr-2" />Renew Membership
                  </Link>
                  <button onClick={() => { setStep("credentials"); setError(""); }} className="w-full mt-3 py-2 text-sm text-center" style={{ color: "var(--text-muted)" }}>
                    Back
                  </button>
                </motion.div>
              )}

              {/* ── FORGOT ── */}
              {step === "forgot" && (
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(239,1,7,0.12)", border: "1px solid rgba(239,1,7,0.25)" }}>
                    <i className="fa-solid fa-key text-2xl" style={{ color: "var(--color-red)" }} />
                  </div>
                  <h1 className="text-3xl font-black text-white mb-1.5" style={{ fontFamily: "var(--font-display)" }}>Forgot Password?</h1>
                  <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Enter your membership number and we will help you reset your password.</p>
                  {error && <div className="mb-5"><FormErrorBanner message={error} /></div>}
                  <div className="space-y-5">
                    <FormField label="Membership Number" icon="fa-solid fa-id-badge" required>
                      <FormInput
                        type="text"
                        inputMode="numeric"
                        value={resetMN}
                        onChange={e => setResetMN(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        placeholder="5-digit number"
                        className="tracking-widest text-base"
                        autoFocus
                      />
                    </FormField>
                    <button onClick={handleForgot} disabled={loading} className="w-full btn-arsenal py-3.5 text-sm">
                      {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Sending…</> : <><i className="fa-solid fa-paper-plane mr-2" />Send Reset Instructions</>}
                    </button>
                    <button onClick={() => { setStep("credentials"); setError(""); }} className="w-full py-3 text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>
                      <i className="fa-solid fa-arrow-left mr-2" />Back to Sign In
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── FORGOT SENT ── */}
              {step === "forgot-sent" && (
                <motion.div key="forgot-sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto" style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.4)" }}>
                    <i className="fa-solid fa-envelope-circle-check text-2xl" style={{ color: "#10B981" }} />
                  </div>
                  <h1 className="text-3xl font-black text-white text-center mb-2" style={{ fontFamily: "var(--font-display)" }}>Request Sent</h1>
                  <p className="text-sm text-center mb-6" style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                    If membership number <strong className="text-white">{resetMN}</strong> is registered, reset instructions have been sent to the associated email.
                  </p>
                  <button onClick={() => { setStep("credentials"); setResetMN(""); setError(""); }} className="w-full btn-arsenal py-3.5 text-sm">
                    <i className="fa-solid fa-right-to-bracket mr-2" />Back to Sign In
                  </button>
                </motion.div>
              )}

            </AnimatePresence>

            <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>
                Admin?{" "}<Link href="/admin/login" className="hover:underline" style={{ color: "var(--text-muted)" }}>Admin portal</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
