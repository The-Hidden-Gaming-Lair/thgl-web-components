/**
 * Colour theme (Settings → Accessibility → Theme). "dark" is the default and
 * is what every page renders without a stored choice. Global, not per game or
 * per profile: stored in a `.th.gl` cookie so every tenant subdomain and the
 * companion app share it, mirrored to localStorage for hosts without a shared
 * cookie (localhost, Overwolf extensions).
 *
 * A theme is applied as `<html data-theme="…">` and remaps the neutral
 * palette + shadcn tokens in @repo/ui styles/themes.css, so the existing
 * zinc/slate/gray/white/black classes follow it without per-component edits.
 */
export const THEMES = ["dark", "light", "black", "system"] as const;
export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = Exclude<Theme, "system">;

export const DEFAULT_THEME: Theme = "dark";
const STORAGE_KEY = "thgl-theme";
const CHANGE_EVENT = "thgl-theme-change";

function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

function readCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)thgl-theme=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = readCookie() ?? localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyTheme(theme: Theme = getTheme()) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveTheme(theme);
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage disabled — the cookie still carries it
  }
  const domain = location.hostname.endsWith("th.gl") ? "; domain=.th.gl" : "";
  document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax${domain}`;
  applyTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeTheme(callback: () => void) {
  const media = window.matchMedia?.("(prefers-color-scheme: light)");
  const onSystemChange = () => {
    if (getTheme() === "system") applyTheme("system");
    callback();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    applyTheme();
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  media?.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
    media?.removeEventListener("change", onSystemChange);
  };
}

/**
 * Inline script for the top of <body>: sets data-theme before first paint so
 * a light-theme page never flashes dark. Keep in sync with getTheme/resolveTheme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)thgl-theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):localStorage.getItem("thgl-theme");if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";if(t==="light"||t==="black")document.documentElement.dataset.theme=t;}catch(e){}})();`;
