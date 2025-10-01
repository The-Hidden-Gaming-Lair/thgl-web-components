import { cn } from "@repo/lib";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdsContainer } from "./ads-container";
import { useOverwolfState } from "@repo/lib/overwolf";
import { initAd } from "./ads";

const mediaQuery = "(min-width: 1680px) and (min-height: 1050px)";
export function Ads400x900Desktop({ title }: { title: string }): JSX.Element {
  const matched = useMediaQuery(mediaQuery);
  const adRef1 = useRef<HTMLDivElement | null>(null);
  const adRef2 = useRef<HTMLDivElement | null>(null);
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const isVisible = matched && !isOverlay;

  useEffect(() => {
    if (
      !isVisible ||
      typeof window.OwAd === "undefined" ||
      adRef1.current === null ||
      adRef2.current === null
    ) {
      return;
    }

    const owAd1 = initAd(
      adRef1.current,
      { width: 400, height: 600 },
      "Ads400x900Desktop-1",
    );
    const owAd2 = initAd(
      adRef2.current,
      { width: 400, height: 300 },
      "Ads400x900Desktop-2",
    );
    return () => {
      owAd1?.shutdown();
      owAd2?.shutdown();
    };
  }, [isVisible]);

  if (!isVisible) {
    return <></>;
  }

  return (
    <AdsContainer title={title} className="right-0 bottom-0">
      <div
        ref={adRef1}
        className={cn("w-[400px] h-[600px] bg-background/50")}
      />
      <div
        ref={adRef2}
        className={cn("w-[400px] h-[300px] bg-background/50")}
      />
    </AdsContainer>
  );
}
