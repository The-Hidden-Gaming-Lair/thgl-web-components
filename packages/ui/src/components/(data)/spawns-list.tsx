"use client";
import {
  getIconsUrl,
  getNodeId,
  type SimpleSpawn,
  useSettingsStore,
} from "@repo/lib";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useT } from "../(providers)";
import { Check, ImageUpscale, X } from "lucide-react";

/** A type's sprite icon at a fixed ~24px box (sprite cells are 64px or larger). */
function SpawnIcon({
  icon,
  appName,
  iconsPath,
}: {
  icon: SimpleSpawn["icon"];
  appName: string;
  iconsPath: string;
}) {
  if (!icon) return <span className="size-6 shrink-0" aria-hidden />;
  if (typeof icon === "string")
    return (
      <img
        src={getIconsUrl(appName, icon, iconsPath)}
        alt=""
        className="size-6 shrink-0 object-contain"
      />
    );
  return (
    <img
      src={getIconsUrl(appName, icon.url, iconsPath)}
      alt=""
      width={icon.width}
      height={icon.height}
      className="shrink-0 object-none"
      style={{
        width: icon.width,
        height: icon.height,
        objectPosition: `-${icon.x ?? 0}px -${icon.y ?? 0}px`,
        zoom: 24 / (icon.width || 64),
      }}
    />
  );
}

