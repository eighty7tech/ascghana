import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { query } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const members = await getStateValue<any[]>("members", []);
    const member = members.find((m: any) => String(m.id) === String(id));
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    const { password: _pw, ...safe } = member;
    return NextResponse.json({ member: safe });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const members = await getStateValue<any[]>("members", []);
    const idx = members.findIndex((m: any) => String(m.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const updated = { ...members[idx], ...updates };
    const newList = [...members];
    newList[idx] = updated;
    await setStateValue("members", newList);

    // Sync two_factor_enabled into any active sessions for this member
    if ("two_factor_enabled" in updates) {
      try {
        const sessions = await query(
          "SELECT token_hash, user_json FROM auth_sessions WHERE expires_at > NOW()"
        ) as any[];
        for (const sess of sessions) {
          try {
            const u = JSON.parse(sess.user_json);
            if (String(u.id) === String(id)) {
              const newU = { ...u, two_factor_enabled: updates.two_factor_enabled };
              await query(
                "UPDATE auth_sessions SET user_json = ? WHERE token_hash = ?",
                [JSON.stringify(newU), sess.token_hash]
              );
            }
          } catch { /* skip malformed row */ }
        }
      } catch { /* table may not exist yet */ }
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const members = await getStateValue<any[]>("members", []);
    const newList = members.filter((m: any) => String(m.id) !== String(id));
    await setStateValue("members", newList);
    // Remove active sessions for deleted member
    try {
      await query("DELETE FROM auth_sessions WHERE user_json LIKE ?", [`%"id":${id},%`]);
    } catch { /* ignore if sessions table not ready */ }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
