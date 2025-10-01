"use client";

import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  LiveTeammates,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "../(interactive-map)";
import { Actions, MapControls, StreamingReceiver, Whiteboard } from "../(controls)";
import type { AppConfig, MarkerOptions, TilesConfig } from "@repo/lib";
import { AdditionalTooltipType } from "../(content)";

const MARKER_OPTIONS: MarkerOptions = {
  imageSprite: true,
  radius: 6,
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
          <Actions>
            <MapControls />
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
