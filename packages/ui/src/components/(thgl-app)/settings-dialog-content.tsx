import { Label } from "../ui/label";
import { HOTKEYS } from "@repo/lib/thgl-app";
import { THGLAppConfig } from "@repo/lib";
import { SettingsDialogContent } from "../(controls)/settings-dialog-content";
import { Separator } from "../ui/separator";
import { Hotkey } from "./hotkey";

export function THGLAppSettingsDialogContent({
  appConfig,
}: {
  appConfig: THGLAppConfig;
}) {
  return (
    <SettingsDialogContent
      activeApp={appConfig.name}
      withoutTraceLines={appConfig.withoutOverlayMode}
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
          <Label className="flex items-center gap-2 justify-between">
            Show/Hide app
            <Hotkey name={HOTKEYS.TOGGLE_APP} />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Zoom in map
            <Hotkey name={HOTKEYS.ZOOM_IN_APP} />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Zoom out map
            <Hotkey name={HOTKEYS.ZOOM_OUT_APP} />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Lock/Unlock app
            <Hotkey name={HOTKEYS.TOGGLE_LOCK_APP} />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Discover Nearest Node
            <Hotkey name={HOTKEYS.DISCOVER_NODE} />
          </Label>
          <Label className="flex items-center gap-2 justify-between">
            Toggle Live Mode
            <Hotkey name={HOTKEYS.TOGGLE_LIVE_MODE} />
          </Label>
        </>
      )}
    </SettingsDialogContent>
  );
}
