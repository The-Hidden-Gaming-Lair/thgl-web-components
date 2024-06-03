"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HeaderLink,
  InteractiveMapLink,
  NavMenu,
  ReleaseNotesLink,
} from "@repo/ui/header";
import { ArrowUp, Bug } from "lucide-react";

export function Links(): JSX.Element {
  const pathname = usePathname();

  const links = [
    { href: "/", content: <InteractiveMapLink active={pathname === "/"} /> },
    {
      href: "/mod-locations",
      content: (
        <HeaderLink active={pathname === "/mod-locations"}>
          <div>
            <ArrowUp className="w-4 h-4" />
            <span>Mod Locations</span>
          </div>
        </HeaderLink>
      ),
    },
    {
      href: "/deviant-locations",
      content: (
        <HeaderLink active={pathname === "/deviant-locations"}>
          <div>
            <Bug className="w-4 h-4" />
            <span>Deviant Locations</span>
          </div>
        </HeaderLink>
      ),
    },
  ];
  const active = links.find((link) => link.href === pathname) ?? links[0];

  return (
    <NavMenu
      breakpoint="lg"
      active={active.content}
      external={
        <ReleaseNotesLink href="https://www.th.gl/apps/Once Human/release-notes" />
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
