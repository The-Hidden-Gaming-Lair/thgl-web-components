"use client";

import { THGLAppConfig, TilesConfig, Version } from "@repo/lib";
import { MapContainer, StreamingSender } from "../(overwolf)";
import {
  InteractiveMap,
  LivePlayer,
  Markers,
  PrivateDrawing,
  PrivateNode,
  Regions,
  TraceLine,
} from "../(interactive-map)";
import { Actions, Whiteboard } from "../(controls)";

export type AppMapProps = {
  appConfig: THGLAppConfig;
  version: Version;
  tileOptions: TilesConfig;
  isOverlay: boolean;
  lockedWindow: boolean;
};

export function AppMap({
  appConfig,
  version,
  isOverlay,
  tileOptions,
  lockedWindow,
}: AppMapProps): JSX.Element {
  return (
    <>
      <MapContainer isOverlay={isOverlay}>
        <InteractiveMap
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
      />
      <div className="fixed top-[40px] right-2 mt-[1px] z-[500] flex gap-2 flex-col sm:flex-row">
        <Whiteboard domain={appConfig.domain} hidden={lockedWindow} />
        <StreamingSender
          domain={appConfig.domain}
          hidden={lockedWindow}
          withoutLiveMode={appConfig.withoutLiveMode}
        />
        <PrivateNode
          appName={appConfig.name}
          hidden={lockedWindow}
          iconsPath={version?.more.icons}
        />
        <PrivateDrawing hidden={lockedWindow} />
      </div>

      <LivePlayer
        markerOptions={appConfig.markerOptions}
        appName={appConfig.name}
        iconsPath={version?.more.icons}
        tilesConfig={tileOptions}
      />
      <TraceLine />
    </>
  );
}
