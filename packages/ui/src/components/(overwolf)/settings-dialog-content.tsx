import { Hotkey } from "./hotkey";
import { Label } from "../ui/label";
import { HOTKEYS } from "@repo/lib/overwolf";
import { useSettingsStore } from "@repo/lib";
import { SettingsDialogContent } from "../(controls)/settings-dialog-content";
import { Separator } from "../ui/separator";
import { Channels } from "./channels";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { ReactNode } from "react";

export function OverwolfSettingsDialogContent({
  activeApp,
  gameClassId,
  more,
}: {
  activeApp: string;
  gameClassId: number;
  more?: ReactNode;
}) {
  const settingsStore = useSettingsStore();

  return (
    <SettingsDialogContent activeApp={activeApp} more={more}>
      <Separator />
      <Channels />
      <Separator />
      <h4 className="text-md font-semibold">Hotkeys</h4>
      <Label className="flex items-center gap-2 justify-between">
        Show/Hide app
        <Hotkey name={HOTKEYS.TOGGLE_APP} gameClassId={gameClassId} />
      </Label>
      <Label className="flex items-center gap-2 justify-between">
        Zoom in map
        <Hotkey name={HOTKEYS.ZOOM_IN_APP} gameClassId={gameClassId} />
      </Label>
      <Label className="flex items-center gap-2 justify-between">
        Zoom out map
        <Hotkey name={HOTKEYS.ZOOM_OUT_APP} gameClassId={gameClassId} />
      </Label>
      <Label className="flex items-center gap-2 justify-between">
        Lock/Unlock app
        <Hotkey name={HOTKEYS.TOGGLE_LOCK_APP} gameClassId={gameClassId} />
      </Label>
      <Label className="flex items-center gap-2 justify-between">
        Discover Nearest Node
        <Hotkey name={HOTKEYS.DISCOVER_NODE} gameClassId={gameClassId} />
      </Label>
      <Separator />
      <h4 className="text-md font-semibold">Performance</h4>
      <div className="flex items-center gap-2 justify-between">
        <Label htmlFor="actors-polling-rate">
          Actors Polling Rate (miliseconds)
        </Label>
        <Input
          type="number"
          id="actors-polling-rate"
          value={settingsStore.actorsPollingRate}
          className="w-fit"
          onChange={(event) =>
            settingsStore.setActorsPollingRate(+event.target.value)
          }
          min={30}
          max={5000}
        />
      </div>
      <Separator />
      <h4 className="text-md font-semibold">Discord Activity Status</h4>
      <div className="flex items-center gap-2 justify-between">
        <Label htmlFor="display-discord-game-status">
          Display playing game status
        </Label>
        <Switch
          id="display-discord-game-status"
          checked={settingsStore.displayDiscordActivityStatus}
          onCheckedChange={(checked) =>
            settingsStore.setDisplayDiscordActivityStatus(checked)
          }
        />
      </div>
    </SettingsDialogContent>
  );
}
