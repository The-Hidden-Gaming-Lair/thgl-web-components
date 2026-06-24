const DEBUG =
  typeof window !== "undefined"
    ? localStorage.getItem("DEBUG") === "true"
    : false;
export function isDebug() {
  return DEBUG;
}

export const isOverwolf =
  typeof window !== "undefined" &&
  // @ts-expect-error
  typeof window.___overwolf___ !== "undefined";

// THGLApp runs the UI in a WebView2 host, which injects `window.chrome.webview`.
// Normal browsers (the public website) never expose it. Cast locally rather
// than rely on the `window.chrome` global augmentation (it lives in
// thgl-app/webview.ts and isn't visible to the isolated dts build).
export const isThglApp =
  typeof window !== "undefined" &&
  typeof (window as unknown as { chrome?: { webview?: unknown } }).chrome
    ?.webview !== "undefined";

/**
 * Running inside an in-game overlay app (Overwolf or THGLApp) rather than the
 * public website. Gates features that only make sense with a live player
 * position / hotkeys (e.g. "Discover Nearest Node").
 */
export const isApp = isOverwolf || isThglApp;

// Base URL of the main THGL site (www.th.gl), overridable on dev via
// NEXT_PUBLIC_TH_GL_URL (e.g. a localhost origin) so global icons / links load
// locally. Lives here (a leaf module) rather than config.ts so `games.ts` can use
// it for logo URLs without a config<->games circular import.
export const TH_GL_URL =
  process.env.NEXT_PUBLIC_TH_GL_URL ?? "https://www.th.gl";
