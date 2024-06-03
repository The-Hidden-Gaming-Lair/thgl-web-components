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
      breakpoint="md"
      active={active.content}
      external={
        <>
          <ExternalAnchor
            className="flex gap-1 hover:text-primary transition-colors"
            href="https://www.overwolf.com/oneapp/Leon_Machens-Palworld-Interactive-map"
          >
            <span>In-Game App</span>
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
          <ExternalAnchor
            className="flex gap-1 hover:text-primary transition-colors"
            href="https://gaming.tools/palworld/en?ref=thgl"
          >
            <span>Database</span>
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
          <ReleaseNotesLink href="https://www.th.gl/apps/Palworld/release-notes" />
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
