import { Label } from "../ui/label";
import { HOTKEYS } from "@repo/lib/thgl-app";
import {
  FiltersConfig,
  THGLAppConfig,
  useCompactOverlay,
  useSettingsStore,
} from "@repo/lib";
import { SettingsDialogContent } from "../(controls)/settings-dialog-content";
import { Separator } from "../ui/separator";
import { Hotkey } from "./hotkey";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useT } from "../(providers)";
import { useDiscoveryProgress } from "./discord-presence-hints";
import { useState } from "react";

export function THGLAppSettingsDialogContent({
  appConfig,
  filters,
}: {
  appConfig: THGLAppConfig;
  filters: FiltersConfig;
}) {
  const [recordingName, setRecordingName] = useState<string | null>(null);
  const compactOverlay = useCompactOverlay(appConfig.name);
  return (
    <SettingsDialogContent
      activeApp={appConfig.name}
      withoutTraceLines={appConfig.withoutOverlayMode}
      filters={filters}
    >
      <DiscordProgressSetting filters={filters} />
      <Separator />
      <h4 className="text-md font-semibold">In-Game Hotkeys</h4>
      {appConfig.withoutOverlayMode ? (
        <p className="text-muted-foreground text-xs">
          This game does not support overlay mode, so the hotkeys are not
          available too.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            To set hotkeys using a gamepad, enable Second Screen mode
            temporarily. Overlay mode can't read gamepad input for recording.
            Non-Xbox controllers (PS5, Steam) must be in Xbox/XInput mode —
            enable Steam Input for them so they work like an Xbox controller.
          </p>
          <Label className="flex items-center gap-2 justify-between">
            Show/Hide app
            <Hotkey
              name={HOTKEYS.TOGGLE_APP}
              isActive={recordingName === HOTKEYS.TOGGLE_APP}
              onStart={() => setRecordingName(HOTKEYS.TOGGLE_APP)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Zoom in map
            <Hotkey
              name={HOTKEYS.ZOOM_IN_APP}
              isActive={recordingName === HOTKEYS.ZOOM_IN_APP}
              onStart={() => setRecordingName(HOTKEYS.ZOOM_IN_APP)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Zoom out map
            <Hotkey
              name={HOTKEYS.ZOOM_OUT_APP}
              isActive={recordingName === HOTKEYS.ZOOM_OUT_APP}
              onStart={() => setRecordingName(HOTKEYS.ZOOM_OUT_APP)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Lock/Unlock app
            <Hotkey
              name={HOTKEYS.TOGGLE_LOCK_APP}
              isActive={recordingName === HOTKEYS.TOGGLE_LOCK_APP}
              onStart={() => setRecordingName(HOTKEYS.TOGGLE_LOCK_APP)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Discover Nearest Node
            <Hotkey
              name={HOTKEYS.DISCOVER_NODE}
              isActive={recordingName === HOTKEYS.DISCOVER_NODE}
              onStart={() => setRecordingName(HOTKEYS.DISCOVER_NODE)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Undiscover Nearest Node
            <Hotkey
              name={HOTKEYS.UNDISCOVER_NODE}
              isActive={recordingName === HOTKEYS.UNDISCOVER_NODE}
              onStart={() => setRecordingName(HOTKEYS.UNDISCOVER_NODE)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Cycle Live Mode
            <Hotkey
              name={HOTKEYS.TOGGLE_LIVE_MODE}
              isActive={recordingName === HOTKEYS.TOGGLE_LIVE_MODE}
              onStart={() => setRecordingName(HOTKEYS.TOGGLE_LIVE_MODE)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Toggle Overlay Fullscreen
            <Hotkey
              name={HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN}
              isActive={recordingName === HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN}
              onStart={() =>
                setRecordingName(HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN)
              }
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Toggle Labels
            <Hotkey
              name={HOTKEYS.SHOW_LABELS}
              isActive={recordingName === HOTKEYS.SHOW_LABELS}
              onStart={() => setRecordingName(HOTKEYS.SHOW_LABELS)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Cycle Map Transparency
            <Hotkey
              name={HOTKEYS.CYCLE_MAP_TRANSPARENCY}
              isActive={recordingName === HOTKEYS.CYCLE_MAP_TRANSPARENCY}
              onStart={() => setRecordingName(HOTKEYS.CYCLE_MAP_TRANSPARENCY)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Cycle Filter Presets
            <Hotkey
              name={HOTKEYS.CYCLE_FILTER_PRESET}
              isActive={recordingName === HOTKEYS.CYCLE_FILTER_PRESET}
              onStart={() => setRecordingName(HOTKEYS.CYCLE_FILTER_PRESET)}
              onStop={() => setRecordingName(null)}
              onClear={() => setRecordingName(null)}
            />
          </Label>
          {compactOverlay.available && (
            <Label className="flex items-center gap-2 justify-between">
              <span>Widgets Only Overlay</span>
              <Hotkey
                name={HOTKEYS.TOGGLE_COMPACT_OVERLAY}
                isActive={recordingName === HOTKEYS.TOGGLE_COMPACT_OVERLAY}
                onStart={() => setRecordingName(HOTKEYS.TOGGLE_COMPACT_OVERLAY)}
                onStop={() => setRecordingName(null)}
                onClear={() => setRecordingName(null)}
              />
            </Label>
          )}
        </>
      )}
    </SettingsDialogContent>
  );
}

/**
 * Which discovery progress the Discord card shows for this game. The other
 * Discord settings are app-wide (Dashboard > Settings > Discord).
 */
function DiscordProgressSetting({ filters }: { filters: FiltersConfig }) {
  const t = useT();
  const progressGroup = useSettingsStore((s) => s.discordProgressGroup);
  const setProgressGroup = useSettingsStore((s) => s.setDiscordProgressGroup);
  const counts = useDiscoveryProgress(filters);
  const groups = filters.filter((filter) => counts.get(filter.group)?.total);
  return (
    <>
      <Separator />
      <h4 className="text-md font-semibold">Discord Rich Presence</h4>
      <Label className="flex items-center gap-2 justify-between">
        Progress shown on Discord
        <Select
          value={progressGroup ?? "auto"}
          onValueChange={(value) =>
            setProgressGroup(value === "auto" ? null : value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (most discovered)</SelectItem>
            <SelectItem value="none">None</SelectItem>
            {groups.map((filter) => {
              const count = counts.get(filter.group)!;
              return (
                <SelectItem key={filter.group} value={filter.group}>
                  {t(filter.group, { fallback: filter.group })} ({count.found}/
                  {count.total})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Label>
      <p className="text-muted-foreground text-xs">
        Shows "found / total" of these markers on your Discord profile while you
        play. More Discord options are in the app&apos;s Settings.
      </p>
    </>
  );
}
