import Markdown from "markdown-to-jsx";
import { useCoordinates, useT } from "../(providers)";
import { useMemo } from "react";
import { getSpawnDiscoveryId, useSettingsStore } from "@repo/lib";
import { Badge } from "../ui/badge";

export function FilterTooltip({ id }: { id: string }) {
  const t = useT();
  const { nodes, typesIdMap, liveCapable } = useCoordinates();
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);

  const filterNode = useMemo(
    () => nodes.find((node) => node.type === id),
    [nodes, id],
  );
  const discoveredSpawns = useMemo(
    () =>
      filterNode?.spawns.filter((spawn) =>
        isDiscoveredNode(getSpawnDiscoveryId(filterNode.type, spawn)),
      ) || [],
    [discoveredNodes, filterNode],
  );

  const hasTypeIDsMap = typesIdMap && Object.keys(typesIdMap).length > 0;
  const supportsLiveMode =
    hasTypeIDsMap && Object.values(typesIdMap).includes(id);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold leading-tight">{t(id)}</p>

      {/* Spawn counts — muted labels, emphasized tabular figures. */}
      <p className="text-xs text-muted-foreground">
        {t("filters.tooltip.total")}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {filterNode?.spawns.length || 0}
        </span>
        <span className="mx-1.5 text-muted-foreground/50">·</span>
        {t("filters.tooltip.discovered")}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {discoveredSpawns.length}
        </span>
      </p>

      {/* Live-mode support + spawn behavior as one status row. The two facts
          overlap (a non-trackable filter is always "Fixed"), so the spawn-type
          badge only appears alongside "supported". */}
      {hasTypeIDsMap && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            {t("filters.tooltip.liveMode")}
          </span>
          {supportsLiveMode ? (
            <>
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("filters.tooltip.supported")}
              </span>
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-medium leading-4"
              >
                {filterNode?.static
                  ? t("filters.tooltip.static")
                  : t("filters.tooltip.dynamic")}
              </Badge>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-orange-500">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              {t("filters.tooltip.notSupported")}
            </span>
          )}
        </div>
      )}

      {/* Only when this filter CAN track live but the current session has no
          live source (plain web, no companion app and no Peer Link). */}
      {supportsLiveMode && !liveCapable && (
        <p className="text-[11px] text-muted-foreground/80">
          {t("filters.tooltip.inGameOnly")}
        </p>
      )}

      <div className="text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline">
        <Markdown>
          {t(id, {
            isDesc: true,
            fallback: id,
          })}
        </Markdown>
      </div>
    </div>
  );
}
