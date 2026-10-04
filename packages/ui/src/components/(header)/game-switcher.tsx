"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ExternalLink, LayoutGrid, Search } from "lucide-react";
import { cn, isOverwolf } from "@repo/lib";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import apps from "./global-menu.json";
import { trackEvent } from "./plausible-tracker";
import { useOptionalT } from "../(providers)/i18n-provider";

// On games-web (and the THGL desktop app served from app.th.gl) the public
// folder is shared across every tenant, so a relative path resolves on
// palia.localhost:3100, palia.th.gl, www.th.gl, etc. Overwolf apps run on
// the `overwolf-extension://` scheme where that path doesn't exist, so they
// have to hit the absolute production URL. The legacy
// `https://www.th.gl/global_icons/` URL was being rewritten to
// `/www/global_icons/*` (no route → Bunny deploy-placeholder HTML → Chrome
// ORB blocked it cross-origin), so we point at the actually-served
// `/games/thgl-web/global_icons/` path in both cases.
const ICON_BASE_URL = isOverwolf
  ? "https://www.th.gl/games/thgl-web/global_icons/"
  : "/games/thgl-web/global_icons/";

type AppEntry = (typeof apps)[number];

// global-menu.json lists games newest-first (new games are added at the top).
const NEW_COUNT = 4;
const RECENT_COUNT = 4;
// A cookie on `.th.gl`, not localStorage: every game is its own subdomain, so
// per-origin storage would only ever "remember" the game you're on. Values are
// bare subdomain labels ("palia.palworld") — no URLs/JSON in cookies, which
// the WAF's SQLi rules have false-flagged before.
const RECENT_COOKIE = "thgl_recent";

/** A–Z key: "The Planet Crafter" sorts under P, not T. */
const sortKey = (title: string) => title.replace(/^the\s+/i, "");

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** "https://palia.th.gl" → "palia" (the cookie stores these labels). */
function appSlug(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0].replace(/[^a-z0-9]/gi, "");
  } catch {
    return "";
  }
}

function readRecent(): string[] {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${RECENT_COOKIE}=([a-z0-9.]*)`, "i"),
    );
    return match?.[1] ? match[1].split(".").filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Remember the active game as most recent. */
function rememberRecent(url: string) {
  try {
    const slug = appSlug(url);
    if (!slug) return;
    const next = [slug, ...readRecent().filter((s) => s !== slug)].slice(
      0,
      RECENT_COUNT + 1,
    );
    const host = window.location.hostname;
    const domain =
      host === "th.gl" || host.endsWith(".th.gl") ? "; domain=.th.gl" : "";
    document.cookie = `${RECENT_COOKIE}=${next.join(".")}; path=/; max-age=31536000; SameSite=Lax${domain}`;
  } catch {
    // Cookies blocked (Overwolf sandbox, privacy mode): no recents.
  }
}

type Sprite = {
  fileName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sheetWidth?: number;
  sheetHeight?: number;
};

// Legacy fallback only (partner sprites now carry sheetWidth/sheetHeight): the
// partner sheet's coord-derived bounds, used if an icon predates those fields.
const partnerSprites = apps.flatMap((a) =>
  ("partners" in a ? (a.partners ?? []) : []).map((p) => p.sprite),
);
const PARTNER_SHEET_FALLBACK_W = Math.max(
  0,
  ...partnerSprites.map((s) => s.x + s.width),
);
const PARTNER_SHEET_FALLBACK_H = Math.max(
  0,
  ...partnerSprites.map((s) => s.y + s.height),
);

// Renders one icon out of a packed sprite sheet, scaled to `size`. Cells are
// packed at their native size (a MAX cap, not a fixed cell), so the sheet MUST
// be scaled by the icon's own width — cropping a fixed-size box would clip any
// source that isn't exactly `size` px. Uses the real sheet canvas size emitted
// by createImageSprite; the shelf packer leaves trailing slack so a
// coord-derived bound (the legacy fallback) under-reports it and CSS would
// squish the sheet, misaligning every icon.
function SpriteIcon({
  sprite,
  label,
  size,
  sheetFallbackWidth,
  sheetFallbackHeight,
  className,
}: {
  sprite: Sprite;
  label: string;
  size: number;
  sheetFallbackWidth: number;
  sheetFallbackHeight: number;
  className?: string;
}) {
  const scale = size / sprite.width;
  const sheetWidth = sprite.sheetWidth ?? sheetFallbackWidth;
  const sheetHeight = sprite.sheetHeight ?? sheetFallbackHeight;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("bg-background shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${ICON_BASE_URL}${sprite.fileName})`,
        backgroundPosition: `-${sprite.x * scale}px -${sprite.y * scale}px`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        backgroundRepeat: "no-repeat",
        backgroundOrigin: "border-box",
      }}
    />
  );
}

