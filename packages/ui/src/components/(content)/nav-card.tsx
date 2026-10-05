"use client";

import Link from "next/link";
import Image from "next/image";
import { NavIcon } from "./nav-icon";
import { IconName, localizePath } from "@repo/lib";
import { useLocale, useT } from "../(providers)";

export type NavCardProps = {
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  bgImage?: string;
  iconName: IconName;
};

// Shared tools look the same in every game, so their banner art is shared too.
// A config's own `bgImage` still wins.
const TOOL_IMAGES: Record<string, string> = {
  "/activities-tracker": "/games/thgl-web/tools/activities-tracker.webp",
  "/crafting": "/games/thgl-web/tools/crafting.webp",
  "/checklist": "/games/thgl-web/tools/checklist.webp",
};

export function getNavCardImage(card: NavCardProps): string | undefined {
  return card.bgImage ?? (card.href ? TOOL_IMAGES[card.href] : undefined);
}

export function NavCard(card: NavCardProps) {
  const {
    title,
    description,
    href = "/",
    linkText = "links.learnMore",
    iconName,
  } = card;
  const t = useT();
  const locale = useLocale();
  const image = getNavCardImage(card);
  const external = /^https?:\/\//.test(href);

  return (
    <Link
      href={external ? href : localizePath(href, locale)}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-800 text-left transition-colors hover:border-primary"
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-linear-to-br from-slate-900 to-black">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <NavIcon
            iconName={iconName}
            className="absolute inset-0 m-auto h-14 w-14 text-slate-700 transition-colors group-hover:text-primary/60"
          />
        )}
      </div>
      <div className="flex grow flex-col gap-1 p-4">
        <h3 className="flex items-center gap-2 font-semibold transition-colors group-hover:text-primary">
          <NavIcon iconName={iconName} className="h-4 w-4 shrink-0" />
          <span className="truncate">{t(title)}</span>
        </h3>
        {description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {t(description)}
          </p>
        )}
        <span className="mt-auto pt-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
          {t(linkText)} →
        </span>
      </div>
    </Link>
  );
}
