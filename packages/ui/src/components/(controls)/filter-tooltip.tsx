import Markdown from "markdown-to-jsx";
import { useCoordinates, useT } from "../(providers)";
import { useMemo } from "react";
import { isOverwolf, useSettingsStore } from "@repo/lib";

export function FilterTooltip({ id }: { id: string }) {
  const t = useT();
  const { nodes, typesIdMap } = useCoordinates();
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);

  const filterNode = useMemo(
    () => nodes.find((node) => node.type === id),
    [nodes, id],
  );
  const discoveredSpawns = useMemo(
    () =>
      filterNode?.spawns.filter((spawn) => {
        const nodeId = spawn.isPrivate
          ? spawn.id!
          : `${spawn.id ?? filterNode.type}@${spawn.p[0]}:${spawn.p[1]}`;

        return isDiscoveredNode(nodeId);
      }) || [],
    [discoveredNodes, filterNode],
  );

  return (
    <>
      <p className="font-bold text-md">{t(id)}</p>
      <p className="text-muted-foreground text-sm">
        {t("filters.tooltip.total")} {filterNode?.spawns.length || 0} –{" "}
        {t("filters.tooltip.discovered")} {discoveredSpawns.length}
      </p>
      {typesIdMap && Object.keys(typesIdMap).length > 0 && (
        <p>
          {t("filters.tooltip.liveMode")}
          {Object.values(typesIdMap).includes(id) ? (
            <span className="text-primary mx-1">
              {t("filters.tooltip.supported")}
            </span>
          ) : (
            <span className="text-orange-500 mx-1">
              {t("filters.tooltip.notSupported")}
            </span>
          )}
          {!isOverwolf && (
            <span className="text-muted-foreground">
              {t("filters.tooltip.inGameOnly")}
            </span>
          )}
        </p>
      )}
      <p>
        {t("filters.tooltip.spawnType")}
        {filterNode?.static ? (
          <span className="mx-1">{t("filters.tooltip.static")}</span>
        ) : (
          <span className="mx-1">{t("filters.tooltip.dynamic")}</span>
        )}
      </p>
      <div className="mt-1">
        <Markdown>
          {t(id, {
            isDesc: true,
            fallback: id,
          })}
        </Markdown>
      </div>
    </>
  );
}
