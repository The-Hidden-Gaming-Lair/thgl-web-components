import { useMemo, useState } from "react";
import { Button, Label, Switch } from "../(controls)";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { useMap } from "./store";
import { useCoordinates, useUserStore } from "../(providers)";
import { mapArrayValues } from "@repo/lib";

export function ShareMapView({
  mapName,
  center,
  open,
  onClose,
  domain,
}: {
  mapName: string;
  center?: [number, number];
  open: boolean;
  onClose: () => void;
  domain: string;
}) {
  const map = useMap();

  const [withCenter, setWithCenter] = useState(true);
  const [withClickCenter, setWithClickCenter] = useState(true);
  const [withZoom, setWithZoom] = useState(true);
  const [withFilters, setWithFilters] = useState(true);
  const { globalFilters: allGlobalFilters, filters: allFilters } =
    useCoordinates();
  const { filters, globalFilters } = useUserStore();

  const url = useMemo(() => {
    let url = `https://${domain}.th.gl/?map=${mapName}`;
    if (!map) {
      return url;
    }
    if (withCenter) {
      if (withClickCenter && center) {
        url += `&center=${center.join(",")}`;
      } else {
        url += `&center=${map.getCenter().lat},${map.getCenter().lng}`;
      }
    }
    if (withZoom) {
      url += `&zoom=${map.getZoom()}`;
    }
    if (withFilters) {
      const gIds = Object.values(allGlobalFilters).flatMap((g) =>
        g.values.map((v) => v.id),
      );
      const fIds = Object.values(allFilters).flatMap((f) =>
        f.values.map((v) => v.id),
      );
      const gStr = mapArrayValues(gIds, globalFilters);
      const fStr = mapArrayValues(fIds, filters);

      url += `&filters=${JSON.stringify({ f: fStr, g: gStr })}`;
    }
    return url;
  }, [
    map,
    mapName,
    center,
    withCenter,
    withClickCenter,
    withZoom,
    withFilters,
    filters,
    globalFilters,
  ]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Map View URL</DialogTitle>
          <DialogDescription>
            Copy the URL below to share the current map view.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="withCenter">Add Map Center</Label>
            <Switch
              id="withCenter"
              checked={withCenter}
              onCheckedChange={setWithCenter}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="withClickCenter">
              Use Clicked Position as Center
            </Label>
            <Switch
              id="withClickCenter"
              checked={withClickCenter}
              onCheckedChange={setWithClickCenter}
              disabled={!withCenter}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="withZoom">Add Zoom Level</Label>
            <Switch
              id="withZoom"
              checked={withZoom}
              onCheckedChange={setWithZoom}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="withFilters">Add Filters</Label>
            <Switch
              id="withFilters"
              checked={withFilters}
              onCheckedChange={setWithFilters}
            />
          </div>
          <Separator />
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="url" placeholder="URL" value={url} />
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast("Copied to clipboard");
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
