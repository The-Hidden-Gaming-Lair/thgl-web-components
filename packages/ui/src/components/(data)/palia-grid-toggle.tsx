"use client";
import { useSettingsStore } from "@repo/lib";
import { Label, Switch } from "../(controls)";
import { useT } from "../(providers)";
import { Slider } from "../ui/slider";

export function PaliaGridToggle() {
  const t = useT();
  const showGrid = useSettingsStore((state) => state.showGrid);
  const toggleShowGrid = useSettingsStore((state) => state.toggleShowGrid);
  const gridLabelSize = useSettingsStore((state) => state.gridLabelSize);
  const setGridLabelSize = useSettingsStore((state) => state.setGridLabelSize);

  return (
    <div className="py-2 px-4">
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="show-grid" className="grow">
          {t("paliaSidebar.showGrid", { fallback: "Show Grid" })}
        </Label>
        <Switch
          id="show-grid"
          onCheckedChange={toggleShowGrid}
          checked={showGrid}
        />
      </div>
      {showGrid && (
        <div className="mt-2 flex items-center gap-2">
          <Label htmlFor="grid-label-size" className="shrink-0">
            {t("paliaSidebar.labelSize", { fallback: "Label Size" })}
          </Label>
          <Slider
            id="grid-label-size"
            className="h-8 p-0"
            value={[gridLabelSize]}
            onValueChange={(values) => {
              setGridLabelSize(values[0]);
            }}
            step={0.1}
            min={0.5}
            max={3}
          />
        </div>
      )}
    </div>
  );
}
