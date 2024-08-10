"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";

export function LargeMobileBanner({
  id,
}: {
  id: string;
  mediaQuery?: string;
}): JSX.Element {
  useEffect(() => {
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [["320", "100"]],
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, []);

  return (
    <AdFreeContainer>
      <div
        className="rounded h-[100px] bg-zinc-800/30 flex flex-col justify-center text-gray-400"
        id={id}
      />
    </AdFreeContainer>
  );
}

export function LargeMobileBannerLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("max-[859px]:block hidden", className)}>
      <div className="rounded h-[100px] bg-zinc-800/30 flex flex-col justify-center text-gray-400">
        Loading Ad
      </div>
    </AdFreeContainer>
  );
}

export function LargeMobileBannerFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("max-[859px]:block hidden", className)}>
      <div className="rounded h-[100px] bg-zinc-800/30 flex flex-col justify-center text-gray-400">
        Please disable your Ad-Blocker
      </div>
    </AdFreeContainer>
  );
}
