"use client";
import { THGLAppConfig, TilesConfig, Version } from "@repo/lib";
import { MapContainer, StreamingSender } from "../(desktop)";
import {
  InteractiveMap,
  LiveNavmesh,
  LivePlayer,
  LiveTeammates,
  Markers,
  PrivateDrawing,
  PrivateNode,
  Regions,
  TraceLine,
} from "../(interactive-map)";
import { Whiteboard } from "../(peer)";
import { AdditionalTooltipType } from "../(content)";
import { MapControls } from "../(controls)";

import type { JSX } from "react";

export type AppMapProps = {
  appConfig: THGLAppConfig;
  version: Version;
  tileOptions: TilesConfig;
  isOverlay: boolean;
  lockedWindow: boolean;
  additionalTooltip?: AdditionalTooltipType;
  withoutLiveMode: boolean;
};

export function AppMap({
  appConfig,
  version,
  isOverlay,
  tileOptions,
  lockedWindow,
  additionalTooltip,
  withoutLiveMode,
}: AppMapProps): JSX.Element {
  return (
    <>
      <MapContainer isOverlay={isOverlay}>
        <InteractiveMap
          appTitle={appConfig.title}
          domain={appConfig.domain}
          isOverlay={isOverlay}
          tileOptions={tileOptions}
          appName={appConfig.name}
        />
      </MapContainer>
      <Regions />
      <Markers
        markerOptions={appConfig.markerOptions}
        appName={appConfig.name}
        iconsPath={version?.more.icons}
        additionalTooltip={additionalTooltip}
      />
      <div className="fixed top-[40px] right-2 mt-px z-500 flex gap-1.5 items-center">
        <div className="flex items-center rounded-md border border-input bg-background shadow-sm divide-x divide-input overflow-hidden [&_button]:border-0 [&_button]:shadow-none [&_button]:rounded-none [&_button]:h-8 [&_button]:w-8">
          <Whiteboard domain={appConfig.domain} hidden={lockedWindow} />
          <StreamingSender
            domain={appConfig.domain}
            hidden={lockedWindow}
            withoutLiveMode={withoutLiveMode}
          />
          <PrivateNode
            appName={appConfig.name}
            hidden={lockedWindow}
            iconsPath={version?.more.icons}
          />
          <PrivateDrawing hidden={lockedWindow} />
        </div>
        <MapControls hidden={lockedWindow} alwaysShowFollowPlayer />
      </div>

      <LivePlayer
        markerOptions={appConfig.markerOptions}
        appName={appConfig.name}
        iconsPath={version?.more.icons}
        tilesConfig={tileOptions}
      />
      <LiveNavmesh />
      <LiveTeammates
        markerOptions={appConfig.markerOptions}
        appName={appConfig.name}
        iconsPath={version?.more.icons}
        tilesConfig={tileOptions}
      />
      <TraceLine />
    </>
  );
}
