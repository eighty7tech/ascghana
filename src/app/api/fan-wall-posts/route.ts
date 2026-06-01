import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMemberSession, getAdminSession } from "@/lib/sessionAuth";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS fan_wall_posts (
      id              BIGINT AUTO_INCREMENT PRIMARY KEY,
      member_id       BIGINT       DEFAULT NULL,
      author_name     VARCHAR(200) NOT NULL,
      author_initials VARCHAR(4)   DEFAULT NULL,
      author_photo    VARCHAR(500) DEFAULT NULL,
      author_tier     VARCHAR(40)  DEFAULT 'Bronze',
      author_tier_color VARCHAR(20) DEFAULT '#CD7F32',
      content         TEXT         NOT NULL,
      image_url       VARCHAR(500) DEFAULT NULL,
      reaction_fire   INT          NOT NULL DEFAULT 0,
      reaction_heart  INT          NOT NULL DEFAULT 0,
      reaction_gooner INT          NOT NULL DEFAULT 0,
      is_pinned       TINYINT(1)   NOT NULL DEFAULT 0,
      is_approved     TINYINT(1)   NOT NULL DEFAULT 1,
      is_featured     TINYINT(1)   NOT NULL DEFAULT 0,
      created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "6");
    const featured = searchParams.get("featured");

    let sql = "SELECT * FROM fan_wall_posts WHERE is_approved = 1";
    const params: unknown[] = [];

    if (featured === "1") {
      sql += " AND is_featured = 1";
    }

    sql += " ORDER BY is_pinned DESC, is_featured DESC, created_at DESC LIMIT ?";
    params.push(limit);

    const rows = await query(sql, params);
    return NextResponse.json({ ok: true, posts: rows });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const member = await getMemberSession();
    const admin  = await getAdminSession();

    if (!member && !admin) {
      return NextResponse.json({ error: "Login required to post" }, { status: 401 });
    }

    const body = await req.json();
    const { content, image_url } = body;

    if (!content || content.trim().length < 3) {
      return NextResponse.json({ error: "Content too short" }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: "Content too long (max 500 chars)" }, { status: 400 });
    }

    const authorName     = member ? `${member.firstName} ${member.lastName}` : (admin as any)?.name || "Admin";
    const authorInitials = authorName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
    const authorPhoto    = member?.photo || null;
    const authorTier     = member?.tier || "Bronze";
    const tierColors: Record<string, string> = {
      Platinum: "#E8E8E8", Gold: "#C6A84B", Silver: "#A8A9AD", Bronze: "#CD7F32", Abusua: "#2ECC71",
    };
    const authorTierColor = tierColors[authorTier] || "#CD7F32";
    const memberId = member?.id || null;

    const result: any = await query(
      `INSERT INTO fan_wall_posts
        (member_id, author_name, author_initials, author_photo, author_tier, author_tier_color, content, image_url)
       VALUES (?,?,?,?,?,?,?,?)`,
      [memberId, authorName, authorInitials, authorPhoto, authorTier, authorTierColor, content.trim(), image_url || null]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const { id, reaction } = body;

    if (!id || !reaction) return NextResponse.json({ error: "id and reaction required" }, { status: 400 });

    const col = reaction === "fire" ? "reaction_fire"
              : reaction === "heart" ? "reaction_heart"
              : reaction === "gooner" ? "reaction_gooner"
              : null;

    if (!col) return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });

    await query(`UPDATE fan_wall_posts SET ${col} = ${col} + 1 WHERE id = ?`, [id]);
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

    await query("DELETE FROM fan_wall_posts WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
