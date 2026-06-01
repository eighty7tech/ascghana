import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStateValue } from "@/lib/databaseState";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30";

    const members = await getStateValue<any[]>("members", []);
    const tickets = await getStateValue<any[]>("tickets", []);
    const events = await getStateValue<any[]>("events", []);
    const donations = await getStateValue<any[]>("donations", []);
    const matchTickets = await getStateValue<any[]>("matchTickets", []);

    // Member stats
    const statusCounts: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    const branchCounts: Record<string, number> = {};
    const joinYears: Record<string, number> = {};

    members.forEach((m: any) => {
      statusCounts[m.status || "Unknown"] = (statusCounts[m.status || "Unknown"] || 0) + 1;
      tierCounts[m.tier || "Unknown"] = (tierCounts[m.tier || "Unknown"] || 0) + 1;
      branchCounts[m.branch || "Unknown"] = (branchCounts[m.branch || "Unknown"] || 0) + 1;
      const year = m.joined ? String(m.joined).slice(-4) : "Unknown";
      joinYears[year] = (joinYears[year] || 0) + 1;
    });

    // Ticket stats
    const ticketStatusCounts: Record<string, number> = {};
    tickets.forEach((t: any) => {
      ticketStatusCounts[t.status] = (ticketStatusCounts[t.status] || 0) + 1;
    });

    // Match ticket stats
    const totalSeatsAvailable = matchTickets.reduce((a: number, mt: any) => a + (mt.ticketsAvailable || 0), 0);
    const soldOutMatches = matchTickets.filter((mt: any) => mt.status === "Sold Out").length;

    // Donation stats
    const totalRaised = donations.reduce((a: number, d: any) => a + (d.raised || 0), 0);
    const totalGoal = donations.reduce((a: number, d: any) => a + (d.goal || 0), 0);

    // Attendance stats (try DB)
    let attendanceStats: any[] = [];
    try {
      attendanceStats = await query(
        `SELECT e.title, COUNT(ea.id) as count 
         FROM event_attendance ea
         JOIN events e ON e.id = ea.event_id
         GROUP BY ea.event_id
         ORDER BY count DESC LIMIT 10`
      ) as any[];
    } catch { /* table may not exist */ }

    // Deletion requests (try DB)
    let deletionRequests: any[] = [];
    try {
      deletionRequests = await query(
        "SELECT status, COUNT(*) as count FROM member_deletion_requests GROUP BY status"
      ) as any[];
    } catch { /* table may not exist */ }

    // Recent activity log (try DB)
    let recentActivity: any[] = [];
    try {
      recentActivity = await query(
        "SELECT * FROM member_activity_log ORDER BY created_at DESC LIMIT 20"
      ) as any[];
    } catch { /* table may not exist */ }

    return NextResponse.json({
      members: {
        total: members.length,
        byStatus: statusCounts,
        byTier: tierCounts,
        byBranch: branchCounts,
        byJoinYear: joinYears,
        active: statusCounts["Active"] || 0,
        frozen: statusCounts["Frozen"] || 0,
        expired: statusCounts["Expired"] || 0,
        pendingRenewal: statusCounts["Pending Renewal"] || 0,
      },
      tickets: {
        total: tickets.length,
        byStatus: ticketStatusCounts,
        pending: ticketStatusCounts["Pending"] || 0,
        approved: ticketStatusCounts["Approved"] || 0,
        declined: ticketStatusCounts["Declined"] || 0,
      },
      matchTickets: {
        total: matchTickets.length,
        active: matchTickets.filter((mt: any) => mt.status === "Active").length,
        soldOut: soldOutMatches,
        totalSeatsAvailable,
      },
      donations: {
        total: donations.length,
        totalRaised,
        totalGoal,
        progressPct: totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0,
      },
      events: {
        total: events.length,
        published: events.filter((e: any) => e.status === "Published").length,
        upcoming: events.filter((e: any) => e.status === "Published" && new Date(e.date) > new Date()).length,
      },
      attendanceStats,
      deletionRequests,
      recentActivity,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
