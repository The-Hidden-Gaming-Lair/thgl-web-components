"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../(data)";
import { Button } from "../ui/button";
import { Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/lib";
import { LOCALE_LABELS } from "./locale-labels";

export function LocaleSwitcher({
  locales,
  current,
  defaultLocale = "en",
}: {
  locales: string[];
  current: string;
  defaultLocale?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSegments = pathname.split("/").filter(Boolean);
  const currentIsLocale = locales.includes(currentSegments[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
        >
          <Globe className="h-3 w-3 opacity-50" />
          {LOCALE_LABELS[current] ?? current}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => {
          const segments = [...currentSegments];

          if (currentIsLocale) {
            // Replace or remove the locale segment
            if (locale === defaultLocale) {
              segments.shift(); // Remove locale for default
            } else {
              segments[0] = locale;
            }
          } else {
            // Only add locale prefix for non-default locales
            if (locale !== defaultLocale) {
              segments.unshift(locale);
            }
          }

          const href =
            "/" +
            segments.join("/") +
            (searchParams.size ? `?${searchParams}` : "");

          const isActive = locale === current;
          return (
            <DropdownMenuItem key={locale} asChild>
              <Link
                href={href}
                className={cn(isActive && "font-medium text-primary")}
              >
                {LOCALE_LABELS[locale] ?? locale}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Flat list of locale links for embedding in an existing dropdown/menu */
export function LocaleSwitcherInline({
  locales,
  current,
  defaultLocale = "en",
}: {
  locales: string[];
  current: string;
  defaultLocale?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSegments = pathname.split("/").filter(Boolean);
  const currentIsLocale = locales.includes(currentSegments[0]);

  return (
    <>
      {locales.map((locale) => {
        const segments = [...currentSegments];
        if (currentIsLocale) {
          if (locale === defaultLocale) {
            segments.shift();
          } else {
            segments[0] = locale;
          }
        } else {
          if (locale !== defaultLocale) {
            segments.unshift(locale);
          }
        }
        const href =
          "/" +
          segments.join("/") +
          (searchParams.size ? `?${searchParams}` : "");
        const isActive = locale === current;
        return (
          <Link
            key={locale}
            href={href}
            className={cn(
              "block px-3 py-1.5 text-sm transition-colors rounded-sm",
              isActive
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            {LOCALE_LABELS[locale] ?? locale}
          </Link>
        );
      })}
    </>
  );
}
