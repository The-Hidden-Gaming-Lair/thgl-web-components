"use client";
import {
  DebugPanel,
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  LiveTeammates,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "../(interactive-map)";
import { Actions, MapControls } from "../(controls)";
import { StreamingReceiver, Whiteboard } from "../(peer)";
import type { AppConfig, MarkerOptions, TilesConfig } from "@repo/lib";
import { AdditionalTooltipType } from "../(content)";

import type { JSX } from "react";

const MARKER_OPTIONS: MarkerOptions = {
  imageSprite: true,
  radius: 6,
  playerIcon: "player.webp",
};
export function FullMap({
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
    <>
      <InteractiveMap
        appTitle={appConfig.title}
        domain={appConfig.domain}
        tileOptions={tilesConfig}
        appName={appConfig.name}
        isOverlay={isOverlay}
      />
      <DebugPanel />
      <Regions />
      <Markers
        appName={appConfig.name}
        markerOptions={appConfig.markerOptions ?? MARKER_OPTIONS}
        hideComments={simple}
        iconsPath={iconsPath}
        additionalTooltip={additionalTooltip}
      />
      {!simple && (
        <>
          <LivePlayer
            appName={appConfig.name}
            markerOptions={appConfig.markerOptions ?? MARKER_OPTIONS}
            iconsPath={iconsPath}
            tilesConfig={tilesConfig}
          />
          <LiveTeammates
            appName={appConfig.name}
            markerOptions={appConfig.markerOptions ?? MARKER_OPTIONS}
            iconsPath={iconsPath}
            tilesConfig={tilesConfig}
          />
          <TraceLine />
          <Actions
            mapControls={
              <MapControls
                coordinateCopyFormat={
                  appConfig.markerOptions?.coordinateCopyFormat
                }
              />
            }
          >
            <Whiteboard domain={appConfig.domain} />
            {appConfig.appUrl ? (
              <StreamingReceiver
                domain={appConfig.domain}
                withoutLiveMode={appConfig.withoutLiveMode}
              />
            ) : null}
            <PrivateNode appName={appConfig.name} iconsPath={iconsPath} />
            <PrivateDrawing />
          </Actions>
        </>
      )}
    </>
  );
}
