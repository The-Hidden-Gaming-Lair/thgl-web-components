"use client";
import { type SimpleSpawn, useSettingsStore } from "@repo/lib";
import { Button, Progress } from "@repo/ui/controls";
import { useT } from "@repo/ui/providers";
import { Check, ImageUpscale, X } from "lucide-react";

export function SpawnsList({
  spawns,
  onShowClick,
  highlightedIds,
}: {
  spawns: SimpleSpawn[];
  onShowClick: (spawnIDs: string[]) => void;
  highlightedIds: string[];
}) {
  useSettingsStore((state) => state.discoveredNodes);
  const t = useT();
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);

  const groupById = spawns.reduce(
    (acc, spawn) => {
      const name = t(spawn.id, false, spawn.type);
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(spawn);
      return acc;
    },
    {} as Record<string, SimpleSpawn[]>,
  );

  return (
    <div className="flex flex-col gap-1 max-w-2xl w-full">
      {Object.entries(groupById).map(([name, groupSpawns]) => {
        const progress = groupSpawns.filter((spawn) =>
          isDiscoveredNode(spawn.id),
        ).length;
        const max = groupSpawns.length;
        const isMax = progress === max;
        const groupSpawnIds = groupSpawns.map((s) => s.id);
        const isHighlighted = highlightedIds.some((id) =>
          groupSpawnIds.includes(id),
        );
        return (
          <div key={name} className="flex gap-2 items-center">
            <div className="relative grow overflow-hidden">
              <p className="text-md font-bold px-2 py-2 text-shadow truncate">
                <span className="truncate">{name}</span>
                <span className="text-xs ml-2 font-normal">
                  ({progress}/{max})
                </span>
              </p>
              <Progress
                value={progress}
                max={max}
                className="absolute inset-0 h-full -z-10 rounded-md"
              />
            </div>
            <Button
              size="icon"
              onClick={() => {
                groupSpawns.forEach((s) => setDiscoverNode(s.id, true));
              }}
              disabled={isMax}
              className="shrink-0"
              variant={isMax ? "ghost" : "outline"}
              title="Mark as Discovered"
            >
              <Check color={isMax ? "green" : undefined} />
            </Button>
            <Button
              size="icon"
              onClick={() => {
                groupSpawns.forEach((s) => setDiscoverNode(s.id, false));
              }}
              disabled={progress === 0}
              className="shrink-0"
              variant="destructive"
              title="Reset Progress"
            >
              <X />
            </Button>
            <Button
              size="icon"
              onClick={() => onShowClick(isHighlighted ? [] : groupSpawnIds)}
              className="shrink-0"
              variant={isHighlighted ? "secondary" : "ghost"}
              title="Highlight on Map"
            >
              <ImageUpscale />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
