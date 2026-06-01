"use client";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

const PLATFORM_ICONS: Record<string, string> = {
  Facebook: "fa-brands fa-facebook-f", Instagram: "fa-brands fa-instagram",
  "Twitter/X": "fa-brands fa-x-twitter", YouTube: "fa-brands fa-youtube",
  TikTok: "fa-brands fa-tiktok", WhatsApp: "fa-brands fa-whatsapp",
  LinkedIn: "fa-brands fa-linkedin-in", Telegram: "fa-brands fa-telegram",
};
const PLATFORM_COLORS: Record<string, string> = {
  Facebook: "#1877F2", Instagram: "#E1306C", "Twitter/X": "#1DA1F2",
  YouTube: "#FF0000", TikTok: "#69C9D0", WhatsApp: "#25D366",
  LinkedIn: "#0A66C2", Telegram: "#26A5E4",
};

const LINKS = [
  { title: "Club", links: [
    { label: "About Us",    href: "/about" },
    { label: "History",     href: "/history" },
    { label: "Executive",   href: "/about/exco" },
    { label: "Supporters Groups", href: "/supporters-groups" },
    { label: "Contact",     href: "/contact" },
  ]},
  { title: "Membership", links: [
    { label: "Join Now",    href: "/membership/apply" },
    { label: "Plans",       href: "/membership" },
    { label: "Renew",       href: "/membership/renew" },
    { label: "Member Login",href: "/auth/login" },
    { label: "Dashboard",   href: "/members/dashboard" },
  ]},
  { title: "Matches & Events", links: [
    { label: "Match Viewings", href: "/match-viewings" },
    { label: "Events",      href: "/events" },
    { label: "Fixtures",    href: "/season-stats" },
    { label: "Ticket Requests", href: "/members/tickets" },
    { label: "Gallery",     href: "/gallery" },
  ]},
  { title: "Community", links: [
    { label: "News",        href: "/news" },
    { label: "Projects",    href: "/community" },
    { label: "Fan Wall",    href: "/fan-wall" },
    { label: "Shop",        href: "/shop" },
    { label: "Donate",      href: "/members/donate" },
  ]},
];

export default function Footer() {
  const { settings } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="footer-root">
      {/* Top accent */}
      <div style={{ height: 3, background: "linear-gradient(90deg, transparent, var(--red) 30%, var(--gold) 50%, var(--red) 70%, transparent)" }} />

      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="ASC Ghana" className="h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--red)" }}>
                  <i className="fa-solid fa-shield-halved text-white text-xl" />
                </div>
              )}
              <div>
                <p className="text-sm font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {settings.siteName || "ASC GHANA"}
                </p>
                <p className="text-[10px]" style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                  Official Arsenal Supporters Club
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)", maxWidth: 260 }}>
              {settings.footerTagline || "Official Arsenal Supporters Club Ghana — The Ghana Gooners. Founded 2003, officially approved by Arsenal FC in 2008."}
            </p>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
              {settings.footerMotto || "Victoria Concordia Crescit"}
            </p>
            {/* Social icons */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {settings.socialLinks?.filter((s: any) => s.url).map((s: any) => {
                const icon  = s.icon  || PLATFORM_ICONS[s.platform]  || "fa-solid fa-globe";
                const color = s.color || PLATFORM_COLORS[s.platform] || "#EF0107";
                return (
                  <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="w-9 h-9 flex items-center justify-center rounded transition-all hover:-translate-y-0.5"
                    style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                    <i className={`${icon} text-sm`} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {LINKS.map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4"
                style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href}
                      className="text-xs transition-colors hover:text-white flex items-center gap-1.5 group"
                      style={{ color: "rgba(255,255,255,0.45)" }}>
                      <i className="fa-solid fa-chevron-right text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--red)" }} />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-12 pt-8 border-t grid sm:grid-cols-3 gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {[
            { icon: "fa-solid fa-location-dot", text: settings.address || "Accra, Ghana" },
            { icon: "fa-solid fa-phone",        text: settings.phone   || "+233 20 000 0000" },
            { icon: "fa-solid fa-envelope",     text: settings.email   || "info@arsenalghana.com" },
          ].map(item => (
            <div key={item.icon} className="flex items-center gap-2.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <i className={`${item.icon} text-[11px]`} style={{ color: "var(--red)" }} />
              {item.text}
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            {settings.footerCopyright || `© ${year} Arsenal Supporters Club Ghana. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms",   href: "/terms" },
              { label: "Cookies", href: "/cookies" },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="text-[11px] transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
