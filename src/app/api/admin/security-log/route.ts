import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function ensure() {
  await query(`CREATE TABLE IF NOT EXISTS security_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(60) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45) DEFAULT NULL,
    admin_user VARCHAR(100) DEFAULT NULL,
    severity ENUM('info','warning','danger','critical') NOT NULL DEFAULT 'info',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created (created_at DESC)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

export async function GET() {
  try {
    await ensure();
    const logs = await query("SELECT * FROM security_log ORDER BY created_at DESC LIMIT 200") as any[];
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status:503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensure();
    const { eventType, description, ipAddress, adminUser, severity="info" } = await req.json();
    await query("INSERT INTO security_log (event_type,description,ip_address,admin_user,severity) VALUES (?,?,?,?,?)",
      [eventType, description||null, ipAddress||null, adminUser||null, severity]);
    return NextResponse.json({ success:true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status:503 });
  }
}

export async function DELETE() {
  try {
    await ensure();
    await query("TRUNCATE TABLE security_log");
    return NextResponse.json({ success:true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status:503 });
  }
}
