import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ensureRewardsTables, ensurePointsTables, awardPoints } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureRewardsTables();
  const url      = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  const admin    = url.searchParams.get("admin");

  try {
    const where = admin ? "" : "WHERE is_active = 1";
    const rewards = await query(`SELECT * FROM rewards_catalogue ${where} ORDER BY points_cost ASC`);

    let redemptions: any[] = [];
    if (memberId) {
      redemptions = await query(
        `SELECT rr.*, rc.title, rc.image_url FROM reward_redemptions rr
         JOIN rewards_catalogue rc ON rc.id = rr.reward_id
         WHERE rr.member_id = ? ORDER BY rr.redeemed_at DESC LIMIT 20`,
        [memberId]
      ) as any[];
    }

    return NextResponse.json({ success: true, rewards, redemptions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureRewardsTables();
  const url   = new URL(req.url);
  const admin = url.searchParams.get("admin");

  try {
    const body = await req.json();

    // Admin: create reward
    if (admin) {
      const { title, description, imageUrl, pointsCost, stock, category } = body;
      if (!title || !pointsCost) return NextResponse.json({ error: "title and pointsCost required" }, { status: 400 });
      const result = await query(
        `INSERT INTO rewards_catalogue (title, description, image_url, points_cost, stock, category)
         VALUES (?,?,?,?,?,?)`,
        [title, description || null, imageUrl || null, pointsCost, stock ?? -1, category || "General"]
      ) as any;
      return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
    }

    // Member: redeem reward
    const { memberId, rewardId } = body;
    if (!memberId || !rewardId) return NextResponse.json({ error: "memberId and rewardId required" }, { status: 400 });

    await ensurePointsTables();
    const reward = await queryOne(`SELECT * FROM rewards_catalogue WHERE id = ? AND is_active = 1`, [rewardId]) as any;
    if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });

    const balance = await queryOne(`SELECT total_points FROM member_points_balance WHERE member_id = ?`, [memberId]) as any;
    const pts = balance?.total_points || 0;
    if (pts < reward.points_cost) return NextResponse.json({ error: "Not enough points" }, { status: 400 });

    if (reward.stock === 0) return NextResponse.json({ error: "Out of stock" }, { status: 400 });

    await query(
      `INSERT INTO reward_redemptions (member_id, reward_id, points_spent) VALUES (?,?,?)`,
      [memberId, rewardId, reward.points_cost]
    );
    await awardPoints(memberId, -reward.points_cost, "reward_redemption", `Redeemed: ${reward.title}`, String(rewardId));

    if (reward.stock > 0) {
      await query(`UPDATE rewards_catalogue SET stock = stock - 1 WHERE id = ?`, [rewardId]);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await ensureRewardsTables();
  try {
    const { id, title, description, imageUrl, pointsCost, stock, category, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sets: string[] = []; const vals: any[] = [];
    if (title       !== undefined) { sets.push("title=?");       vals.push(title); }
    if (description !== undefined) { sets.push("description=?"); vals.push(description); }
    if (imageUrl    !== undefined) { sets.push("image_url=?");   vals.push(imageUrl); }
    if (pointsCost  !== undefined) { sets.push("points_cost=?"); vals.push(pointsCost); }
    if (stock       !== undefined) { sets.push("stock=?");       vals.push(stock); }
    if (category    !== undefined) { sets.push("category=?");    vals.push(category); }
    if (isActive    !== undefined) { sets.push("is_active=?");   vals.push(isActive ? 1 : 0); }

    if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    vals.push(id);
    await query(`UPDATE rewards_catalogue SET ${sets.join(",")} WHERE id=?`, vals);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureRewardsTables();
  const url = new URL(req.url);
  const id  = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await query(`DELETE FROM rewards_catalogue WHERE id=?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
