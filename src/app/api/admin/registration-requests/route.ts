import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminRole } from "@/lib/sessionAuth";
import {
  listRegistrationApplications,
  approveRegistrationApplication,
  rejectRegistrationApplication,
  getApplicationById,
} from "@/lib/registrationDb";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !isAdminRole(session.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status") || undefined;
  const apps = await listRegistrationApplications(
    status as "awaiting_payment" | "pending_review" | "approved" | "rejected" | undefined
  );
  return NextResponse.json({ applications: apps });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !isAdminRole(session.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, id } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  const app = await getApplicationById(Number(id));
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    const result = await approveRegistrationApplication(Number(id), session.username || "admin");
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, member: result.member });
  }

  if (action === "reject") {
    await rejectRegistrationApplication(Number(id), session.username || "admin");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
