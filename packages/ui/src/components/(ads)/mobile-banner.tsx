"use client";
import type { JSX } from "react";
import { InContentBanner } from "./in-content-banner";

// Page-end banner: a 300x250 rectangle on phones (the page end is rarely
// seen, so a rectangle's deeper demand beats a 320x50 there, and it pushes
// no content down), a 728x90 leaderboard where the content column fits it.
const PHONE = { width: 300, height: 250 };

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
      phoneId={`${id}-mr`}
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
