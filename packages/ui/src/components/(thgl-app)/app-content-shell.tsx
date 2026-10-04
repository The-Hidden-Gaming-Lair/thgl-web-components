"use client";

import { useEffect, useMemo } from "react";
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
  return (
    <>
      <InitializeApp />
      <AppLinkInterceptor
        gameId={gameId}
        locales={appConfig.supportedLocales}
      />
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
      {/* Window edges only exist in the app's frameless window. */}
      {mounted && isThglApp && <ResizeBorders />}
    </>
  );
}

/**
 * The game's page groups as compact title-bar tabs, linking to the app copies
 * (/apps/<id>/db, …). Also rendered in the desktop map window's title bar
 * (app.tsx `pagesNav`), where the map tab is left out.
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
  const current = toAppSurfacePath(pathname, gameId, locales);
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

  return (
    <div
      className="flex items-center gap-1 min-w-0 overflow-x-auto [scrollbar-width:none]"
      // The title bar drags the window on mouse down; menus must not.
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {showMapTab && hasAppMap && (
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
            onClick={() => track(group.id, group.link!.href)}
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
              {group.items.map((link) => (
                <DropdownMenuItem key={link.key} asChild>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className={cn(
                      "cursor-pointer text-xs",
                      isActive(link) && "text-amber-400",
                    )}
                    onClick={() => track(group.id, link.href)}
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
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
      } else {
        window.location.assign(target);
      }
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router, gameId, locales]);
  return null;
}
