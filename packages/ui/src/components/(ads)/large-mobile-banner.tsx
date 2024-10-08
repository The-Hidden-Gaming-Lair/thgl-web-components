"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";

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

export function LargeMobileBannerLoading(): JSX.Element {
  return (
    <AdFreeContainer>
      <div className="rounded h-[100px] bg-zinc-800/30 flex flex-col justify-center text-gray-400">
        Loading Ad
      </div>
    </AdFreeContainer>
  );
}

export function LargeMobileBannerFallback(): JSX.Element {
  return (
    <AdFreeContainer>
      <div className="rounded h-[100px] bg-zinc-800/30 flex flex-col justify-center text-gray-400">
        Please disable your Ad-Blocker
      </div>
    </AdFreeContainer>
  );
}
