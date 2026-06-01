import type { ButtonStyleConfig } from "@/lib/buttonDefaults";

const CLIPS: Record<string, string> = {
  none: "none",
  chamfer: "polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)",
  "arrow-r": "polygon(0% 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,0% 100%)",
  "arrow-l": "polygon(12px 0%,100% 0%,100% 100%,12px 100%,0% 50%)",
  chevron: "polygon(0% 0%,calc(100% - 14px) 0%,100% 50%,calc(100% - 14px) 100%,0% 100%,14px 50%)",
  "double-cut": "polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)",
  "skew-r": "polygon(0% 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)",
  stadium: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
  pill: "none",
  badge: "polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))",
};

function clipPath(preset: string) {
  if (preset === "pill") return undefined;
  return CLIPS[preset] || CLIPS.chamfer;
}

function ruleBlock(selector: string, b: ButtonStyleConfig): string {
  const bg = b.useGradient
    ? `linear-gradient(135deg,${b.gradientFrom},${b.gradientTo})`
    : b.bg;
  const hoverBg = b.useGradient
    ? `linear-gradient(135deg,${b.gradientTo},${b.gradientFrom})`
    : b.hoverBg;
  const clip = clipPath(b.clipPreset);
  const radius = b.clipPreset === "pill" ? "999px" : `${b.borderRadius ?? 0}px`;
  const border =
    (b.borderWidth ?? 0) > 0 ? `${b.borderWidth}px solid ${b.borderColor}` : "none";

  const base = `
${selector} {
  background: ${bg} !important;
  color: ${b.textColor} !important;
  border: ${border} !important;
  padding: ${b.paddingY}px ${b.paddingX}px !important;
  font-size: ${b.fontSize} !important;
  font-family: ${b.fontFamily} !important;
  font-weight: ${b.fontWeight} !important;
  letter-spacing: ${b.letterSpacing} !important;
  text-transform: ${b.textTransform} !important;
  ${clip ? `clip-path: ${clip} !important;` : ""}
  border-radius: ${radius} !important;
  box-shadow: none;
}
${selector}:hover {
  background: ${hoverBg} !important;
  color: ${b.hoverTextColor} !important;
}`;

  return base;
}

/** Dynamic CSS for .btn-arsenal (global default + per-section overrides). */
export function buildButtonStyleCss(
  styles: ButtonStyleConfig[],
  activeButtonId: string | undefined,
  sectionButtonIds: Record<string, string> | undefined
): string {
  if (!styles.length) return "";

  const byId = new Map(styles.map((s) => [s.id, s]));
  const globalId = activeButtonId || styles[0]?.id;
  const globalBtn = globalId ? byId.get(globalId) : styles[0];

  const parts: string[] = [];

  if (globalBtn) {
    parts.push(ruleBlock("a.btn-arsenal, button.btn-arsenal, .btn-arsenal", globalBtn));
  }

  if (sectionButtonIds) {
    for (const [section, btnId] of Object.entries(sectionButtonIds)) {
      if (!btnId) continue;
      const btn = byId.get(btnId);
      if (!btn) continue;
      parts.push(ruleBlock(`.btn-arsenal[data-btn-section="${section}"]`, btn));
    }
  }

  return parts.join("\n");
}
