"use client";

import {
  FiltersConfig,
  findPlayerRegion,
  games,
  getSpawnDiscoveryId,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
import {
  setDiscordPresenceHints,
  type DiscordPresenceHints,
} from "@repo/lib/thgl-app";
import { useEffect, useMemo, useRef } from "react";
import { useCoordinates, useT } from "../(providers)";

// The player moves constantly; the card only changes with the map/region, and
// the app rate-limits Discord anyway.
const POLL_MS = 2000;

/**
 * Discord progress line for one filter group: discovered / total spawns of the
 * group's types over all maps (private markers excluded).
 */
export function useDiscoveryProgress(filters: FiltersConfig) {
  const { searchableNodes } = useCoordinates();
  const discoveredNodes = useSettingsStore((s) => s.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((s) => s.isDiscoveredNode);
  return useMemo(() => {
    const groupOfType = new Map<string, string>();
    for (const filter of filters) {
      for (const value of filter.values)
        groupOfType.set(value.id, filter.group);
    }
    const counts = new Map<string, { found: number; total: number }>();
    for (const node of searchableNodes) {
      const group = groupOfType.get(node.type);
      if (!group) continue;
      const count = counts.get(group) ?? { found: 0, total: 0 };
      for (const spawn of node.spawns) {
        if (spawn.isPrivate) continue;
        count.total++;
        if (isDiscoveredNode(getSpawnDiscoveryId(node.type, spawn))) {
          count.found++;
        }
      }
      counts.set(group, count);
    }
    return counts;
  }, [filters, searchableNodes, discoveredNodes, isDiscoveredNode]);
}

/**
 * Sends the Discord Rich Presence hints of this game window to THGLApp: game
 * title + art, the player's map and region, discovery progress and the web map
 * URL. The app builds the card from them plus the user's Discord settings and
 * shows it only while the game runs. Generic: every game works without
 * per-game code.
 */
export function DiscordPresenceHintsSender({
  appName,
  filters,
}: {
  appName: string;
  filters: FiltersConfig;
}) {
  const t = useT();
  const { regions } = useCoordinates();
  const progressGroup = useSettingsStore((s) => s.discordProgressGroup);
  const progressCounts = useDiscoveryProgress(filters);
  const game = useMemo(() => games.find((g) => g.id === appName), [appName]);
  const lastSent = useRef<string | null>(null);

  const progress = useMemo(() => {
    if (progressGroup === "none") return undefined;
    let group = progressGroup;
    if (!group || !progressCounts.has(group)) {
      // Auto: the group the player has discovered the most of.
      group = null;
      let best = 0;
      for (const [id, count] of progressCounts) {
        if (count.found > best) {
          best = count.found;
          group = id;
        }
      }
    }
    const count = group ? progressCounts.get(group) : undefined;
    if (!group || !count || count.total === 0) return undefined;
    return { label: t(group, { fallback: group }), ...count };
  }, [progressGroup, progressCounts, t]);

  useEffect(() => {
    if (!game) return;

    const send = () => {
      const player = useGameState.getState().player;
      const hints: DiscordPresenceHints = {
        title: game.title,
        imageUrl: game.logo,
        mapUrl: game.web,
        progress,
      };
      if (player?.mapName) {
        hints.mapTitle = t(player.mapName, { fallback: player.mapName });
        const found = findPlayerRegion(regions, player.mapName, [
          player.x,
          player.y,
        ]);
        // Only a region the player is inside; "near X" is too vague for a card.
        if (found?.inside) {
          const regionTitle = t(found.region.id, { fallback: "" });
          if (regionTitle) hints.regionTitle = regionTitle;
        }
      }
      const json = JSON.stringify(hints);
      if (json === lastSent.current) return;
      lastSent.current = json;
      // No retry on failure: apps before the feature don't know the action,
      // and the next change sends again anyway.
      setDiscordPresenceHints(hints).catch(() => {});
    };
    send();
    const interval = setInterval(send, POLL_MS);
    return () => clearInterval(interval);
  }, [game, progress, regions, t]);

  return null;
}
