import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { getAdminSession } from "@/lib/sessionAuth";

export async function GET() {
  try {
    return NextResponse.json(await getStateValue("settings", {}));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Settings read failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const incoming = await req.json();
    const existing = await getStateValue<Record<string, unknown>>("settings", {});
    const merged = { ...existing, ...incoming };
    await setStateValue("settings", merged);
    return NextResponse.json({ success: true, settings: merged });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Settings save failed" }, { status: 503 });
  }
}
