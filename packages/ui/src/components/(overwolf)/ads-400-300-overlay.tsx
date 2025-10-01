import { cn } from "@repo/lib";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdsContainer } from "./ads-container";
import { useOverwolfState } from "@repo/lib/overwolf";
import { initAd } from "./ads";

const mediaQuery = "(min-width: 1920px)";
export function Ads400x300Overlay({ title }: { title: string }): JSX.Element {
  const matched = useMediaQuery(mediaQuery);
  const adRef = useRef<HTMLDivElement | null>(null);
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const isVisible = matched && isOverlay;

  useEffect(() => {
    if (
      !isVisible ||
      typeof window.OwAd === "undefined" ||
      adRef.current === null
    ) {
      return;
    }

    const owAd = initAd(
      adRef.current,
      { width: 400, height: 300 },
      "Ads400x300Overlay",
    );
    return () => {
      owAd?.shutdown();
    };
  }, [isVisible]);

  if (!isVisible) {
    return <></>;
  }

  return (
    <AdsContainer
      title={title}
      className="right-0 bottom-0"
      transformId="Ads400x300Overlay"
    >
      <div ref={adRef} className={cn("w-[400px] h-[300px] bg-background/50")} />
    </AdsContainer>
  );
}
