"use client";

import { useEffect } from "react";
import { MarkerOptions, TilesConfig, useGameState } from "@repo/lib";
import { Player } from "./player";

interface LiveTelemetryData {
  connected: boolean;
  x: number;
  y: number;
  z: number;
  yaw?: number;
  mapName?: string;
}

export function LivePlayer({
  appName,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
}) {
  useEffect(() => {
    // Connect to the local memory reader companion server SSE stream (default port 8765)
    // when developing locally or running games that leverage external companion processes.
    if (
      typeof window !== "undefined" &&
      (process.env.NODE_ENV === "development" || appName === "dawnwalker")
    ) {
      let isSubscribed = true;
      const telemetryEndpoint = "http://localhost:8765/api/telemetry/stream";
      let eventSourceStream: EventSource | null = null;

      try {
        eventSourceStream = new EventSource(telemetryEndpoint);
        eventSourceStream.onmessage = (messageEvent) => {
          if (!isSubscribed) return;
          try {
            const telemetryPayload: LiveTelemetryData = JSON.parse(
              messageEvent.data,
            );
            if (
              telemetryPayload?.connected &&
              typeof telemetryPayload.x === "number"
            ) {
              useGameState.getState().setPlayer({
                x: telemetryPayload.x,
                y: telemetryPayload.y,
                z: telemetryPayload.z,
                r: telemetryPayload.yaw ?? 0,
                mapName: telemetryPayload.mapName ?? "TheValley",
                type: "player",
                address: 0,
              });
            }
          } catch {
            // Ignore malformed SSE frames
          }
        };
      } catch {
        // Companion server not reachable yet; stream will reconnect automatically
      }

      return () => {
        isSubscribed = false;
        eventSourceStream?.close();
      };
    }
  }, [appName]);

  const player = useGameState((state) => state.player);

  if (!player) {
    return <></>;
  }
  return (
    <Player
      appName={appName}
      player={player}
      markerOptions={markerOptions}
      iconsPath={iconsPath}
      tilesConfig={tilesConfig}
    />
  );
}
