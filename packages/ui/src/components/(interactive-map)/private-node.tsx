"use client";
import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { Button } from "../ui/button";
import {
  type PrivateNode,
  cn,
  useSettingsStore,
  useConnectionStore,
  putSharedFilters,
  useUserStore,
} from "@repo/lib";
import CanvasMarker from "./canvas-marker";
import type { LeafletMouseEvent } from "leaflet";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ColorPicker } from "../(controls)/color-picker";
import { Slider } from "../ui/slider";
import { Info, MapPin } from "lucide-react";
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
import { AddSharedFilter } from "./add-shared-filter";
import { UploadFilter } from "./upload-filter";

export function PrivateNode({
  appName,
  hidden,
  iconsPath,
}: {
  appName?: string;
  hidden?: boolean;
  iconsPath?: string;
}) {
  const map = useMap();
  const canvasMarker = useRef<CanvasMarker | null>(null);
  const mapName = useUserStore((state) => state.mapName);
  const myFilters = useSettingsStore((state) => state.myFilters);
  const setMyFilters = useSettingsStore((state) => state.setMyFilters);
  const tempPrivateNode = useSettingsStore((state) => state.tempPrivateNode);
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const isEditing = tempPrivateNode !== null;
  const radius = tempPrivateNode?.radius ?? 10;
  const color = tempPrivateNode?.color ?? "#FFFFFFCC";

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
      icon: tempPrivateNode.icon || null,
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

    if (canvasMarker.current.options.icon !== tempPrivateNode.icon) {
      canvasMarker.current.setIcon(tempPrivateNode.icon || null);
    }
    if (canvasMarker.current.options.fillColor !== color) {
      canvasMarker.current.setStyle({ fillColor: color });
    }
    const newRadius = radius * baseIconSize;
    if (canvasMarker.current.options.radius !== newRadius) {
      canvasMarker.current.setRadius(newRadius);
    }
    const latLng = canvasMarker.current.getLatLng();
    if (
      tempPrivateNode.p &&
      (latLng.lat !== tempPrivateNode.p[0] ||
        latLng.lng !== tempPrivateNode.p[1])
    ) {
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
      icon: sharedTempPrivateNode.icon,
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

    const latLng = canvasMarker.current.getLatLng();
    const id = `${tempPrivateNode.filter}_${Date.now()}`;
    const marker: PrivateNode = {
      id,
      name: tempPrivateNode.name,
      description: tempPrivateNode.description,
      color: color,
      icon: tempPrivateNode.icon || null,
      radius,
      p: [latLng.lat, latLng.lng] as [number, number],
      mapName,
    };

    const newMyFilters = [...myFilters];
    const myFilter = newMyFilters.find(
      (filter) => filter.name === tempPrivateNode.filter,
    );
    if (!myFilter) {
      return;
    }
    myFilter.nodes =
      myFilter.nodes?.filter((marker) => marker.id !== tempPrivateNode.id) ??
      [];
    myFilter.nodes.push(marker);

    if (tempPrivateNode.id) {
      trackEvent("Private Node: Update", {
        props: { filter: tempPrivateNode.filter },
      });
    } else {
      trackEvent("Private Node: Add", {
        props: { filter: tempPrivateNode.filter },
      });
    }

    if (myFilter.isShared && myFilter.url) {
      putSharedFilters(myFilter.url, myFilter);
    }

    setMyFilters(newMyFilters);
    setFilters([
      ...filters.filter((f) => f !== tempPrivateNode.filter),
      tempPrivateNode.filter,
    ]);
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
          className={cn("lg:w-auto lg:h-9 lg:px-4 lg:py-2")}
        >
          <MapPin className="lg:mr-2 h-4 w-4" />
          <span className="hidden lg:inline">Add Node</span>
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
                <FilterSelect
                  id="filter"
                  className="col-span-2 h-8"
                  filter={tempPrivateNode?.filter}
                  onFilterSelect={(filter) => {
                    setTempPrivateNode({
                      filter,
                    });
                  }}
                />
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
                  appName={appName}
                  className="col-span-2 h-8"
                  value={tempPrivateNode?.icon ?? null}
                  onChange={(icon) => setTempPrivateNode({ icon })}
                  iconsPath={iconsPath}
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
            <Button size="sm" type="submit" disabled={!tempPrivateNode?.filter}>
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
          <UploadFilter />
          <AddSharedFilter />
        </div>
      </PopoverContent>
    </Popover>
  );
}
