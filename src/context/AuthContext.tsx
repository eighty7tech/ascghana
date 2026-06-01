"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UserRole =
  | "member" | "admin" | "superadmin" | "editor"
  | "moderator" | "membership_officer" | "event_coordinator"
  | "ticket_manager" | "events_moderator";

export interface LoggedUser {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipNumber: string;
  tier: string;
  tierColor: string;
  branch: string;
  status: "Active" | "Frozen" | "Expired" | "Pending Renewal" | "Inactive";
  role: UserRole;
  photo?: string;
  joinDate: string;
  renewalDue: string;
}

interface AuthContextType {
  user: LoggedUser | null;
  isLoggedIn: boolean;
  isMember: boolean;
  isAdmin: boolean;
  isActiveMember: boolean;
  isFrozen: boolean;
  isExpired: boolean;
  login: (memberNumber: string, password: string) => Promise<{ success: boolean; error?: string; user?: LoggedUser }>;
  logout: () => void;
  updateUser: (updates: Partial<LoggedUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoggedUser | null>(null);

  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(payload => setUser(payload?.user || null))
      .catch(() => setUser(null));
  }, []);

  const login = async (
    memberNumber: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: LoggedUser }> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber, password }),
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok || !payload.success) {
      return { success: false, error: payload.error || "Invalid credentials." };
    }

    setUser(payload.user);
    return { success: true, user: payload.user };
  };

  const logout = () => {
    setUser(null);
    fetch("/api/auth", { method: "DELETE" }).catch(() => {});
  };

  const updateUser = (updates: Partial<LoggedUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    fetch("/api/auth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      if (!res.ok) return;
      const payload = await res.json();
      if (payload?.user) setUser(payload.user);
    } catch {
      /* ignore */
    }
  };

  const isActiveMember = !!user && user.status === "Active";
  const isFrozen = !!user && user.status === "Frozen";
  const isExpired = !!user && (user.status === "Expired" || user.status === "Pending Renewal");

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isMember: !!user && user.role === "member",
        isAdmin: !!user && [
          "membership_officer", "event_coordinator", "ticket_manager",
          "events_moderator", "moderator", "editor",
        ].includes(user.role),
        isActiveMember,
        isFrozen,
        isExpired,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
