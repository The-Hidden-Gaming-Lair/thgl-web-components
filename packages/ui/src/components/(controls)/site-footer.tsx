"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import type { AppConfig, GuideNavLink } from "@repo/lib";
import { ExternalAnchor } from "../(header)";
import { useI18n } from "../(providers)";
import { ScriptLoader } from "../(ads)";
import ConsentLink from "../(ads)/consent-link";
import { useNavGroups } from "./links";

/**
 * Footer for every game page except the full-screen map: the same groups as
 * the header nav (maps, database sections, guides, tools) as plain links, plus
 * the legal links that used to live only in the header's "⋯" menu. Database
 * and guide pages are where most search visitors land, and without this they
 * had no route onward except the header menus.
 */
export function SiteFooter({
  appConfig,
  hasMap,
  hasGuides = true,
  guideLinks,
}: {
  appConfig: AppConfig;
  hasMap: boolean;
  hasGuides?: boolean;
  guideLinks?: GuideNavLink[];
}): JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();
  const groups = useNavGroups({ appConfig, hasMap, hasGuides, guideLinks });

  // The interactive map fills the viewport — a footer would only add a scrollbar.
  if (/^\/(?:[a-zA-Z-]+\/)?maps\/[^/]+/.test(pathname)) return null;

  const columns = groups.filter((g) => g.id !== "home");
  // Single links (Guides, a lone tool, a map-only game's map) share one column.
  const singles = columns.filter((g) => g.link).map((g) => g.link!);
  const menus = columns.filter((g) => g.items?.length);

  const linkClass =
    "block py-0.5 text-muted-foreground hover:text-foreground transition-colors truncate";

  return (
    <footer className="mt-12 border-t border-neutral-800 bg-zinc-950/60 text-xs">
      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {menus.map((group) => (
          <div key={`${group.id}:${group.label}`} className="min-w-0">
            <div className="mb-2 font-semibold text-foreground">
              {group.label}
            </div>
            {group.items!.slice(0, 12).map((link) =>
              link.external ? (
                <ExternalAnchor
                  key={link.key}
                  href={link.href}
                  className={linkClass}
                >
                  {link.label}
                </ExternalAnchor>
              ) : (
                <Link key={link.key} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ),
            )}
            {group.items!.length > 12 && group.items![0].exact && (
              <Link
                href={group.items![0].href}
                className={`${linkClass} text-amber-400/80`}
              >
                {group.items![0].label} →
              </Link>
            )}
          </div>
        ))}
        {singles.length > 0 && (
          <div className="min-w-0">
            <div className="mb-2 font-semibold text-foreground">
              {appConfig.title}
            </div>
            {singles.map((link) =>
              link.external ? (
                <ExternalAnchor
                  key={link.key}
                  href={link.href}
                  className={linkClass}
                >
                  {link.label}
                </ExternalAnchor>
              ) : (
                <Link key={link.key} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ),
            )}
          </div>
        )}
      </div>
      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <a href="https://www.th.gl" className="hover:text-foreground">
            The Hidden Gaming Lair
          </a>
          <ExternalAnchor
            href="https://www.th.gl/legal-notice"
            className="hover:text-foreground"
          >
            {t("legal_notice")}
          </ExternalAnchor>
          <ExternalAnchor
            href="https://www.th.gl/privacy-policy"
            className="hover:text-foreground"
          >
            {t("privacy_policy")}
          </ExternalAnchor>
          <ExternalAnchor
            href="https://www.th.gl/developers"
            className="hover:text-foreground"
          >
            {t("footer.embeds", { fallback: "Embeds & Tooltips" })}
          </ExternalAnchor>
          <div className="[&>button]:inline [&>button]:w-auto [&>button]:p-0 [&>button]:hover:bg-transparent">
            <ScriptLoader>
              <ConsentLink />
            </ScriptLoader>
          </div>
        </div>
      </div>
    </footer>
  );
}
