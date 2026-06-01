/**
 * ASC Ghana v3.0.0 — Admin Dashboard Stats API
 * Returns aggregated stats from both raw MySQL (existing) and Prisma (new)
 */
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/sessionAuth";
import { getStateValue } from "@/lib/databaseState";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Member stats from raw MySQL ──────────────────────────────────────────
    const memberStats = await query<any>(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Active')           AS active,
        SUM(status = 'Frozen')           AS frozen,
        SUM(status = 'Expired')          AS expired,
        SUM(status = 'Pending Renewal')  AS pendingRenewal,
        SUM(status = 'Inactive')         AS inactive,
        SUM(tier = 'Platinum')           AS platinum,
        SUM(tier = 'Gold')               AS gold,
        SUM(tier = 'Silver')             AS silver,
        SUM(tier = 'Bronze')             AS bronze,
        SUM(tier = 'Abusua')             AS abusua
      FROM members
    `).catch(() => [{}]);

    // ── New members this month ────────────────────────────────────────────────
    const newThisMonth = await query<any>(`
      SELECT COUNT(*) AS count FROM members
      WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
    `).catch(() => [{ count: 0 }]);

    // ── Event stats ───────────────────────────────────────────────────────────
    const eventStats = await query<any>(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Published') AS published,
        SUM(status = 'Draft')     AS draft,
        SUM(date >= CURDATE())    AS upcoming
      FROM events
    `).catch(() => [{}]);

    // ── Payment stats ─────────────────────────────────────────────────────────
    const paymentStats = await query<any>(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Paid') AS paid,
        SUM(status = 'Pending') AS pending,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) AS totalRevenue
      FROM payments
    `).catch(() => [{ total: 0, paid: 0, pending: 0, totalRevenue: 0 }]);

    // ── Donation stats ────────────────────────────────────────────────────────
    const donationStats = await query<any>(`
      SELECT
        COUNT(*) AS campaigns,
        COALESCE(SUM(raised), 0) AS totalRaised,
        COALESCE(SUM(goal), 0)   AS totalGoal
      FROM donations WHERE status = 'Active'
    `).catch(() => [{ campaigns: 0, totalRaised: 0, totalGoal: 0 }]);

    // ── Ticket stats (from app_state) ─────────────────────────────────────────
    const tickets = await getStateValue<any[]>("tickets", []);
    const ticketStats = {
      total:    tickets.length,
      pending:  tickets.filter((t: any) => t.status === "Pending").length,
      approved: tickets.filter((t: any) => t.status === "Approved").length,
      declined: tickets.filter((t: any) => t.status === "Declined").length,
    };

    // ── Blog stats ────────────────────────────────────────────────────────────
    const postStats = await query<any>(`
      SELECT COUNT(*) AS total, SUM(status = 'Published') AS published
      FROM posts
    `).catch(() => [{ total: 0, published: 0 }]);

    // ── Recent members ────────────────────────────────────────────────────────
    const recentMembers = await query<any>(`
      SELECT id, first_name, last_name, membership_number, tier, branch, status, created_at
      FROM members ORDER BY created_at DESC LIMIT 8
    `).catch(() => []);

    // ── Recent payments ───────────────────────────────────────────────────────
    const recentPayments = await query<any>(`
      SELECT id, member_name, amount, currency, method, status, purpose, created_at
      FROM payments ORDER BY created_at DESC LIMIT 8
    `).catch(() => []);

    // ── Monthly member growth (last 6 months) ─────────────────────────────────
    const memberGrowth = await query<any>(`
      SELECT
        DATE_FORMAT(created_at, '%b %Y') AS month,
        COUNT(*) AS count
      FROM members
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) ASC
    `).catch(() => []);

    // ── Upcoming events ───────────────────────────────────────────────────────
    const upcomingEvents = await query<any>(`
      SELECT id, title, date, time, venue, category, capacity, booked, status
      FROM events
      WHERE status = 'Published' AND date >= CURDATE()
      ORDER BY date ASC LIMIT 5
    `).catch(() => []);

    // ── Unread contact messages ───────────────────────────────────────────────
    const unreadMessages = await query<any>(`
      SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0
    `).catch(() => [{ count: 0 }]);

    const ms = memberStats[0] || {};
    const es = eventStats[0] || {};
    const ps = paymentStats[0] || {};
    const ds = donationStats[0] || {};
    const bs = postStats[0] || {};

    return NextResponse.json({
      ok: true,
      stats: {
        members: {
          total:        Number(ms.total || 0),
          active:       Number(ms.active || 0),
          frozen:       Number(ms.frozen || 0),
          expired:      Number(ms.expired || 0),
          pendingRenewal: Number(ms.pendingRenewal || 0),
          inactive:     Number(ms.inactive || 0),
          newThisMonth: Number(newThisMonth[0]?.count || 0),
          byTier: {
            Platinum: Number(ms.platinum || 0),
            Gold:     Number(ms.gold || 0),
            Silver:   Number(ms.silver || 0),
            Bronze:   Number(ms.bronze || 0),
            Abusua:   Number(ms.abusua || 0),
          },
        },
        events: {
          total:     Number(es.total || 0),
          published: Number(es.published || 0),
          draft:     Number(es.draft || 0),
          upcoming:  Number(es.upcoming || 0),
        },
        payments: {
          total:        Number(ps.total || 0),
          paid:         Number(ps.paid || 0),
          pending:      Number(ps.pending || 0),
          totalRevenue: Number(ps.totalRevenue || 0),
        },
        donations: {
          campaigns:   Number(ds.campaigns || 0),
          totalRaised: Number(ds.totalRaised || 0),
          totalGoal:   Number(ds.totalGoal || 0),
        },
        tickets: ticketStats,
        posts: {
          total:     Number(bs.total || 0),
          published: Number(bs.published || 0),
        },
        unreadMessages: Number(unreadMessages[0]?.count || 0),
      },
      recentMembers,
      recentPayments,
      memberGrowth,
      upcomingEvents,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
