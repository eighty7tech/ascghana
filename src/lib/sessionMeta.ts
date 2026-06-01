import { type NextRequest } from "next/server";

export type SessionMeta = {
  ipAddress: string;
  userAgent: string;
  deviceLabel: string;
};

export function getSessionMeta(req: NextRequest): SessionMeta {
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress =
    (forwarded ? forwarded.split(",")[0].trim() : "") ||
    req.headers.get("x-real-ip") ||
    "";
  const userAgent = req.headers.get("user-agent") || "Unknown device";
  return { ipAddress, userAgent, deviceLabel: parseDeviceLabel(userAgent) };
}

function parseDeviceLabel(ua: string): string {
  const u = ua.toLowerCase();
  if (u.includes("iphone")) return "iPhone";
  if (u.includes("ipad")) return "iPad";
  if (u.includes("android") && u.includes("mobile")) return "Android Phone";
  if (u.includes("android")) return "Android Tablet";
  if (u.includes("mac os")) return "Mac";
  if (u.includes("windows")) return "Windows PC";
  if (u.includes("linux")) return "Linux";
  let browser = "Browser";
  if (u.includes("edg/")) browser = "Edge";
  else if (u.includes("chrome/")) browser = "Chrome";
  else if (u.includes("firefox/")) browser = "Firefox";
  else if (u.includes("safari/") && !u.includes("chrome")) browser = "Safari";
  return `${browser} · ${ua.includes("mobile") ? "Mobile" : "Desktop"}`;
}
