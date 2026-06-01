"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui";
import { ADMIN_NAV } from "@/config/adminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { settings, tickets } = useApp();
  const adminBg      = (settings as any).adminPanelBg      || "#07060F";
  const adminText    = (settings as any).adminPanelText     || "#FFFFFF";
  const adminSidebar = (settings as any).adminSidebarBg     || "#0A0812";
  const adminHeader  = (settings as any).adminHeaderBg      || "#0D0B18";
  const adminAccent  = (settings as any).adminAccent        || "var(--color-red)";
  const pendingTickets = tickets.filter(t=>t.status==="Pending").length;

  // Read admin session
  const [adminSession, setAdminSession] = useState<{username:string;name:string;role:string}|null>(null);
  const [adminProfile, setAdminProfile] = useState<{ displayName?: string; photoUrl?: string; jobTitle?: string } | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/admin/auth", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(payload => setAdminSession(payload?.session || null))
      .catch(() => setAdminSession(null))
      .finally(() => setSessionLoaded(true));
    fetch("/api/admin/profile", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(d => setAdminProfile(d?.profile || null))
      .catch(() => setAdminProfile(null));
  }, [pathname]);

  const displayName = adminProfile?.displayName || adminSession?.name || "Admin";
  const profilePhoto = adminProfile?.photoUrl;

  // ── Real DB-driven notifications ─────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = () => {
    fetch("/api/admin/notifications?limit=50")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!d) return; setNotifications(d.notifications || []); setUnreadCount(Number(d.unreadCount || 0)); })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id: number) => {
    fetch("/api/admin/notifications", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) }).catch(()=>{});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    fetch("/api/admin/notifications", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({markAllRead:true}) }).catch(()=>{});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const clearAllNotifs = () => {
    fetch("/api/admin/notifications", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({clearAll:true}) }).catch(()=>{});
    setNotifications([]);
    setUnreadCount(0);
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {});
    router.push("/admin/login");
  };

  const NOTIF_ICONS: Record<string,string> = {
    ticket: "fa-solid fa-ticket",
    member: "fa-solid fa-user-plus",
    renewal:"fa-solid fa-crown",
    event:  "fa-solid fa-calendar-days",
    system: "fa-solid fa-gear",
  };
  const NOTIF_ROUTES: Record<string,string> = {
  ticket: "/admin/tickets",
  member: "/admin/members",
  renewal: "/admin/membership-requests",
  event: "/admin/events",
  blog: "/admin/blog",
  shop: "/admin/shop",
  gallery: "/admin/gallery",
  suggestion: "/admin/suggestions",
  message: "/admin/messages",
  newsletter: "/admin/newsletter",
  system: "/admin/settings",
};

