import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/sessionAuth";

// Ensure table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS live_scores (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      home_team       VARCHAR(100) NOT NULL DEFAULT 'Arsenal',
      away_team       VARCHAR(100) NOT NULL,
      home_score      INT          NOT NULL DEFAULT 0,
      away_score      INT          NOT NULL DEFAULT 0,
      home_team_logo  VARCHAR(500) DEFAULT NULL,
      away_team_logo  VARCHAR(500) DEFAULT NULL,
      competition     VARCHAR(100) DEFAULT 'Premier League',
      match_date      DATE         NOT NULL,
      match_time      VARCHAR(10)  DEFAULT '17:30',
      venue           VARCHAR(200) DEFAULT NULL,
      status          ENUM('upcoming','live','halftime','result','postponed') NOT NULL DEFAULT 'upcoming',
      minute          INT          DEFAULT NULL,
      is_featured     TINYINT(1)   NOT NULL DEFAULT 1,
      watch_party_venue VARCHAR(200) DEFAULT NULL,
      watch_party_time  VARCHAR(20)  DEFAULT NULL,
      ticket_link     VARCHAR(500) DEFAULT NULL,
      sort_order      INT          NOT NULL DEFAULT 0,
      created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit  = parseInt(searchParams.get("limit") || "10");

    let sql = "SELECT * FROM live_scores WHERE 1=1";
    const params: unknown[] = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY is_featured DESC, match_date ASC, sort_order ASC LIMIT ?";
    params.push(limit);

    const rows = await query(sql, params);
    return NextResponse.json({ ok: true, scores: rows });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureTable();
    const body = await req.json();
    const {
      home_team = "Arsenal", away_team, home_score = 0, away_score = 0,
      home_team_logo, away_team_logo, competition = "Premier League",
      match_date, match_time = "17:30", venue, status = "upcoming",
      minute, is_featured = 1, watch_party_venue, watch_party_time,
      ticket_link, sort_order = 0,
    } = body;

    if (!away_team || !match_date) {
      return NextResponse.json({ error: "away_team and match_date are required" }, { status: 400 });
    }

    const result: any = await query(
      `INSERT INTO live_scores
        (home_team, away_team, home_score, away_score, home_team_logo, away_team_logo,
         competition, match_date, match_time, venue, status, minute, is_featured,
         watch_party_venue, watch_party_time, ticket_link, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [home_team, away_team, home_score, away_score, home_team_logo, away_team_logo,
       competition, match_date, match_time, venue, status, minute, is_featured,
       watch_party_venue, watch_party_time, ticket_link, sort_order]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureTable();
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const allowed = ["home_team","away_team","home_score","away_score","home_team_logo",
      "away_team_logo","competition","match_date","match_time","venue","status","minute",
      "is_featured","watch_party_venue","watch_party_time","ticket_link","sort_order"];

    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const k of allowed) {
      if (k in fields) { sets.push(`${k} = ?`); vals.push(fields[k]); }
    }
    if (!sets.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    vals.push(id);
    await query(`UPDATE live_scores SET ${sets.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await query("DELETE FROM live_scores WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
