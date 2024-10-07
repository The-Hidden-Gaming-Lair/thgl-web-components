"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ReleaseNotesLink,
  InteractiveMapLink,
  ExternalAnchor,
  NavMenu,
  HeaderLink,
} from "@repo/ui/header";
import { ExternalLink, Gift, MapPin } from "lucide-react";

export function Links(): JSX.Element {
  const pathname = usePathname();

  const links = [
    { href: "/", content: <InteractiveMapLink active={pathname === "/"} /> },
    {
      href: "/weekly-wants",
      content: (
        <HeaderLink active={pathname === "/mod-locations"}>
          <div>
            <Gift className="w-4 h-4" />
            <span>Weekly Wants</span>
          </div>
        </HeaderLink>
      ),
    },
    {
      href: "/rummage-pile",
      content: (
        <HeaderLink active={pathname === "/rummage-pile"}>
          <div>
            <MapPin className="w-4 h-4" />
            <span>Rummage Pile</span>
          </div>
        </HeaderLink>
      ),
    },
  ];
  const active = links.find((link) => link.href === pathname) ?? links[0];

  return (
    <NavMenu
      active={active.content}
      external={
        <>
          <ExternalAnchor
            className="flex gap-1 hover:text-primary transition-colors"
            href="https://www.overwolf.com/app/Leon_Machens-Palia_Map"
          >
            <span>In-Game App</span>
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
          <ReleaseNotesLink href="https://www.th.gl/apps/Palia%20Map/release-notes" />
        </>
      }
    >
      {links.map(({ href, content }) => (
        <Link key={href} href={href}>
          {content}
        </Link>
      ))}
    </NavMenu>
  );
}
