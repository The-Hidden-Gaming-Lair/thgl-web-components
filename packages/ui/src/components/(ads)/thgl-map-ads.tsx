"use client";
import { useEffect, useMemo, useState, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { ScriptLoader } from "./nitro-script";
import { THGLAppConfig } from "@repo/lib";
import dynamic from "next/dynamic";
import { IS_DEMO_MODE } from "./constants";

const MovableAdsContainer = dynamic(
  () =>
    import("./movable-ad-free-container").then(
      (mod) => mod.MovableAdsContainer,
    ),
  {
    ssr: false,
  },
);

// SSR-safe media query hook
function useMediaQuerySafe(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Ad format configurations based on window size (matching Overwolf breakpoints)
// Available NitroPay sizes: 728x90, 970x90, 970x250, 300x250, 336x280, 320x50, 320x100, 320x480, 160x600, 300x600
type AdFormat = {
  sizes: [string, string][];
  // Fixed container dimensions (max of all possible ad sizes) to prevent dynamic resizing
  width: number;
  height: number;
  variant: string;
  // Stacked slots (each width x height, own auction + refresh). Default 1.
  stack?: number;
};

const STACK_GAP = 8;

// Desktop breakpoints (not overlay)
const DESKTOP_SHORT_RECTANGLE: AdFormat = {
  // Height < 700px (and width >= 970px). Was a 970x90/728x90 bottom banner,
  // the weakest unit we ran ($0.03-0.09 CPM); a corner rectangle covers
  // about the same area.
  sizes: [["300", "250"]],
  width: 300,
  height: 250,
  variant: "short-rectangle",
};

const DESKTOP_SMALL_RECTANGLE: AdFormat = {
  // Width < 1680px AND Height >= 700px. Was 160x600 only ($0.10-0.14 CPM vs
  // $0.19-0.28 for the 300x600 variant); 300x250 covers less of the map.
  sizes: [["300", "250"]],
  width: 300,
  height: 250,
  variant: "small-rectangle",
};

const DESKTOP_MEDIUM_STACK: AdFormat = {
  // Width >= 1680px AND Height 700-1049px. Was one 300x600 box; two stacked
  // rectangles earn more per screen area and take 92px less height.
  sizes: [["300", "250"]],
  width: 300,
  height: 250,
  variant: "medium-stack",
  stack: 2,
};

const DESKTOP_LARGE_STACK: AdFormat = {
  // Width >= 1680px AND Height >= 1050px. Was one 336x600 box.
  sizes: [
    ["336", "280"],
    ["300", "250"],
  ],
  width: 336,
  height: 280,
  variant: "large-stack",
  stack: 2,
};

const DESKTOP_COMPACT: AdFormat = {
  // Small window: Width < 970px AND Height < 700px
  sizes: [
    ["300", "250"],
    ["320", "100"],
  ],
  width: 300,
  height: 250,
  variant: "compact",
};

// Overlay breakpoints
const OVERLAY_SMALL: AdFormat = {
  // Width < 1920px
  sizes: [
    ["300", "250"],
    ["320", "100"],
  ],
  width: 320,
  height: 250,
  variant: "overlay-small",
};

const OVERLAY_LARGE: AdFormat = {
  // Width >= 1920px
  sizes: [
    ["336", "280"],
    ["300", "250"],
    ["320", "100"],
  ],
  width: 336,
  height: 280,
  variant: "overlay-large",
};

function useAdFormat(isOverlay: boolean): AdFormat | null {
  const [hydrated, setHydrated] = useState(false);

  // Desktop breakpoints
  const isSmallHeight = useMediaQuerySafe(
    "(max-height: 699px) and (min-width: 970px)",
  );
  const isSmallWindow = useMediaQuerySafe(
    "(max-height: 699px) and (max-width: 969px)",
  );
  const isNarrowTall = useMediaQuerySafe(
    "(max-width: 1679px) and (min-height: 700px)",
  );
  const isWideMedium = useMediaQuerySafe(
    "(min-width: 1680px) and (min-height: 700px) and (max-height: 1049px)",
  );
  const isWideTall = useMediaQuerySafe(
    "(min-width: 1680px) and (min-height: 1050px)",
  );

  // Overlay breakpoints
  const isLargeOverlay = useMediaQuerySafe("(min-width: 1920px)");

  useEffect(() => {
    setHydrated(true);
  }, []);

  return useMemo(() => {
    if (!hydrated) return null;

    if (isOverlay) {
      return isLargeOverlay ? OVERLAY_LARGE : OVERLAY_SMALL;
    }

    // Desktop mode
    if (isSmallHeight) return DESKTOP_SHORT_RECTANGLE;
    if (isSmallWindow) return DESKTOP_COMPACT;
    if (isNarrowTall) return DESKTOP_SMALL_RECTANGLE;
    if (isWideMedium) return DESKTOP_MEDIUM_STACK;
    if (isWideTall) return DESKTOP_LARGE_STACK;

    // Fallback
    return DESKTOP_SMALL_RECTANGLE;
  }, [
    hydrated,
    isOverlay,
    isSmallHeight,
    isSmallWindow,
    isNarrowTall,
    isWideMedium,
    isWideTall,
    isLargeOverlay,
  ]);
}

export function THGLMapAds({
  isOverlay,
  appConfig,
}: {
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}): JSX.Element | null {
  const adFormat = useAdFormat(isOverlay ?? false);

  // Wait for hydration to determine the correct ad format
  if (!adFormat) return null;

  const id =
    "thgl-" +
    appConfig.name +
    "-" +
    (isOverlay ? "overlay" : "desktop") +
    "-" +
    adFormat.variant;

  // Use key to force re-mount when format changes, ensuring clean ad recreation
  return (
    <ScriptLoader
      key={adFormat.variant}
      loading={
        <NitroPayAdLoading
          id={id}
          isOverlay={isOverlay}
          appConfig={appConfig}
          adFormat={adFormat}
        />
      }
    >
      <NitroPayAd
        id={id}
        isOverlay={isOverlay}
        appConfig={appConfig}
        adFormat={adFormat}
      />
    </ScriptLoader>
  );
}

function NitroPayAd({
  id,
  isOverlay,
  appConfig,
  adFormat,
}: {
  id: string;
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
  adFormat: AdFormat;
}): JSX.Element {
  useEffect(() => {
    for (const [index, slotId] of slotIds(id, adFormat).entries()) {
      try {
        getNitroAds().createAd(slotId, {
          targeting: {
            platform: "thgl-app",
            game: appConfig.name,
            view: isOverlay ? "overlay" : "desktop",
            variant: adFormat.variant,
            slot: String(index + 1),
          }, // Use 'platform' as primary discriminator to avoid bleed over with web
          refreshTime: 30,
          renderVisibleOnly: false,
          // Outstream video only outside the in-game overlay: a playing video
          // composited over the game costs game performance. The desktop window
          // (usually a second screen) takes video bids like the dashboard does.
          outstream: isOverlay ? "never" : "auto",
          sizes: adFormat.sizes,
          report: {
            enabled: false,
            icon: false,
            wording: "Report Ad",
            position: "top-left",
          },
          skipBidders: ["google"],
          demo: IS_DEMO_MODE,
          debug: "silent",
        });
      } catch (error) {
        console.error(`[THGLMapAds] Failed to create ad ${slotId}:`, error);
      }
    }
  }, [id, adFormat.sizes, adFormat.variant, appConfig.name, isOverlay]);

  return (
    <MovableAdsContainer
      className="right-0 bottom-0"
      transformId={
        appConfig.name +
        "-" +
        (isOverlay ? "overlay" : "map") +
        "-" +
        adFormat.variant
      }
    >
      <AdSlots id={id} adFormat={adFormat} />
    </MovableAdsContainer>
  );
}

function NitroPayAdLoading({
  id,
  isOverlay,
  appConfig,
  adFormat,
}: {
  id: string;
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
  adFormat: AdFormat;
}) {
  return (
    <MovableAdsContainer
      className="right-0 bottom-0"
      transformId={
        appConfig.name +
        "-" +
        (isOverlay ? "overlay" : "map") +
        "-" +
        adFormat.variant
      }
    >
      <AdSlots id={id} adFormat={adFormat} />
    </MovableAdsContainer>
  );
}

function slotIds(id: string, adFormat: AdFormat): string[] {
  const stack = adFormat.stack ?? 1;
  return stack === 1
    ? [id]
    : Array.from({ length: stack }, (_, i) => `${id}-${i + 1}`);
}

function AdSlots({ id, adFormat }: { id: string; adFormat: AdFormat }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: STACK_GAP }}>
      {slotIds(id, adFormat).map((slotId) => (
        <div
          key={slotId}
          // Clamp the NitroPay-injected creative (and its iframe) to the box —
          // NitroPay occasionally serves a creative larger than the requested
          // sizes; without this it overflows instead of fitting the container.
          className="bg-background/50 [&>*]:max-w-full [&>*]:max-h-full [&_iframe]:max-w-full [&_iframe]:max-h-full"
          style={{
            width: adFormat.width,
            height: adFormat.height,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          id={slotId}
        />
      ))}
    </div>
  );
}
