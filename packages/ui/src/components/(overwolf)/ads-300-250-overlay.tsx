import { cn } from "@repo/lib";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdsContainer } from "./ads-container";
import { useOverwolfState } from "@repo/lib/overwolf";
import { initAd } from "./ads";

const mediaQuery = "(max-width: 1919px)";
export function Ads300x250Overlay({ title }: { title: string }): JSX.Element {
  const matched = useMediaQuery(mediaQuery);
  const adRef = useRef<HTMLDivElement | null>(null);
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const isVisible = matched && isOverlay;

  useEffect(() => {
    if (!isVisible || adRef.current === null) {
      return;
    }

    const owAd = initAd(
      adRef.current,
      { width: 300, height: 250 },
      "Ads300x250Overlay"
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
      transformId="Ads300x250Overlay"
    >
      <div ref={adRef} className={cn("w-[300px] h-[250px] bg-background/50")} />
    </AdsContainer>
  );
}
