"use client";

import { AppConfig, type TilesConfig } from "@repo/lib";
import dynamic from "next/dynamic";
import { AdditionalTooltipType } from "../(content)";

const FullMap = dynamic(() => import("./full-map").then((mod) => mod.FullMap), {
  ssr: false,
});

export function FullMapDynamic({
  tilesConfig,
  appConfig,
  simple,
  iconsPath,
  isOverlay,
  additionalTooltip,
}: {
  tilesConfig: TilesConfig;
  appConfig: AppConfig;
  simple?: boolean;
  iconsPath: string;
  isOverlay?: boolean;
  additionalTooltip?: AdditionalTooltipType;
}): JSX.Element {
  return (
    <FullMap
      tilesConfig={tilesConfig}
      appConfig={appConfig}
      simple={simple}
      iconsPath={iconsPath}
      isOverlay={isOverlay}
      additionalTooltip={additionalTooltip}
    />
  );
}
