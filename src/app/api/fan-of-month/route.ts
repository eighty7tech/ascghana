import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ensureFanOfMonthTable, awardPoints } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureFanOfMonthTable();
  const url   = new URL(req.url);
  const year  = parseInt(url.searchParams.get("year")  || String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));

  try {
    // Current winner
    const winner = await queryOne(
      `SELECT n.*, m.name, m.photo, m.tier, m.branch, m.membership_number
       FROM fan_of_month_nominations n
       JOIN members m ON m.id = n.nominated_id
       WHERE n.period_year = ? AND n.period_month = ? AND n.is_winner = 1
       LIMIT 1`,
      [year, month]
    );

    // Nominees with vote counts
    const nominees = await query(
      `SELECT n.nominated_id, m.name, m.photo, m.tier, m.membership_number,
              COUNT(*) as vote_count, MAX(n.reason) as reason
       FROM fan_of_month_nominations n
       JOIN members m ON m.id = n.nominated_id
       WHERE n.period_year = ? AND n.period_month = ?
       GROUP BY n.nominated_id
       ORDER BY vote_count DESC
       LIMIT 10`,
      [year, month]
    );

    // Past winners
    const history = await query(
      `SELECT n.period_year, n.period_month, n.reason,
              m.name, m.photo, m.tier, m.membership_number
       FROM fan_of_month_nominations n
       JOIN members m ON m.id = n.nominated_id
       WHERE n.is_winner = 1
       ORDER BY n.period_year DESC, n.period_month DESC
       LIMIT 12`
    );

    return NextResponse.json({ success: true, winner, nominees, history, period: { year, month } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureFanOfMonthTable();
  try {
    const { nominatedId, nominatedBy, reason } = await req.json();
    if (!nominatedId || !nominatedBy) return NextResponse.json({ error: "nominatedId and nominatedBy required" }, { status: 400 });
    if (nominatedId === nominatedBy) return NextResponse.json({ error: "Cannot nominate yourself" }, { status: 400 });

    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    // Check if already nominated someone this month
    const existing = await queryOne(
      `SELECT id FROM fan_of_month_nominations WHERE period_year=? AND period_month=? AND nominated_by=?`,
      [year, month, nominatedBy]
    );
    if (existing) return NextResponse.json({ error: "You have already nominated someone this month" }, { status: 400 });

    await query(
      `INSERT INTO fan_of_month_nominations (period_year, period_month, nominated_id, nominated_by, reason)
       VALUES (?,?,?,?,?)`,
      [year, month, nominatedId, nominatedBy, reason || null]
    );

    await awardPoints(nominatedBy, 2, "fan_nomination", "Nominated a fan of the month", String(nominatedId));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureFanOfMonthTable();
  try {
    const { nominatedId, year, month } = await req.json();
    if (!nominatedId) return NextResponse.json({ error: "nominatedId required" }, { status: 400 });

    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);

    // Clear existing winner
    await query(
      `UPDATE fan_of_month_nominations SET is_winner=0 WHERE period_year=? AND period_month=?`,
      [y, m]
    );
    // Set winner
    await query(
      `UPDATE fan_of_month_nominations SET is_winner=1
       WHERE period_year=? AND period_month=? AND nominated_id=? LIMIT 1`,
      [y, m, nominatedId]
    );

    // Big points reward for the winner
    await awardPoints(nominatedId, 50, "fan_of_month_winner", `Fan of the Month — ${y}/${String(m).padStart(2,"0")}`);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