const NOTIF_COLORS: Record<string,string> = {
    ticket:"#EF0107", member:"#10B981", renewal:"#C6A84B", event:"#3B82F6", system:"#8B5CF6",
  };

  // Redirect unauthenticated users to admin login
  useEffect(() => {
    if (!sessionLoaded || pathname === "/admin/login") return;
    if (!adminSession) router.replace("/admin/login");
  }, [sessionLoaded, adminSession, pathname, router]);

  if (pathname==="/admin/login") return <>{children}</>;
  if (!sessionLoaded || !adminSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: adminBg }}>
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarContent = ({ compact }: { compact: boolean }) => (
    <div className="flex flex-col h-full admin-sidebar" style={{ background:adminSidebar }}>
      {/* Logo */}
      <div className={`flex items-center px-4 py-5 ${compact?"justify-center":"justify-between"}`}
        style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        {!compact && (
          <div className="flex items-center gap-2.5">
            {settings.logoUrl
              ? <img src={settings.logoUrl} alt="Logo" className="h-8 object-contain" />
              : <div className="w-8 h-8" />
            }
            <div>
              <p className="text-xs font-black text-white leading-none" style={{ fontFamily:"var(--font-display)" }}>{settings.siteName || "ARSENAL"}</p>
              <p className="text-[9px] leading-none mt-0.5" style={{ color:"rgba(255,255,255,0.3)",fontFamily:"var(--font-heading)" }}>GHANA ADMIN</p>
            </div>
          </div>
        )}
        {compact && (settings.logoUrl
          ? <img src={settings.logoUrl} alt="" className="h-7 object-contain" />
          : <div className="w-7 h-7" />
        )}
        <button onClick={()=>setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 rounded transition-colors hover:bg-white/5" style={{ color:"rgba(255,255,255,0.25)" }}>
          <i className={`fa-solid ${collapsed?"fa-chevron-right":"fa-chevron-left"} text-xs`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ scrollbarWidth:"none" }}>
        {ADMIN_NAV.map(section=>(
          <div key={section.section} className="mb-3">
            {!compact && <p className="px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.18)",fontFamily:"var(--font-heading)" }}>{section.section}</p>}
            {section.items.map(item=>{
              const active = pathname===item.href || (item.href!=="/admin"&&pathname.startsWith(item.href));
              const hasBadge = item.badgeKey === "tickets" && pendingTickets > 0;
              return (
                <Link key={item.href} href={item.href}
                  className={`sidebar-link flex items-center mx-2 rounded-sm mb-0.5 transition-all ${compact?"justify-center px-2 py-2.5":"gap-3 px-3 py-2.5"} ${active?"active":""}`}
                  style={{ background:active?"rgba(239,1,7,0.1)":"transparent", borderLeft:active&&!compact?"2px solid var(--color-red)":"2px solid transparent", paddingLeft:active&&!compact?"calc(12px - 2px)":compact?"8px":"12px" }}
                  title={compact?item.label:undefined}>
                  <i className={`${item.icon} text-sm flex-shrink-0 text-center`} style={{ color:active?"var(--color-red)":"rgba(255,255,255,0.35)",width:"16px" }} />
                  {!compact && <span className="text-sm flex-1 truncate" style={{ color:active?"white":"rgba(255,255,255,0.5)",fontFamily:"var(--font-body)",fontWeight:active?500:400 }}>{item.label}</span>}
                  {!compact && hasBadge && <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded-full" style={{ background:"var(--color-red)",color:"white",fontFamily:"var(--font-heading)",minWidth:18,textAlign:"center" }}>{pendingTickets}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`p-4 flex items-center gap-3 ${compact?"justify-center":""}`} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin/profile" className={`flex-shrink-0 ${compact ? "" : ""}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black overflow-hidden"
            style={{ background: profilePhoto ? "transparent" : "linear-gradient(135deg,#C6A84B,#E8C97A)", color:"#1A0A0A", fontFamily:"var(--font-heading)", border:"1px solid rgba(198,168,75,0.35)" }}>
            {profilePhoto ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> : displayName[0]}
          </div>
        </Link>
        {!compact && <>
          <Link href="/admin/profile" className="flex-1 min-w-0 no-underline">
            <p className="text-xs font-medium text-white truncate">{displayName}</p>
            <p className="text-[10px] truncate" style={{ color:"rgba(255,255,255,0.3)" }}>
              {adminProfile?.jobTitle || adminSession?.username}
            </p>
          </Link>
          <button onClick={handleLogout} className="p-1.5 rounded transition-colors hover:text-red-400" style={{ color:"rgba(255,255,255,0.25)" }}
            title="Logout">
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        </>}
      </div>
    </div>
  );

  return (
    <div className="admin-scope flex h-screen overflow-hidden" style={{ background:adminBg || "var(--bg-primary)", color:adminText || "var(--text-primary)" }}>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed?"w-16":"w-60"}`} style={{ borderRight:"1px solid rgba(255,255,255,0.04)" }}>
        <SidebarContent compact={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col" style={{ background:adminSidebar }}>
            <SidebarContent compact={false} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center gap-4 px-6 py-4" style={{ background:adminHeader, borderBottom:"1px solid rgba(255,255,255,0.08)", height:"72px" }}>
          <button onClick={()=>setMobileOpen(true)} className="lg:hidden" style={{ color:"rgba(255,255,255,0.5)" }}>
            <i className="fa-solid fa-bars text-lg" />
          </button>
          <div className="flex items-center gap-2 flex-1 max-w-xs px-4 py-2.5 rounded-lg" style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
            <i className="fa-solid fa-magnifying-glass text-xs" style={{ color:"rgba(255,255,255,0.25)" }} />
            <input type="text" placeholder="Search members, events..." className="bg-transparent text-sm text-white placeholder-white/30 outline-none flex-1 min-w-0" style={{ fontFamily:"var(--font-body)" }} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden sm:flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color:"rgba(255,255,255,0.3)",fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-up-right-from-square text-[10px]" />View Site
            </Link>
            {/* Notification bell with dropdown */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 transition-colors hover:text-white" style={{ color:"rgba(255,255,255,0.4)" }}>
                <i className="fa-solid fa-bell text-base" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black notif-pulse"
                    style={{ background:"var(--color-red)", color:"white", fontFamily:"var(--font-heading)" }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50 shadow-2xl"
                  style={{ background:"var(--bg-card)", border:"1px solid var(--border-accent)", borderTop:"2px solid var(--color-red)" }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px]"
                          style={{ background:"rgba(239,1,7,0.2)", color:"var(--color-red)" }}>
                          {unreadCount} new
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] transition-colors hover:text-white"
                          style={{ color:"rgba(255,255,255,0.35)", fontFamily:"var(--font-heading)" }}>
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={() => clearAllNotifs()} className="text-[10px] transition-colors hover:text-red-400"
                          style={{ color:"rgba(255,255,255,0.25)", fontFamily:"var(--font-heading)" }}>
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <i className="fa-solid fa-bell-slash text-3xl mb-3 block" style={{ color:"rgba(255,255,255,0.08)" }} />
                        <p className="text-xs font-bold mb-1" style={{ color:"rgba(255,255,255,0.25)", fontFamily:"var(--font-heading)" }}>All Clear</p>
                        <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.18)" }}>No notifications yet. Admin actions will appear here.</p>
                      </div>
                    ) : notifications.map(n => (
                      <Link key={n.id} href={NOTIF_ROUTES[n.type] || "/admin"} onClick={() => { markRead(n.id); setNotifOpen(false); }}
                        className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 no-underline block"
                        style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background: n.is_read ? "transparent" : "rgba(239,1,7,0.03)" }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background:`${NOTIF_COLORS[n.type]||"#EF0107"}18` }}>
                          <i className={`${NOTIF_ICONS[n.type]||"fa-solid fa-bell"} text-xs`}
                            style={{ color: NOTIF_COLORS[n.type]||"#EF0107" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-semibold text-white leading-tight" style={{ fontFamily:"var(--font-heading)" }}>
                              {n.title}
                            </p>
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background:"var(--color-red)" }} />}
                          </div>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-body)" }}>
                            {n.message}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-2.5" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <Link href="/admin/members" onClick={() => setNotifOpen(false)}
                      className="text-[11px] flex items-center justify-center gap-1.5 transition-colors hover:text-white"
                      style={{ color:"rgba(255,255,255,0.35)", fontFamily:"var(--font-heading)" }}>
                      View all activity <i className="fa-solid fa-arrow-right text-[9px]" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Badge variant="gold">
              {adminSession?.role === "superadmin" || adminSession?.role === "super_admin"
                ? "SUPER ADMIN"
                : (adminSession?.role || "ADMIN").replace(/_/g, " ").toUpperCase()}
            </Badge>
            <Link href="/admin/profile" className="no-underline">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black overflow-hidden transition-opacity hover:opacity-90"
                style={{ background: profilePhoto ? "transparent" : "linear-gradient(135deg,#C6A84B,#E8C97A)", color:"#1A0A0A", fontFamily:"var(--font-heading)", border:"1px solid rgba(198,168,75,0.35)" }}>
                {profilePhoto ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" /> : displayName[0]}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
