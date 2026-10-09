"use client";
import { cn } from "@repo/lib";
import { AdFreeContainer } from "./ad-free-container";
import { AdLoadingMessage } from "./ad-loading-message";
import { BlockedHouseAd } from "./house-ad";

import type { CSSProperties, JSX } from "react";

type AdPlaceholderType = "loading" | "blocked";

interface AdPlaceholderProps {
  type: AdPlaceholderType;
  width: string;
  height: string;
  className?: string;
  displayCheck?: boolean;
  /** Inline size for runtime-chosen dimensions (Tailwind can't see dynamic classes) */
  style?: CSSProperties;
}

/**
 * Reusable ad placeholder component for loading and blocked states. Blocked
 * slots show one of our house ads (house-ad.tsx) instead of an empty box.
 *
 * @example
 * <AdPlaceholder type="loading" width="w-[320px]" height="h-[50px]" />
 * <AdPlaceholder type="blocked" width="w-[320px]" height="h-[100px]" />
 */
export function AdPlaceholder({
  type,
  width,
  height,
  className,
  displayCheck = true,
  style,
}: AdPlaceholderProps): JSX.Element {
  return (
    <AdFreeContainer className={className} displayCheck={displayCheck}>
      <div
        className={cn(
          "relative overflow-hidden rounded bg-zinc-800/30 text-gray-500 flex flex-col justify-center",
          width,
          height,
        )}
        style={{
          textAlign: "center",
          ...style,
        }}
      >
        {type === "loading" && <AdLoadingMessage />}
        {type === "blocked" && <BlockedHouseAd />}
      </div>
    </AdFreeContainer>
  );
}
