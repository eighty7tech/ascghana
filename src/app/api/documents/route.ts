import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureDocumentsTable } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureDocumentsTable();
  const url   = new URL(req.url);
  const admin = url.searchParams.get("admin");

  try {
    const where = admin ? "" : "WHERE is_public = 1";
    const docs = await query(
      `SELECT * FROM club_documents ${where} ORDER BY sort_order ASC, created_at DESC`
    );
    return NextResponse.json({ success: true, documents: docs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureDocumentsTable();
  try {
    const { title, description, fileUrl, fileType, category, isPublic, sortOrder } = await req.json();
    if (!title || !fileUrl) return NextResponse.json({ error: "title and fileUrl required" }, { status: 400 });

    const result = await query(
      `INSERT INTO club_documents (title, description, file_url, file_type, category, is_public, sort_order)
       VALUES (?,?,?,?,?,?,?)`,
      [title, description || null, fileUrl, fileType || "pdf", category || "General",
       isPublic !== false ? 1 : 0, sortOrder || 0]
    ) as any;

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await ensureDocumentsTable();
  try {
    const { id, title, description, fileUrl, fileType, category, isPublic, sortOrder } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await query(
      `UPDATE club_documents SET title=?, description=?, file_url=?, file_type=?, category=?, is_public=?, sort_order=?
       WHERE id=?`,
      [title, description || null, fileUrl, fileType || "pdf", category || "General",
       isPublic !== false ? 1 : 0, sortOrder || 0, id]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureDocumentsTable();
  const url = new URL(req.url);
  const id  = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await query(`UPDATE club_documents SET download_count = download_count + 1 WHERE id=?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureDocumentsTable();
  const url = new URL(req.url);
  const id  = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await query(`DELETE FROM club_documents WHERE id=?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
