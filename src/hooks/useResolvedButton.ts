"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { DEFAULT_BUTTON_STYLES } from "@/lib/buttonDefaults";
import { cn } from "@/components/ui";

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

export type ResolvedButton = {
  className: string;
  style: React.CSSProperties;
};

function inlineButtonStyle(btn: Record<string, unknown>): React.CSSProperties {
  const b = btn as {
    useGradient?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
    bg?: string;
    textColor?: string;
    borderWidth?: number;
    borderColor?: string;
    paddingY?: number;
    paddingX?: number;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    letterSpacing?: string;
    clipPreset?: string;
    borderRadius?: number;
    textTransform?: string;
  };
  return {
    background: b.useGradient
      ? `linear-gradient(135deg,${b.gradientFrom},${b.gradientTo})`
      : b.bg,
    color: b.textColor,
    border: (b.borderWidth ?? 0) > 0 ? `${b.borderWidth}px solid ${b.borderColor}` : "none",
    padding: `${b.paddingY}px ${b.paddingX}px`,
    fontSize: b.fontSize,
    fontFamily: b.fontFamily,
    fontWeight: b.fontWeight as React.CSSProperties["fontWeight"],
    letterSpacing: b.letterSpacing,
    clipPath: b.clipPreset !== "pill" ? CLIPS[b.clipPreset || "none"] || "none" : undefined,
    borderRadius: b.clipPreset === "pill" ? "999px" : `${b.borderRadius ?? 0}px`,
    textTransform: b.textTransform as React.CSSProperties["textTransform"],
    transition: "all 0.2s ease",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
  };
}

/** Resolves global / per-section button style from admin settings. */
export function useResolvedButton(section?: string, extraClass?: string): ResolvedButton {
  const { settings } = useApp();
  const s = settings as {
    buttonStyles?: Record<string, unknown>[];
    activeButtonId?: string;
    sectionButtonIds?: Record<string, string>;
  };

  return useMemo(() => {
    const styles = s.buttonStyles?.length ? s.buttonStyles : DEFAULT_BUTTON_STYLES;
    const sectionId = section ? s.sectionButtonIds?.[section] : undefined;
    const activeId = s.activeButtonId || (styles[0] as { id?: string })?.id;
    const id = sectionId || activeId;
    const btn = styles.find((b) => (b as { id?: string }).id === id) || styles[0];

    if (!btn) {
      return {
        className: cn("btn btn-primary btn-md", extraClass),
        style: {},
      };
    }

    const cssClass = (btn as { cssClass?: string }).cssClass?.trim();
    const parts = cssClass ? cssClass.split(/\s+/).filter(Boolean) : [];
    const hasBase = parts.includes("btn");
    const presetClasses = cssClass ? (hasBase ? parts : ["btn", ...parts]) : ["btn"];

    return {
      className: cn(...presetClasses, "btn-arsenal", extraClass),
      style: inlineButtonStyle(btn),
    };
  }, [s.buttonStyles, s.activeButtonId, s.sectionButtonIds, section, extraClass]);
}
