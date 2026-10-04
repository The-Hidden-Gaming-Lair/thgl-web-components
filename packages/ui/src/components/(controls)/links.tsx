"use client";

import { useState, useRef, useEffect, useMemo, type JSX } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ExternalAnchor,
  DiscordIcon,
  GitHubIcon,
  RedditIcon,
} from "../(header)";
import { trackEvent } from "../(header)/plausible-tracker";
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Menu,
  MoreHorizontal,
  X,
} from "lucide-react";
import { AppConfig, localizePath, cn } from "@repo/lib";
import { Badge } from "../ui/badge";
import { usePreviewReleaseGate } from "../(apps)/preview-release-guard";
import { useI18n } from "../(providers)";
import { ScriptLoader } from "../(ads)";
import ConsentLink from "../(ads)/consent-link";

/**
 * Header navigation, grouped by what a page IS rather than one flat list:
 *
 *   Home | Map(s) ▾ | Database ▾ | Guides | Tools ▾   [In-Game App] [partners] [🌐] [⋯]
 *
 * Every group is derived from the tenant config — nothing per game to curate:
 *   - Maps: `/maps` + every named `/maps/<map>` internalLink (plain
 *     "Interactive Map" link when the game has no named map links).
 *   - Database: `/db` ("All categories") + `db.homeSections` + `/db/*` internalLinks.
 *   - Guides: `/guides` when the game has filters.
 *   - Tools: every other internalLink (breeding, rummage pile, forecast, …);
 *     a single tool renders inline instead of a one-item menu.
 * Only groups the tenant has are rendered (map-only: Home | Map | Guides).
 *
 * Menus are always in the DOM (toggled with `hidden`), so every link stays in
 * the server-rendered HTML for crawlers; below `md` the same groups render in
 * a menu sheet. Clicks fire a "Nav: Click" Plausible event.
 */

export type NavLink = {
  key: string;
  href: string;
  label: string;
  /** Active only on this exact path (index links like /maps, /db). */
  exact?: boolean;
  external?: boolean;
};

export type NavGroup = {
  id: "home" | "maps" | "db" | "guides" | "tools";
  label: string;
  /** Single link (no menu). */
  link?: NavLink;
  /** Menu entries. */
  items?: NavLink[];
};

const isExternalHref = (href: string) => /^https?:\/\//.test(href);

