/**
 * Exchange Rate API — /api/exchange-rate
 * ════════════════════════════════════════════════════════════════════
 * Fetches current GBP → GHS exchange rate from open.er-api.com.
 * Results are cached for 24 hours via Next.js revalidation.
 *
 * Usage in client:
 *   const res = await fetch('/api/exchange-rate');
 *   const { GHS } = await res.json();  // e.g. { GHS: 18.5 }
 *
 * In production, also store the rate in site_settings.gbp_to_ghs
 * so it survives server restarts without refetching.
 */
import { NextResponse } from "next/server";

const FALLBACK_GBP_TO_GHS = 18.5; // Update this fallback periodically

export async function GET() {
  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/GBP",
      { next: { revalidate: 86400 } } // Cache 24 hours
    );

    if (!response.ok) throw new Error("Exchange rate API unavailable");

    const data = await response.json();
    const rate = data?.rates?.GHS;

    if (!rate || typeof rate !== "number") throw new Error("Invalid rate data");

    return NextResponse.json({
      base: "GBP",
      GHS: rate,
      updatedAt: data.time_last_update_utc || new Date().toISOString(),
      source: "open.er-api.com",
    });
  } catch (err) {
    // Return fallback rate so the UI always has a value
    return NextResponse.json({
      base: "GBP",
      GHS: FALLBACK_GBP_TO_GHS,
      updatedAt: null,
      source: "fallback",
      warning: `Live rate unavailable: ${String(err)}. Using fallback ${FALLBACK_GBP_TO_GHS}.`,
    });
  }
}
