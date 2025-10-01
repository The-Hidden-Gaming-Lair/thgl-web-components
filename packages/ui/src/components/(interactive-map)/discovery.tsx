import { useSettingsStore } from "@repo/lib";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  Label,
  Switch,
} from "../(controls)";
import { Info } from "lucide-react";

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
          Discovered
        </Label>
        <HoverCard openDelay={20} closeDelay={20}>
          <HoverCardTrigger>
            <Info className="h-4 w-4" />
          </HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent className="text-sm w-auto">
              <p>
                Backup, restore and hide discovered nodes in the app settings.
              </p>
              <p>Right-Click on the icon to toggle the node</p>
              <p>In-Game App Only: Use the hotkey to toggle near-by node</p>
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
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              removeMyNode(id.split("@")[0]);
              onClose?.();
            }}
          >
            Delete
          </Button>
        </div>
      )}
    </>
  );
}
