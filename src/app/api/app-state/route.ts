import { type NextRequest, NextResponse } from "next/server";
import { getAllState, getStateValue, setStateValue } from "@/lib/databaseState";
import { getAdminSession, getMemberSession } from "@/lib/sessionAuth";

const ADMIN_ONLY_KEYS = new Set([
  "settings",
  "adminAccounts",
  "members",
  "tiers",
  "backups",
  "matchTickets",
  "events",
  "posts",
  "products",
  "exco",
  "donations",
  "membershipRequests",
]);

async function canWriteState(key: string): Promise<boolean> {
  const admin = await getAdminSession();
  if (admin) return true;
  if (ADMIN_ONLY_KEYS.has(key)) return false;
  const member = await getMemberSession();
  return !!member;
}

export async function GET(req: NextRequest) {
  try {
    const key = new URL(req.url).searchParams.get("key");

    if (key) {
      return NextResponse.json({ ok: true, key, value: await getStateValue(key, null) });
    }

    return NextResponse.json({ ok: true, state: await getAllState() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Database read failed" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { key?: string; value?: unknown; state?: Record<string, unknown> } | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.key) {
      if (!(await canWriteState(body.key))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await setStateValue(body.key, body.value);
      return NextResponse.json({ ok: true, key: body.key });
    }

    if (body.state && typeof body.state === "object") {
      for (const key of Object.keys(body.state)) {
        if (!(await canWriteState(key))) {
          return NextResponse.json({ error: `Unauthorized to write key: ${key}` }, { status: 401 });
        }
      }
      await Promise.all(Object.entries(body.state).map(([key, value]) => setStateValue(key, value)));
      return NextResponse.json({ ok: true, keys: Object.keys(body.state) });
    }

    return NextResponse.json({ error: "Provide either { key, value } or { state }" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Database write failed" },
      { status: 503 }
    );
  }
}
