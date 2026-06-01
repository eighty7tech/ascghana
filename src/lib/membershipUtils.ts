// ══════════════════════════════════════════════════════════════════════════════
// Arsenal Supporters Club Ghana — Membership Utility Functions
// ══════════════════════════════════════════════════════════════════════════════

/** Fixed renewal fee for ALL tiers — GH₵100 for 2 seasons */
export const RENEWAL_FEE = 100;

/**
 * Season: June 1 – May 31.
 * Renewal window: May 1 – May 31.
 */
export function getCurrentSeason(): { label: string; start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  // If we're Jan–May, season started June of previous year
  const seasonStart = month <= 5
    ? new Date(year - 1, 5, 1)   // June 1 last year
    : new Date(year, 5, 1);       // June 1 this year

  const seasonEnd = new Date(seasonStart.getFullYear() + 1, 4, 31); // May 31 next year

  const startYear = seasonStart.getFullYear();
  const endYear = seasonEnd.getFullYear();
  return {
    label: `${startYear}/${String(endYear).slice(2)}`,
    start: seasonStart,
    end: seasonEnd,
  };
}

/** Returns true during May 1–31 (renewal window) */
export function isRenewalWindow(): boolean {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return m === 5 && d >= 1 && d <= 31;
}

/** Returns GH₵100 renewal fee — same for all tiers */
export function getRenewalFee(): number {
  return RENEWAL_FEE;
}

/**
 * Given a 4-digit year string (e.g. "2014"), returns how many full years
 * have elapsed since that year, and a display string like "2014 (11 years)".
 */
export function formatMemberSince(yearStr: string | undefined | null): {
  year: string;
  yearsDisplay: string;
  yearsCount: number;
} {
  const raw = String(yearStr || "").replace(/\D/g, "").slice(0, 4);
  const year = raw.length === 4 ? raw : String(new Date().getFullYear());
  const count = Math.max(0, new Date().getFullYear() - parseInt(year));
  const yearsDisplay =
    count === 0
      ? `${year} (this year)`
      : count === 1
      ? `${year} (1 year)`
      : `${year} (${count} years)`;
  return { year, yearsDisplay, yearsCount: count };
}

/** Whether a member status allows full portal access */
export function canAccessPortal(status: string): boolean {
  return status === "Active";
}

/** Whether a member can log in at all */
export function canLogin(status: string): boolean {
  return ["Active", "Frozen", "Expired", "Pending Renewal"].includes(status);
}

/** Returns the renewal due date string: "May 31, YYYY" based on current season */
export function getRenewalDueDate(): string {
  const season = getCurrentSeason();
  const dueYear = season.end.getFullYear();
  return `May 31, ${dueYear}`;
}
