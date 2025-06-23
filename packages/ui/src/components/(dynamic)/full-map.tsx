"use client";

import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "../(interactive-map)";
import { Actions, StreamingReceiver, Whiteboard } from "../(controls)";
import type { AppConfig, MarkerOptions, TilesConfig } from "@repo/lib";

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
}: {
  tilesConfig: TilesConfig;
  appConfig: AppConfig;
  simple?: boolean;
  iconsPath?: string;
  isOverlay?: boolean;
}): JSX.Element {
  return (
    <>
      <InteractiveMap
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
      />
      {!simple && (
        <>
          <LivePlayer
            appName={appConfig.name}
            markerOptions={appConfig.markerOptions ?? MARKER_OPTIONS}
            iconsPath={iconsPath}
            tilesConfig={tilesConfig}
          />
          <TraceLine />
          <Actions>
            <Whiteboard domain={appConfig.domain} />
            {appConfig.appUrl ? (
              <StreamingReceiver
                domain={appConfig.domain}
                href={appConfig.appUrl}
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
