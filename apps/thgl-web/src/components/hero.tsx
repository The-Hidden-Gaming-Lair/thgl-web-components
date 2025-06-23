"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { games } from "@repo/lib";
import { faqEntries } from "@/lib/faq-entries";
import { blogEntries } from "@/lib/blog-entries";

const titles: Record<string, string> = {
  "/": "The Hidden Gaming Lair",
  "/apps": "Gaming Apps & Tools",
  "/blog": "Blog",
  "/faq": "FAQ",
  "/companion-app": "Companion App",
  "/support-me": "Support Me",
  "/support-me/account": "Thank you!",
  "/partner-program": "Partner Program",
  "/advertise": "Advertise",
  "/legal-notice": "Legal Notice",
  "/privacy-policy": "Privacy Policy",
};

games.forEach((game) => {
  titles[`/apps/${game.id}`] = game.title;
});

faqEntries.forEach((entry) => {
  titles[`/faq/${entry.id}`] = entry.headline;
});

blogEntries.forEach((entry) => {
  titles[`/blog/${entry.id}`] = entry.headline;
});

export function Hero(): JSX.Element {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState<string>(pathname);

  const isNewPathname = pathname !== prevPathname;
  const prevTitle = titles[prevPathname] ?? titles["/"];
  const title = titles[pathname] ?? titles["/"];

  useEffect(() => {
    if (isNewPathname) {
      if (!prevTitle) {
        setPrevPathname(pathname);
      } else {
        const timeoutId = setTimeout(() => {
          setPrevPathname(pathname);
        }, 1000);
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewPathname]);

  return (
    <div className="w-full overflow-hidden mx-auto border-x border-[#1d1d1f] relative shrink-0">
      <div
        className={cn(
          "relative transition-all !duration-1000",
          title ? (pathname === "/" ? "" : "mt-[-15%] mb-[-15%]") : "mt-[-53%]",
        )}
      >
        <Image
          alt="Hero Background"
          className="w-full object-contain"
          draggable={false}
          height={671}
          sizes="100vw"
          src="/hero.webp"
          width={1280}
          priority
        />

        <h1 className={cn("hero-title absolute -right-3 top-[50%]")}>
          <span
            className={cn(
              "flex items-center absolute left-0 -translate-y-1/2 ",
              isNewPathname && "opacity-0",
              isNewPathname &&
                (pathname === "/"
                  ? "animate-fade-out-from-top"
                  : "animate-fade-out-from-bottom"),
            )}
          >
            <span className="-translate-x-1/2">{prevTitle}</span>
          </span>
          {isNewPathname ? (
            <span
              className={cn(
                "flex items-center absolute left-0 -translate-y-1/2",
                pathname === "/"
                  ? "animate-fade-in-to-top"
                  : "animate-fade-in-to-bottom",
              )}
            >
              <span className="-translate-x-1/2">{title}</span>
            </span>
          ) : null}
        </h1>
      </div>
    </div>
  );
}
