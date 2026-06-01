import { ensureRegistrationTable } from "@/lib/registrationDb";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { query } from "@/lib/db";

type StepResult = { step: string; ok: boolean; detail?: string };

const DEFAULT_TOP_BAR_SECTIONS = {
  broadcasts: {
    label: "Watch & Listen",
    links: [
      { label: "Arsenal TV", href: "#", icon: "📺" },
      { label: "Arsenal+ App", href: "#", icon: "📱" },
      { label: "Arsenal YouTube", href: "https://youtube.com/@arsenal", icon: "▶" },
    ],
  },
  women: {
    label: "Women",
    links: [
      { label: "Women's Team", href: "https://www.arsenal.com/women", icon: "fa-solid fa-shield-halved" },
      { label: "WSL Fixtures", href: "#", icon: "fa-solid fa-calendar" },
      { label: "Women's Tickets", href: "#", icon: "fa-solid fa-ticket" },
    ],
  },
  partners: {
    label: "Partners",
    links: [
      { label: "Emirates", href: "https://emirates.com", tag: "Principal Partner" },
      { label: "Adidas", href: "https://adidas.com", tag: "Kit Partner" },
      { label: "Visit Rwanda", href: "https://visitrwanda.com", tag: "Sleeve Partner" },
    ],
  },
};

const PAGE_DEFAULTS = {
  aboutPage: {
    title: "ABOUT US",
    subtitle: "Official Arsenal Supporters Club Ghana",
    storyTitle: "OUR STORY",
    ctaLabel: "Join The Family",
    ctaHref: "/membership/register",
    timeline: [
      { year: "2003", title: "Club Founded", text: "ASC Ghana formed by passionate Gunners in Accra." },
      { year: "2008", title: "Arsenal Approved", text: "Officially recognised by Arsenal Football Club." },
      { year: "Today", title: "2,400+ Members", text: "Growing community across all regions of Ghana." },
    ],
  },
  excoPage: {
    title: "OUR EXCO",
    subtitle: "Executive Committee",
    excoSectionTitle: "Executive Committee",
    servingSectionTitle: "Serving Members",
  },
  contactPageExtra: {
    formTitle: "Send a Message",
    formSubtitle: "We typically respond within 2 business days.",
    mapTitle: "Find Us",
  },
  footerVictoryTagline: "Victory Through Harmony",
  footerSocialHeading: "Follow Us",
  footerSocialSubtext: "Stay connected with Arsenal Ghana on social media",
  footerLegalLinks: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
    { label: "Admin Portal", href: "/admin/login" },
  ],
  footerDeveloperLabel: "Developed by Eighty7Tech",
  registrationRequirePayment: true,
};

export async function runUpgradeV210(): Promise<{ ok: boolean; results: StepResult[]; version: string }> {
  const results: StepResult[] = [];
  const run = async (step: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ step, ok: true });
    } catch (e: unknown) {
      results.push({ step, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  };

  await run("registration_applications table", async () => {
    await ensureRegistrationTable();
  });

  await run("cms_page_settings seed", async () => {
    const settings = await getStateValue<Record<string, unknown>>("settings", {});
    const merged = { ...settings };
    for (const [k, v] of Object.entries(PAGE_DEFAULTS)) {
      if (merged[k] === undefined) merged[k] = v;
    }
    if (!merged.topBarSections) merged.topBarSections = DEFAULT_TOP_BAR_SECTIONS;
    await setStateValue("settings", merged);
  });

  await run("app_state db_version", async () => {
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('db_version', '\"2.1.0\"')
       ON DUPLICATE KEY UPDATE \`value\` = '\"2.1.0\"', updated_at = NOW()`,
      []
    );
  });

  const ok = results.every((r) => r.ok);
  return { ok, results, version: "2.1.0" };
}
