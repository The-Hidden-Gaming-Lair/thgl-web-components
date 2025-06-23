"use client";
import { Button } from "../ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  writeFileOverwolf,
  saveFile,
  useSettingsStore,
  openFileOrFiles,
} from "@repo/lib";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { ReactNode } from "react";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { IconSizes } from "./icon-sizes";
import { ColorPicker } from "./color-picker";

export function SettingsDialogContent({
  activeApp,
  more,
  children,
  hideAppSettings,
  withoutTraceLines = false,
}: {
  activeApp: string;
  more?: ReactNode;
  children?: ReactNode;
  hideAppSettings?: boolean;
  withoutTraceLines?: boolean;
}) {
  const settingsStore = useSettingsStore();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>
      <ScrollArea>
        <div className="space-y-2 pr-3">
          {more ? (
            <>
              {more}
              <Separator />
            </>
          ) : null}
          <h4 className="text-md font-semibold">Discovered Nodes</h4>
          <p className="text-muted-foreground text-xs">
            You discovered {settingsStore.discoveredNodes.length} nodes.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => {
                const fileName = `${activeApp}_discovered_nodes_${Date.now()}.json`;
                if (typeof overwolf === "undefined") {
                  const blob = new Blob(
                    [JSON.stringify(settingsStore.discoveredNodes)],
                    {
                      type: "text/json",
                    },
                  );
                  saveFile(blob, fileName);
                } else {
                  writeFileOverwolf(
                    JSON.stringify(settingsStore.discoveredNodes),
                    overwolf.io.paths.documents + "\\the-hidden-gaming-lair",
                    fileName,
                  );
                }
              }}
            >
              Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
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
                    let discoveredNodes = JSON.parse(text);
                    if (!Array.isArray(discoveredNodes)) {
                      discoveredNodes = [];
                    } else if (
                      discoveredNodes.some((node) => typeof node !== "string")
                    ) {
                      discoveredNodes = discoveredNodes.filter(
                        (node) => typeof node === "string",
                      );
                    }
                    settingsStore.setDiscoveredNodes(discoveredNodes);
                    toast.success("Discovered nodes restored");
                  } catch (error) {
                    // Do nothing
                  }
                });
                reader.readAsText(file);
              }}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                settingsStore.setDiscoveredNodes([]);
                toast.warning("Discovered nodes reset");
              }}
            >
              Reset
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-discovered-nodes">Hide Discovered Nodes</Label>
            <Switch
              id="hide-discovered-nodes"
              checked={settingsStore.hideDiscoveredNodes}
              onCheckedChange={settingsStore.toggleHideDiscoveredNodes}
            />
          </div>
          <Separator />
          <h4 className="text-md font-semibold">My Filters</h4>
          <p className="text-muted-foreground text-xs">
            You have {settingsStore.myFilters.length} filters.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => {
                const fileName = `${activeApp}_My_Filters_${Date.now()}.json`;
                if (typeof overwolf === "undefined") {
                  const blob = new Blob(
                    [JSON.stringify(settingsStore.myFilters)],
                    {
                      type: "text/json",
                    },
                  );
                  saveFile(blob, fileName);
                } else {
                  writeFileOverwolf(
                    JSON.stringify(settingsStore.myFilters),
                    overwolf.io.paths.documents + "\\the-hidden-gaming-lair",
                    fileName,
                  );
                }
              }}
            >
              Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
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
                    let myFilters = JSON.parse(text);
                    if (!Array.isArray(myFilters)) {
                      myFilters = [];
                    }

                    settingsStore.setMyFilters(myFilters);
                    toast.success("My filters restored");
                  } catch (error) {
                    // Do nothing
                  }
                });
                reader.readAsText(file);
              }}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                settingsStore.setMyFilters([]);
                toast.warning("My filters reset");
              }}
            >
              Reset
            </Button>
          </div>
          {hideAppSettings ? (
            <IconSizes />
          ) : (
            <>
              <Separator />
              <h4 className="text-md font-semibold">User Interface</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-trace-line">
                  Zoom map on filters change
                </Label>
                <Switch
                  id="show-trace-line"
                  checked={settingsStore.fitBoundsOnChange}
                  onCheckedChange={settingsStore.toggleFitBoundsOnChange}
                />
              </div>
              <div className="flex items-center gap-2 justify-between">
                Reset UI positions
                <Button onClick={settingsStore.resetTransform} size="sm">
                  Reset
                </Button>
              </div>
              <IconSizes />
              <Separator />
              <h4 className="text-md font-semibold">Trace Line</h4>
              {withoutTraceLines ? (
                <p className="text-muted-foreground text-xs">
                  This game does not support trace lines.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-trace-line">Show Trace Line</Label>
                    <Switch
                      id="show-trace-line"
                      checked={settingsStore.showTraceLine}
                      onCheckedChange={settingsStore.toggleShowTraceLine}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="trace-line-length">Trace Line Length</Label>
                    <Input
                      type="number"
                      id="trace-line-length"
                      value={settingsStore.traceLineLength}
                      className="w-fit"
                      onChange={(event) =>
                        settingsStore.setTraceLineLength(+event.target.value)
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="trace-line-rate">Trace Line Rate</Label>
                    <Input
                      type="number"
                      id="trace-line-rate"
                      value={settingsStore.traceLineRate}
                      className="w-fit"
                      onChange={(event) =>
                        settingsStore.setTraceLineRate(+event.target.value)
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="trace-line-color">Trace Line Color</Label>
                    <ColorPicker
                      id="trace-line-color"
                      value={settingsStore.traceLineColor}
                      onChange={settingsStore.setTraceLineColor}
                    />
                  </div>
                </>
              )}
            </>
          )}
          {children}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
