import { Label } from "../ui/label";
import { HOTKEYS } from "@repo/lib/thgl-app";
import { FiltersConfig, THGLAppConfig } from "@repo/lib";
import { SettingsDialogContent } from "../(controls)/settings-dialog-content";
import { Separator } from "../ui/separator";
import { Hotkey } from "./hotkey";
import { useState } from "react";

export function THGLAppSettingsDialogContent({
  appConfig,
  filters,
}: {
  appConfig: THGLAppConfig;
  filters: FiltersConfig;
}) {
  const [recordingName, setRecordingName] = useState<string | null>(null);
  return (
    <SettingsDialogContent
      activeApp={appConfig.name}
      withoutTraceLines={appConfig.withoutOverlayMode}
      filters={filters}
    >
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
            Toggle Live Mode
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
        </>
      )}
    </SettingsDialogContent>
  );
}
