"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";

const mediaQuery = "(min-width: 768px)";
export function FloatingBanner({ id }: { id: string }): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  useEffect(() => {
    if (!matched) {
      return;
    }
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [
        ["160", "600"],
        ["300", "600"],
        ["300", "250"],
      ],
      mediaQuery: mediaQuery,
      debug: "silent",
      demo: location.href.includes("localhost"),
    });
  }, [matched]);

  if (!matched) {
    return <></>;
  }
  return (
    <AdFreeContainer className="fixed bottom-2 right-2 min-h-[250px] min-w-[160px]">
      <div id={id} />
    </AdFreeContainer>
  );
}
