"use client";
import type { JSX } from "react";
import { InContentBanner } from "./in-content-banner";

// 320x100 on phones, 728x90 leaderboard where the content column fits it.
const PHONE = { width: 320, height: 100 };

export function LargeMobileBanner({
  id,
  targeting,
}: {
  id: string;
  targeting?: Record<string, string>;
}): JSX.Element {
  return <InContentBanner id={id} targeting={targeting} phone={PHONE} />;
}

export function LargeMobileBannerLoading(): JSX.Element {
  return <InContentBanner id="" phone={PHONE} state="loading" />;
}

export function LargeMobileBannerFallback(): JSX.Element {
  return <InContentBanner id="" phone={PHONE} state="blocked" />;
}