function stripLocale(pathname: string, locale: string): string {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function trackNavClick(group: string, href: string) {
  trackEvent("Nav: Click", { props: { group, href } });
}

/**
 * The tenant's navigation groups (see the comment above). Shared by the header
 * and the site footer so both always list the same pages.
 */
export function useNavGroups({
  appConfig,
  hasMap,
  hasGuides = true,
  inlineLinks,
}: {
  appConfig: AppConfig;
  hasMap: boolean;
  hasGuides?: boolean;
  inlineLinks?: number;
}): NavGroup[] {
  const { locale, t } = useI18n();
  // Elite-only (previewOnly) links stay hidden from the nav until access resolves.
  const previewGate = usePreviewReleaseGate();
  return useMemo(() => {
    const toLink = (href: string, label: string, exact?: boolean): NavLink => {
      const external = isExternalHref(href);
      const target = external ? href : localizePath(href, locale);
      return { key: target, href: target, label, exact, external };
    };
    const appLinks =
      appConfig.internalLinks?.filter(
        (l) => l.href !== "/" && (!l.previewOnly || previewGate === "allow"),
      ) ?? [];

    const result: NavGroup[] = [
      {
        id: "home",
        label: t("home.title"),
        link: toLink("/", t("home.title"), true),
      },
    ];

    if (hasMap) {
      const named = appLinks.filter((l) => l.href.startsWith("/maps/"));
      if (named.length === 0) {
        result.push({
          id: "maps",
          label: t("interactive_map"),
          link: toLink("/maps", t("interactive_map")),
        });
      } else {
        result.push({
          id: "maps",
          label: t("nav.maps", { fallback: "Maps" }),
          items: [
            toLink("/maps", t("nav.allMaps", { fallback: "All Maps" }), true),
            ...named.map((l) => toLink(l.href, t(l.title))),
          ],
        });
      }
    }

    const db = appConfig.db;
    if (db) {
      const items: NavLink[] = [
        toLink(
          "/db",
          t("nav.allCategories", { fallback: "All Categories" }),
          true,
        ),
      ];
      const seen = new Set(["/db"]);
      for (const section of db.homeSections) {
        if (seen.has(section.href)) continue;
        seen.add(section.href);
        // The section's display (plural) label — the same one the section's
        // h1 / breadcrumb / title use. `typeLabels` is the SINGULAR entry
        // label (search badges, entry titles), only a last resort here.
        const label =
          (section.titleKey ? t(section.titleKey) : undefined) ??
          section.titleFallback ??
          db.typeLabels?.[section.type] ??
          section.type;
        items.push(toLink(section.href, label));
      }
      for (const l of appLinks) {
        if (!l.href.startsWith("/db") || seen.has(l.href)) continue;
        seen.add(l.href);
        items.push(toLink(l.href, t(l.title)));
      }
      result.push({ id: "db", label: t("database"), items });
    }

    if (hasGuides) {
      const label = t("nav.guides", { fallback: "Guides" });
      result.push({ id: "guides", label, link: toLink("/guides", label) });
    }

    const tools = appLinks
      .filter(
        (l) =>
          !l.href.startsWith("/maps") &&
          !l.href.startsWith("/db") &&
          !l.href.startsWith("/guides"),
      )
      .map((l) => toLink(l.href, t(l.title)));
    if (inlineLinks !== undefined) {
      // Non-game sites (www): the first links inline, the rest under "More".
      for (const link of tools.slice(0, inlineLinks)) {
        result.push({ id: "tools", label: link.label, link });
      }
      if (tools.length > inlineLinks) {
        result.push({
          id: "tools",
          label: t("nav.more", { fallback: "More" }),
          items: tools.slice(inlineLinks),
        });
      }
    } else if (tools.length === 1) {
      result.push({ id: "tools", label: tools[0].label, link: tools[0] });
    } else if (tools.length > 1) {
      result.push({
        id: "tools",
        label: t("nav.tools", { fallback: "Tools" }),
        items: tools,
      });
    }

    return result;
  }, [
    appConfig.internalLinks,
    appConfig.db,
    hasMap,
    hasGuides,
    inlineLinks,
    locale,
    t,
    previewGate,
  ]);
}

export function Links({
  appConfig,
  hasMap,
  hasGuides = true,
  inlineLinks,
  children,
  childrenDropdown,
}: {
  appConfig: AppConfig;
  /** Whether the game has any maps (derived from version.data.tiles in the layout). */
  hasMap: boolean;
  /**
   * Whether the /guides section exists. Defaults to true (map games).
   * Database-only deployments (e.g. homm-olden-era) set this to false so
   * the Guides link is hidden from the header.
   */
  hasGuides?: boolean;
  /**
   * Non-game sites (www): render the first N internalLinks as top-level tabs
   * and the rest under "More" instead of grouping them as "Tools".
   */
  inlineLinks?: number;
  /** Language switcher (dropdown) shown at the right of the nav. */
  children?: React.ReactNode;
  /** Flat language list for the mobile menu sheet (falls back to `children`). */
  childrenDropdown?: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname() ?? "/";
  const { locale, t } = useI18n();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  // Re-render after hydration so the active state matches the client path.
  const [, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const groups = useNavGroups({ appConfig, hasMap, hasGuides, inlineLinks });

  // In-Game App first (most important), then partner links (never dropped).
  const externals = useMemo(() => {
    const items: NavLink[] = [];
    if (appConfig.appUrl) {
      items.push({
        key: appConfig.appUrl,
        href: appConfig.appUrl,
        label: t("links.inGameApp"),
        external: true,
      });
    }
    for (const { href, title } of appConfig.externalLinks ?? []) {
      items.push({ key: href, href, label: t(title), external: true });
    }
    return items;
  }, [appConfig.externalLinks, appConfig.appUrl, t]);

  const path = safeDecode(stripLocale(pathname, locale));
  const isLinkActive = (link: NavLink) => {
    if (link.external) return false;
    const href = safeDecode(stripLocale(link.href, locale));
    if (link.exact || href === "/") return path === href;
    return path === href || path.startsWith(`${href}/`);
  };
  const isGroupActive = (group: NavGroup) =>
    group.link ? isLinkActive(group.link) : !!group.items?.some(isLinkActive);

  // Close menus on outside click / Escape / navigation.
  useEffect(() => {
    if (!openMenu && !sheetOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        navRef.current?.contains(target) ||
        sheetRef.current?.contains(target) ||
        mobileRef.current?.contains(target)
      )
        return;
      setOpenMenu(null);
      setSheetOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpenMenu(null);
      setSheetOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openMenu, sheetOpen]);

  useEffect(() => {
    setOpenMenu(null);
    setSheetOpen(false);
  }, [pathname]);

  const legalLinks = (
    <>
      <ExternalAnchor
        className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
        href="https://www.th.gl/legal-notice"
      >
        {t("legal_notice")}
      </ExternalAnchor>
      <ExternalAnchor
        className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
        href="https://www.th.gl/privacy-policy"
      >
        {t("privacy_policy")}
      </ExternalAnchor>
      <ScriptLoader>
        <ConsentLink />
      </ScriptLoader>
    </>
  );

  const socialLinks = (
    <div className="flex items-center justify-center gap-1.5 px-3 py-2">
      {[
        { href: "https://th.gl/discord", title: "Discord", Icon: DiscordIcon },
        {
          href: "https://github.com/The-Hidden-Gaming-Lair",
          title: "GitHub",
          Icon: GitHubIcon,
        },
        {
          href: "https://www.reddit.com/r/TheHiddenGamingLair/",
          title: "Reddit",
          Icon: RedditIcon,
        },
      ].map(({ href, title, Icon }) => (
        <ExternalAnchor
          key={href}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
          href={href}
          title={title}
        >
          <Icon size={14} className="opacity-70" />
        </ExternalAnchor>
      ))}
    </div>
  );

  const promoBadges = !!appConfig.promoLinks?.length && (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {appConfig.promoLinks.map(({ href, title }) => (
        <Link key={href} href={localizePath(href, locale)}>
          <Badge>{t(title)}</Badge>
        </Link>
      ))}
    </div>
  );

  const renderMenuLink = (group: string, link: NavLink, className?: string) =>
    link.external ? (
      <ExternalAnchor
        key={link.key}
        href={link.href}
        onClick={() => trackNavClick(group, link.href)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors",
          className,
        )}
      >
        {link.label}
        <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
      </ExternalAnchor>
    ) : (
      <Link
        key={link.key}
        href={link.href}
        onClick={() => trackNavClick(group, link.href)}
        className={cn(
          "block px-3 py-2 text-sm transition-colors",
          isLinkActive(link)
            ? "text-amber-400 bg-amber-900/20"
            : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
          className,
        )}
      >
        {link.label}
      </Link>
    );

  const menuPanel =
    "absolute top-full mt-1 font-medium rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-50 py-1 max-h-[min(70vh,600px)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent";

  const tabClass = (active: boolean, open = false) =>
    cn(
      "inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap",
      active
        ? "bg-amber-900/30 text-amber-400"
        : open
          ? "bg-zinc-800 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
    );

  const renderDesktopGroup = (group: NavGroup) => {
    if (group.link) {
      return (
        <Link
          key={group.link.key}
          href={group.link.href}
          onClick={() => trackNavClick(group.id, group.link!.href)}
          className={tabClass(isGroupActive(group))}
        >
          {group.label}
        </Link>
      );
    }
    const items = group.items ?? [];
    const open = openMenu === group.id;
    // Long menus (Palia's database) flow into two columns.
    const twoColumns = items.length > 10;
    return (
      <div
        key={`${group.id}:${group.label}`}
        className="relative"
        onMouseEnter={() =>
          openMenu && openMenu !== group.id && setOpenMenu(group.id)
        }
      >
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpenMenu(open ? null : group.id)}
          className={tabClass(isGroupActive(group), open)}
        >
          {group.label}
          <ChevronDown
            className={cn(
              "w-3 h-3 opacity-60 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        <div
          className={cn(
            menuPanel,
            "left-0",
            twoColumns ? "w-[26rem] grid grid-cols-2" : "w-56",
            !open && "hidden",
          )}
        >
          {items.map((link, i) =>
            renderMenuLink(
              group.id,
              link,
              // The index entry ("All maps" / "All categories") spans the row.
              cn(
                "truncate",
                i === 0 &&
                  link.exact &&
                  twoColumns &&
                  "col-span-2 border-b border-neutral-800 mb-1",
                i === 0 &&
                  link.exact &&
                  !twoColumns &&
                  "border-b border-neutral-800 mb-1",
              ),
            ),
          )}
        </div>
      </div>
    );
  };

  const moreOpen = openMenu === "__more__";

  return (
    <>
      {/* Desktop (md+): grouped tabs */}
      <div
        ref={navRef}
        className="max-md:hidden flex flex-1 items-center gap-1 min-w-0"
      >
        <div className="flex items-center gap-0.5 min-w-0">
          {groups.map(renderDesktopGroup)}
        </div>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {/* Externals inline from lg; below that they live in the ⋯ menu. */}
          {externals.map((link) => (
            <ExternalAnchor
              key={link.key}
              href={link.href}
              onClick={() => trackNavClick("external", link.href)}
              className="max-lg:hidden inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
            >
              {link.label}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </ExternalAnchor>
          ))}

          {children && <div className="shrink-0">{children}</div>}

          <div
            className="relative"
            onMouseEnter={() =>
              openMenu && !moreOpen && setOpenMenu("__more__")
            }
          >
            <button
              type="button"
              aria-label={t("nav.more", { fallback: "More" })}
              aria-expanded={moreOpen}
              onClick={() => setOpenMenu(moreOpen ? null : "__more__")}
              className={tabClass(false, moreOpen)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <div
              className={cn(menuPanel, "right-0 w-56", !moreOpen && "hidden")}
            >
              {externals.length > 0 && (
                <div className="lg:hidden border-b border-neutral-800 mb-1 pb-1">
                  {externals.map((link) => renderMenuLink("external", link))}
                </div>
              )}
              {promoBadges}
              {socialLinks}
              <div className="border-t border-neutral-800 my-1" />
              {legalLinks}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile (< md): one menu button → sheet with the same groups */}
      <div ref={mobileRef} className="md:hidden relative min-w-0">
        {(() => {
          const active = groups.find(isGroupActive);
          const activeLink = active?.items?.find(isLinkActive);
          const label =
            activeLink && !activeLink.exact
              ? activeLink.label
              : (active?.label ?? groups[0]?.label);
          return (
            <button
              type="button"
              aria-expanded={sheetOpen}
              aria-label={t("nav.menu", { fallback: "Menu" })}
              onClick={() => setSheetOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors max-w-[180px] min-w-0 w-full",
                sheetOpen
                  ? "border-amber-800/50 bg-amber-900/20 text-amber-400"
                  : "border-neutral-700 bg-zinc-900 text-foreground hover:border-neutral-600",
              )}
            >
              {sheetOpen ? (
                <X className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Menu className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </button>
          );
        })()}
      </div>

      {sheetOpen && (
        <div
          ref={sheetRef}
          className="md:hidden fixed left-0 right-0 top-[54px] font-medium max-h-[calc(100dvh-54px)] overflow-y-auto border-b border-neutral-700 bg-zinc-950 shadow-2xl z-50 py-2"
        >
          {groups.map((group) =>
            group.link ? (
              renderMenuLink(group.id, group.link, "text-base font-medium")
            ) : (
              <details
                key={`${group.id}:${group.label}`}
                open={isGroupActive(group) || (group.items?.length ?? 0) <= 6}
                className="group/details"
              >
                <summary
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-base font-medium cursor-pointer list-none [&::-webkit-details-marker]:hidden",
                    isGroupActive(group) ? "text-amber-400" : "text-foreground",
                  )}
                >
                  {group.label}
                  <ChevronDown className="w-4 h-4 opacity-60 transition-transform group-open/details:rotate-180" />
                </summary>
                <div className="pl-3 border-l border-neutral-800 ml-3 mb-1">
                  {group.items?.map((link) => renderMenuLink(group.id, link))}
                </div>
              </details>
            ),
          )}

          {externals.length > 0 && (
            <>
              <div className="border-t border-neutral-800 my-1" />
              {externals.map((link) => renderMenuLink("external", link))}
            </>
          )}

          {(childrenDropdown ?? children) && (
            <>
              <div className="border-t border-neutral-800 my-1" />
              {/* Up to 16 languages — collapsed so they don't bury the rest. */}
              <details className="group/details">
                <summary className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="w-4 h-4 opacity-60" />
                    {t("nav.language", { fallback: "Language" })}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60 transition-transform group-open/details:rotate-180" />
                </summary>
                <div className="px-2 py-1">{childrenDropdown ?? children}</div>
              </details>
            </>
          )}

          {promoBadges}
          <div className="border-t border-neutral-800 my-1" />
          {socialLinks}
          {legalLinks}
        </div>
      )}
    </>
  );
}
