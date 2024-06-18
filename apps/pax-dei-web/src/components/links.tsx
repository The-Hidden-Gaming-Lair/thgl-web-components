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
import { ExternalLink, Handshake } from "lucide-react";

export function Links(): JSX.Element {
  const pathname = usePathname();

  const links = [
    { href: "/", content: <InteractiveMapLink active={pathname === "/"} /> },
    {
      href: "/market",
      content: (
        <HeaderLink active={pathname === "/market"}>
          <div>
            <Handshake className="w-4 h-4" />
            <span>Market</span>
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
            href="https://paxdei.gaming.tools?ref=thgl"
          >
            <span>Database</span>
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
          <ReleaseNotesLink href="https://www.th.gl/apps/Pax%20Dei/release-notes" />
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
