"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { NavIcon } from "./nav-icon";
import { cn, IconName, localizePath } from "@repo/lib";
import { useLocale, useT } from "../(providers)";

export type NavCardProps = {
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  bgImage?: string;
  iconName: IconName;
};

export function NavCard({
  title,
  description,
  href = "/",
  linkText = "links.learnMore",
  bgImage,
  iconName,
}: NavCardProps) {
  const t = useT();
  const locale = useLocale();
  return (
    <Link
      href={localizePath(href, locale)}
      className={cn("block", { "min-h-[200px]": bgImage })}
    >
      <Card className="h-full w-full hover:border-primary transition-colors relative text-left overflow-hidden flex flex-col bg-gradient-to-b from-muted/50 to-black">
        <CardHeader className="relative z-10 grow p-0">
          <CardTitle className="bg-black/75 border-black px-2 py-2 flex justify-center items-center uppercase truncate text-md">
            <NavIcon
              iconName={iconName}
              className="inline-block h-4 w-4 mr-2"
            />
            <span>{t(title)}</span>
          </CardTitle>

          {bgImage ? (
            <CardDescription className="grow h-[220px] w-[330px]">
              <Image
                src={bgImage}
                alt=""
                width={330}
                height={220}
                className="object-contain h-full w-full"
              />
            </CardDescription>
          ) : description ? (
            <CardDescription className="p-2 text-secondary-foreground text-md">
              {t(description)}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardFooter className="px-2 py-1 text-sm relative z-10 text-muted-foreground">
          {t(linkText)} →
        </CardFooter>
      </Card>
    </Link>
  );
}
