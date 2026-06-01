/** Default button presets — used when admin has not configured styles yet. */
export const ARSENAL_CSS_PRESETS = [
  { cssClass: "btn-primary", label: "Primary — Arsenal Red" },
  { cssClass: "btn-glow", label: "Glow — Glowing Red" },
  { cssClass: "btn-secondary-a", label: "Secondary — Red Outline" },
  { cssClass: "btn-gold-full", label: "Gold Premium" },
  { cssClass: "btn-gold-outline-full", label: "Gold Outline" },
  { cssClass: "btn-hero-full", label: "Hero — Large CTA" },
] as const;

export type ButtonStyleConfig = {
  id: string;
  label: string;
  cssClass?: string;
  sizeClass?: string;
  bg: string;
  hoverBg: string;
  textColor: string;
  hoverTextColor: string;
  borderColor: string;
  borderWidth: number;
  paddingX: number;
  paddingY: number;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  clipPreset: string;
  borderRadius: number;
  textTransform: string;
  useGradient: boolean;
  gradientFrom: string;
  gradientTo: string;
};

const base = {
  hoverBg: "#C0090D",
  textColor: "#FFFFFF",
  hoverTextColor: "#FFFFFF",
  borderColor: "transparent",
  borderWidth: 0,
  paddingX: 20,
  paddingY: 10,
  fontSize: "14px",
  fontFamily: "var(--font-heading)",
  fontWeight: "700",
  letterSpacing: "0.05em",
  clipPreset: "chamfer",
  borderRadius: 0,
  textTransform: "uppercase",
  useGradient: false,
  gradientFrom: "#EF0107",
  gradientTo: "#8B0000",
};

export const DEFAULT_BUTTON_STYLES: ButtonStyleConfig[] = [
  { ...base, id: "1", label: "Primary — Arsenal Red", cssClass: "btn-primary btn-md", bg: "#EF0107" },
  { ...base, id: "2", label: "Glow", cssClass: "btn-glow btn-md", bg: "#EF0107" },
  {
    ...base,
    id: "3",
    label: "Secondary Outline",
    cssClass: "btn-secondary-a btn-md",
    bg: "transparent",
    textColor: "#EF0107",
    borderColor: "#EF0107",
    borderWidth: 2,
    hoverBg: "#EF0107",
    hoverTextColor: "#FFFFFF",
  },
  {
    ...base,
    id: "4",
    label: "Gold Premium",
    cssClass: "btn-gold-full btn-md",
    bg: "#C6A84B",
    textColor: "#1A0A0A",
    hoverBg: "#B8963E",
    hoverTextColor: "#1A0A0A",
  },
  {
    ...base,
    id: "5",
    label: "Hero CTA",
    cssClass: "btn-hero-full",
    bg: "#EF0107",
    paddingX: 32,
    paddingY: 16,
    fontSize: "16px",
  },
];

export function withDefaultButtonSettings<T extends { buttonStyles?: ButtonStyleConfig[]; activeButtonId?: string; sectionButtonIds?: Record<string, string> }>(
  settings: T
): T {
  if (settings.buttonStyles?.length) {
    const active = settings.activeButtonId || settings.buttonStyles[0]?.id;
    return { ...settings, activeButtonId: active };
  }
  return {
    ...settings,
    buttonStyles: DEFAULT_BUTTON_STYLES,
    activeButtonId: DEFAULT_BUTTON_STYLES[0].id,
    sectionButtonIds: settings.sectionButtonIds || {},
  };
}
