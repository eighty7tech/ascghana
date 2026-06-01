"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";

function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    if (!targetDate) return;
    const update = () => setDiff(Math.max(0, new Date(targetDate).getTime() - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const s = Math.floor(diff / 1000);
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    active:  diff > 0,
  };
}

export default function MaintenancePage() {
  const { settings } = useApp();
  const router = useRouter();
  const s = settings as any;

  useEffect(() => {
    if (!settings.maintenanceMode) router.replace("/");
  }, [settings.maintenanceMode, router]);

  const countdown = useCountdown(s.maintenanceCountdownDate || "");
  const bgColor   = s.maintenanceBgColor || "#07060F";
  const bgImage   = s.maintenanceBgImage || "";
  const showContact = s.maintenanceShowContact !== false;
  const showSocial  = s.maintenanceShowSocial  !== false;
  const msg = settings.maintenanceMessage || "We're currently upgrading our systems. We'll be back shortly.";
  const activeSocials = settings.socialLinks?.filter((l: any) => l.url?.trim()) || [];

  const contactEmail = s.contactEmail || s.email || "";
  const contactPhone = s.contactPhone || s.phone || "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat`
          : bgColor,
      }}
    >
      {/* Overlay when using image */}
      {bgImage && (
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
      )}

      {/* Animated red radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(239,1,7,0.12) 0%,transparent 70%)" }}
      />
      <div className="absolute inset-0 arsenal-pattern opacity-[0.06] pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-lg w-full">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(239,1,7,0.12)", border: "2px solid rgba(239,1,7,0.3)" }}
          >
            <i className="fa-solid fa-wrench text-3xl" style={{ color: "#EF0107" }} />
          </div>
        </div>

        {/* Club name */}
        <p
          className="text-xs font-bold uppercase tracking-[0.35em] mb-3"
          style={{ color: "rgba(198,168,75,0.85)", fontFamily: "var(--font-heading)" }}
        >
          Arsenal Supporters Club Ghana
        </p>

        {/* Heading */}
        <h1
          className="text-5xl md:text-6xl font-black leading-none mb-3"
          style={{ fontFamily: "var(--font-display)", color: "#FFFFFF" }}
        >
          MAINTENANCE
        </h1>
        <div className="w-14 h-1 mx-auto rounded-full mb-6" style={{ background: "#EF0107" }} />

        {/* Message */}
        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-body)" }}
        >
          {msg}
        </p>

        {/* Countdown */}
        {countdown.active && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {[
              { label: "Days",    val: countdown.days },
              { label: "Hours",   val: countdown.hours },
              { label: "Mins",    val: countdown.minutes },
              { label: "Secs",    val: countdown.seconds },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 flex items-center justify-center rounded-sm text-2xl font-black text-white"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: "rgba(239,1,7,0.1)",
                    border: "1px solid rgba(239,1,7,0.25)",
                  }}
                >
                  {pad(val)}
                </div>
                <p
                  className="text-[9px] mt-1 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-heading)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Victoria Concordia Crescit badge */}
        <div
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-sm mb-8"
          style={{
            background: "rgba(239,1,7,0.07)",
            border: "1px solid rgba(239,1,7,0.18)",
          }}
        >
          <i className="fa-solid fa-shield-halved text-xs" style={{ color: "#EF0107" }} />
          <span
            className="text-xs font-bold tracking-widest"
            style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}
          >
            VICTORIA CONCORDIA CRESCIT
          </span>
          <i className="fa-solid fa-shield-halved text-xs" style={{ color: "#EF0107" }} />
        </div>

        {/* Contact info */}
        {showContact && (contactEmail || contactPhone) && (
          <div className="mb-6 space-y-1">
            {contactEmail && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                <i className="fa-solid fa-envelope mr-2" style={{ color: "rgba(239,1,7,0.6)" }} />
                <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                  {contactEmail}
                </a>
              </p>
            )}
            {contactPhone && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                <i className="fa-solid fa-phone mr-2" style={{ color: "rgba(239,1,7,0.6)" }} />
                <a href={`tel:${contactPhone}`} className="hover:text-white transition-colors">
                  {contactPhone}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Social icons */}
        {showSocial && activeSocials.length > 0 && (
          <div className="flex justify-center gap-3 mb-8">
            {activeSocials.map((social: any) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                title={social.platform}
                className="w-9 h-9 rounded-sm flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: `${social.color || "#EF0107"}15`,
                  border: `1px solid ${social.color || "#EF0107"}35`,
                  color: social.color || "#EF0107",
                }}
              >
                <i className={`${social.icon || "fa-solid fa-globe"} text-sm`} />
              </a>
            ))}
          </div>
        )}

        {/* Admin access */}
        {settings.maintenanceAllowAdmin && (
          <div className="mt-4">
            <a
              href="/admin"
              className="text-[11px] underline transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}
            >
              Admin Access →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
