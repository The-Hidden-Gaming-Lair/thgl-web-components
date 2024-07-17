import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import leaflet from "leaflet";
import type { ActorPlayer } from "@repo/lib/overwolf";
import { MarkerOptions } from "@repo/lib";
import { useUserStore } from "../(providers)";

export function Player({
  player,
  markerOptions,
}: {
  player: ActorPlayer;
  markerOptions: MarkerOptions;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const followPlayerPosition = true;
  const setMapName = useUserStore((state) => state.setMapName);

  useEffect(() => {
    if (!map) {
      return;
    }

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) {
      return;
    }

    if (!marker.current) {
      const icon = leaflet.icon({
        iconUrl: markerOptions.playerIcon
          ? `/icons/${markerOptions.playerIcon}`
          : "/global_icons/player.png",
        className: "player",
        iconSize: [36, 36],
      });

      marker.current = new PlayerMarker([player.x, player.y], {
        icon,
        interactive: false,
      });
      marker.current.rotation = player.r;
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
  }, [map, player?.mapName]);

  const lastAnimation = useRef(0);
  useEffect(() => {
    if (!map || !player || !marker.current) {
      return;
    }

    marker.current.updatePosition(player);

    if (followPlayerPosition && player.mapName === map.mapName) {
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
  }, [map, player, followPlayerPosition]);

  useEffect(() => {
    if (!player?.mapName || !map) {
      return;
    }
    if (player.mapName !== map.mapName) {
      console.log("Setting map name", player.mapName);
      setMapName(player.mapName, [player.x, player.y], map.getZoom());
    }
  }, [player?.mapName]);

  return <></>;
}
