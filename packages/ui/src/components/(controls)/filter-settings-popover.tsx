"use client";

import { Settings2 } from "lucide-react";
import { useUserStore } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  isApp,
  PREVIEW_LIVE_MODES,
  useAccountStore,
  useSettingsStore,
  type DiscoverMode,
  type LabelMode,
  type LiveMode,
} from "@repo/lib";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { useCoordinates } from "../(providers)";
import { FilterTooltip } from "./filter-tooltip";
import { DiscoverAllButton } from "./discover-all-button";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type FilterSettingsPopoverProps =
  | {
      filterId: string;
      filterLabel: string;
      isGroup?: false;
      groupId?: never;
      filterIds?: never;
      liveOnly?: boolean;
    }
  | {
      filterId?: never;
      filterLabel: string;
      isGroup: true;
      groupId: string;
      filterIds: string[];
      liveOnly?: never;
    };

export function FilterSettingsPopover(props: FilterSettingsPopoverProps) {
  const { filterLabel, isGroup } = props;
  const [open, setOpen] = useState(false);

  const { filters, typesIdMap } = useCoordinates();
  const userFilters = useUserStore((s) => s.filters);
  const setUserFilters = useUserStore((s) => s.setFilters);

  // Sibling variants: filter values across all groups that share this
  // value's baseType (e.g. all sizes of Gold, or base + starred + infected
  // + amber of the same bug). Lets us offer a one-click "Enable all
  // variants" toggle alongside the existing per-filter controls.
  const siblingIds = useMemo<string[] | null>(() => {
    if (isGroup) return null;
    let baseType: string | undefined;
    for (const g of filters) {
      const v = g.values.find((v) => v.id === props.filterId);
      if (v) {
        baseType = v.baseType;
        break;
      }
    }
    if (!baseType) return null;
    // A value can legitimately appear in several groups (e.g. a rarity group
    // plus a "by quest" group), so dedupe by id — otherwise the same variant
    // would be counted twice and inflate the sibling set.
    const ids = new Set<string>();
    for (const g of filters) {
      for (const v of g.values) {
        if (v.baseType === baseType) ids.add(v.id);
      }
    }
    return ids.size > 1 ? [...ids] : null;
  }, [filters, isGroup, isGroup ? null : props.filterId]);

  const siblingEnabledCount = useMemo(
    () =>
      siblingIds
        ? siblingIds.filter((id) => userFilters.includes(id)).length
        : 0,
    [siblingIds, userFilters],
  );
  const allSiblingsEnabled =
    siblingIds !== null && siblingEnabledCount === siblingIds.length;

  const handleToggleAllVariants = () => {
    if (!siblingIds) return;
    if (allSiblingsEnabled) {
      const drop = new Set(siblingIds);
      setUserFilters(userFilters.filter((id) => !drop.has(id)));
    } else {
      setUserFilters([...new Set([...userFilters, ...siblingIds])]);
    }
  };

  const iconSizeByFilter = useSettingsStore((s) => s.iconSizeByFilter);
  const setIconSizeByFilter = useSettingsStore((s) => s.setIconSizeByFilter);
  const iconSizeByGroup = useSettingsStore((s) => s.iconSizeByGroup);
  const setIconSizeByGroup = useSettingsStore((s) => s.setIconSizeByGroup);
  const audioAlertByFilter = useSettingsStore((s) => s.audioAlertByFilter);
  const toggleAudioAlertByFilter = useSettingsStore(
    (s) => s.toggleAudioAlertByFilter,
  );
  const setAudioAlertByFilters = useSettingsStore(
    (s) => s.setAudioAlertByFilters,
  );
  const audioAlertsMuted = useSettingsStore((s) => s.audioAlertsMuted);
  const labelModeByFilter = useSettingsStore((s) => s.labelModeByFilter);
  const setLabelModeByFilter = useSettingsStore((s) => s.setLabelModeByFilter);
  const setLabelModeByFilters = useSettingsStore(
    (s) => s.setLabelModeByFilters,
  );
  const liveModeByFilter = useSettingsStore((s) => s.liveModeByFilter);
  const setLiveModeByFilter = useSettingsStore((s) => s.setLiveModeByFilter);
  const setLiveModeByFilters = useSettingsStore((s) => s.setLiveModeByFilters);
  const discoverModeByFilter = useSettingsStore((s) => s.discoverModeByFilter);
  const setDiscoverModeByFilter = useSettingsStore(
    (s) => s.setDiscoverModeByFilter,
  );
  const setDiscoverModeByFilters = useSettingsStore(
    (s) => s.setDiscoverModeByFilters,
  );
  const hasPreviewAccess = useAccountStore((s) => s.perks.previewReleaseAccess);

  // The per-filter live-mode override only applies to live-trackable types
  // (those mapped in typesIdMap). Hide the control for everything else — and
  // for whole games without live mode (no typesIdMap).
  const liveTrackable = useMemo(() => {
    if (!typesIdMap) return false;
    const trackedTypes = new Set(Object.values(typesIdMap));
    if (isGroup) return props.filterIds.some((id) => trackedTypes.has(id));
    return trackedTypes.has(props.filterId);
  }, [
    typesIdMap,
    isGroup,
    isGroup ? props.filterIds : null,
    isGroup ? null : props.filterId,
  ]);

  // Group live-mode state: collapse to a single value only if every trackable
  // filter agrees, else "mixed". Absent override = "default".
  const groupLiveMode = useMemo<LiveMode | "default" | "mixed">(() => {
    if (!isGroup) return "default";
    const trackedTypes = typesIdMap ? new Set(Object.values(typesIdMap)) : null;
    const ids = props.filterIds.filter((id) => trackedTypes?.has(id));
    if (ids.length === 0) return "default";
    const first = liveModeByFilter[ids[0]] ?? "default";
    return ids.every((id) => (liveModeByFilter[id] ?? "default") === first)
      ? first
      : "mixed";
  }, [isGroup, isGroup ? props.filterIds : null, liveModeByFilter, typesIdMap]);

  const liveModeValue: LiveMode | "default" = isGroup
    ? groupLiveMode === "mixed"
      ? "default"
      : groupLiveMode
    : (liveModeByFilter[props.filterId] ?? "default");

  const handleLiveModeChange = (value: LiveMode | "default") => {
    if (isGroup) {
      setLiveModeByFilters(props.filterIds, value);
    } else {
      setLiveModeByFilter(props.filterId, value);
    }
  };

  // Mirrors the global LiveModeControl gate: locked only while `combined` is in
  // PREVIEW_LIVE_MODES (currently empty → public) and the user lacks access.
  const combinedLocked =
    !hasPreviewAccess && PREVIEW_LIVE_MODES.has("combined");
  // For groups, calculate if all/some/none have audio enabled
  const groupAudioState = useMemo(() => {
    if (!isGroup) return null;
    const filterIds = props.filterIds;
    const enabledCount = filterIds.filter(
      (id) => audioAlertByFilter[id],
    ).length;
    if (enabledCount === 0) return "none";
    if (enabledCount === filterIds.length) return "all";
    return "some";
  }, [isGroup, isGroup ? props.filterIds : null, audioAlertByFilter]);

  // For groups, calculate label mode state
  const groupLabelMode = useMemo(() => {
    if (!isGroup) return null;
    const filterIds = props.filterIds;
    const allAlways = filterIds.every(
      (id) => labelModeByFilter[id] === "always",
    );
    if (allAlways) return "always";
    const allInRange = filterIds.every(
      (id) => labelModeByFilter[id] === "inRange",
    );
    if (allInRange) return "inRange";
    const allHotkey = filterIds.every(
      (id) => labelModeByFilter[id] === "hotkey",
    );
    if (allHotkey) return "hotkey";
    const allOff = filterIds.every(
      (id) => !labelModeByFilter[id] || labelModeByFilter[id] === "off",
    );
    if (allOff) return "off";
    return "mixed";
  }, [isGroup, isGroup ? props.filterIds : null, labelModeByFilter]);

  const labelMode = isGroup
    ? "off"
    : (labelModeByFilter[props.filterId] ?? "off");

  const iconSize = isGroup
    ? (iconSizeByGroup[props.groupId] ?? 1)
    : (iconSizeByFilter[props.filterId] ?? 1);

  const audioEnabled = isGroup
    ? groupAudioState === "all"
    : (audioAlertByFilter[props.filterId] ?? false);

  // Group Discover-mode state: collapse to a single value only if every filter
  // agrees, else "mixed". Absent override = "default" (inherit the static-flag
  // default).
  const groupDiscoverMode = useMemo<DiscoverMode | "default" | "mixed">(() => {
    if (!isGroup) return "default";
    const ids = props.filterIds;
    if (ids.length === 0) return "default";
    const first = discoverModeByFilter[ids[0]] ?? "default";
    return ids.every((id) => (discoverModeByFilter[id] ?? "default") === first)
      ? first
      : "mixed";
  }, [isGroup, isGroup ? props.filterIds : null, discoverModeByFilter]);

  const discoverModeValue: DiscoverMode | "default" = isGroup
    ? groupDiscoverMode === "mixed"
      ? "default"
      : groupDiscoverMode
    : (discoverModeByFilter[props.filterId] ?? "default");

  const handleDiscoverModeChange = (value: DiscoverMode | "default") => {
    if (isGroup) {
      setDiscoverModeByFilters(props.filterIds, value);
    } else {
      setDiscoverModeByFilter(props.filterId, value);
    }
  };

  const handleIconSizeChange = (value: number[]) => {
    if (isGroup) {
      setIconSizeByGroup(props.groupId, value[0]);
    } else {
      setIconSizeByFilter(props.filterId, value[0]);
    }
  };

  const handleAudioToggle = () => {
    if (isGroup) {
      // If all or some are enabled, disable all. If none are enabled, enable all.
      const newEnabled = groupAudioState === "none";
      setAudioAlertByFilters(props.filterIds, newEnabled);
    } else {
      toggleAudioAlertByFilter(props.filterId);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 hover:text-primary transition-colors shrink-0 text-muted-foreground"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          type="button"
          aria-label="Filter settings"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 space-y-3 max-h-(--radix-popover-content-available-height) overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent"
        side="right"
      >
        {!isGroup && (
          <>
            {props.liveOnly && (
              <p className="font-bold text-sm text-orange-500">
                This filter is only available with the live mode of the In-Game
                app.
              </p>
            )}
            <FilterTooltip id={props.filterId} />
            <DiscoverAllButton filterIds={[props.filterId]} />
            <Separator />
          </>
        )}

        {isGroup && (
          <>
            <div className="font-medium text-sm truncate">{filterLabel}</div>
            <DiscoverAllButton filterIds={props.filterIds} />
          </>
        )}

        {siblingIds && (
          <div className="space-y-1.5">
            <Label className="text-xs">Variants</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between text-xs h-7"
              onClick={handleToggleAllVariants}
            >
              <span>{allSiblingsEnabled ? "Disable all" : "Enable all"}</span>
              <span className="text-muted-foreground tabular-nums">
                {siblingEnabledCount}/{siblingIds.length}
              </span>
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Icon Size {isGroup && "(Group)"}</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[iconSize]}
              onValueChange={handleIconSizeChange}
              min={0.1}
              max={2.5}
              step={0.1}
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {iconSize.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Audio Alert {isGroup && "(All)"}</Label>
          <Switch checked={audioEnabled} onCheckedChange={handleAudioToggle} />
        </div>

        {isGroup && groupAudioState === "some" && (
          <p className="text-xs text-muted-foreground">
            Some filters in this group have audio alerts enabled.
          </p>
        )}

        {audioAlertsMuted && (
          <p className="text-xs text-muted-foreground">
            Audio alerts are muted in Settings.
          </p>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <Label className="text-xs">Label {isGroup && "(All)"}</Label>
          <Select
            value={
              isGroup
                ? groupLabelMode === "mixed"
                  ? ""
                  : groupLabelMode!
                : labelMode
            }
            onValueChange={(value: LabelMode) => {
              if (isGroup) {
                setLabelModeByFilters(props.filterIds, value);
              } else {
                setLabelModeByFilter(props.filterId, value);
              }
            }}
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue
                placeholder={
                  isGroup && groupLabelMode === "mixed" ? "Mixed" : undefined
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="inRange">In Range</SelectItem>
              <SelectItem value="hotkey">Hotkey</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isGroup && groupLabelMode === "mixed" && (
          <p className="text-xs text-muted-foreground">
            Filters have different label settings.
          </p>
        )}

        {/* Discover Nearest Node is an in-game-app hotkey (needs live player
            position), so this control is hidden on the public website. */}
        {isApp && (
          <>
            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-xs">Discover {isGroup && "(All)"}</Label>
              <Select
                value={
                  isGroup && groupDiscoverMode === "mixed"
                    ? ""
                    : discoverModeValue
                }
                onValueChange={(value: DiscoverMode | "default") =>
                  handleDiscoverModeChange(value)
                }
              >
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue
                    placeholder={
                      isGroup && groupDiscoverMode === "mixed"
                        ? "Mixed"
                        : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="predicted">Only Predicted</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tooltip delayDuration={200} disableHoverableContent>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground underline cursor-help">
                  What is this?
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                The “Discover Nearest Node” hotkey marks the closest node within
                the Proximity Range. Default discovers placed nodes and their
                live confirmations but skips purely-moving actors (players,
                NPCs). Enabled always includes live detections; Only Predicted
                ignores live (moving) ones; Disabled turns it off.
              </TooltipContent>
            </Tooltip>

            {isGroup && groupDiscoverMode === "mixed" && (
              <p className="text-xs text-muted-foreground">
                Filters have different discover settings.
              </p>
            )}
          </>
        )}

        {liveTrackable && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-xs">Live Mode {isGroup && "(All)"}</Label>
              <Select
                value={
                  isGroup && groupLiveMode === "mixed" ? "" : liveModeValue
                }
                onValueChange={(value: LiveMode | "default") =>
                  handleLiveModeChange(value)
                }
              >
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue
                    placeholder={
                      isGroup && groupLiveMode === "mixed" ? "Mixed" : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="static">Predicted</SelectItem>
                  <SelectItem value="combined" disabled={combinedLocked}>
                    <span className="flex items-center gap-1">
                      Combined
                      {combinedLocked && (
                        <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      )}
                    </span>
                  </SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tooltip delayDuration={200} disableHoverableContent>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground underline cursor-help">
                  What is this?
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                Override the global live mode for{" "}
                {isGroup ? "these filters" : "this filter"}. Predicted = spawn
                guesses only; Live = confirmed spawns only.
              </TooltipContent>
            </Tooltip>
            {isGroup && groupLiveMode === "mixed" && (
              <p className="text-xs text-muted-foreground">
                Filters have different live-mode settings.
              </p>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
