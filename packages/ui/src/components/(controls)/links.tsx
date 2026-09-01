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
import { ExternalLink, MoreHorizontal, ChevronsUpDown } from "lucide-react";
import { AppConfig, localizePath, cn } from "@repo/lib";
import { Badge } from "../ui/badge";
import { usePreviewReleaseGate } from "../(apps)/preview-release-guard";
import { useI18n } from "../(providers)";
import { ScriptLoader } from "../(ads)";
import ConsentLink from "../(ads)/consent-link";

const NAV_BEFORE = [
  { href: "/", title: "home.title" },
  { href: "/maps", title: "interactive_map" },
] as const;

const NAV_AFTER = [
  { href: "/guides", title: "config.internalLinks.guides.title" },
] as const;

type MeasuredItem = {
  key: string;
  label: string;
  href: string;
  isActive: boolean;
  isExternal?: boolean;
  isLocale?: boolean;
  isHome?: boolean;
};

export function Links({
  appConfig,
  hasMap,
  hasGuides = true,
  children,
  childrenDropdown,
}: {
  appConfig: AppConfig;
  /** Whether the game has any maps (derived from version.data.tiles in the layout). */
  hasMap: boolean;
  /**
   * Whether the /guides section exists. Defaults to true (map games).
   * Database-only deployments (e.g. homm-olden-era) set this to false so
   * the "All Guides" link is hidden from the header.
   */
  hasGuides?: boolean;
  children?: React.ReactNode;
  childrenDropdown?: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname() ?? "/";
  const { locale, t } = useI18n();
  // Elite-only (previewOnly) links stay hidden from the nav until access resolves.
  const previewGate = usePreviewReleaseGate();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  // Force re-render after hydration to fix active state mismatch
  const [, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isItemActive = (item: MeasuredItem) => {
    if (item.isExternal || item.isLocale) return false;
    return item.isHome
      ? pathname === "/" || pathname === `/${locale}`
      : pathname.startsWith(item.href);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Build nav items
  const navItems = useMemo(() => {
    const appLinks =
      appConfig.internalLinks?.filter(
        (l) =>
          l.href !== "/" &&
          !l.href.startsWith("/maps") &&
          !l.href.startsWith("/guides") &&
          // Hide Elite-only links unless preview access is granted.
          (!l.previewOnly || previewGate === "allow"),
      ) ?? [];

    const before = NAV_BEFORE.filter(
      (l) => l.href === "/" || (l.href === "/maps" && hasMap),
    );
    const after = hasGuides ? [...NAV_AFTER] : [];

    // DB sections come before guides so "All Guides" is always last
    const allLinks = [...before, ...appLinks];

    const items = allLinks.map((l): MeasuredItem => {
      const href = localizePath(l.href, locale);
      return {
        key: href,
        href,
        label: t(l.title),
        isActive: false,
        isHome: l.href === "/",
      };
    });

    // Data-driven sections: opt-in, append every DB section not already linked
    // above (de-duped by href). Keeps the nav in sync with `db.homeSections`
    // without hand-curating each one in `internalLinks`.
    if (appConfig.db?.sectionsInNav) {
      const seen = new Set([...allLinks, ...after].map((l) => l.href));
      for (const section of appConfig.db.homeSections) {
        if (seen.has(section.href)) continue;
        seen.add(section.href);
        const label =
          appConfig.db.typeLabels?.[section.type] ??
          (section.titleKey ? t(section.titleKey) : undefined) ??
          section.titleFallback ??
          section.type;
        items.push({
          key: localizePath(section.href, locale),
          href: localizePath(section.href, locale),
          label,
          isActive: false,
        });
      }
    }

    // Guides always last
    for (const l of after) {
      items.push({
        key: localizePath(l.href, locale),
        href: localizePath(l.href, locale),
        label: t(l.title),
        isActive: false,
      });
    }

    return items;
  }, [
    appConfig.internalLinks,
    appConfig.db,
    hasMap,
    hasGuides,
    locale,
    t,
    previewGate,
  ]);

  // Build external items: In-Game App first (most important), then partner links, then locale last
  const externalItems = useMemo(() => {
    const items: MeasuredItem[] = [];
    if (appConfig.appUrl) {
      items.push({
        key: appConfig.appUrl,
        href: appConfig.appUrl,
        label: t("links.inGameApp"),
        isActive: false,
        isExternal: true,
      });
    }
    for (const { href, title } of appConfig.externalLinks ?? []) {
      items.push({
        key: href,
        href,
        label: t(title),
        isActive: false,
        isExternal: true,
      });
    }
    if (children) {
      items.push({
        key: "__locale__",
        href: "",
        label: "English",
        isActive: false,
        isLocale: true,
      });
    }
    return items;
  }, [appConfig.externalLinks, appConfig.appUrl, children, t]);

  // All items: nav first, then externals.
  // Measurement goes left-to-right. When items don't fit, externals (at end) overflow first.
  const allItems = useMemo(
    () => [...navItems, ...externalItems],
    [navItems, externalItems],
  );
  const navCount = navItems.length;

  // Measure how many items fit
  useEffect(() => {
    function measure() {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const measuredChildren = measureRef.current.children;
      let total = 0;
      let count = 0;
      const moreButtonWidth = 40;

      for (let i = 0; i < measuredChildren.length; i++) {
        const childWidth = (measuredChildren[i] as HTMLElement).offsetWidth + 4;
        if (total + childWidth + moreButtonWidth > containerWidth) break;
        total += childWidth;
        count++;
      }
      setVisibleCount(Math.max(1, count));
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!overflowOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !mobileMenuRef.current?.contains(target)
      ) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [overflowOpen]);

  // Close when navigating
  useEffect(() => {
    setOverflowOpen(false);
  }, [pathname]);

  // Split visible vs overflow
  const visibleItems = allItems.slice(0, visibleCount);
  const overflowItems = allItems.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0;
  const overflowHasActive = overflowItems.some((item) => isItemActive(item));

  // Check which externals are visible vs overflowed
  const visibleExternals = visibleItems.filter(
    (i) => i.isExternal || i.isLocale,
  );
  const overflowedExternals = overflowItems.filter(
    (i) => i.isExternal || i.isLocale,
  );
  const visibleNavItems = visibleItems.filter(
    (i) => !i.isExternal && !i.isLocale,
  );
  const overflowedNavItems = overflowItems.filter(
    (i) => !i.isExternal && !i.isLocale,
  );

  const legalFooter = (
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
    </>
  );

  const renderInlineItem = (item: MeasuredItem) => {
    if (item.isLocale) {
      return (
        <div key={item.key} className="order-2">
          {children}
        </div>
      );
    }
    if (item.isExternal) {
      return (
        <ExternalAnchor
          key={item.key}
          className="order-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
          href={item.href}
        >
          {item.label}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </ExternalAnchor>
      );
    }
    return (
      <Link
        key={item.key}
        href={item.href}
        className={cn(
          "order-1 text-xs px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap",
          isItemActive(item)
            ? "bg-amber-900/30 text-amber-400"
            : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
        )}
      >
        {item.label}
      </Link>
    );
  };

  const renderDropdownItem = (item: MeasuredItem) => {
    if (item.isLocale) {
      return (
        <div key={item.key} className="px-1 py-1">
          {childrenDropdown ?? children}
        </div>
      );
    }
    if (item.isExternal) {
      return (
        <ExternalAnchor
          key={item.key}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
          href={item.href}
        >
          {item.label}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </ExternalAnchor>
      );
    }
    return (
      <Link
        key={item.key}
        href={item.href}
        className={cn(
          "block px-3 py-2 text-sm transition-colors",
          isItemActive(item)
            ? "text-amber-400 bg-amber-900/20"
            : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
        )}
      >
        {item.label}
      </Link>
    );
  };

  const dropdownContent = (showAll = false, alignLeft = false) => {
    // In showAll mode (mobile), show everything. Otherwise show only overflowed items.
    const navToShow = showAll ? navItems : overflowedNavItems;
    const extToShow = showAll ? externalItems : overflowedExternals;

    return (
      <div
        className={cn(
          "absolute top-full mt-1 w-52 max-h-[min(70vh,600px)] overflow-y-auto rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-50 py-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent",
          alignLeft ? "left-0" : "right-0",
        )}
      >
        {navToShow.map(renderDropdownItem)}

        {extToShow.length > 0 && (
          <>
            {navToShow.length > 0 && (
              <div className="border-t border-neutral-800 my-1" />
            )}
            {extToShow.map(renderDropdownItem)}
          </>
        )}

        {/* Promo links */}
        {!!appConfig.promoLinks?.length && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2">
            {appConfig.promoLinks.map(({ href, title }) => (
              <Link key={href} href={localizePath(href, locale)}>
                <Badge>{t(title)}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Social icons */}
        <div className="border-t border-neutral-800 my-1" />
        <div className="flex items-center justify-center gap-1.5 px-3 py-2">
          <ExternalAnchor
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
            href="https://th.gl/discord"
            title="Discord"
          >
            <DiscordIcon size={14} className="opacity-70" />
          </ExternalAnchor>
          <ExternalAnchor
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
            href="https://github.com/The-Hidden-Gaming-Lair"
            title="GitHub"
          >
            <GitHubIcon size={14} className="opacity-70" />
          </ExternalAnchor>
          <ExternalAnchor
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
            href="https://www.reddit.com/r/TheHiddenGamingLair/"
            title="Reddit"
          >
            <RedditIcon size={14} className="opacity-70" />
          </ExternalAnchor>
        </div>

        <div className="border-t border-neutral-800 my-1" />
        {legalFooter}
        <ScriptLoader>
          <ConsentLink />
        </ScriptLoader>
      </div>
    );
  };

  return (
    <>
      {/* Hidden measurer — nav items then external items */}
      <div
        ref={measureRef}
        className="flex items-center gap-1 absolute left-[-9999px] opacity-0 pointer-events-none"
        aria-hidden
      >
        {allItems.map((item) => (
          <span
            key={item.key}
            className={cn(
              "text-xs px-2.5 py-1.5 whitespace-nowrap",
              item.isExternal &&
                "font-medium px-2.5 py-1.5 border border-transparent",
            )}
          >
            {item.label}
            {item.isExternal ? " ↗" : ""}
          </span>
        ))}
      </div>

      {/* Mobile: page switcher */}
      <div className="sm:hidden relative" ref={mobileMenuRef}>
        {(() => {
          const activeNav = navItems.find(isItemActive);
          const activeLabel = activeNav?.label ?? navItems[0]?.label ?? "";
          return (
            <button
              onClick={() => setOverflowOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors max-w-[160px]",
                overflowOpen
                  ? "border-amber-800/50 bg-amber-900/20 text-amber-400"
                  : "border-neutral-700 bg-zinc-900 text-foreground hover:border-neutral-600",
              )}
            >
              <span className="truncate">{activeLabel}</span>
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </button>
          );
        })()}
        {overflowOpen && dropdownContent(true, true)}
      </div>

      {/* Desktop: inline items with CSS order (nav=1, externals=2, more=3) */}
      <div
        ref={containerRef}
        className="flex-1 hidden sm:flex items-center gap-1 min-w-0 flex-wrap-reverse"
        style={{ flexWrap: "nowrap" }}
      >
        {visibleItems.map(renderInlineItem)}

        {/* More/overflow button — always visible, order-3 pushes it between nav and externals visually */}
        <div ref={menuRef} className="relative order-3">
          <button
            onClick={() => setOverflowOpen((v) => !v)}
            aria-label="More navigation links"
            className={cn(
              "text-xs px-2 py-1.5 rounded-md transition-colors",
              overflowHasActive
                ? "bg-amber-900/30 text-amber-400"
                : overflowOpen
                  ? "bg-zinc-800 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {overflowOpen && dropdownContent(false)}
        </div>
      </div>
    </>
  );
}
