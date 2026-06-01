import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureFanWallTable, awardPoints } from "@/lib/featureDb";

export async function POST(req: NextRequest) {
  await ensureFanWallTable();
  try {
    const { postId, memberId } = await req.json();
    if (!postId || !memberId) return NextResponse.json({ error: "postId and memberId required" }, { status: 400 });

    // Toggle like
    const existing = await query(`SELECT 1 FROM fan_wall_likes WHERE post_id = ? AND member_id = ?`, [postId, memberId]) as any[];

    if (existing.length > 0) {
      await query(`DELETE FROM fan_wall_likes WHERE post_id = ? AND member_id = ?`, [postId, memberId]);
      await query(`UPDATE fan_wall_posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?`, [postId]);
      return NextResponse.json({ success: true, liked: false });
    } else {
      await query(`INSERT INTO fan_wall_likes (post_id, member_id) VALUES (?,?) ON DUPLICATE KEY UPDATE created_at = created_at`, [postId, memberId]);
      await query(`UPDATE fan_wall_posts SET likes = likes + 1 WHERE id = ?`, [postId]);
      // Small reward for liking
      await awardPoints(memberId, 1, "fan_wall_like", "Liked a fan wall post", String(postId));
      return NextResponse.json({ success: true, liked: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