function GameIcon({
  app,
  size = 36,
  className,
}: {
  app: AppEntry;
  size?: number;
  className?: string;
}) {
  return (
    <SpriteIcon
      sprite={app.sprite}
      label={app.title}
      size={size}
      sheetFallbackWidth={Math.max(
        ...apps.map((a) => a.sprite.x + a.sprite.width),
      )}
      sheetFallbackHeight={Math.max(
        ...apps.map((a) => a.sprite.y + a.sprite.height),
      )}
      className={className}
    />
  );
}

export function GameSwitcher({
  activeApp,
  compact,
}: {
  activeApp: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = useOptionalT();

  const { activeAppData, otherApps, newApps } = useMemo(() => {
    let active: AppEntry | undefined;
    const rest: AppEntry[] = [];
    for (const app of apps) {
      if (app.title === activeApp) {
        active = app;
      } else {
        rest.push(app);
      }
    }
    const newest = rest.slice(0, NEW_COUNT);
    rest.sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title)));
    return { activeAppData: active, otherApps: rest, newApps: newest };
  }, [activeApp]);

  // Record the current game on every visit; read the list when opening.
  useEffect(() => {
    if (activeAppData) rememberRecent(activeAppData.url);
  }, [activeAppData]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    setRecentUrls(readRecent());
    // Focus after the popover mounted its content.
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const recentApps = useMemo(
    () =>
      recentUrls
        .map((slug) => otherApps.find((app) => appSlug(app.url) === slug))
        .filter((app): app is AppEntry => !!app)
        .slice(0, RECENT_COUNT),
    [recentUrls, otherApps],
  );

  const matches = useMemo(() => {
    const q = normalize(query);
    if (!q) return null;
    return otherApps.filter((app) => normalize(app.title).includes(q));
  }, [query, otherApps]);

  const onPick = (app: AppEntry, from: string) => {
    trackEvent("Game Switcher: Click", { props: { game: app.title, from } });
    setOpen(false);
  };

  const renderGrid = (list: AppEntry[], from: string) => (
    <div className="grid grid-cols-4 gap-1 px-2 pb-2">
      {list.map((app) => (
        <a
          key={app.url}
          href={app.url}
          onClick={() => onPick(app, from)}
          className={cn(
            "group flex flex-col items-center gap-1 rounded-lg p-2",
            "transition-colors hover:bg-white/8 focus-visible:bg-white/8 focus-visible:outline-none",
          )}
          title={app.title}
        >
          <GameIcon
            app={app}
            size={36}
            className="border-2 border-transparent group-hover:border-white/30 transition-colors"
          />
          <span className="text-[10px] leading-tight text-center line-clamp-2 w-full text-muted-foreground group-hover:text-foreground">
            {app.title}
          </span>
        </a>
      ))}
    </div>
  );

  const sectionTitle = (label: string) => (
    <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  );

  return (
    <>
      {/* Crawlable copies of the links inside the popover.
       *
       * Everything below lives in PopoverContent, which Radix renders into a
       * portal only while the popover is open — so those links are absent from
       * the server-rendered HTML and from the DOM until a user clicks. Search
       * engines do not open menus to discover links, so neither the partner
       * chips nor the game grid were reaching crawlers. This block renders the
       * same hrefs unconditionally (SSR included), hidden with the sr-only clip
       * technique rather than `display: none` so the links stay in the layout
       * and accessibility tree.
       *
       * Every anchor here is out of the tab order on purpose: a focusable
       * element that stays invisible while focused strands keyboard users.
       * Screen readers still reach them in browse mode, and the visible
       * popover remains the keyboard path.
       */}
      {activeAppData?.partners && activeAppData.partners.length > 0 && (
        <nav className="sr-only" aria-label={`${activeAppData.title} partners`}>
          <ul>
            {activeAppData.partners.map((partner) => (
              <li key={partner.url}>
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener"
                  tabIndex={-1}
                >
                  {partner.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {/* The other games are all `*.th.gl`, i.e. the same registrable domain —
       * this is internal linking between tenants, not an outbound link block. */}
      <nav className="sr-only" aria-label="Other games">
        <ul>
          {otherApps.map((app) => (
            <li key={app.url}>
              <a href={app.url} tabIndex={-1}>
                {app.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5",
              "hover:bg-white/10 transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
            aria-label="Switch game"
          >
            {activeAppData ? (
              <GameIcon
                app={activeAppData}
                size={compact ? 22 : 32}
                className={
                  compact ? "border border-primary" : "border-2 border-primary"
                }
              />
            ) : (
              // No active game (www): a "games" grid glyph instead of a blank icon.
              <div
                className={cn(
                  "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
                  compact ? "w-[22px] h-[22px]" : "w-8 h-8",
                )}
              >
                <LayoutGrid className={compact ? "h-3 w-3" : "h-4 w-4"} />
              </div>
            )}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="w-[340px] p-0 border-border/60 bg-background/95 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-border/40 px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Enter opens the first match.
                if (e.key === "Enter" && matches?.[0]) {
                  onPick(matches[0], "search-enter");
                  window.location.href = matches[0].url;
                }
              }}
              placeholder={t("nav.searchGames", { fallback: "Search games…" })}
              aria-label={t("nav.searchGames", { fallback: "Search games…" })}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ScrollArea className="h-[min(420px,65vh)]" type="always">
            {/* Active game + partners section */}
            {activeAppData && (
              <div className="border-b border-border/40 p-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <GameIcon
                    app={activeAppData}
                    size={28}
                    className="border-2 border-primary"
                  />
                  <span className="text-sm font-semibold text-primary">
                    {activeAppData.title}
                  </span>
                </div>
                {activeAppData.partners &&
                  activeAppData.partners.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 ml-0.5">
                      {activeAppData.partners.map((partner) => (
                        <a
                          key={partner.url}
                          href={partner.url}
                          target="_blank"
                          rel="noopener"
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-muted/40 hover:bg-muted transition-colors"
                        >
                          {partner.sprite && (
                            <SpriteIcon
                              sprite={partner.sprite}
                              label={partner.title}
                              size={14}
                              sheetFallbackWidth={PARTNER_SHEET_FALLBACK_W}
                              sheetFallbackHeight={PARTNER_SHEET_FALLBACK_H}
                            />
                          )}
                          {partner.title}
                          <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {matches ? (
              matches.length > 0 ? (
                <div className="pt-2">{renderGrid(matches, "search")}</div>
              ) : (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t("nav.noGames", { fallback: "No games found" })}
                </p>
              )
            ) : (
              <>
                {recentApps.length > 0 && (
                  <>
                    {sectionTitle(t("nav.recent", { fallback: "Recent" }))}
                    {renderGrid(recentApps, "recent")}
                  </>
                )}
                {newApps.length > 0 && (
                  <>
                    {sectionTitle(t("nav.new", { fallback: "New" }))}
                    {renderGrid(newApps, "new")}
                  </>
                )}
                {sectionTitle(t("nav.allGames", { fallback: "All Games" }))}
                {renderGrid(otherApps, "all")}
              </>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
