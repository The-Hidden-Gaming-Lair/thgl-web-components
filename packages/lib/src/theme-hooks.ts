"use client";
// React hooks for theme.ts — split out because theme.ts is also imported by
// server components (THEME_INIT_SCRIPT for the root layouts).
import { useEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  DEFAULT_THEME,
  getTheme,
  subscribeTheme,
  type Theme,
} from "./theme";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME);
}

/** Keeps this window's <html data-theme> in sync (Overwolf windows, no ThemeScript). */
export function useApplyTheme() {
  const theme = useTheme();
  useEffect(() => applyTheme(theme), [theme]);
}
