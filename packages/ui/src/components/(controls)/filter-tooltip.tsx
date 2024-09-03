import Markdown from "markdown-to-jsx";
import { useCoordinates, useT } from "../(providers)";
import { useMemo } from "react";
import { useSettingsStore } from "@repo/lib";

export function FilterTooltip({ id }: { id: string }) {
  const t = useT();
  const { nodes } = useCoordinates();
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
      <Markdown>{t(id, true, id)}</Markdown>
    </>
  );
}
