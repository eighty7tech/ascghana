import { NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";

interface AdminAccount {
  id: string;
  username: string;
  name: string;
  email?: string;
  password: string;
  role: "superadmin" | "admin" | "moderator";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// PUT - Change admin password
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Admin ID is required" },
        { status: 400 }
      );
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const adminAccounts = await getStateValue<AdminAccount[]>("adminAccounts", []);
    const adminIndex = adminAccounts.findIndex((a) => a.id === id);

    if (adminIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    // Update password (in production, hash this!)
    adminAccounts[adminIndex].password = password;
    await setStateValue("adminAccounts", adminAccounts);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}
