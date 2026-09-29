"use client";
import { cn } from "@repo/lib";
import { AdFreeContainer } from "./ad-free-container";
import { AdBlockMessage } from "./ad-block-message";
import { AdLoadingMessage } from "./ad-loading-message";

import type { CSSProperties, JSX } from "react";

type AdPlaceholderType = "loading" | "blocked";

interface AdPlaceholderProps {
  type: AdPlaceholderType;
  width: string;
  height: string;
  className?: string;
  hideBlockedText?: boolean;
  displayCheck?: boolean;
  /** Inline size for runtime-chosen dimensions (Tailwind can't see dynamic classes) */
  style?: CSSProperties;
}

/**
 * Reusable ad placeholder component for loading and blocked states
 *
 * Replaces duplicated Loading/Fallback components across all ad types
 *
 * @example
 * <AdPlaceholder type="loading" width="w-[320px]" height="h-[50px]" />
 * <AdPlaceholder type="blocked" width="w-[320px]" height="h-[100px]" hideBlockedText />
 */
export function AdPlaceholder({
  type,
  width,
  height,
  className,
  hideBlockedText = false,
  displayCheck = true,
  style,
}: AdPlaceholderProps): JSX.Element {
  return (
    <AdFreeContainer className={className} displayCheck={displayCheck}>
      <div
        className={cn(
          "rounded bg-zinc-800/30 text-gray-500 flex flex-col justify-center",
          width,
          height,
        )}
        style={{
          textAlign: "center",
          ...style,
        }}
      >
        {type === "loading" && <AdLoadingMessage />}
        {type === "blocked" && <AdBlockMessage hideText={hideBlockedText} />}
      </div>
    </AdFreeContainer>
  );
}
