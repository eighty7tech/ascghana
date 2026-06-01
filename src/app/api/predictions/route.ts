import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ensurePredictionsTable, awardPoints } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensurePredictionsTable();
  const url = new URL(req.url);
  const memberId  = url.searchParams.get("memberId");
  const fixture   = url.searchParams.get("fixture");
  const leaderboard = url.searchParams.get("leaderboard");

  try {
    if (leaderboard) {
      const rows = await query(
        `SELECT pl.*, m.photo as photo
         FROM prediction_leaderboard pl
         LEFT JOIN members m ON m.id = pl.member_id
         ORDER BY pl.total_points DESC, pl.exact_scores DESC
         LIMIT 50`
      );
      return NextResponse.json({ success: true, leaderboard: rows });
    }

    if (memberId && fixture) {
      const pred = await queryOne(
        `SELECT * FROM match_predictions WHERE member_id = ? AND fixture_ref = ?`,
        [memberId, fixture]
      );
      return NextResponse.json({ success: true, prediction: pred || null });
    }

    if (memberId) {
      const preds = await query(
        `SELECT * FROM match_predictions WHERE member_id = ? ORDER BY created_at DESC LIMIT 20`,
        [memberId]
      );
      const balance = await queryOne(
        `SELECT * FROM member_points_balance WHERE member_id = ?`, [memberId]
      );
      return NextResponse.json({ success: true, predictions: preds, pointsBalance: balance });
    }

    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensurePredictionsTable();
  try {
    const { memberId, fixtureRef, homeScore, awayScore, memberName, memberNumber, memberPhoto } = await req.json();

    if (!memberId || !fixtureRef) {
      return NextResponse.json({ error: "memberId and fixtureRef required" }, { status: 400 });
    }
    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: "Scores required" }, { status: 400 });
    }

    await query(
      `INSERT INTO match_predictions (member_id, fixture_ref, home_score, away_score)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE home_score = ?, away_score = ?, is_settled = 0, points = 0`,
      [memberId, fixtureRef, homeScore, awayScore, homeScore, awayScore]
    );

    // Upsert leaderboard entry
    await query(
      `INSERT INTO prediction_leaderboard (member_id, member_name, member_number, member_photo, total_predictions)
       VALUES (?,?,?,?,1)
       ON DUPLICATE KEY UPDATE
         member_name = VALUES(member_name),
         member_photo = VALUES(member_photo),
         total_predictions = total_predictions + IF(
           (SELECT COUNT(*) FROM match_predictions WHERE member_id = ? AND fixture_ref = ?) = 1, 1, 0
         )`,
      [memberId, memberName || "Member", memberNumber || "", memberPhoto || null, memberId, fixtureRef]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — settle predictions for a fixture (admin only)
export async function PATCH(req: NextRequest) {
  await ensurePredictionsTable();
  try {
    const { fixtureRef, actualHome, actualAway } = await req.json();
    if (!fixtureRef || actualHome === undefined || actualAway === undefined) {
      return NextResponse.json({ error: "fixtureRef and scores required" }, { status: 400 });
    }

    const predictions = await query(
      `SELECT * FROM match_predictions WHERE fixture_ref = ? AND is_settled = 0`,
      [fixtureRef]
    ) as any[];

    let settled = 0;
    for (const pred of predictions) {
      let pts = 0;
      const exactScore = pred.home_score === actualHome && pred.away_score === actualAway;
      const correctResult = (
        (pred.home_score > pred.away_score && actualHome > actualAway) ||
        (pred.home_score < pred.away_score && actualHome < actualAway) ||
        (pred.home_score === pred.away_score && actualHome === actualAway)
      );

      if (exactScore) pts = 5;
      else if (correctResult) pts = 2;

      await query(
        `UPDATE match_predictions SET points = ?, is_settled = 1 WHERE id = ?`,
        [pts, pred.id]
      );

      if (pts > 0) {
        await awardPoints(
          pred.member_id, pts,
          exactScore ? "prediction_exact" : "prediction_correct",
          exactScore ? `Exact score: ${actualHome}-${actualAway}` : `Correct result vs ${fixtureRef}`,
          fixtureRef
        );
        await query(
          `INSERT INTO prediction_leaderboard (member_id, member_name, member_number, total_points, exact_scores, correct_results)
           VALUES (?, '', '', ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             total_points = total_points + ?,
             exact_scores = exact_scores + ?,
             correct_results = correct_results + ?`,
          [pred.member_id, pts, exactScore?1:0, correctResult&&!exactScore?1:0,
           pts, exactScore?1:0, correctResult&&!exactScore?1:0]
        );
      }
      settled++;
    }

    return NextResponse.json({ success: true, settled });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
