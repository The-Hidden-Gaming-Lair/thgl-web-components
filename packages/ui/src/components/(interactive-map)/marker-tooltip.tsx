import Markdown from "markdown-to-jsx";
import { useT } from "../(providers)";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { cn, useSettingsStore } from "@repo/lib";
import { Label } from "../ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Button } from "../ui/button";
import { Info, User, Users } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "../ui/hover-card";

export type TooltipItems = {
  id: string;
  termId: string;
  description?: string;
  type: string;
  group?: string;
  isPrivate?: boolean;
}[];

export function MarkerTooltip({
  latLng,
  items,
  onClose,
  hideDiscovered,
}: {
  latLng: [number, number];
  items: TooltipItems;
  onClose: () => void;
  hideDiscovered?: boolean;
}) {
  const t = useT();
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const toggleDiscoveredNode = useSettingsStore(
    (state) => state.toggleDiscoveredNode,
  );
  const removePrivateNode = useSettingsStore(
    (state) => state.removePrivateNode,
  );
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const privateNodes = useSettingsStore((state) => state.privateNodes);

  return (
    <Carousel>
      <CarouselContent>
        {items.map((item) => (
          <CarouselItem key={item.id}>
            <article className="space-y-1">
              <h3 className="text-lg">
                {t(item.termId, false, item.type) || item.termId}
              </h3>
              <p className="italic flex gap-2 items-center">
                {item.type.includes("private_") && (
                  <User className={cn("h-4 w-4 shrink-0")} />
                )}
                {item.type.includes("shared_") && (
                  <Users className={cn("h-4 w-4 shrink-0")} />
                )}
                {t(item.type) ||
                  item.type.replace("private_", "").replace(/shared_\d+_/, "")}
                {item.group && ` | ${t(item.group) || item.group}`}
              </p>
              <p className="text-xs text-muted-foreground">
                [{latLng[1].toFixed(0)}, {latLng[0].toFixed(0)}]
              </p>
              <div>
                <Markdown options={{ forceBlock: false }}>
                  {item.description
                    ? item.description.replace("\n", "<br>")
                    : t(item.termId, true)}
                </Markdown>
              </div>
            </article>
            {!hideDiscovered && (
              <>
                <Separator className="my-4" />
                {item.isPrivate ? (
                  <>
                    <div className="flex items-center space-x-2 text-sm">
                      <Button
                        size="sm"
                        onClick={() => {
                          const privateNode = privateNodes.find(
                            (node) => node.id === item.id,
                          );
                          setTempPrivateNode(privateNode ?? null);
                          onClose();
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          removePrivateNode(item.id);
                          onClose();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2 text-sm">
                    <Switch
                      id="discovered-node"
                      checked={discoveredNodes.includes(item.id)}
                      onCheckedChange={() => {
                        toggleDiscoveredNode(item.id);
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
                            Backup, restore and hide discovered nodes in the app
                            settings.
                          </p>
                          <p>Right-Click on the icon to toggle the node</p>
                        </HoverCardContent>
                      </HoverCardPortal>
                    </HoverCard>
                  </div>
                )}
              </>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      {items.length > 1 ? (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <span className="grow italic">
              This is a cluster of {items.length} items
            </span>
            <CarouselPrevious className="static transform-none" />
            <CarouselNext className="static transform-none" />
          </div>
        </>
      ) : null}
    </Carousel>
  );
}
