import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      email           VARCHAR(200) NOT NULL UNIQUE,
      name            VARCHAR(200) DEFAULT NULL,
      member_id       INT          DEFAULT NULL,
      status          ENUM('Active','Unsubscribed','Bounced') NOT NULL DEFAULT 'Active',
      source          VARCHAR(60)  DEFAULT 'website',
      source_page     VARCHAR(100) DEFAULT 'homepage',
      confirmed       TINYINT(1)   NOT NULL DEFAULT 0,
      subscribed_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at DATETIME     DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { email, name, source_page } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Check if already subscribed
    const existing: any = await query(
      "SELECT id, status FROM newsletter_subscribers WHERE email = ?",
      [email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      const sub = existing[0];
      if (sub.status === "Active") {
        return NextResponse.json({ ok: true, message: "Already subscribed!", alreadyExists: true });
      }
      // Re-subscribe
      await query(
        "UPDATE newsletter_subscribers SET status = 'Active', subscribed_at = NOW(), source_page = ? WHERE email = ?",
        [source_page || "homepage", email]
      );
      return NextResponse.json({ ok: true, message: "Welcome back! You're re-subscribed." });
    }

    await query(
      "INSERT INTO newsletter_subscribers (email, name, source, source_page) VALUES (?,?,?,?)",
      [email.toLowerCase().trim(), name || null, "homepage", source_page || "homepage"]
    );

    return NextResponse.json({ ok: true, message: "Subscribed successfully! Welcome to the Ghana Gooners." });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = searchParams.get("count");

    if (count === "1") {
      await ensureTable();
      const result: any = await query(
        "SELECT COUNT(*) as total FROM newsletter_subscribers WHERE status = 'Active'"
      );
      return NextResponse.json({ ok: true, total: result[0]?.total || 0 });
    }

    return NextResponse.json({ ok: false, error: "Use ?count=1" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
