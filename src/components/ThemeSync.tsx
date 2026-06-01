"use client";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeSync() {
  const { settings } = useApp();
  const { theme } = useTheme();
  const s = settings as any;

  useEffect(() => {
    const root = document.documentElement;
    if (settings.accentColor) root.style.setProperty("--red", settings.accentColor);
    if (settings.goldColor)   root.style.setProperty("--gold", settings.goldColor);
    if (theme === "dark") {
      if (s.darkBgPrimary) root.style.setProperty("--bg", s.darkBgPrimary);
      if (s.darkBgCard)    root.style.setProperty("--bg-card", s.darkBgCard);
      if (s.darkTextPrimary) root.style.setProperty("--text", s.darkTextPrimary);
    } else {
      if (s.lightBgPrimary) root.style.setProperty("--bg", s.lightBgPrimary);
      if (s.lightBgCard)    root.style.setProperty("--bg-card", s.lightBgCard);
      if (s.lightTextPrimary) root.style.setProperty("--text", s.lightTextPrimary);
    }
  }, [settings, theme, s]);

  return null;
}
