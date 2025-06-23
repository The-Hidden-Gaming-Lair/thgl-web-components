"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { NitroScript } from "./nitro-script";
import { THGLAppConfig } from "@repo/lib";
import dynamic from "next/dynamic";

const MovableAdsContainer = dynamic(
  () =>
    import("./movable-ad-free-container").then(
      (mod) => mod.MovableAdsContainer,
    ),
  {
    ssr: false,
  },
);

export function THGLMapAds({
  isOverlay,
  appConfig,
}: {
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}): JSX.Element {
  const id =
    "thgl-" + appConfig.name + "-" + (isOverlay ? "overlay" : "desktop");
  return (
    <NitroScript
      loading={
        <NitroPayAdLoading
          id={id}
          isOverlay={isOverlay}
          appConfig={appConfig}
        />
      }
    >
      <NitroPayAd id={id} isOverlay={isOverlay} appConfig={appConfig} />
    </NitroScript>
  );
}

function NitroPayAd({
  id,
  isOverlay,
  appConfig,
}: {
  id: string;
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}): JSX.Element {
  useEffect(() => {
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      outstream: "never",
      sizes: [
        ["300", "250"],
        ["320", "50"],
        ["320", "100"],
        ["336", "280"],
      ],
      report: {
        enabled: false,
        icon: false,
        wording: "Report Ad",
        position: "top-left",
      },
      skipBidders: ["google"],
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, []);

  return (
    <MovableAdsContainer
      className="right-0 bottom-0"
      transformId={appConfig.name + "-" + (isOverlay ? "overlay" : "map")}
    >
      <div className="bg-background/50 min-w-[300px] min-h-[280px]" id={id} />
    </MovableAdsContainer>
  );
}

function NitroPayAdLoading({
  id,
  isOverlay,
  appConfig,
}: {
  id: string;
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}) {
  return (
    <MovableAdsContainer
      className="right-0 bottom-0"
      transformId={appConfig.name + "-" + (isOverlay ? "overlay" : "map")}
    >
      <div className="bg-background/50 min-w-[300px] min-h-[50px]" id={id} />
    </MovableAdsContainer>
  );
}
