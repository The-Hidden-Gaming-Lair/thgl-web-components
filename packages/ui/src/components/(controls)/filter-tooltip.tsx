import Markdown from "markdown-to-jsx";
import { useCoordinates, useT } from "../(providers)";
import { useMemo } from "react";
import { isOverwolf, useSettingsStore } from "@repo/lib";

export function FilterTooltip({ id }: { id: string }) {
  const t = useT();
  const { nodes, typesIdMap } = useCoordinates();
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const filterNode = useMemo(
    () => nodes.find((node) => node.type === id),
    [nodes, id],
  );
  const discoveredSpawns =
    filterNode?.spawns.filter((spawn) => {
      const nodeId = spawn.isPrivate
        ? spawn.id!
        : `${spawn.id ?? filterNode.type}@${spawn.p[0]}:${spawn.p[1]}`;

      return discoveredNodes.includes(nodeId);
    }) || [];
  return (
    <>
      <p className="font-bold text-md">{t(id)}</p>
      <p className="text-muted-foreground text-sm">
        Total: {filterNode?.spawns.length || 0} – Discovered:{" "}
        {discoveredSpawns.length}
      </p>
      {typesIdMap && (
        <p>
          Live Mode:
          {Object.values(typesIdMap).includes(id) ? (
            <span className="text-primary mx-1">supported</span>
          ) : (
            <span className="text-orange-500 mx-1">not supported</span>
          )}
          {!isOverwolf && (
            <span className="text-muted-foreground">(In-Game App only)</span>
          )}
        </p>
      )}
      <p>
        Spawn Type:
        {filterNode?.static ? (
          <span className="mx-1">static</span>
        ) : (
          <span className="mx-1">dynamic</span>
        )}
      </p>
      <div className="mt-1">
        <Markdown>{t(id, true, id)}</Markdown>
      </div>
    </>
  );
}
