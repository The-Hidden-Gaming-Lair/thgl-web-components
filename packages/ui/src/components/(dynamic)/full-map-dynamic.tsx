"use client";

import { AppConfig, type TilesConfig } from "@repo/lib";
import dynamic from "next/dynamic";

const FullMap = dynamic(() => import("./full-map").then((mod) => mod.FullMap), {
  ssr: false,
});

export function FullMapDynamic({
  tilesConfig,
  appConfig,
  simple,
  iconsPath,
  isOverlay,
}: {
  tilesConfig: TilesConfig;
  appConfig: AppConfig;
  simple?: boolean;
  iconsPath?: string;
  isOverlay?: boolean;
}): JSX.Element {
  return (
    <FullMap
      tilesConfig={tilesConfig}
      appConfig={appConfig}
      simple={simple}
      iconsPath={iconsPath}
      isOverlay={isOverlay}
    />
  );
}
