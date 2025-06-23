"use client";

import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import leaflet from "leaflet";
import type { ActorPlayer } from "@repo/lib/overwolf";
import {
  getIconsUrl,
  MarkerOptions,
  TilesConfig,
  useUserStore,
} from "@repo/lib";
import { useT } from "../(providers)";
import { useThrottledEffect } from "../ui/useThrottleEffect";

export function Player({
  appName,
  player,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName?: string;
  player: ActorPlayer;
  markerOptions: MarkerOptions;
  iconsPath?: string;
  tilesConfig: TilesConfig;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const followPlayerPosition = true;
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();

  useEffect(() => {
    if (!map?.mapName) {
      return;
    }

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) {
      return;
    }

    if (!marker.current) {
      const iconName = markerOptions.playerIcon
        ? `/icons/${markerOptions.playerIcon}`
        : "https://th.gl/global_icons/player.png";
      const iconUrl = appName
        ? getIconsUrl(appName, iconName, iconsPath)
        : iconName;
      const icon = leaflet.icon({
        iconUrl: iconUrl,
        className: "player",
        iconSize: [36, 36],
      });

      const tile = tilesConfig[map.mapName];
      const rotationOffset = tile?.rotation?.angle;

      marker.current = new PlayerMarker([player.x, player.y], {
        icon,
        interactive: false,
        rotation: player.r,
        pane: "tooltipPane",
        rotationOffset,
      });
    } else {
      marker.current.updatePosition(player);
    }
    try {
      marker.current.addTo(map);
      map.panTo([player.x, player.y], {
        animate: false,
        duration: 0,
        easeLinearity: 1,
        noMoveStart: true,
      });
    } catch (e) {}

    return () => {
      try {
        marker.current?.remove();
        marker.current = null;
      } catch (e) {}
    };
  }, [map?.mapName, player?.mapName]);

  const lastAnimation = useRef(0);

  useThrottledEffect(
    () => {
      if (!map?.mapName || !player || !marker.current) {
        return;
      }
      marker.current.updatePosition(player);

      const isOnMap = !player.mapName || player.mapName === map.mapName;
      if (!isOnMap) {
        return;
      }

      if (followPlayerPosition) {
        const now = Date.now();
        if (now - lastAnimation.current > 500) {
          lastAnimation.current = now;
          document
            .querySelector(".leaflet-map-pane")
            ?.classList.add(
              "transition-transform",
              "ease-linear",
              "duration-1000",
            );
          map.panTo([player.x, player.y], {
            animate: false,
            duration: 0,
            easeLinearity: 1,
            noMoveStart: true,
          });
        }
      }
    },
    [map?.mapName, player, followPlayerPosition],
    50,
  );

  useEffect(() => {
    if (!player?.mapName || !map) {
      return;
    }
    if (player.mapName !== map.mapName) {
      console.log("Setting map name", player.mapName);
      setMapName(player.mapName, [player.x, player.y], map.getZoom());
      if (location.pathname.includes("/maps/")) {
        window.history.pushState({}, "", `/maps/${t(player.mapName)}`);
      }
    }
  }, [player?.mapName]);

  return <></>;
}
