import Markdown from "markdown-to-jsx";
import { useT } from "../(providers)";
import { ExternalAnchor } from "../(header)";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { useSettingsStore } from "@repo/lib";
import { Label } from "../ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Button } from "../ui/button";

export type TooltipItems = {
  id: string;
  termId: string;
  description?: string;
  type: string;
  group?: string;
  isPrivate?: boolean;
}[];

export function MarkerHoverCard({
  latLng,
  items,
  onClose,
}: {
  latLng: [number, number];
  items: TooltipItems;
  onClose: () => void;
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
              <p className="italic">
                {t(item.type) || item.type.replace("private_", "")}
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
                <Label htmlFor="discovered-node">Discovered</Label>
              </div>
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
