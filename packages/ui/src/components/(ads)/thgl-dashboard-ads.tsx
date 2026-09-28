"use client";
import { useEffect, useRef, useState, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { ScriptLoader } from "./nitro-script";
import { AdFreeContainer } from "./ad-free-container";
import { IS_DEMO_MODE } from "./constants";

// The dashboard column stacks independent rectangle slots (each its own
// auction + refresh) as far as the window height allows. Slots that would sit
// below the fold are not created — an unviewable impression drags the
// viewability rate (and with it every slot's CPM) down.
const SLOT_WIDTH = 336;
const SLOT_HEIGHT = 280;
const SLOT_GAP = 8;
const HEADER_HEIGHT = 18; // "Get AD Free" link above the stack
const MAX_SLOTS = 3;

// First slot keeps the historical id so NitroPay reporting stays continuous.
const SLOT_IDS = ["thgl-dashboard", "thgl-dashboard-2", "thgl-dashboard-3"];

function useSlotCount(el: React.RefObject<HTMLDivElement | null>): number {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!el.current) return;
    const update = (height: number) => {
      // Minimised WebView2 windows report 0 — keep the current stack.
      if (height === 0) return;
      const fit = Math.floor(
        (height - HEADER_HEIGHT + SLOT_GAP) / (SLOT_HEIGHT + SLOT_GAP),
      );
      setCount(Math.max(1, Math.min(MAX_SLOTS, fit)));
    };
    update(el.current.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.height);
    });
    observer.observe(el.current);
    return () => observer.disconnect();
  }, [el]);

  return count;
}

export function THGLDashboardAds({
  className,
}: {
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const count = useSlotCount(ref);
  const ids = SLOT_IDS.slice(0, count);

  return (
    <div ref={ref} className={`h-full overflow-hidden ${className}`}>
      <ScriptLoader
        loading={<DashboardSlots ids={ids} />}
        fallback={<DashboardSlots ids={ids} />}
      >
        <DashboardSlots ids={ids} live />
      </ScriptLoader>
    </div>
  );
}

function DashboardSlots({
  ids,
  live,
}: {
  ids: string[];
  live?: boolean;
}): JSX.Element {
  return (
    <AdFreeContainer noBorder className="h-full">
      <div className="flex flex-col items-center" style={{ gap: SLOT_GAP }}>
        {ids.map((id, index) =>
          live ? (
            <NitroPaySlot key={id} id={id} slot={index + 1} />
          ) : (
            <SlotBox key={id} id={id} />
          ),
        )}
      </div>
    </AdFreeContainer>
  );
}

function NitroPaySlot({ id, slot }: { id: string; slot: number }) {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting: {
          platform: "thgl-app", // Use 'platform' as primary discriminator
          component: "dashboard",
          slot: String(slot),
        },
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [
          ["336", "280"],
          ["300", "250"],
        ],
        report: {
          enabled: true,
          icon: true,
          wording: "Report Ad",
          position: "bottom-right",
        },
        skipBidders: ["google"],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[THGLDashboardAds] Failed to create ad ${id}:`, error);
    }
  }, [id, slot]);

  return <SlotBox id={id} />;
}

function SlotBox({ id }: { id: string }) {
  return (
    <div
      id={id}
      // Clamp the NitroPay-injected creative (and its iframe) to the box —
      // same guard as THGLMapAds.
      className="bg-background/50 [&>*]:max-w-full [&>*]:max-h-full [&_iframe]:max-w-full [&_iframe]:max-h-full"
      style={{
        width: SLOT_WIDTH,
        height: SLOT_HEIGHT,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    />
  );
}
