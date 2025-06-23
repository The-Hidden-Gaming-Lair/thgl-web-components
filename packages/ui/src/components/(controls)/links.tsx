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
import { AppConfig } from "@repo/lib";
import { NavIcon } from "../(content)";
import { useMemo } from "react";

const HOME_INTERNAL_LINK = {
  href: "/",
  title: "Home",
  description: "Return to the home page.",
  iconName: "House",
} as const;

const DEFAULT_INTERNAL_LINKS = [
  {
    href: "/",
    title: "Interactive Map",
    description: "Explore the Interactive Maps.",
    iconName: "Map",
  },
] as const;

export function Links({
  appConfig,
  hideReleaseNotes,
}: {
  appConfig: AppConfig;
  hideReleaseNotes?: boolean;
}): JSX.Element {
  const pathname = usePathname();

  const internalLinks = useMemo(() => {
    let internalLinks;
    if (appConfig.internalLinks) {
      if (
        !appConfig.internalLinks.some((l) => l.href === HOME_INTERNAL_LINK.href)
      ) {
        internalLinks = [HOME_INTERNAL_LINK, ...appConfig.internalLinks];
      } else {
        internalLinks = appConfig.internalLinks;
      }
    } else {
      internalLinks = DEFAULT_INTERNAL_LINKS;
    }
    return internalLinks;
  }, [appConfig.internalLinks]);

  const links = internalLinks.map((l) => ({
    href: l.href,
    content: (
      <HeaderLink active={pathname === l.href}>
        <div>
          <NavIcon iconName={l.iconName} className="w-4 h-4" />
          <span>{l.title}</span>
        </div>
      </HeaderLink>
    ),
  }));
  const active =
    links.find(
      (link) =>
        link.href === pathname ||
        (link.href !== "/" && pathname.startsWith(link.href)),
    ) ?? links[0];

  return (
    <NavMenu
      active={active.content}
      external={
        <>
          {appConfig.appUrl ? (
            <ExternalAnchor
              className="flex gap-1 hover:text-primary transition-colors"
              href={appConfig.appUrl}
            >
              <span>In-Game App</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          ) : null}
          {appConfig.externalLinks?.map(({ href, title }) => (
            <ExternalAnchor
              key={href}
              className="flex gap-1 hover:text-primary transition-colors"
              href={href}
            >
              <span>{title}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          ))}
          {!hideReleaseNotes && (
            <ReleaseNotesLink
              href={`https://www.th.gl/apps/${appConfig.name}`}
            />
          )}
        </>
      }
    >
      {internalLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex h-full w-full select-none flex-col justify-end rounded-md hover:bg-gradient-to-b from-muted/50 to-muted p-4 space-y-1 no-underline outline-none focus:shadow-md"
        >
          <div className="flex items-center uppercase truncate">
            <NavIcon
              iconName={l.iconName}
              className="inline-block h-4 w-4 mr-2"
            />
            <span>{l.title}</span>
          </div>
          <p className="text-sm leading-tight text-muted-foreground">
            {l.description}
          </p>
        </Link>
      ))}
    </NavMenu>
  );
}
