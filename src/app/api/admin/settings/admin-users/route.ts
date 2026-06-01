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

// GET - Retrieve all admin users
export async function GET() {
  try {
    const adminAccounts = await getStateValue<AdminAccount[]>("adminAccounts", []);
    
    // Return without passwords for security
    const safeAdmins = adminAccounts.map(({ password, ...rest }) => rest);
    
    return NextResponse.json({ success: true, admins: safeAdmins });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}

// POST - Create new admin user
export async function POST(req: NextRequest) {
  try {
    const { username, name, email, password, role, isActive } = await req.json();

    // Validation
    if (!username || !name || !password) {
      return NextResponse.json(
        { success: false, error: "Username, name, and password are required" },
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

    // Check if username already exists
    if (adminAccounts.some((a) => a.username === username)) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 400 }
      );
    }

    // Create new admin
    const newAdmin: AdminAccount = {
      id: Date.now().toString(),
      username,
      name,
      email: email || "",
      password, // In production, hash this!
      role: role || "admin",
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };

    adminAccounts.push(newAdmin);
    await setStateValue("adminAccounts", adminAccounts);

    // Return without password
    const { password: _, ...safeAdmin } = newAdmin;
    return NextResponse.json(
      { success: true, admin: safeAdmin },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

// PUT - Update admin user
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

    const { username, name, email, password, role, isActive } = await req.json();
    const adminAccounts = await getStateValue<AdminAccount[]>("adminAccounts", []);

    const adminIndex = adminAccounts.findIndex((a) => a.id === id);
    if (adminIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    const admin = adminAccounts[adminIndex];

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (typeof isActive === "boolean") admin.isActive = isActive;
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      admin.password = password; // In production, hash this!
    }

    adminAccounts[adminIndex] = admin;
    await setStateValue("adminAccounts", adminAccounts);

    const { password: _, ...safeAdmin } = admin;
    return NextResponse.json({ success: true, admin: safeAdmin });
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admin user" },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin user
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Admin ID is required" },
        { status: 400 }
      );
    }

    const adminAccounts = await getStateValue<AdminAccount[]>("adminAccounts", []);

    // Don't allow deleting the last superadmin
    const superAdmins = adminAccounts.filter((a) => a.role === "superadmin");
    const adminToDelete = adminAccounts.find((a) => a.id === id);

    if (adminToDelete?.role === "superadmin" && superAdmins.length <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the last super admin" },
        { status: 400 }
      );
    }

    const filtered = adminAccounts.filter((a) => a.id !== id);
    
    if (filtered.length === adminAccounts.length) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    await setStateValue("adminAccounts", filtered);

    return NextResponse.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete admin user" },
      { status: 500 }
    );
  }
}
