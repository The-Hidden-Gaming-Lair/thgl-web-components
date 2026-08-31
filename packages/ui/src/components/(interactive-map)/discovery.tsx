import { useSettingsStore } from "@repo/lib";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Info } from "lucide-react";
import { useT } from "../(providers)";

export function Discovery({
  id,
  isPrivate,
  isLive,
  onClose,
}: {
  id: string;
  isPrivate?: boolean;
  isLive?: boolean;
  onClose?: () => void;
}) {
  const t = useT();
  useSettingsStore((state) => state.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);
  const toggleDiscoveredNode = useSettingsStore(
    (state) => state.toggleDiscoveredNode,
  );
  const removeMyNode = useSettingsStore((state) => state.removeMyNode);
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );

  return (
    <>
      <div className="flex items-center space-x-2 text-sm">
        <Switch
          id="discovered-node"
          checked={isDiscoveredNode(id)}
          onCheckedChange={() => {
            toggleDiscoveredNode(id);
          }}
        />
        <Label htmlFor="discovered-node" className="grow">
          {t("markers.discovered", { fallback: "Discovered" })}
        </Label>
        <HoverCard openDelay={20} closeDelay={20}>
          <HoverCardTrigger>
            <Info className="h-4 w-4" />
          </HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent className="text-sm w-auto">
              <p>
                {t("discovered.backupHint", {
                  fallback:
                    "Backup, restore and hide discovered nodes in the app settings.",
                })}
              </p>
              <p>
                {t("discovered.rightClickHint", {
                  fallback: "Right-Click on the icon to toggle the node",
                })}
              </p>
              <p>
                {t("discovered.hotkeyHint", {
                  fallback:
                    "In-Game App Only: Use the hotkey to toggle near-by node",
                })}
              </p>
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      </div>
      {isPrivate && (
        <div className="flex items-center space-x-2 text-sm mt-2">
          <Button
            size="sm"
            onClick={() => {
              const myFilter = useSettingsStore
                .getState()
                .myFilters.find((filter) =>
                  filter.nodes?.some(
                    (node) =>
                      `${node.id ?? filter.name}@${node.p[0]}:${node.p[1]}` ===
                      id,
                  ),
                );
              const privateNode = myFilter?.nodes?.find(
                (node) =>
                  `${node.id ?? myFilter.name}@${node.p[0]}:${node.p[1]}` ===
                  id,
              );
              if (!myFilter || !privateNode) return;
              setTempPrivateNode({
                ...privateNode,
                filter: myFilter.name,
              });
              onClose?.();
            }}
          >
            {t("common.edit", { fallback: "Edit" })}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              removeMyNode(id.split("@")[0]);
              onClose?.();
            }}
          >
            {t("common.delete", { fallback: "Delete" })}
          </Button>
        </div>
      )}
    </>
  );
}
