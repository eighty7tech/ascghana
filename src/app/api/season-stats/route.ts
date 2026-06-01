import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSeasonStatsTable } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureSeasonStatsTable();
  const url    = new URL(req.url);
  const season = url.searchParams.get("season");

  try {
    const where = season ? "WHERE season = ?" : "";
    const vals  = season ? [season] : [];
    const stats = await query(
      `SELECT * FROM season_stats ${where} ORDER BY season DESC, competition ASC`,
      vals
    );
    return NextResponse.json({ success: true, stats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureSeasonStatsTable();
  try {
    const body = await req.json();
    const {
      season, competition, played, won, drawn, lost,
      goalsFor, goalsAgainst, position, points,
      topScorer, topScorerGoals, assistLeader, assistLeaderAssists, cleanSheets
    } = body;

    if (!season) return NextResponse.json({ error: "season required" }, { status: 400 });

    await query(
      `INSERT INTO season_stats
         (season, competition, played, won, drawn, lost, goals_for, goals_against,
          position, points, top_scorer, top_scorer_goals, assist_leader, assist_leader_assists, clean_sheets)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         played=?, won=?, drawn=?, lost=?, goals_for=?, goals_against=?,
         position=?, points=?, top_scorer=?, top_scorer_goals=?,
         assist_leader=?, assist_leader_assists=?, clean_sheets=?`,
      [
        season, competition || "Premier League",
        played||0, won||0, drawn||0, lost||0, goalsFor||0, goalsAgainst||0,
        position||1, points||0, topScorer||null, topScorerGoals||0,
        assistLeader||null, assistLeaderAssists||0, cleanSheets||0,
        // ON DUPLICATE values
        played||0, won||0, drawn||0, lost||0, goalsFor||0, goalsAgainst||0,
        position||1, points||0, topScorer||null, topScorerGoals||0,
        assistLeader||null, assistLeaderAssists||0, cleanSheets||0,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureSeasonStatsTable();
  const url = new URL(req.url);
  const id  = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await query(`DELETE FROM season_stats WHERE id=?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
