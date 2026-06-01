import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensurePointsTables } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensurePointsTables();
  const url      = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  const leaderboard = url.searchParams.get("leaderboard");

  try {
    if (leaderboard) {
      const rows = await query(
        `SELECT pb.*, m.name, m.membership_number, m.photo, m.tier
         FROM member_points_balance pb
         JOIN members m ON m.id = pb.member_id
         ORDER BY pb.total_points DESC
         LIMIT 50`
      );
      return NextResponse.json({ success: true, leaderboard: rows });
    }

    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

    const balance = await query(`SELECT * FROM member_points_balance WHERE member_id = ?`, [memberId]) as any[];
    const history = await query(
      `SELECT * FROM member_points WHERE member_id = ? ORDER BY created_at DESC LIMIT 50`,
      [memberId]
    );

    return NextResponse.json({
      success: true,
      balance: balance[0] || { total_points: 0, total_earned: 0, total_spent: 0 },
      history
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
