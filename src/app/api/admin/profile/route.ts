import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { getAdminSession } from "@/lib/sessionAuth";

export type AdminProfile = {
  displayName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
  jobTitle?: string;
};

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  const profiles = await getStateValue<Record<string, AdminProfile>>("adminProfiles", {});
  const profile = profiles[admin.username] || {
    displayName: admin.name,
    email: "",
    photoUrl: "",
  };

  return NextResponse.json({ profile, username: admin.username, role: admin.role });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  const body = (await req.json()) as AdminProfile;
  const profiles = await getStateValue<Record<string, AdminProfile>>("adminProfiles", {});

  profiles[admin.username] = {
    ...profiles[admin.username],
    ...body,
    displayName: body.displayName?.trim() || admin.name,
  };

  await setStateValue("adminProfiles", profiles);

  const settings = await getStateValue<Record<string, unknown>>("settings", {});
  const accounts = Array.isArray((settings as any).adminAccounts) ? [...(settings as any).adminAccounts] : [];
  const idx = accounts.findIndex((a: any) => a.username === admin.username);
  if (idx !== -1 && body.displayName) {
    accounts[idx] = { ...accounts[idx], name: body.displayName };
    await setStateValue("settings", { ...settings, adminAccounts: accounts });
  }

  return NextResponse.json({ success: true, profile: profiles[admin.username] });
}
