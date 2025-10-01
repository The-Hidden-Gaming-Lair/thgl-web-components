"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";
import { AdBlockMessage } from "./ad-block-message";
import { AdLoadingMessage } from "./ad-loading-message";

const smallMediaQuery = "(min-width: 768px)";
const bigMediaQuery = "(min-width: 1250px)";
export function FloatingBanner({
  id,
  isLoading = false,
  isBlocked = false,
}: {
  id: string;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const smallMatched = useMediaQuery(smallMediaQuery);
  const bigMatched = useMediaQuery(bigMediaQuery);

  useEffect(() => {
    if (!smallMatched || isLoading || isBlocked) {
      return;
    }
    const sizes = bigMatched
      ? [
          ["300", "600"],
          ["300", "250"],
          ["160", "600"],
        ]
      : [["160", "600"]];
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: sizes,
      mediaQuery: smallMediaQuery,
      debug: "silent",
      demo: location.href.includes("localhost"),
    });
  }, [smallMatched, bigMatched]);

  if (!smallMatched) {
    return <></>;
  }

  if (isLoading) {
    return (
      <AdFreeContainer className="fixed bottom-2 right-2">
        <div
          id={id}
          className={cn(
            "h-[600px] flex items-center justify-center flex-col",
            bigMatched ? "w-[300px]" : "w-[160px]",
          )}
        >
          <AdLoadingMessage />
        </div>
      </AdFreeContainer>
    );
  }

  if (isBlocked) {
    return (
      <AdFreeContainer className="fixed bottom-2 right-2">
        <div
          id={id}
          className={cn(
            "h-[600px] flex items-center justify-center flex-col",
            bigMatched ? "w-[300px]" : "w-[160px]",
          )}
        >
          <AdBlockMessage />
        </div>
      </AdFreeContainer>
    );
  }
  return (
    <AdFreeContainer className="fixed bottom-2 right-2">
      <div
        id={id}
        className={cn(
          "min-h-[600px]",
          bigMatched ? "min-w-[300px]" : "min-w-[160px]",
        )}
      />
    </AdFreeContainer>
  );
}
