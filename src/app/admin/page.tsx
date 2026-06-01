"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, Button, Progress, Avatar, Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashStats {
  members:  { total:number; active:number; frozen:number; expired:number; pendingRenewal:number; newThisMonth:number; byTier:Record<string,number> };
  events:   { total:number; published:number; upcoming:number };
  payments: { total:number; paid:number; pending:number; totalRevenue:number };
  donations:{ campaigns:number; totalRaised:number; totalGoal:number };
  tickets:  { total:number; pending:number; approved:number; declined:number };
  posts:    { total:number; published:number };
  unreadMessages: number;
}
interface RecentMember {
  id:number; first_name:string; last_name:string;
  membership_number:string; tier:string; branch:string; status:string; created_at:string;
}
interface RecentPayment {
  id:string; member_name:string; amount:number; currency:string;
  method:string; status:string; purpose:string; created_at:string;
}
interface GrowthPoint { month:string; count:number; }
interface UpcomingEvent {
  id:number; title:string; date:string; time:string;
  venue:string; category:string; capacity:number; booked:number;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string,string> = {
  Platinum:"#E8E8E8", Gold:"#C6A84B", Silver:"#A8A9AD", Bronze:"#CD7F32", Abusua:"#2ECC71",
};
const STATUS_COLORS: Record<string,string> = {
  Active:"#22C55E", Frozen:"#3B82F6", Expired:"#EF4444",
  "Pending Renewal":"#F59E0B", Inactive:"#6B7280", Suspended:"#8B5CF6",
};
const PAYMENT_STATUS_COLORS: Record<string,string> = {
  Paid:"#22C55E", Pending:"#F59E0B", Failed:"#EF4444", Refunded:"#3B82F6", Cancelled:"#6B7280",
};

function fmt(n:number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }
function fmtCurrency(n:number, currency="GHS") {
  return `${currency === "GHS" ? "GH₵" : "£"}${n.toLocaleString("en-GB", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
}
function timeAgo(d:string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short" });
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, href, trend }: {
  label:string; value:string|number; sub?:string; icon:string;
  color:string; href?:string; trend?: { value:number; label:string };
}) {
  const inner = (
    <div
      className="relative overflow-hidden rounded-sm border p-5 transition-all duration-200 group"
      style={{ background:"var(--bg-card)", borderColor:"var(--border-color)", borderTop:`2px solid ${color}` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}18`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-30"
        style={{ background:`radial-gradient(circle at top right, ${color}30 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
          {label}
        </p>
        <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background:`${color}12` }}>
          <i className={`${icon} text-sm`} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)" }}>{sub}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          <i className={`fa-solid ${trend.value >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"} text-[10px]`}
            style={{ color: trend.value >= 0 ? "#22C55E" : "#EF4444" }} />
          <span className="text-[10px] font-bold" style={{ color: trend.value >= 0 ? "#22C55E" : "#EF4444", fontFamily:"var(--font-heading)" }}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
  if (href) return <Link href={href} className="block no-underline">{inner}</Link>;
  return inner;
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function MiniBarChart({ data, color="#EF0107" }: { data:{label:string;value:number}[]; color?:string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-sm transition-all duration-300 group-hover:opacity-100 opacity-70"
            style={{ height:`${Math.max(4, (d.value / max) * 56)}px`, background:color }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px] font-bold truncate w-full text-center" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
            {d.label.slice(0,3)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────────
function DonutChart({ segments, size=80 }: { segments:{label:string;value:number;color:string}[]; size?:number }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (!total) return <div className="w-20 h-20 rounded-full" style={{ background:"var(--border-color)" }} />;

  let offset = 0;
  const r = 30, cx = 40, cy = 40, circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-color)" strokeWidth="10" />
      {segments.filter(s => s.value > 0).map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circumference;
        const gap  = circumference - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference}
            strokeLinecap="butt"
            style={{ transition:"stroke-dasharray 0.5s ease" }}
          >
            <title>{s.label}: {s.value}</title>
          </circle>
        );
        offset += pct;
        return el;
      })}
      <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize:14, fontWeight:900, fill:"var(--text-primary)", fontFamily:"var(--font-display)" }}>
        {total}
      </text>
    </svg>
  );
}
