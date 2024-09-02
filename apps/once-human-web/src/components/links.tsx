"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ExternalAnchor,
  HeaderLink,
  InteractiveMapLink,
  NavMenu,
  ReleaseNotesLink,
} from "@repo/ui/header";
import { ArrowUp, Bug, ExternalLink, NotepadText } from "lucide-react";

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
    {
      href: "/remnants",
      content: (
        <HeaderLink active={pathname === "/remnants"}>
          <div>
            <NotepadText className="w-4 h-4" />
            <span>Remnants</span>
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
        <>
          <ExternalAnchor
            className="flex gap-1 hover:text-primary transition-colors"
            href="https://www.overwolf.com/app/Leon_Machens-Once_Human_Map"
          >
            <span>In-Game App</span>
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
          <ReleaseNotesLink href="https://www.th.gl/apps/Once Human/release-notes" />
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
