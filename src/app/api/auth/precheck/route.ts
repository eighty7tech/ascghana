import { type NextRequest, NextResponse } from "next/server";
import { getStateValue } from "@/lib/databaseState";
import { checkPassword } from "@/lib/authPassword";

const TIER_COLORS: Record<string, string> = {
  Platinum: "#E8E8E8", Gold: "#C6A84B", Silver: "#A8A9AD", Bronze: "#CD7F32", Abusua: "#2ECC71",
};

function canLogin(status: string) {
  return ["Active", "Frozen", "Pending Renewal", "Expired"].includes(status);
}

export async function POST(req: NextRequest) {
  try {
    const { memberNumber, password } = await req.json();
    if (!memberNumber || !password) {
      return NextResponse.json({ success: false, error: "Membership number and password required" }, { status: 400 });
    }

    const members = await getStateValue<any[]>("members", []);
    const member = members.find(m => m.membershipNumber === memberNumber);

    if (!member) {
      return NextResponse.json({ success: false, error: "Membership number not found. Contact admin." }, { status: 401 });
    }

    if (!checkPassword(password, member.password)) {
      return NextResponse.json({ success: false, error: "Incorrect password. Please try again." }, { status: 401 });
    }

    if (!canLogin(member.status || "Active")) {
      return NextResponse.json({ success: false, error: "Your account is inactive. Contact the membership coordinator." }, { status: 403 });
    }

    // Return minimal user info — no session cookie set yet
    return NextResponse.json({
      success: true,
      user: {
        id: member.id,
        name: member.name || `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        membershipNumber: member.membershipNumber,
        tier: member.tier,
        tierColor: TIER_COLORS[member.tier] || "#C6A84B",
        status: member.status || "Active",
        role: member.role || "member",
        two_factor_enabled: member.two_factor_enabled ?? 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Server error" }, { status: 503 });
  }
}
