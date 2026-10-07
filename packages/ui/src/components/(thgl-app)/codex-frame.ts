/**
 * Messages between the companion app's map window and the codex pane it hosts
 * (an iframe of `/apps/<id>/<page>`, see codex-pane.tsx). Same origin only:
 * both sides check `event.origin` and `event.source`.
 *
 * THGLApp only answers `chrome.webview` messages from the top document, so the
 * frame never talks to the host: the map window keeps the title bar (drag,
 * window controls, back / forward, page tabs) and drives the frame from there.
 */
export type CodexFrameMessage =
  /** frame → map: the frame is mounted and listens for "navigate". */
  | { type: "thgl-codex:ready" }
  /** frame → map: the frame's URL (`/apps/<id>/db/x?…`) and history changed. */
  | {
      type: "thgl-codex:location";
      path: string;
      canGoBack: boolean;
      canGoForward: boolean;
    }
  /** frame → map: a map link was clicked (`/apps/<id>[/maps/<title>/…]?id=…`). */
  | { type: "thgl-codex:show-on-map"; href: string }
  /** frame → map: close the pane (Esc). */
  | { type: "thgl-codex:close" }
  /** map → frame: soft-navigate to an app content path. */
  | { type: "thgl-codex:navigate"; href: string }
  /** map → frame: step through the frame's own history. */
  | { type: "thgl-codex:history"; direction: "back" | "forward" };

export function isCodexFrameMessage(data: unknown): data is CodexFrameMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { type?: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith("thgl-codex:")
  );
}

/** True when this document is the codex pane inside the map window. */
export function isCodexFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin parent: not our map window.
    return false;
  }
}

/**
 * Marks `<html data-thgl-frame>` before first paint, so the frame drops the
 * window title bar (CSS below) without a hydration flash.
 */
export const CODEX_FRAME_SCRIPT = `try{if(window.self!==window.top)document.documentElement.setAttribute("data-thgl-frame","")}catch(e){}`;

/** In the frame: no title bar, so no header offset either (HeaderOffset reads --header-h). */
export const CODEX_FRAME_STYLE =
  "html[data-thgl-frame]{--header-h:0px!important}" +
  "html[data-thgl-frame] .thgl-window-chrome{display:none!important}";
