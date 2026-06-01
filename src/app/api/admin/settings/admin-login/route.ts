import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";

const DEFAULT_ADMIN_LOGIN_SETTINGS = {
  logoUrl: "",
  logoSize: 60,
  showLogo: true,
  showSiteName: true,
  siteName: "Arsenal Supporters Club Ghana",
  bgType: "color",          // 'color' | 'image' | 'gradient'
  bgColor: "#07060F",
  bgImageUrl: "",
  bgOverlay: 0.7,
  bgGradient: "linear-gradient(135deg, #07060F 0%, #1A0A0A 100%)",
  cardBg: "rgba(12,10,20,0.9)",
  cardBorder: "rgba(198,168,75,0.2)",
  accentColor: "#EF0107",
  goldColor: "#C6A84B",
  welcomeTitle: "ADMIN PANEL",
  welcomeSubtitle: "Arsenal Supporters Club Ghana",
  showPattern: true,
  patternOpacity: 0.04,
  allowRememberMe: true,
  maxLoginAttempts: 5,
  lockoutMinutes: 30,
  sessionHours: 12,
};

export async function GET() {
  try {
    const saved = await getStateValue<any>("adminLoginSettings", {});
    return NextResponse.json({ settings: { ...DEFAULT_ADMIN_LOGIN_SETTINGS, ...saved } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    const existing = await getStateValue<any>("adminLoginSettings", {});
    const merged = { ...DEFAULT_ADMIN_LOGIN_SETTINGS, ...existing, ...updates };
    await setStateValue("adminLoginSettings", merged);
    return NextResponse.json({ success: true, settings: merged });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
