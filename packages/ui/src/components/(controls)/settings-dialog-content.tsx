"use client";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  writeFileOverwolf,
  saveFile,
  useSettingsStore,
  openFileOrFiles,
  FiltersConfig,
} from "@repo/lib";
import { useT } from "../(providers)";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { ReactNode } from "react";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { IconSizes } from "./icon-sizes";
import { ColorPicker } from "./color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { ProfileManager } from "./profile-manager";
import { Play, RotateCcw, X } from "lucide-react";
import { playAlertSound, ALERT_SOUND_OPTIONS } from "./audio-alert";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5 rounded-md bg-muted/20 p-3">
      <div>
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        {description && (
          <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function SettingsDialogContent({
  activeApp,
  more,
  children,
  hideAppSettings,
  withoutTraceLines = false,
  filters,
}: {
  activeApp: string;
  more?: ReactNode;
  children?: ReactNode;
  hideAppSettings?: boolean;
  withoutTraceLines?: boolean;
  filters: FiltersConfig;
}) {
  const settingsStore = useSettingsStore();
  const profileSettings = useSettingsStore((state) => state);
  const t = useT();
  return (
    <DialogContent
      onMouseDown={(e) => e.stopPropagation()}
      aria-describedby="settings-dialog-description"
    >
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription id="settings-dialog-description">
          Configure your application settings below.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea>
        <div className="space-y-3 pr-3">
          {more ? (
            <>
              {more}
              <Separator />
            </>
          ) : null}

          {/* Profiles */}
          <Section
            title="Profiles"
            description="Manage your settings profiles to quickly switch between different configurations."
          >
            <ProfileManager activeApp={activeApp} />
          </Section>

          {/* Discovered Nodes */}
          <Section
            title="Discovered Nodes"
            description={`You discovered ${settingsStore.discoveredNodes.length} nodes.`}
          >
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
                        discoveredNodes.some(
                          (node: unknown) => typeof node !== "string",
                        )
                      ) {
                        discoveredNodes = discoveredNodes.filter(
                          (node: unknown) => typeof node === "string",
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
              <Label htmlFor="hide-discovered-nodes">
                Hide Discovered Nodes
              </Label>
              <Switch
                id="hide-discovered-nodes"
                checked={settingsStore.hideDiscoveredNodes}
                onCheckedChange={settingsStore.toggleHideDiscoveredNodes}
              />
            </div>
          </Section>

          {/* My Filters */}
          <Section
            title="My Filters"
            description={`You have ${settingsStore.myFilters.length} filters.`}
          >
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Backup &amp; Restore
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
                        overwolf.io.paths.documents +
                          "\\the-hidden-gaming-lair",
                        fileName,
                      );
                    }
                  }}
                >
                  Export All
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
                  Import All
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
            </div>
          </Section>

          {/* Accessibility */}
          <Section title="Accessibility">
            <div className="flex items-center gap-2 justify-between">
              <Label htmlFor="color-blind-mode">Color Blind Mode</Label>
              <Select
                value={profileSettings.colorBlindMode}
                onValueChange={settingsStore.setColorBlindMode}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="protanopia">Protanopia</SelectItem>
                  <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                  <SelectItem value="tritanopia">Tritanopia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <Label htmlFor="color-blind-severity">Color Blind Severity</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="color-blind-severity"
                  className="w-40 h-8 p-0"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[profileSettings.colorBlindSeverity]}
                  onValueChange={(values) => {
                    settingsStore.setColorBlindSeverity(values[0]);
                  }}
                />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(profileSettings.colorBlindSeverity * 100)}%
                </span>
              </div>
            </div>
            <Separator className="opacity-30" />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-contrast-mode">
                  High Contrast Markers
                </Label>
                <p className="text-muted-foreground text-xs">
                  Adds a bright glow around markers for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast-mode"
                checked={profileSettings.highContrastMode}
                onCheckedChange={settingsStore.toggleHighContrastMode}
              />
            </div>
            {profileSettings.highContrastMode && (
              <>
                <div className="flex items-center gap-2 justify-between">
                  <Label htmlFor="high-contrast-color">Outline Color</Label>
                  <ColorPicker
                    id="high-contrast-color"
                    value={profileSettings.highContrastColor}
                    onChange={settingsStore.setHighContrastColor}
                  />
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <Label htmlFor="high-contrast-thickness">
                    Outline Thickness
                  </Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="high-contrast-thickness"
                      className="w-28 h-8 p-0"
                      min={1}
                      max={6}
                      step={1}
                      value={[profileSettings.highContrastThickness]}
                      onValueChange={(values) => {
                        settingsStore.setHighContrastThickness(values[0]);
                      }}
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {profileSettings.highContrastThickness}px
                    </span>
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* Icon Sizes & Map Behavior */}
          <Section title="Icon Sizes">
            <IconSizes filters={filters} />
            <div className="flex items-center justify-between mt-3">
              <Label htmlFor="dynamic-icon-size">
                Dynamic icon size (zoom-based)
              </Label>
              <Switch
                id="dynamic-icon-size"
                checked={profileSettings.dynamicIconSize}
                onCheckedChange={settingsStore.toggleDynamicIconSize}
              />
            </div>
            {profileSettings.dynamicIconSize && (
              <div className="flex items-center gap-2 justify-between mt-2">
                <Label htmlFor="dynamic-icon-factor">Factor</Label>
                <Slider
                  id="dynamic-icon-factor"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={[profileSettings.dynamicIconSizeFactor]}
                  onValueChange={([v]) =>
                    settingsStore.setDynamicIconSizeFactor(v)
                  }
                  className="w-32"
                />
              </div>
            )}
          </Section>

          {!hideAppSettings && (
            <>
              {/* Map Behavior */}
              <Section title="Map Behavior">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zoom-on-filter-change">
                    Zoom map on filters change
                  </Label>
                  <Switch
                    id="zoom-on-filter-change"
                    checked={profileSettings.fitBoundsOnChange}
                    onCheckedChange={settingsStore.toggleFitBoundsOnChange}
                  />
                </div>
              </Section>

              {/* Trace Line */}
              <Section
                title="Trace Line"
                description={
                  withoutTraceLines
                    ? "This game does not support trace lines."
                    : undefined
                }
              >
                {!withoutTraceLines && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-trace-line">Show Trace Line</Label>
                      <Switch
                        id="show-trace-line"
                        checked={profileSettings.showTraceLine}
                        onCheckedChange={settingsStore.toggleShowTraceLine}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="follow-player">Follow Player</Label>
                      <Switch
                        id="follow-player"
                        checked={profileSettings.followPlayer}
                        onCheckedChange={settingsStore.toggleFollowPlayer}
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-between">
                      <Label htmlFor="trace-line-length">
                        Trace Line Length
                      </Label>
                      <Input
                        type="number"
                        id="trace-line-length"
                        value={profileSettings.traceLineLength}
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
                        value={profileSettings.traceLineRate}
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
                        value={profileSettings.traceLineColor}
                        onChange={settingsStore.setTraceLineColor}
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-between">
                      <Label htmlFor="trace-line-style">Trace Line Style</Label>
                      <Select
                        value={profileSettings.traceLineStyle}
                        onValueChange={(v) =>
                          settingsStore.setTraceLineStyle(v as "dots" | "line")
                        }
                      >
                        <SelectTrigger className="w-24" id="trace-line-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dots">Dots</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </Section>

              {/* Proximity Range */}
              <Section
                title="Proximity Range"
                description='Used by audio alerts, "In Range" labels, and "Discover Nearest Node". Configure per-filter using the settings icon next to each filter.'
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="proximity-range">Range</Label>
                    <Input
                      type="number"
                      id="proximity-range"
                      value={profileSettings.audioAlertRange}
                      className="w-24"
                      onChange={(e) =>
                        settingsStore.setAudioAlertRange(+e.target.value)
                      }
                      min={10}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Distance in map units. The ideal value depends on the game
                    and map scale.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-proximity-range">
                    Show Range on Map
                  </Label>
                  <Switch
                    id="show-proximity-range"
                    checked={profileSettings.showAudioAlertRange}
                    onCheckedChange={settingsStore.toggleShowAudioAlertRange}
                  />
                </div>
              </Section>

              {/* Audio Alerts */}
              <Section
                title="Audio Alerts"
                description="Play a sound when tracked items appear within range. Enable per-filter using the settings icon next to each filter."
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="mute-audio-alerts">Mute All</Label>
                  <Switch
                    id="mute-audio-alerts"
                    checked={profileSettings.audioAlertsMuted}
                    onCheckedChange={settingsStore.toggleAudioAlertsMuted}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="audio-alert-notifications">
                    Show Notification
                    <span className="block text-muted-foreground text-xs font-normal">
                      Pop up which alert fired, so you know what dinged.
                    </span>
                  </Label>
                  <Switch
                    id="audio-alert-notifications"
                    checked={profileSettings.audioAlertNotifications}
                    onCheckedChange={
                      settingsStore.toggleAudioAlertNotifications
                    }
                  />
                </div>
                {(() => {
                  // List the filters that currently have an audio alert set,
                  // so it's easy to remember what you turned on (and silence a
                  // stray one) instead of getting dinged with no idea why.
                  const enabledIds = Object.entries(
                    profileSettings.audioAlertByFilter,
                  )
                    .filter(([, on]) => on)
                    .map(([id]) => id);
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label>
                          Active Alerts
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            ({enabledIds.length})
                          </span>
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={enabledIds.length === 0}
                          onClick={settingsStore.resetAudioAlerts}
                        >
                          Reset all
                        </Button>
                      </div>
                      {enabledIds.length === 0 ? (
                        <p className="text-muted-foreground text-xs">
                          No audio alerts set. Enable one with the gear icon
                          next to a filter.
                        </p>
                      ) : (
                        // Native overflow scroll — Radix ScrollArea needs a
                        // definite height to scroll, and a max-height-only list
                        // wouldn't (the viewport never overflows). This scrolls
                        // reliably regardless of item count.
                        <ul className="max-h-48 space-y-0.5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
                          {enabledIds.map((id) => {
                            const name = t(id) || id;
                            return (
                              <li
                                key={id}
                                className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/50"
                              >
                                <span className="truncate">{name}</span>
                                <button
                                  type="button"
                                  aria-label={`Turn off alert for ${name}`}
                                  title="Turn off this alert"
                                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() =>
                                    settingsStore.toggleAudioAlertByFilter(id)
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2 justify-between">
                  <Label htmlFor="audio-alert-sound">Alert Sound</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={profileSettings.audioAlertSound}
                      onValueChange={settingsStore.setAudioAlertSound}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_SOUND_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        playAlertSound(
                          profileSettings.audioAlertSound,
                          profileSettings.audioAlertVolume,
                        )
                      }
                      title="Preview sound"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <Label htmlFor="audio-alert-volume">Volume</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="audio-alert-volume"
                      className="w-28 h-8 p-0"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[profileSettings.audioAlertVolume]}
                      onValueChange={(values) => {
                        settingsStore.setAudioAlertVolume(values[0]);
                      }}
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {Math.round(profileSettings.audioAlertVolume * 100)}%
                    </span>
                  </div>
                </div>
              </Section>

              {/* Marker Labels */}
              <Section
                title="Marker Labels"
                description="Show text labels above markers for easier identification. Configure per-filter using the settings icon next to each filter."
              >
                <div className="flex items-center gap-2 justify-between">
                  <Label htmlFor="label-text-size">Label Text Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="label-text-size"
                      className="w-28 h-8 p-0"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[profileSettings.labelTextSize]}
                      onValueChange={(values) => {
                        settingsStore.setLabelTextSize(values[0]);
                      }}
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {profileSettings.labelTextSize.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </Section>
            </>
          )}

          {children}

          {/* Reset Interface — always at the bottom */}
          <Separator />
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Reset Interface</p>
              <p className="text-muted-foreground text-xs">
                Resets all visual settings to defaults
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                settingsStore.resetInterface();
                toast.success("Interface reset to defaults");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
