import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/sessionAuth";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS club_milestones (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      year        VARCHAR(10)  NOT NULL,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      icon        VARCHAR(80)  DEFAULT 'fa-solid fa-star',
      color       VARCHAR(20)  DEFAULT '#EF0107',
      image_url   VARCHAR(500) DEFAULT NULL,
      is_active   TINYINT(1)   NOT NULL DEFAULT 1,
      sort_order  INT          NOT NULL DEFAULT 0,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed defaults if empty
  const count: any = await query("SELECT COUNT(*) as c FROM club_milestones");
  if (Array.isArray(count) && count[0]?.c === 0) {
    await query(`
      INSERT INTO club_milestones (year, title, description, icon, color, sort_order) VALUES
      ('2003','Club Founded','Arsenal Supporters Club Ghana established by passionate Gooners in Accra.','fa-solid fa-flag','#EF0107',1),
      ('2008','Arsenal FC Approval','Officially approved and recognised by Arsenal Football Club.','fa-solid fa-shield-halved','#3B82F6',2),
      ('2010','Official Registration','Registered as an official organisation in Ghana.','fa-solid fa-certificate','#10B981',3),
      ('2015','1,000 Members','Reached the milestone of 1,000 registered members.','fa-solid fa-users','#8B5CF6',4),
      ('2019','Emirates Trip','First official club trip to the Emirates Stadium.','fa-solid fa-plane','#F59E0B',5),
      ('2023','20 Years Strong','Celebrated 20 years of the Ghana Gooners with 2,000+ members.','fa-solid fa-trophy','#EF0107',6),
      ('2024','2,400+ Members','Grew to over 2,400 active members across 10 regions.','fa-solid fa-chart-line','#C6A84B',7)
    `);
  }
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await query(
      "SELECT * FROM club_milestones WHERE is_active = 1 ORDER BY sort_order ASC, year ASC"
    );
    return NextResponse.json({ ok: true, milestones: rows });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureTable();
    const { year, title, description, icon, color, image_url, sort_order } = await req.json();
    if (!year || !title) return NextResponse.json({ error: "year and title required" }, { status: 400 });

    const result: any = await query(
      "INSERT INTO club_milestones (year, title, description, icon, color, image_url, sort_order) VALUES (?,?,?,?,?,?,?)",
      [year, title, description || null, icon || "fa-solid fa-star", color || "#EF0107", image_url || null, sort_order || 0]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureTable();
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const allowed = ["year","title","description","icon","color","image_url","is_active","sort_order"];
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const k of allowed) {
      if (k in fields) { sets.push(`${k} = ?`); vals.push(fields[k]); }
    }
    if (!sets.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    vals.push(id);
    await query(`UPDATE club_milestones SET ${sets.join(", ")} WHERE id = ?`, vals);
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
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await query("DELETE FROM club_milestones WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
