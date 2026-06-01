import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/sessionAuth";
import { tableExists } from "@/lib/dbSchemaFix";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") || "all";
  const limit = Math.min(200, parseInt(req.nextUrl.searchParams.get("limit") || "100", 10));

  try {
    const memberRows =
      type !== "admin" && (await tableExists("member_activity_log"))
        ? await query(
            `SELECT id, member_id AS actorId, action, detail, ip_address AS ipAddress, user_agent AS userAgent, created_at AS createdAt, 'member' AS actorType
             FROM member_activity_log ORDER BY created_at DESC LIMIT ?`,
            [limit]
          )
        : [];

    const adminRows =
      type !== "member" && (await tableExists("admin_activity_log"))
        ? await query(
            `SELECT id, username AS actorId, actor_name AS actorName, action, detail, ip_address AS ipAddress, user_agent AS userAgent, created_at AS createdAt, 'admin' AS actorType
             FROM admin_activity_log ORDER BY created_at DESC LIMIT ?`,
            [limit]
          )
        : [];

    const combined = [...(memberRows as object[]), ...(adminRows as object[])].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ activities: combined.slice(0, limit) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load activity" },
      { status: 503 }
    );
  }
}
