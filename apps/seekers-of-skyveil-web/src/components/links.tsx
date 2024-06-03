"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ReleaseNotesLink,
  InteractiveMapLink,
  ExternalAnchor,
  NavMenu,
} from "@repo/ui/header";
import { ExternalLink } from "lucide-react";

export function Links(): JSX.Element {
  const pathname = usePathname();

  const links = [
    { href: "/", content: <InteractiveMapLink active={pathname === "/"} /> },
  ];
  const active = links.find((link) => link.href === pathname) ?? links[0];

  return (
    <NavMenu
      breakpoint="sm"
      active={active.content}
      external={
        <>
          <ExternalAnchor
            className="flex gap-1 hover:text-primary transition-colors"
            href="https://seekers.gaming.tools?ref=thgl"
          >
            <span>Database</span>
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
          <ReleaseNotesLink href="https://www.th.gl/apps/Seekers%20of%20Skyveil/release-notes" />
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
