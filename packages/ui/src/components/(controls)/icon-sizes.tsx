import { Label } from "@radix-ui/react-label";
import { Slider } from "../ui/slider";
import { FiltersConfig, useSettingsStore } from "@repo/lib";
import { useT } from "../(providers)";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { FoldVertical } from "lucide-react";

const MIN_ICON_SIZE = 0.1;
const MAX_ICON_SIZE = 2.5;
export function IconSizes({ filters }: { filters: FiltersConfig }) {
  const t = useT();
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const setBaseIconSize = useSettingsStore((state) => state.setBaseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const setPlayerIconSize = useSettingsStore(
    (state) => state.setPlayerIconSize,
  );
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const setIconSizeByFilter = useSettingsStore(
    (state) => state.setIconSizeByFilter,
  );
  const iconSizeByGroup = useSettingsStore((state) => state.iconSizeByGroup);
  const setIconSizeByGroup = useSettingsStore(
    (state) => state.setIconSizeByGroup,
  );

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor="baseSize">Icon Size (Base)</Label>
      <Slider
        id="baseSize"
        className="col-span-2 h-8 p-0"
        value={[baseIconSize]}
        onValueChange={(values) => {
          setBaseIconSize(values[0]);
        }}
        step={0.1}
        min={MIN_ICON_SIZE}
        max={MAX_ICON_SIZE}
      />

      <Label htmlFor="playerSize">Player Icon Size</Label>
      <Slider
        id="playerSize"
        className="col-span-2 h-8 p-0"
        value={[playerIconSize]}
        onValueChange={(values) => {
          setPlayerIconSize(values[0]);
        }}
        step={0.1}
        min={MIN_ICON_SIZE}
        max={MAX_ICON_SIZE}
      />

      <Collapsible className="col-span-3">
        <CollapsibleTrigger className="flex w-full justify-between hover:text-primary">
          <span>Per-Filter Icon Sizes</span>
          <FoldVertical className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="col-span-3">
          {/* Per-filter icon size sliders */}
          {filters.map((group) => (
            <div key={group.group} className="contents">
              <div className="col-span-3 mt-2 text-sm font-medium opacity-80">
                {t(group.group)}
              </div>
              {/* Group-wide size slider */}
              <Label htmlFor={`size-group-${group.group}`}>Group Size</Label>
              <Slider
                id={`size-group-${group.group}`}
                className="col-span-2 h-8 p-0"
                value={[iconSizeByGroup[group.group] ?? 1]}
                onValueChange={(values) => {
                  setIconSizeByGroup(group.group, values[0]);
                }}
                step={0.1}
                min={MIN_ICON_SIZE}
                max={MAX_ICON_SIZE}
              />
              {group.values.map((value) => {
                const current = iconSizeByFilter[value.id] ?? 1;
                return (
                  <div key={`${group.group}-${value.id}`} className="contents">
                    <Label htmlFor={`size-${value.id}`}>{t(value.id)}</Label>
                    <Slider
                      id={`size-${value.id}`}
                      className="col-span-2 h-8 p-0"
                      value={[current]}
                      onValueChange={(values) => {
                        setIconSizeByFilter(value.id, values[0]);
                      }}
                      step={0.1}
                      min={MIN_ICON_SIZE}
                      max={MAX_ICON_SIZE}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
