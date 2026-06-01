import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";

export async function GET() {
  try {
    const settings = await getStateValue<any>("settings", {});
    return NextResponse.json({ fixtures: settings.arsenalFixtures || [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const fixtures = settings.arsenalFixtures || [];
    const newFixture = { ...body, id: Date.now() };
    await setStateValue("settings", { ...settings, arsenalFixtures: [...fixtures, newFixture] });
    return NextResponse.json({ success: true, fixture: newFixture });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const fixtures = (settings.arsenalFixtures || []).map((f: any) => f.id === id ? { ...f, ...updates } : f);
    await setStateValue("settings", { ...settings, arsenalFixtures: fixtures });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const fixtures = (settings.arsenalFixtures || []).filter((f: any) => f.id !== id);
    await setStateValue("settings", { ...settings, arsenalFixtures: fixtures });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
