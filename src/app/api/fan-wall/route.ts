import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ensureFanWallTable, awardPoints } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureFanWallTable();
  const url    = new URL(req.url);
  const limit  = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const memberId = url.searchParams.get("memberId");
  const admin  = url.searchParams.get("admin");

  try {
    const where = admin ? "" : "WHERE p.is_approved = 1";
    const rows = await query(
      `SELECT p.*,
         (SELECT COUNT(*) FROM fan_wall_comments c WHERE c.post_id = p.id AND c.is_approved = 1) as comment_count
       FROM fan_wall_posts p
       ${where}
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    // Attach comments for each post (last 3)
    const withComments = await Promise.all(rows.map(async post => {
      const comments = await query(
        `SELECT * FROM fan_wall_comments WHERE post_id = ? AND is_approved = 1 ORDER BY created_at ASC LIMIT 3`,
        [post.id]
      );
      let liked = false;
      if (memberId) {
        const l = await queryOne(`SELECT 1 FROM fan_wall_likes WHERE post_id = ? AND member_id = ?`, [post.id, memberId]);
        liked = !!l;
      }
      return { ...post, comments, liked };
    }));

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM fan_wall_posts ${where}`) as any[];
    return NextResponse.json({ success: true, posts: withComments, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureFanWallTable();
  try {
    const { memberId, memberName, memberPhoto, memberTier, content, imageUrl, postType } = await req.json();
    if (!memberId || !content?.trim()) {
      return NextResponse.json({ error: "memberId and content required" }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: "Post too long (max 1000 chars)" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO fan_wall_posts (member_id, member_name, member_photo, member_tier, content, image_url, post_type)
       VALUES (?,?,?,?,?,?,?)`,
      [memberId, memberName, memberPhoto||null, memberTier||null, content.trim(), imageUrl||null, postType||"text"]
    ) as any;

    // Award points for posting
    await awardPoints(memberId, 2, "fan_wall_post", "Posted on the fan wall", String(result.insertId));

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureFanWallTable();
  try {
    const { postId, action, adminNote } = await req.json();
    if (!postId || !action) return NextResponse.json({ error: "postId and action required" }, { status: 400 });

    if (action === "approve")  await query(`UPDATE fan_wall_posts SET is_approved = 1 WHERE id = ?`, [postId]);
    if (action === "remove")   await query(`UPDATE fan_wall_posts SET is_approved = 0 WHERE id = ?`, [postId]);
    if (action === "pin")      await query(`UPDATE fan_wall_posts SET is_pinned = 1 WHERE id = ?`, [postId]);
    if (action === "unpin")    await query(`UPDATE fan_wall_posts SET is_pinned = 0 WHERE id = ?`, [postId]);
    if (action === "flag")     await query(`UPDATE fan_wall_posts SET is_flagged = 1 WHERE id = ?`, [postId]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureFanWallTable();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await query(`DELETE FROM fan_wall_posts WHERE id = ?`, [id]);
    await query(`DELETE FROM fan_wall_comments WHERE post_id = ?`, [id]);
    await query(`DELETE FROM fan_wall_likes WHERE post_id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
