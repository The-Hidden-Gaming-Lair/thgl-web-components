import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { Button } from "../ui/button";
import {
  type PrivateNode,
  cn,
  useSettingsStore,
  openFileOrFiles,
  useConnectionStore,
  putSharedNodes,
} from "@repo/lib";
import CanvasMarker from "./canvas-marker";
import type { LeafletMouseEvent } from "leaflet";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ColorPicker } from "../(controls)/color-picker";
import { Slider } from "../ui/slider";
import { useUserStore } from "../(providers)";
import { Info, MapPin, Upload } from "lucide-react";
import { trackEvent } from "../(header)/plausible-tracker";
import { IconPicker } from "../(controls)";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { FilterSelect } from "../(controls)/filter-select";
import { toast } from "sonner";
import { AddSharedNodes } from "./add-shared-nodes";

export function PrivateNode({ hidden }: { hidden?: boolean }) {
  const map = useMap();
  const canvasMarker = useRef<CanvasMarker | null>(null);
  const mapName = useUserStore((state) => state.mapName);
  const privateNodes = useSettingsStore((state) => state.privateNodes);
  const addPrivateNode = useSettingsStore((state) => state.addPrivateNode);
  const removePrivateNode = useSettingsStore(
    (state) => state.removePrivateNode,
  );
  const tempPrivateNode = useSettingsStore((state) => state.tempPrivateNode);
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const addSharedFilter = useSettingsStore((state) => state.addSharedFilter);
  const sharedFilters = useSettingsStore((state) => state.sharedFilters);

  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const isEditing = tempPrivateNode !== null;
  const radius = tempPrivateNode?.radius ?? 10;
  const color = tempPrivateNode?.color ?? "#FFFFFFAA";

  useEffect(() => {
    if (!map) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        try {
          // @ts-expect-error
          map?.pm.Draw.Line._finishShape();
        } catch (e) {
          //
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map]);

  useEffect(() => {
    if (!isEditing || !map) {
      return;
    }

    let latLng;
    if (!tempPrivateNode.p || tempPrivateNode.p.length !== 2) {
      const mapCenter = map.getCenter();
      setTempPrivateNode({
        p: [mapCenter.lat, mapCenter.lng],
      });
      latLng = [mapCenter.lat, mapCenter.lng] as [number, number];
    } else {
      latLng = tempPrivateNode.p;
    }
    const radius = tempPrivateNode.radius ?? 10;
    const privateNodeMarker = new CanvasMarker(latLng, {
      id: "private-node",
      icon: tempPrivateNode.icon ? tempPrivateNode.icon.url : null,
      baseRadius: 10,
      radius: radius * baseIconSize,
      fillColor: color,
      noCache: true,
    });
    let isDragging = false;
    privateNodeMarker.on("mousedown", (event) => {
      event.originalEvent.preventDefault();
      event.originalEvent.stopPropagation();
      isDragging = true;
    });
    const handleMouseMove = (event: LeafletMouseEvent) => {
      if (!isDragging) {
        return;
      }
      const { lat, lng } = event.latlng;
      privateNodeMarker.setLatLng([lat, lng]);
      setTempPrivateNode({ p: [lat, lng] });
    };
    map.on("mousemove", handleMouseMove);
    const handleClick = (event: LeafletMouseEvent) => {
      isDragging = false;
      const { lat, lng } = event.latlng;
      privateNodeMarker.setLatLng([lat, lng]);
      setTempPrivateNode({ p: [lat, lng] });
    };
    map.on("click", handleClick);
    privateNodeMarker.on("mouseup", (event) => {
      event.originalEvent.preventDefault();
      event.originalEvent.stopPropagation();
      isDragging = false;
    });

    try {
      privateNodeMarker.addTo(map);
    } catch (err) {}
    canvasMarker.current = privateNodeMarker;
    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("click", handleClick);
      privateNodeMarker.off();
      try {
        privateNodeMarker.remove();
      } catch (err) {}
    };
  }, [isEditing, map]);

  useEffect(() => {
    if (!isEditing || !canvasMarker.current) {
      return;
    }

    canvasMarker.current.setIcon(
      tempPrivateNode.icon ? tempPrivateNode.icon.url : null,
    );
    canvasMarker.current.setStyle({ fillColor: color });
    canvasMarker.current.setRadius(radius * baseIconSize);
    if (tempPrivateNode.p) {
      canvasMarker.current.setLatLng(tempPrivateNode.p);
    }
  }, [color, radius, baseIconSize, tempPrivateNode?.icon, tempPrivateNode?.p]);

  const sharedTempPrivateNode = useConnectionStore(
    (state) => state.tempPrivateNode,
  );
  useEffect(() => {
    if (!sharedTempPrivateNode || !map) {
      return;
    }
    if (sharedTempPrivateNode.mapName !== mapName) {
      return;
    }
    const latLng = sharedTempPrivateNode.p;
    if (!latLng) {
      return;
    }
    const radius = sharedTempPrivateNode.radius ?? 10;
    const privateNodeMarker = new CanvasMarker(latLng, {
      id: "shared-private-node",
      icon: sharedTempPrivateNode.icon ? sharedTempPrivateNode.icon.url : null,
      baseRadius: 10,
      radius: radius * baseIconSize,
      fillColor: sharedTempPrivateNode.color,
      noCache: true,
    });

    try {
      privateNodeMarker.addTo(map);
    } catch (err) {}
    return () => {
      try {
        privateNodeMarker.remove();
      } catch (err) {}
    };
  }, [sharedTempPrivateNode, baseIconSize, mapName]);

  useEffect(() => {
    if (tempPrivateNode) {
      setTempPrivateNode({ mapName });
    }
  }, [mapName]);

  if (hidden) {
    return <></>;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tempPrivateNode?.filter) {
      return;
    }

    if (!canvasMarker.current) {
      return;
    }

    const isExistingNode = tempPrivateNode.id
      ? privateNodes.some((marker) => marker.id === tempPrivateNode.id)
      : false;
    if (isExistingNode) {
      removePrivateNode(tempPrivateNode.id!);
    }
    const latLng = canvasMarker.current.getLatLng();
    const id = `${tempPrivateNode.filter}_${Date.now()}`;
    const marker: PrivateNode = {
      id,
      filter: tempPrivateNode.filter,
      name: tempPrivateNode.name,
      description: tempPrivateNode.description,
      color: color,
      icon: tempPrivateNode.icon
        ? { name: tempPrivateNode.icon.name, url: tempPrivateNode.icon.url }
        : null,
      radius,
      p: [latLng.lat, latLng.lng] as [number, number],
      mapName,
    };
    if (isExistingNode) {
      trackEvent("Private Node: Update", {
        props: { filter: marker.filter },
      });
    } else {
      trackEvent("Private Node: Add", {
        props: { filter: marker.filter },
      });
    }

    const isSharedFilter = marker.filter.includes("shared_");
    if (isSharedFilter) {
      const sharedFilter = sharedFilters.find(
        (f) => f.filter === marker.filter,
      );
      const markers = [
        ...privateNodes.filter(
          (node) => node.id !== marker.id && node.filter === marker.filter,
        ),
        marker,
      ];
      const newBlob = await putSharedNodes(
        sharedFilter?.url ?? marker.filter,
        markers,
      );
      if (!sharedFilter) {
        addSharedFilter({
          filter: marker.filter,
          url: newBlob.url,
        });
      }
    }

    addPrivateNode(marker);
    setFilters([...filters.filter((f) => f !== marker.filter), marker.filter!]);
    setTempPrivateNode(null);
  };

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        setTempPrivateNode(open ? { mapName } : null);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant={isEditing ? "secondary" : "outline"}
          className={cn("md:w-auto md:h-9 md:px-4 md:py-2")}
        >
          <MapPin className="md:mr-2 h-4 w-4" />
          <span className="hidden md:inline">Add Node</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Add Node</h4>
              <p className="text-sm text-muted-foreground">
                Drag the icon or click on the map to change its position.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="filter" className="flex gap-1 items-center">
                  Filter
                  <HoverCard openDelay={50} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      You can group nodes by filters. For example, you can use a
                      filter to group all nodes related to a specific quest. The
                      filter is toggled on and off in the search. Shared nodes
                      can be imported by other users.
                    </HoverCardContent>
                  </HoverCard>
                </Label>
                <FilterSelect id="filter" className="col-span-2 h-8" />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="name" className="flex gap-1 items-center">
                  Name
                  <HoverCard openDelay={50} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      An optional name for the node, which is visible in the
                      search and tooltip.
                    </HoverCardContent>
                  </HoverCard>
                </Label>
                <Input
                  id="name"
                  className="col-span-2 h-8"
                  value={tempPrivateNode?.name ?? ""}
                  onChange={(e) => setTempPrivateNode({ name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label
                  htmlFor="description"
                  className="flex gap-1 items-center"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="col-span-2 resize-none"
                  value={tempPrivateNode?.description ?? ""}
                  onChange={(e) =>
                    setTempPrivateNode({ description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="color">Color</Label>
                <ColorPicker
                  id="color"
                  className="col-span-2 h-8"
                  value={color}
                  onChange={(color) => setTempPrivateNode({ color })}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>Icon</Label>
                <IconPicker
                  className="col-span-2 h-8"
                  value={tempPrivateNode?.icon ?? null}
                  onChange={(icon) => setTempPrivateNode({ icon })}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="radius">Size</Label>
                <Slider
                  id="radius"
                  className="col-span-2 h-8 p-0"
                  value={[radius]}
                  onValueChange={(values) => {
                    setTempPrivateNode({ radius: values[0] });
                  }}
                  min={1}
                  max={30}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>X/Y</Label>
                <div className="flex basis-1/2 col-span-2">
                  <Input
                    className="h-8"
                    type="number"
                    value={tempPrivateNode?.p?.[1] ?? 0}
                    onChange={(e) => {
                      setTempPrivateNode({
                        p: [tempPrivateNode?.p?.[0] ?? 0, +e.target.value],
                      });
                      if (
                        !Number.isNaN(tempPrivateNode?.p?.[0] ?? 0) &&
                        !Number.isNaN(+e.target.value)
                      ) {
                        canvasMarker.current?.setLatLng([
                          tempPrivateNode?.p?.[0] ?? 0,
                          +e.target.value,
                        ]);
                      }
                    }}
                  />
                  <Input
                    className="h-8"
                    type="number"
                    value={tempPrivateNode?.p?.[0] ?? 0}
                    onChange={(e) => {
                      setTempPrivateNode({
                        p: [+e.target.value, tempPrivateNode?.p?.[1] ?? 0],
                      });
                      if (
                        !Number.isNaN(tempPrivateNode?.p?.[1] ?? 0) &&
                        !Number.isNaN(+e.target.value)
                      ) {
                        canvasMarker.current?.setLatLng([
                          +e.target.value,
                          tempPrivateNode?.p?.[1] ?? 0,
                        ]);
                      }
                    }}
                  />
                </div>
              </div>
              <Separator className="my-2" />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Button size="sm" type="submit">
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTempPrivateNode(null)}
              type="button"
            >
              Cancel
            </Button>
          </div>
        </form>
        <Separator className="my-2" />
        <div className="flex items-center space-x-2 mt-2">
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={async () => {
              const file = await openFileOrFiles();
              if (!file) {
                return;
              }
              const reader = new FileReader();
              reader.addEventListener("load", (loadEvent) => {
                const text = loadEvent.target?.result;
                if (!text || typeof text !== "string") {
                  return;
                }
                try {
                  const data = JSON.parse(text);
                  if (typeof data !== "object") {
                    return;
                  }
                  if (!Array.isArray(data)) {
                    return;
                  }
                  data.forEach(addPrivateNode);
                  toast(
                    `Nodes imported to filter: ${data[0].filter
                      .replace("private_", "")
                      .replace(/shared_\d+_/, "")}`,
                  );
                } catch (error) {
                  // Do nothing
                }
              });
              reader.readAsText(file);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Nodes
          </Button>
          <AddSharedNodes />
        </div>
      </PopoverContent>
    </Popover>
  );
}
