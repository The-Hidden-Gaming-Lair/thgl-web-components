"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn, parseAppPath, translate, type TilesConfig } from "@repo/lib";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../(controls)";
import { useI18n, useUserStore } from "../(providers)";
import { isCodexFrameMessage, type CodexFrameMessage } from "./codex-frame";

/**
 * The game's codex / guides / tools inside the map window (desktop and
 * overlay): the title-bar tabs (AppPagesNav) open `/apps/<id>/<page>` in an
 * iframe that covers the window below the title bar, and the title bar
 * switches to the codex controls (app.tsx). The map, its tiles and live data
 * stay mounted underneath, so "back to the map" is instant; the iframe stays
 * alive while closed (scroll position, frame history).
 * Messages: codex-frame.ts; the frame end is CodexFrameBridge (app-content-shell.tsx).
 */
type CodexPaneState = {
  open: boolean;
  /** The frame's current URL (`/apps/<id>/db/x?…`), "" before the first open. */
  currentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  openPath: (href: string) => void;
  close: () => void;
  goBack: () => void;
  goForward: () => void;
};

type CodexPaneInternals = CodexPaneState & {
  src: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  readyRef: React.MutableRefObject<boolean>;
  /** Picked while the frame was still loading; sent on "ready". */
  pendingHrefRef: React.MutableRefObject<string | null>;
  onLocation: (path: string, canGoBack: boolean, canGoForward: boolean) => void;
};

const CodexPaneContext = createContext<CodexPaneInternals | null>(null);

/** The map window's codex pane, or null outside it (the codex window itself). */
export function useCodexPane(): CodexPaneState | null {
  return useContext(CodexPaneContext);
}

export function CodexPaneProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [location, setLocation] = useState({
    path: "",
    canGoBack: false,
    canGoForward: false,
  });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);

  const postToFrame = useCallback((message: CodexFrameMessage) => {
    iframeRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin,
    );
  }, []);

  const currentPath = location.path;
  const openPath = useCallback(
    (href: string) => {
      setOpen(true);
      if (src && readyRef.current) {
        // Soft navigation inside the frame (shared root layout).
        if (href !== currentPath)
          postToFrame({ type: "thgl-codex:navigate", href });
      } else if (!src) {
        setSrc(href);
        setLocation({ path: href, canGoBack: false, canGoForward: false });
      } else {
        pendingHrefRef.current = href;
      }
    },
    [src, currentPath, postToFrame],
  );
  const close = useCallback(() => setOpen(false), []);
  const goBack = useCallback(
    () => postToFrame({ type: "thgl-codex:history", direction: "back" }),
    [postToFrame],
  );
  const goForward = useCallback(
    () => postToFrame({ type: "thgl-codex:history", direction: "forward" }),
    [postToFrame],
  );
  const onLocation = useCallback(
    (path: string, canGoBack: boolean, canGoForward: boolean) =>
      setLocation({ path, canGoBack, canGoForward }),
    [],
  );

  const value = useMemo<CodexPaneInternals>(
    () => ({
      open,
      currentPath,
      canGoBack: location.canGoBack,
      canGoForward: location.canGoForward,
      openPath,
      close,
      goBack,
      goForward,
      src,
      iframeRef,
      readyRef,
      pendingHrefRef,
      onLocation,
    }),
    [
      open,
      currentPath,
      location,
      openPath,
      close,
      goBack,
      goForward,
      src,
      onLocation,
    ],
  );
  return (
    <CodexPaneContext.Provider value={value}>
      {children}
    </CodexPaneContext.Provider>
  );
}

/**
 * The pane: the whole window below the 32px title bar, above everything the
 * map draws.
 * Inside CoordinatesProvider: "show on map" picks the map and marker in place.
 */
export function CodexPane({
  tiles,
  disabled,
  onSelectMarker,
}: {
  tiles: TilesConfig;
  /** Closes and hides the pane ("Hide Controls"). */
  disabled?: boolean;
  /** Select + center a marker by node id (app.tsx `markerSlug`). */
  onSelectMarker: (nodeId: string) => void;
}) {
  const pane = useContext(CodexPaneContext);
  const { dict } = useI18n();
  const setMapName = useUserStore((state) => state.setMapName);
  const lastContentPathRef = useRef<string>("");

  const open = pane?.open ?? false;
  const close = pane?.close;
  useEffect(() => {
    if (disabled && open) close?.();
  }, [disabled, open, close]);

  const showOnMap = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.origin);
      const rest = parseAppPath(url.pathname)?.rest ?? "";
      const title = rest.startsWith("/maps/")
        ? safeDecode(rest.split("/")[2] ?? "")
        : url.searchParams.get("mapTitle");
      const mapName =
        title &&
        Object.keys(tiles).find(
          (name) =>
            tiles[name]?.defaultTitle === title ||
            translate(dict, name) === title,
        );
      if (mapName) setMapName(mapName);
      const id = url.searchParams.get("id");
      if (id) {
        // useMarkerUrlSync reads the node id from the window URL.
        const current = new URL(window.location.href);
        current.searchParams.set("id", id);
        current.searchParams.delete("mapTitle");
        window.history.replaceState(window.history.state, "", current);
        onSelectMarker(id);
      }
    },
    [tiles, dict, setMapName, onSelectMarker],
  );

  useEffect(() => {
    if (!pane) return;
    const { iframeRef, readyRef, pendingHrefRef, onLocation } = pane;
    const onMessage = (e: MessageEvent) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame || e.source !== frame) return;
      if (e.origin !== window.location.origin) return;
      if (!isCodexFrameMessage(e.data)) return;
      switch (e.data.type) {
        case "thgl-codex:ready":
          readyRef.current = true;
          if (pendingHrefRef.current) {
            frame.postMessage(
              { type: "thgl-codex:navigate", href: pendingHrefRef.current },
              window.location.origin,
            );
            pendingHrefRef.current = null;
          }
          break;
        case "thgl-codex:location":
          onLocation(e.data.path, e.data.canGoBack, e.data.canGoForward);
          lastContentPathRef.current = e.data.path;
          break;
        case "thgl-codex:close":
          pane.close();
          break;
        case "thgl-codex:show-on-map": {
          pane.close();
          // A map page loaded INTO the frame (a redirect the link interceptor
          // could not see) → put the frame back on the last codex page.
          if (!parseAppPath(frame.location.pathname)?.rest) {
            readyRef.current = false;
            frame.location.replace(lastContentPathRef.current || pane.src!);
          }
          showOnMap(e.data.href);
          break;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pane, showOnMap]);

  useEffect(() => {
    if (!open || !close) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!pane?.src) return null;
  return (
    <div
      className={cn(
        "fixed top-[32px] inset-x-0 bottom-0 bg-black",
        (!open || disabled) && "hidden",
      )}
      // Above the map's minimap / ads (z 11000-12000), below the unlock
      // button (99999), the title bar (999999) and their menus.
      style={{ zIndex: 50000 }}
    >
      <iframe
        ref={pane.iframeRef}
        src={pane.src}
        title="Database"
        className="block w-full h-full border-0 bg-black"
      />
    </div>
  );
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Back / forward through the codex pane's pages, in the map window's title bar. */
export function CodexNavigationButtons() {
  const pane = useCodexPane();
  if (!pane) return null;
  return (
    <div
      className="flex items-center gap-0.5 mr-1"
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={!pane.canGoBack}
        onClick={pane.goBack}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={!pane.canGoForward}
        onClick={pane.goForward}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
