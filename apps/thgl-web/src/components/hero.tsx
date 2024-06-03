"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { orbitron } from "@/styles/fonts";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/": "The Hidden Gaming Lair",
  "/support-me": "Support Me",
  "/support-me/account": "Thank you!",
  "/partner-program": "Partner Program",
  "/legal-notice": "Legal Notice",
  "/privacy-policy": "Privacy Policy",
};
export function Hero(): JSX.Element {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState<string>(pathname);

  const isNewPathname = pathname !== prevPathname;
  const prevTitle = titles[prevPathname];
  const title = titles[pathname];

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
    <div className="w-full overflow-hidden max-w-7xl mx-auto border-x border-[#1d1d1f] relative">
      <div
        className={cn(
          "relative transition-all !duration-1000",
          title ? (pathname === "/" ? "" : "mt-[-15%] mb-[-15%]") : "mt-[-53%]"
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
        />

        <h1
          className={cn(
            orbitron.className,
            "hero-title absolute right-[6%] top-[50%]"
          )}
        >
          <span
            className={cn(
              "flex items-center absolute left-0 -translate-y-1/2",
              isNewPathname && "opacity-0",
              isNewPathname &&
                (pathname === "/"
                  ? "animate-fade-out-from-top"
                  : "animate-fade-out-from-bottom")
            )}
          >
            {prevTitle}
          </span>
          {isNewPathname ? (
            <span
              className={cn(
                "flex items-center absolute left-0 -translate-y-1/2",
                pathname === "/"
                  ? "animate-fade-in-to-top"
                  : "animate-fade-in-to-bottom"
              )}
            >
              {title}
            </span>
          ) : null}
        </h1>
      </div>
    </div>
  );
}
