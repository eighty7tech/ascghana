import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureFanWallTable, awardPoints } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureFanWallTable();
  const url = new URL(req.url);
  const postId = url.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  try {
    const comments = await query(
      `SELECT * FROM fan_wall_comments WHERE post_id = ? AND is_approved = 1 ORDER BY created_at ASC`,
      [postId]
    );
    return NextResponse.json({ success: true, comments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureFanWallTable();
  try {
    const { postId, memberId, memberName, memberPhoto, content } = await req.json();
    if (!postId || !memberId || !content?.trim()) {
      return NextResponse.json({ error: "postId, memberId and content required" }, { status: 400 });
    }
    if (content.length > 500) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

    const result = await query(
      `INSERT INTO fan_wall_comments (post_id, member_id, member_name, member_photo, content) VALUES (?,?,?,?,?)`,
      [postId, memberId, memberName, memberPhoto || null, content.trim()]
    ) as any;

    await awardPoints(memberId, 1, "fan_wall_comment", "Commented on the fan wall", String(postId));

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
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
    await query(`DELETE FROM fan_wall_comments WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
