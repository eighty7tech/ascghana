import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(200)  NOT NULL,
      message     TEXT          NOT NULL,
      type        ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
      is_read     TINYINT(1)    NOT NULL DEFAULT 0,
      link_href   VARCHAR(500)  DEFAULT NULL,
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_read    (is_read),
      INDEX idx_created (created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// GET  — fetch all (default: last 50, newest first)
export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const limit  = Math.min(Number(searchParams.get("limit") || "50"), 200);
    const unread = searchParams.get("unread") === "true";

    let sql = "SELECT * FROM admin_notifications";
    if (unread) sql += " WHERE is_read = 0";
    sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

    const rows = await query(sql) as any[];
    const unreadCount = (await query("SELECT COUNT(*) as c FROM admin_notifications WHERE is_read = 0") as any[])[0]?.c ?? 0;
    return NextResponse.json({ notifications: rows, unreadCount: Number(unreadCount) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// POST — create notification
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { title, message, type = "info", linkHref } = await req.json();
    if (!title || !message) return NextResponse.json({ error: "title and message required" }, { status: 400 });

    const result = await query(
      "INSERT INTO admin_notifications (title, message, type, link_href) VALUES (?, ?, ?, ?)",
      [title, message, type, linkHref || null]
    ) as any;

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// PATCH — mark read (single or all)
export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const { id, markAllRead } = await req.json();

    if (markAllRead) {
      await query("UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0");
    } else if (id) {
      await query("UPDATE admin_notifications SET is_read = 1 WHERE id = ?", [id]);
    } else {
      return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// DELETE — delete single or clear all
export async function DELETE(req: NextRequest) {
  try {
    await ensureTable();
    const { id, clearAll } = await req.json();

    if (clearAll) {
      await query("DELETE FROM admin_notifications");
    } else if (id) {
      await query("DELETE FROM admin_notifications WHERE id = ?", [id]);
    } else {
      return NextResponse.json({ error: "Provide id or clearAll" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
