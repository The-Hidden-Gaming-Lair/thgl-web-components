"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ReleaseNotesLink,
  InteractiveMapLink,
  NavMenu,
  HeaderLink,
} from "@repo/ui/header";
import { Bot, House, Server } from "lucide-react";

export function Links(): JSX.Element {
  const pathname = usePathname();

  const links = [
    { href: "/", content: <InteractiveMapLink active={pathname === "/"} /> },
    {
      href: "/units",
      content: (
        <HeaderLink active={pathname === "/units"}>
          <div>
            <Bot className="w-4 h-4" />
            <span>Units</span>
          </div>
        </HeaderLink>
      ),
    },
    {
      href: "/structures",
      content: (
        <HeaderLink active={pathname === "/structures"}>
          <div>
            <House className="w-4 h-4" />
            <span>Structures</span>
          </div>
        </HeaderLink>
      ),
    },
    {
      href: "/server-status",
      content: (
        <HeaderLink active={pathname === "/server-status"}>
          <div>
            <Server className="w-4 h-4" />
            <span>Server Status</span>
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
        <ReleaseNotesLink href="https://www.th.gl/apps/Stormgate/release-notes" />
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
