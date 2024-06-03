import { Label } from "@radix-ui/react-label";
import { Slider } from "../ui/slider";
import { useSettingsStore } from "@repo/lib";

export function IconSizes() {
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const setBaseIconSize = useSettingsStore((state) => state.setBaseIconSize);

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor="baseSize">Icon Size</Label>
      <Slider
        id="baseSize"
        className="col-span-2 h-8 p-0"
        value={[baseIconSize]}
        onValueChange={(values) => {
          setBaseIconSize(values[0]);
        }}
        step={0.1}
        min={0.1}
        max={2}
      />
    </div>
  );
}
