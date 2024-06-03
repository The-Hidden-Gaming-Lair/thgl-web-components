"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";

export function FloatingMobileBanner({ id }: { id: string }): JSX.Element {
  return (
    <MobileBanner
      id={id}
      className="fixed bottom-0 left-0 right-0"
      mediaQuery="(max-width: 767px)"
    />
  );
}

export function MobileBanner({
  id,
  mediaQuery = "(max-width: 859px)",
  className,
}: {
  id: string;
  mediaQuery?: string;
  className?: string;
}): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  useEffect(() => {
    if (!matched) {
      return;
    }
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [["320", "50"]],
      mediaQuery: mediaQuery,
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, [matched]);

  if (!matched) {
    return <></>;
  }

  return (
    <AdFreeContainer className={className}>
      <div
        className="rounded h-[50px] bg-zinc-800/30 flex flex-col justify-center text-gray-400"
        id={id}
      />
    </AdFreeContainer>
  );
}

export function MobileBannerLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("max-[859px]:block hidden", className)}>
      <div className="rounded h-[50px] bg-zinc-800/30 flex flex-col justify-center text-gray-400">
        Loading Ad
      </div>
    </AdFreeContainer>
  );
}

export function MobileBannerFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("max-[859px]:block hidden", className)}>
      <div className="rounded h-[50px] bg-zinc-800/30 flex flex-col justify-center text-gray-400">
        Please disable your Ad-Blocker
      </div>
    </AdFreeContainer>
  );
}
