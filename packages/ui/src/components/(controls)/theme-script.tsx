"use client";
import { THEME_INIT_SCRIPT, useApplyTheme } from "@repo/lib";

/**
 * First child of every root <body>: the inline script applies the stored
 * colour theme before the page paints (see @repo/lib theme.ts); the effect
 * re-applies it after hydration, because a hydration mismatch elsewhere
 * regenerates <html> on the client and drops data-theme. Pair it with
 * `suppressHydrationWarning` on <html>.
 */
export function ThemeScript() {
  useApplyTheme();
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
