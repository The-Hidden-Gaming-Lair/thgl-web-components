import { useSettingsStore } from "@repo/lib";
import { Label, Switch } from "../(controls)";

export function PaliaGridToggle() {
  const showGrid = useSettingsStore((state) => state.showGrid);
  const toggleShowGrid = useSettingsStore((state) => state.toggleShowGrid);

  return (
    <div className="flex items-center justify-between space-x-2 py-2 px-4">
      <Label htmlFor="show-grid" className="grow">
        Show Grid
      </Label>
      <Switch
        id="show-grid"
        onCheckedChange={toggleShowGrid}
        checked={showGrid}
      />
    </div>
  );
}
