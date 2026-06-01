import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS poll_votes (
      id         BIGINT AUTO_INCREMENT PRIMARY KEY,
      poll_id    INT NOT NULL,
      option_id  INT NOT NULL,
      voter_id   INT    DEFAULT NULL,
      voter_name VARCHAR(200) DEFAULT NULL,
      voter_ip   VARCHAR(45) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_poll   (poll_id),
      INDEX idx_option (option_id),
      INDEX idx_voter  (voter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const pollId = searchParams.get("pollId");
    const all    = searchParams.get("all") === "1";

    let rows: any[];
    if (all) {
      rows = await query("SELECT poll_id, option_id, voter_id FROM poll_votes ORDER BY created_at DESC LIMIT 10000") as any[];
    } else if (pollId) {
      rows = await query("SELECT poll_id, option_id, voter_id FROM poll_votes WHERE poll_id = ?", [pollId]) as any[];
    } else {
      rows = [];
    }

    // Aggregate vote counts per option
    const counts: Record<string, Record<string, number>> = {};
    rows.forEach((r: any) => {
      const pid = String(r.poll_id);
      const oid = String(r.option_id);
      if (!counts[pid]) counts[pid] = {};
      counts[pid][oid] = (counts[pid][oid] || 0) + 1;
    });

    return NextResponse.json({ votes: rows, counts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { pollId, optionId, voterId, voterName } = await req.json();
    if (!pollId || !optionId) {
      return NextResponse.json({ error: "pollId and optionId required" }, { status: 400 });
    }

    // Get voter IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Check if already voted (by voterId if logged in, otherwise by IP)
    let alreadyVoted = false;
    if (voterId) {
      const existing = await query(
        "SELECT id FROM poll_votes WHERE poll_id = ? AND voter_id = ?",
        [pollId, voterId]
      ) as any[];
      alreadyVoted = existing.length > 0;
    } else {
      const existing = await query(
        "SELECT id FROM poll_votes WHERE poll_id = ? AND voter_ip = ? AND voter_id IS NULL",
        [pollId, ip]
      ) as any[];
      alreadyVoted = existing.length > 0;
    }

    if (alreadyVoted) {
      return NextResponse.json({ error: "Already voted on this poll", alreadyVoted: true }, { status: 409 });
    }

    await query(
      "INSERT INTO poll_votes (poll_id, option_id, voter_id, voter_name, voter_ip) VALUES (?, ?, ?, ?, ?)",
      [pollId, optionId, voterId || null, voterName || null, ip]
    );

    // Get updated counts for this poll
    const counts = await query(
      "SELECT option_id, COUNT(*) as count FROM poll_votes WHERE poll_id = ? GROUP BY option_id",
      [pollId]
    ) as any[];

    return NextResponse.json({ success: true, counts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
