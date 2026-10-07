"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Map as MapIcon } from "lucide-react";
import {
  AppConfig,
  cn,
  games,
  isThglApp,
  localizePath,
  parseAppPath,
  toAppSurfacePath,
  useHasMounted,
} from "@repo/lib";
import { useNavGroups, type NavGroup, type NavLink } from "../(controls)/links";
import { trackEvent } from "../(header)/plausible-tracker";
import { useI18n } from "../(providers)";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { AppHeader } from "./app-header";
import {
  isCodexFrame,
  isCodexFrameMessage,
  type CodexFrameMessage,
} from "./codex-frame";
import { useCodexPane } from "./codex-pane";
import { InitializeApp } from "./initialize-app";
import { NavigationButtons } from "./navigation-buttons";
import { ResizeBorders } from "./resize-borders";

/**
 * App chrome for a game's codex / guides / tools inside the companion app
 * (`app.th.gl/apps/<id>/<page>`, see @repo/lib app-surface.ts): the app title
 * bar (drag, window controls, back/forward) with the game's page groups —
 * Map | Database | Guides | Tools — from the same nav model as the website
 * header, every link kept under `/apps/<id>`.
 */
export function AppContentShell({
  appConfig,
  gameId,
  hasMap,
  hasGuides,
}: {
  appConfig: AppConfig;
  gameId: string;
  hasMap: boolean;
  hasGuides: boolean;
}) {
  const mounted = useHasMounted();
  // Inside the map window's codex pane (codex-pane.tsx) the map window owns the
  // app bridge, the title bar and the window edges.
  const framed = mounted && isCodexFrame();
  return (
    <>
      {mounted && !framed && <InitializeApp />}
      <AppLinkInterceptor
        gameId={gameId}
        locales={appConfig.supportedLocales}
      />
      {/* Hidden inside the codex pane before first paint (CODEX_FRAME_SCRIPT,
          app-surface-root.tsx): the map window's title bar serves the frame. */}
      <div className="thgl-window-chrome">
        <AppHeader title={appConfig.title}>
          <NavigationButtons />
          <AppPagesNav
            appConfig={appConfig}
            gameId={gameId}
            hasMap={hasMap}
            hasGuides={hasGuides}
            showMapTab
          />
        </AppHeader>
      </div>
      {framed && <CodexFrameBridge />}
      {/* Window edges only exist in the app's frameless window. */}
      {mounted && isThglApp && !framed && <ResizeBorders />}
    </>
  );
}

/**
 * The game's page groups as compact title-bar tabs, linking to the app copies
 * (/apps/<id>/db, …). Also rendered in the map window's title bar (app.tsx
 * `pagesNav`): there a CodexPaneProvider is mounted and the tabs open the pages
 * in the codex pane over the map instead of navigating the window, with the
 * map tab closing the pane.
 */
