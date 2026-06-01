"use client";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
export default function IconStyleSync() {
  const { settings } = useApp();
  useEffect(() => {
    const s = settings as any;
    const root = document.documentElement;
    if (s.iconSettings?.size)  root.style.setProperty("--site-icon-size", `${s.iconSettings.size}px`);
    if (s.iconSettings?.color) root.style.setProperty("--site-icon-color", s.iconSettings.color);
  }, [settings]);
  return null;
}
