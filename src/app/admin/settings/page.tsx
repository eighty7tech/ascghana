"use client";
import Link from "next/link";
import { Type, DollarSign, Globe, Database, Image, Settings, MessageSquare, Shield, Ticket, Lock, Monitor, Bell, Layout, Menu, Upload, Sliders, Cloud, Wrench, Palette } from "lucide-react";

const settingsSections = [
  { icon:Palette,   label:"Theme & Colors",     desc:"Light/dark palette, nav bar, mega-menu & card colors", href:"/admin/settings/appearance",      color:"#E30613" },
  { icon:Shield,    label:"Authentication",     desc:"2FA, social login, sessions, security policies",    href:"/admin/settings/authentication",  color:"#EF0107" },
  { icon:Monitor,   label:"Admin Login Page",   desc:"Logo, background, welcome text for login page",     href:"/admin/settings/admin-login",     color:"#8B5CF6" },
  { icon:Layout,    label:"Homepage Sections",  desc:"Match countdown, stats, bulletin, spotlight, polls", href:"/admin/settings/homepage",        color:"#10B981" },
  { icon:Image,     label:"Logo & Branding",    desc:"Logo, colors, club info, login background",         href:"/admin/settings/branding",        color:"#C6A84B" },
  { icon:Type,      label:"Typography & Fonts", desc:"Fonts, sizes, weights for all text",                href:"/admin/settings/fonts",           color:"#F59E0B" },
  { icon:Sliders,   label:"Button Styles",      desc:"CRUD buttons — clips, colors, fonts, padding",      href:"/admin/settings/buttons",         color:"#EF0107" },
  { icon:Sliders,   label:"Icon Settings",       desc:"Global icon size, color, and FontAwesome style",    href:"/admin/settings/icons",           color:"#F59E0B" },
  { icon:Menu,      label:"Menu & Navigation",  desc:"CRUD nav items, dropdowns, top bar links",          href:"/admin/settings/menu",            color:"#3B82F6" },
  { icon:DollarSign,label:"Payments & Currency",desc:"Gateways, GBP/GHS rate, ticket currency",          href:"/admin/settings/payments",        color:"#10B981" },
  { icon:Globe,     label:"Social Media",       desc:"Links shown in footer and contact page",            href:"/admin/settings/social",          color:"#3B82F6" },
  { icon:Lock,      label:"Social Login",       desc:"Google and Facebook OAuth keys",                    href:"/admin/settings/social-login",    color:"#6366F1" },
  { icon:Cloud,     label:"Storage & Uploads",  desc:"Cloudinary, AWS S3, ImgBB, local storage",         href:"/admin/settings/uploads",         color:"#3448C5" },
  { icon:Database,  label:"Backup & Database",  desc:"Backup, restore, SQL migrate, system upgrade",     href:"/admin/settings/database",        color:"#F59E0B" },
  { icon:Wrench,    label:"Maintenance Mode",   desc:"Show maintenance page, restrict frontend access",   href:"/admin/settings/site",            color:"#EF4444" },
  { icon:Bell,      label:"Announcements",      desc:"Post announcements to members and admins",          href:"/admin/announcements",            color:"#EF0107" },
  { icon:MessageSquare,label:"Contact Messages",desc:"View messages from contact form",                   href:"/admin/messages",                 color:"#06B6D4" },
  { icon:Settings,  label:"Contact Page",      desc:"Email, phone, WhatsApp, map embed, hours",          href:"/admin/settings/contact",         color:"#06B6D4" },
  { icon:Settings,  label:"Developer Settings", desc:"Developer credits and misc settings",               href:"/admin/settings/developer",       color:"#6B7280" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>SETTINGS</h1>
        <p className="text-sm text-white/40 mt-0.5" style={{ fontFamily:"var(--font-body)" }}>Configure your Arsenal Ghana club site — v1.7.0</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map(s => (
          <Link key={s.href} href={s.href}
            className="flex items-center gap-4 p-5 rounded-sm transition-all hover:-translate-y-0.5 group"
            style={{ background:"#16213E", border:`1px solid ${s.color}20` }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor=`${s.color}50`)}
            onMouseLeave={e=>(e.currentTarget.style.borderColor=`${s.color}20`)}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:`${s.color}15` }}>
              <s.icon size={22} style={{ color:s.color }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm" style={{ fontFamily:"var(--font-heading)" }}>{s.label}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color:"rgba(255,255,255,0.4)" }}>{s.desc}</p>
            </div>
            <i className="fa-solid fa-chevron-right text-xs group-hover:translate-x-1 transition-transform" style={{ color:"rgba(255,255,255,0.2)" }}/>
          </Link>
        ))}
      </div>
    </div>
  );
}