export function AppPagesNav({
  appConfig,
  gameId,
  hasMap,
  hasGuides,
  showMapTab,
}: {
  appConfig: AppConfig;
  gameId: string;
  hasMap: boolean;
  hasGuides: boolean;
  showMapTab?: boolean;
}) {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? "/";
  const pane = useCodexPane();
  const locales = appConfig.supportedLocales;
  const groups = useNavGroups({ appConfig, hasMap, hasGuides });
  const hasAppMap = useMemo(
    () => !!games.find((game) => game.id === gameId)?.companion,
    [gameId],
  );

  // Home and the website's map pages have no app counterpart; the app's own
  // map (/apps/<id>) takes their place.
  const appGroups = useMemo(
    () =>
      groups
        .filter((group) => group.id !== "home" && group.id !== "maps")
        .map(
          (group): NavGroup => ({
            ...group,
            link: group.link && toAppLink(group.link, gameId, locales),
            items: group.items?.map((l) => toAppLink(l, gameId, locales)),
          }),
        ),
    [groups, gameId, locales],
  );

  // usePathname may report the rewritten route (/db/x) or the browser URL
  // (/apps/<id>/db/x); compare in the prefixed form either way.
  const current = pane
    ? pane.open
      ? pane.currentPath.split(/[?#]/)[0]
      : ""
    : toAppSurfacePath(pathname, gameId, locales);
  const isActive = (link: NavLink) =>
    !link.external &&
    (link.exact
      ? current === link.href
      : current === link.href || current.startsWith(`${link.href}/`));

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors whitespace-nowrap",
      active
        ? "bg-amber-900/30 text-amber-400"
        : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
    );
  const track = (group: string, href: string) =>
    trackEvent("Nav: Click", { props: { group, href, surface: "thgl-app" } });
  const onLinkClick = (e: React.MouseEvent, group: string, link: NavLink) => {
    track(group, link.href);
    if (pane && !link.external) {
      e.preventDefault();
      pane.openPath(link.href);
    }
  };

  return (
    <div
      className="flex items-center gap-1 min-w-0 overflow-x-auto [scrollbar-width:none]"
      // The title bar drags the window on mouse down; menus must not.
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Codex pane open: back to the map (closed, the map IS the view). */}
      {pane?.open && (
        <button
          type="button"
          className={tabClass(false)}
          onClick={() => {
            track("maps", "codex-pane-close");
            pane.close();
          }}
        >
          <MapIcon className="h-3 w-3" />
          {t("interactive_map")}
        </button>
      )}
      {!pane && showMapTab && hasAppMap && (
        // A plain <a>: the map page has its own root layout (full navigation).
        <a
          href={toAppSurfacePath(localizePath("/", locale), gameId, locales)}
          className={tabClass(false)}
          onClick={(e) => track("maps", e.currentTarget.href)}
        >
          <MapIcon className="h-3 w-3" />
          {t("interactive_map")}
        </a>
      )}
      {appGroups.map((group) =>
        group.link ? (
          <Link
            key={group.id + group.link.key}
            href={group.link.href}
            prefetch={false}
            className={tabClass(isActive(group.link))}
            onClick={(e) => onLinkClick(e, group.id, group.link!)}
          >
            {group.label}
          </Link>
        ) : group.items?.length ? (
          <DropdownMenu key={group.id + group.label}>
            <DropdownMenuTrigger
              className={tabClass(group.items.some(isActive))}
            >
              {group.label}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="z-9999999 max-h-[70vh] overflow-y-auto sidebar-scroll"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {group.items.map((link) =>
                // Codex pane: select the item (a prevented link click would
                // also cancel Radix's select, leaving the menu open).
                pane && !link.external ? (
                  <DropdownMenuItem
                    key={link.key}
                    className={cn(
                      "cursor-pointer text-xs",
                      isActive(link) && "text-amber-400",
                    )}
                    onSelect={() => {
                      track(group.id, link.href);
                      pane.openPath(link.href);
                    }}
                  >
                    {link.label}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={link.key} asChild>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "cursor-pointer text-xs",
                        isActive(link) && "text-amber-400",
                      )}
                      onClick={(e) => onLinkClick(e, group.id, link)}
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
      )}
    </div>
  );
}

function toAppLink(
  link: NavLink,
  gameId: string,
  locales: readonly string[],
): NavLink {
  if (link.external) return link;
  const href = toAppSurfacePath(link.href, gameId, locales);
  return { ...link, key: href, href };
}

/**
 * Keeps plain page links inside the app: a same-origin link to a game page
 * (`/db/x`, rendered by the shared page components) is re-pointed at
 * `/apps/<id>/db/x` before Next's <Link> handler runs (window capture phase).
 * Modified clicks, new-tab targets and downloads are left alone.
 */
function AppLinkInterceptor({
  gameId,
  locales,
}: {
  gameId: string;
  locales: readonly string[];
}) {
  const router = useRouter();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const raw = url.pathname + url.search + url.hash;
      const target = toAppSurfacePath(raw, gameId, locales);
      if (target === raw) return;
      e.preventDefault();
      e.stopPropagation();
      const parsed = parseAppPath(new URL(target, url).pathname);
      // Content pages share this root layout (soft nav); the map page and its
      // /maps redirect do not.
      if (parsed?.rest && !parsed.rest.startsWith("/maps")) {
        router.push(target);
      } else if (isCodexFrame()) {
        // Codex pane: the map is already open in the parent window.
        postToMapWindow({ type: "thgl-codex:show-on-map", href: target });
      } else {
        window.location.assign(target);
      }
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router, gameId, locales]);
  return null;
}

function postToMapWindow(message: CodexFrameMessage) {
  window.parent.postMessage(message, window.location.origin);
}

/**
 * Frame end of the codex pane (codex-pane.tsx), no UI: reports the URL and
 * whether the frame can go back / forward (the map window's title bar shows
 * the buttons), follows "navigate" / "history" and forwards Esc as "close".
 *
 * Back / forward count only this frame's navigations: the iframe shares the
 * window's session history, so a plain history.back() past the first codex
 * page would navigate the map window itself.
 */
function CodexFrameBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const depthRef = useRef({ back: 0, forward: 0 });
  const pendingRef = useRef<"back" | "forward" | null>(null);
  const firstRef = useRef(true);

  useEffect(() => {
    const depth = depthRef.current;
    if (firstRef.current) {
      firstRef.current = false;
    } else if (pendingRef.current === "back") {
      depth.back = Math.max(0, depth.back - 1);
      depth.forward += 1;
    } else if (pendingRef.current === "forward") {
      depth.back += 1;
      depth.forward = Math.max(0, depth.forward - 1);
    } else {
      depth.back += 1;
      depth.forward = 0;
    }
    pendingRef.current = null;
    postToMapWindow({
      type: "thgl-codex:location",
      path: window.location.pathname + window.location.search,
      canGoBack: depth.back > 0,
      canGoForward: depth.forward > 0,
    });
  }, [pathname]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent)
        return;
      if (!isCodexFrameMessage(e.data)) return;
      if (e.data.type === "thgl-codex:navigate") {
        router.push(e.data.href);
      } else if (e.data.type === "thgl-codex:history") {
        const depth = depthRef.current;
        if (e.data.direction === "back" && depth.back > 0) {
          pendingRef.current = "back";
          router.back();
        } else if (e.data.direction === "forward" && depth.forward > 0) {
          pendingRef.current = "forward";
          router.forward();
        }
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        postToMapWindow({ type: "thgl-codex:close" });
      }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKeyDown);
    postToMapWindow({ type: "thgl-codex:ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return null;
}
