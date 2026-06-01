/**
 * ASC Ghana v3.0.0 — Edge Middleware
 * Server-side route protection for /admin/* and /members/*
 * Uses the EXISTING custom cookie-based session system — no JWT, no NextAuth
 */
import { type NextRequest, NextResponse } from "next/server";

// Routes that require an admin session cookie
const ADMIN_PROTECTED = /^\/admin(?!\/login)(\/.*)?$/;

// Routes that require a member session cookie
const MEMBER_PROTECTED = /^\/members(\/.*)?$/;

// Public routes — always allowed
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/history",
  "/events",
  "/gallery",
  "/blog",
  "/shop",
  "/contact",
  "/membership",
  "/membership/register",
  "/auth/login",
  "/admin/login",
  "/maintenance",
  "/fan-wall",
  "/predictions",
  "/sponsors",
  "/season-stats",
  "/documents",
  "/fan-of-month",
  "/rewards",
  "/leaderboard",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/images/") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // ── Admin route protection ──────────────────────────────────────────────
  if (ADMIN_PROTECTED.test(pathname)) {
    const adminToken = req.cookies.get("asc_admin_session")?.value;
    if (!adminToken) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists — let the layout do the full DB validation
    return NextResponse.next();
  }

  // ── Member route protection ─────────────────────────────────────────────
  if (MEMBER_PROTECTED.test(pathname)) {
    const memberToken = req.cookies.get("asc_session")?.value;
    if (!memberToken) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