export function SpawnsList({
  spawns,
  onShowClick,
  highlightedIds,
  typeGroupLabels,
  appName,
  iconsPath = "/icons/icons.webp",
}: {
  /** For the type icons; rows render without icons when omitted. */
  appName?: string;
  /** Content-hashed sprite path (`version.more.icons`). The unhashed
   *  `/icons/icons.webp` is cached `immutable` but overwritten on every
   *  re-extraction, so browsers keep an old sprite and show wrong cells. */
  iconsPath?: string;
  spawns: SimpleSpawn[];
  onShowClick: (spawnIDs: string[]) => void;
  highlightedIds: string[];
  /** Map of type ID → group display name for section headers */
  typeGroupLabels?: Record<string, string>;
}) {
  useSettingsStore((state) => state.discoveredNodes);
  const t = useT();
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);

  // Build sections of spawn entries, grouped by type and optionally by group label.
  // Groups by type ID (not display name) so different filter types with the same
  // translated name stay separate (e.g. common "sifudog" vs predator "predator_sifudog").
  type Entry = {
    name: string;
    spawns: SimpleSpawn[];
    groupLabel: string | null;
  };
  type Section = { label: string | null; entries: Entry[] };

  // Resolve a spawn's display name. The server already populated
  // `spawn.name` with the dict-translated value using the full game
  // dictionary, so prefer that. As a defensive fallback for legacy
  // callers that build SimpleSpawn manually we retry via `t()` (the
  // client-side dict only ships UI strings, so this rarely yields
  // anything useful but at least we don't crash).
  const resolveName = (spawn: SimpleSpawn): string => {
    if (spawn.name) return spawn.name;
    return t(spawn.id, { fallback: spawn.type });
  };

  const sections: Section[] = (() => {
    // Group spawns by display name, but use a composite key of
    // "type:name" so same-named spawns from different filter types
    // stay separate (e.g. common vs predator "Dogen").
    const useTypeKey = Boolean(typeGroupLabels);
    const grouped: Record<string, SimpleSpawn[]> = {};
    for (const spawn of spawns) {
      const name = resolveName(spawn);
      const key = useTypeKey ? `${spawn.type || ""}::${name}` : name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(spawn);
    }

    if (typeGroupLabels) {
      // Organize entries into sections by group label
      const groupMap = new Map<string, Entry[]>();
      for (const [, groupSpawns] of Object.entries(grouped)) {
        const name = resolveName(groupSpawns[0]);
        const typeId = groupSpawns[0].type || "";
        const groupLabel = typeGroupLabels[typeId] ?? null;
        const key = groupLabel ?? "__ungrouped";
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push({ name, spawns: groupSpawns, groupLabel });
      }
      return [...groupMap.entries()].map(([key, entries]) => ({
        label: key === "__ungrouped" ? null : key,
        entries,
      }));
    }

    // No group labels — flat list
    return [
      {
        label: null,
        entries: Object.entries(grouped).map(([, s]) => ({
          name: resolveName(s[0]),
          spawns: s,
          groupLabel: null,
        })),
      },
    ];
  })();

  const markDiscoveredLabel = t("guide.spawns.markDiscovered", {
    fallback: "Mark as Discovered",
  });
  const resetProgressLabel = t("guide.spawns.resetProgress", {
    fallback: "Reset Progress",
  });
  const highlightLabel = t("guide.spawns.highlightOnMap", {
    fallback: "Highlight on Map",
  });

  return (
    <div className="flex flex-col gap-4 max-w-2xl w-full">
      {sections.map((section, si) => (
        <div key={section.label ?? si} className="flex flex-col gap-1.5">
          {section.label && (
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              {section.label}
            </h4>
          )}
          {section.entries.map((entry) => {
            const { name, spawns: groupSpawns } = entry;
            const progress = groupSpawns.filter((spawn) =>
              isDiscoveredNode(getNodeId(spawn)),
            ).length;
            const max = groupSpawns.length;
            const isMax = progress === max;
            const groupSpawnIds = groupSpawns.map((s) => s.id);
            const isHighlighted = highlightedIds.some((id) =>
              groupSpawnIds.includes(id),
            );
            // Entries are grouped by type AND name, so two types sharing a
            // display name (e.g. a location and a landmark both called
            // "Night Sky Temple") are separate rows — key them the same way.
            const key = `${groupSpawns[0]?.type ?? ""}::${name}`;
            return (
              <div
                key={key}
                className={
                  "flex gap-2 items-center rounded-md border bg-card px-2 py-1.5" +
                  (isHighlighted ? " border-primary" : "")
                }
              >
                {appName && (
                  <SpawnIcon
                    icon={groupSpawns[0]?.icon}
                    appName={appName}
                    iconsPath={iconsPath}
                  />
                )}
                <div className="grow min-w-0">
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold truncate">{name}</span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                      {progress}/{max}
                    </span>
                  </p>
                  <Progress
                    value={progress}
                    max={max}
                    className="mt-1 h-1.5"
                    aria-label={`${name}: ${progress} of ${max}`}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={() => {
                    // getNodeId, not raw s.id: for id-less spawns the raw id is
                    // the bare type, and checkNodeDiscovered's base-id match
                    // would mark the ENTIRE type discovered on every map.
                    groupSpawns.forEach((s) =>
                      setDiscoverNode(getNodeId(s), true),
                    );
                  }}
                  disabled={isMax}
                  className="shrink-0 size-8"
                  variant="ghost"
                  aria-label={markDiscoveredLabel}
                  title={markDiscoveredLabel}
                >
                  <Check color={isMax ? "green" : undefined} />
                </Button>
                <Button
                  size="icon"
                  onClick={() => {
                    if (
                      progress > 0 &&
                      !confirm(`Reset all ${progress} discovered ${name}?`)
                    )
                      return;
                    groupSpawns.forEach((s) =>
                      setDiscoverNode(getNodeId(s), false),
                    );
                  }}
                  disabled={progress === 0}
                  className="shrink-0 size-8 text-destructive hover:text-destructive"
                  variant="ghost"
                  aria-label={resetProgressLabel}
                  title={resetProgressLabel}
                >
                  <X />
                </Button>
                <Button
                  size="icon"
                  onClick={() =>
                    onShowClick(isHighlighted ? [] : groupSpawnIds)
                  }
                  className="shrink-0 size-8"
                  variant={isHighlighted ? "secondary" : "ghost"}
                  aria-label={highlightLabel}
                  title={highlightLabel}
                >
                  <ImageUpscale />
                </Button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
