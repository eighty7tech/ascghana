import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      type ENUM('info','success','warning','danger','event','ticket') NOT NULL DEFAULT 'info',
      target ENUM('all','members','admin','gold','platinum','silver','bronze') NOT NULL DEFAULT 'all',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      is_pinned TINYINT(1) NOT NULL DEFAULT 0,
      show_on_dashboard TINYINT(1) NOT NULL DEFAULT 1,
      link_url VARCHAR(500) DEFAULT NULL,
      link_label VARCHAR(100) DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      expires_at DATETIME DEFAULT NULL,
      created_by VARCHAR(100) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_active (is_active),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let sql = "SELECT * FROM announcements WHERE 1=1";
    if (activeOnly) sql += " AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())";
    sql += " ORDER BY is_pinned DESC, created_at DESC";

    const rows = await query(sql) as any[];
    return NextResponse.json({ announcements: rows });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { title, body, type = "info", target = "all", isPinned = false,
            showOnDashboard = true, linkUrl, linkLabel, imageUrl, expiresAt, createdBy } = await req.json();

    if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

    const result = await query(
      `INSERT INTO announcements (title, body, type, target, is_pinned, show_on_dashboard, link_url, link_label, image_url, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, body, type, target, isPinned ? 1 : 0, showOnDashboard ? 1 : 0,
       linkUrl || null, linkLabel || null, imageUrl || null, expiresAt || null, createdBy || null]
    ) as any;

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const fieldMap: Record<string, string> = {
      title: "title", body: "body", type: "type", target: "target",
      isActive: "is_active", isPinned: "is_pinned", showOnDashboard: "show_on_dashboard",
      linkUrl: "link_url", linkLabel: "link_label", imageUrl: "image_url", expiresAt: "expires_at",
    };

    const fields: string[] = [];
    const vals: any[] = [];
    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in updates) {
        fields.push(`${col} = ?`);
        vals.push(typeof updates[key] === "boolean" ? (updates[key] ? 1 : 0) : updates[key]);
      }
    }
    if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    vals.push(id);
    await query(`UPDATE announcements SET ${fields.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTable();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await query("DELETE FROM announcements WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
