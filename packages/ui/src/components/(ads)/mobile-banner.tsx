"use client";
import type { JSX } from "react";
import { InContentBanner } from "./in-content-banner";

// 320x50 on phones, 728x90 leaderboard where the content column fits it.
const PHONE = { width: 320, height: 50 };

export function MobileBanner({
  id,
  targeting,
  className,
}: {
  id: string;
  targeting?: Record<string, string>;
  className?: string;
}): JSX.Element {
  return (
    <InContentBanner
      id={id}
      targeting={targeting}
      phone={PHONE}
      className={className}
    />
  );
}

export function MobileBannerLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <InContentBanner
      id=""
      phone={PHONE}
      state="loading"
      className={className}
    />
  );
}

export function MobileBannerFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <InContentBanner
      id=""
      phone={PHONE}
      state="blocked"
      hideBlockedText
      className={className}
    />
  );
}
