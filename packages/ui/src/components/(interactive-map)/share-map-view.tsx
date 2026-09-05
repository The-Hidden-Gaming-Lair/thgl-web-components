import { useUserStore } from "../(providers)";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
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
import { useCoordinates, useI18n, useT } from "../(providers)";
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
  const t = useT();
  const map = useMap();
  const { dict } = useI18n();

  const [withCenter, setWithCenter] = useState(true);
  const [withClickCenter, setWithClickCenter] = useState(true);
  const [withZoom, setWithZoom] = useState(true);
  const [withFilters, setWithFilters] = useState(true);
  const { globalFilters: allGlobalFilters, filters: allFilters } =
    useCoordinates();
  const { filters, globalFilters } = useUserStore();

  const url = useMemo(() => {
    const pathname = location.pathname.includes("/maps/")
      ? location.pathname
      : `/maps/${encodeURIComponent(dict[mapName] || mapName)}`;
    let url = `https://${domain}.th.gl${pathname}?map=${mapName}`;
    if (!map) {
      return url;
    }
    try {
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
    } catch (e) {}
    return url;
  }, [
    map,
    mapName,
    center,
    domain,
    dict,
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
          <DialogTitle>
            {t("shareView.title", { fallback: "Share Map View URL" })}
          </DialogTitle>
          <DialogDescription>
            {t("shareView.description", {
              fallback: "Copy the URL below to share the current map view.",
            })}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="withCenter">
              {t("shareView.addCenter", { fallback: "Add Map Center" })}
            </Label>
            <Switch
              id="withCenter"
              checked={withCenter}
              onCheckedChange={setWithCenter}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="withClickCenter">
              {t("shareView.useClickedCenter", {
                fallback: "Use Clicked Position as Center",
              })}
            </Label>
            <Switch
              id="withClickCenter"
              checked={withClickCenter}
              onCheckedChange={setWithClickCenter}
              disabled={!withCenter}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="withZoom">
              {t("shareView.addZoom", { fallback: "Add Zoom Level" })}
            </Label>
            <Switch
              id="withZoom"
              checked={withZoom}
              onCheckedChange={setWithZoom}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="withFilters">
              {t("shareView.addFilters", { fallback: "Add Filters" })}
            </Label>
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
                toast(
                  t("common.copiedToClipboard", {
                    fallback: "Copied to clipboard",
                  }),
                );
              }}
            >
              {t("common.copy", { fallback: "Copy" })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
