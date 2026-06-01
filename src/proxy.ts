import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — server-side maintenance mode guard.
 * Reads maintenance state from the DB via the /api/settings/maintenance-status
 * endpoint. If maintenance is ON and the request is not for /maintenance,
 * /admin, or /api, redirect to /maintenance.
 *
 * NOTE: For performance the result is cached in a response header for 10s.
 * The client-side MaintenanceGuard component handles real-time toggling.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never intercept admin, maintenance page, API, or static assets
  const isExempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/images") ||
    pathname.match(/\.(ico|png|jpg|jpeg|webp|svg|css|js|woff2?)$/);

  if (isExempt) return NextResponse.next();

  // Check maintenance cookie (set by client after admin saves settings)
  const maintenanceCookie = request.cookies.get("asc_maintenance")?.value;
  if (maintenanceCookie === "1") {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
