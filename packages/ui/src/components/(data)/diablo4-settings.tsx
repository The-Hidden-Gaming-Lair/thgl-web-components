import { persist } from "zustand/middleware";
import { Label, Switch } from "../(controls)";
import { create } from "zustand";

export const useD4SettingsStore = create(
  persist<{
    showTimers: boolean;
    setShowTimers: (showTimers: boolean) => void;
  }>(
    (set) => ({
      showTimers: true,
      setShowTimers: (showTimers: boolean) => {
        set({ showTimers });
      },
    }),
    {
      name: "d4-settings-storage",
    },
  ),
);

export function D4Settings() {
  const d4SettingsStore = useD4SettingsStore();

  return (
    <>
      <h4 className="text-md font-semibold">Diablo IV Map</h4>
      <div className="flex items-center justify-between">
        <Label htmlFor="hide-discovered-nodes">Always Show Timers</Label>
        <Switch
          id="hide-discovered-nodes"
          checked={d4SettingsStore.showTimers}
          onCheckedChange={d4SettingsStore.setShowTimers}
        />
      </div>
    </>
  );
}
