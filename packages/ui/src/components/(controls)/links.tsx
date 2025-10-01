"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ReleaseNotesLink,
  ExternalAnchor,
  NavMenu,
  HeaderLink,
} from "@repo/ui/header";
import { ExternalLink } from "lucide-react";
import { AppConfig, localizePath } from "@repo/lib";
import { NavIcon } from "../(content)";
import { useMemo } from "react";
import { Badge } from "../ui/badge";
import { useI18n } from "../(providers)";

const HOME_INTERNAL_LINK = {
  href: "/",
  title: "home.title",
  description: "home.description",
  iconName: "House",
} as const;

const DEFAULT_INTERNAL_LINKS = [
  {
    href: "/",
    title: "defaultMap.title",
    description: "defaultMap.description",
    iconName: "Map",
  },
] as const;

export function Links({
  appConfig,
  hideReleaseNotes,
  children,
}: {
  appConfig: AppConfig;
  hideReleaseNotes?: boolean;
  children?: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const { locale, t } = useI18n();

  const internalLinks = useMemo(() => {
    const list = appConfig.internalLinks ?? DEFAULT_INTERNAL_LINKS;
    const hasHome = list.some((l) => l.href === HOME_INTERNAL_LINK.href);
    return hasHome ? list : [HOME_INTERNAL_LINK, ...list];
  }, [appConfig.internalLinks]);

  const links = internalLinks.map((l) => {
    const localizedHref = localizePath(l.href, locale);
    const isHome = l.href === "/";
    const isExactMatch = isHome
      ? pathname === "/" || pathname === `/${locale}`
      : pathname === localizedHref;

    const isNestedMatch = !isHome && pathname.startsWith(localizedHref + "/");

    return {
      href: localizedHref,
      isActive: isExactMatch || isNestedMatch,
      content: (
        <HeaderLink active={isExactMatch || isNestedMatch}>
          <div>
            <NavIcon iconName={l.iconName} className="w-4 h-4" />
            <span>{t(l.title)}</span>
          </div>
        </HeaderLink>
      ),
    };
  });

  const active = links.find((link) => link.isActive) ?? links[0];

  return (
    <NavMenu
      active={active.content}
      external={
        <>
          {appConfig.appUrl && (
            <ExternalAnchor
              className="flex gap-1 hover:text-primary transition-colors"
              href={appConfig.appUrl}
            >
              <span>{t("links.inGameApp")}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          )}

          {appConfig.promoLinks?.map(({ href, title }) => (
            <Link key={href} href={localizePath(href, locale)}>
              <Badge>{t(title)}</Badge>
            </Link>
          ))}

          {appConfig.externalLinks?.map(({ href, title }) => (
            <ExternalAnchor
              key={href}
              className="flex gap-1 hover:text-primary transition-colors"
              href={href}
            >
              <span>{t(title)}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          ))}

          {!hideReleaseNotes && (
            <ReleaseNotesLink
              href={`https://www.th.gl/apps/${appConfig.name}`}
            />
          )}

          {children}
        </>
      }
    >
      {internalLinks.map((l) => (
        <Link
          key={l.href}
          href={localizePath(l.href, locale)}
          className="flex h-full w-full select-none flex-col justify-end rounded-md hover:bg-gradient-to-b from-muted/50 to-muted p-4 space-y-1 no-underline outline-none focus:shadow-md"
        >
          <div className="flex items-center uppercase truncate">
            <NavIcon
              iconName={l.iconName}
              className="inline-block h-4 w-4 mr-2"
            />
            <span className="truncate">{t(l.title)}</span>
          </div>
          {l.description && (
            <p className="text-sm leading-tight text-muted-foreground">
              {t(l.description)}
            </p>
          )}
        </Link>
      ))}
    </NavMenu>
  );
}
