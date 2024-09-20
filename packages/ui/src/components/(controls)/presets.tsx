import { REGION_FILTERS, useCoordinates, useUserStore } from "../(providers)";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronsUpDown, Delete } from "lucide-react";
import { Input } from "../ui/input";
import { useSettingsStore } from "@repo/lib";
import { useState } from "react";

export function Presets(): JSX.Element {
  const coordinates = useCoordinates();
  const { setFilters, filters, globalFilters, setGlobalFilters } =
    useUserStore();
  const presets = useSettingsStore((state) => state.presets);
  const addPreset = useSettingsStore((state) => state.addPreset);
  const removePreset = useSettingsStore((state) => state.removePreset);
  const [presetName, setPresetName] = useState("");

  const allGlobalFilters = coordinates.globalFilters.flatMap((filter) =>
    filter.values.flatMap((value) => value.id),
  );
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allFilters = [...filters, ...globalFilters];
    addPreset(presetName, allFilters);
    setPresetName("");
  };

  return (
    <div className="flex justify-center p-1">
      <Button
        variant="ghost"
        className="grow"
        size="sm"
        onClick={() => {
          setFilters(coordinates.allFilters);
          setGlobalFilters(allGlobalFilters);
        }}
        type="button"
      >
        <span>
          <span className="hidden md:inline">Show </span>All
        </span>
      </Button>
      <Button
        className="grow"
        variant="ghost"
        size="sm"
        onClick={() => {
          setFilters([]);
          const defaultGlobalFilters = coordinates.globalFilters.flatMap(
            (filter) =>
              filter.values.flatMap((value) =>
                value.defaultOn ? value.id : [],
              ),
          );
          setGlobalFilters(defaultGlobalFilters);
        }}
        type="button"
      >
        <span>
          <span className="hidden md:inline">Show </span>None
        </span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" type="button">
            <span>
              More<span className="hidden md:inline"> Presets</span>
            </span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuItem
            onClick={() => {
              const defaultGlobalFilters = coordinates.globalFilters.flatMap(
                (filter) =>
                  filter.values.flatMap((value) =>
                    value.defaultOn ? value.id : [],
                  ),
              );
              setGlobalFilters(defaultGlobalFilters);

              const defaultFilters = [
                ...coordinates.filters.flatMap((filter) =>
                  filter.defaultOn
                    ? filter.values
                        .filter((value) => value.defaultOn !== false)
                        .map((value) => value.id)
                    : [],
                ),
                ...REGION_FILTERS.map((filter) => filter.id),
              ];
              setFilters(defaultFilters);
            }}
            className="grow"
          >
            Default
          </DropdownMenuItem>
          {Object.entries(presets).map(([name, filters]) => (
            <div key={name} className="flex items-center w-full">
              <DropdownMenuItem
                onClick={() => {
                  const { globalFilters, filters: localFilters } =
                    filters.reduce(
                      (acc, filter) => {
                        if (allGlobalFilters.includes(filter)) {
                          acc.globalFilters.push(filter);
                        } else {
                          acc.filters.push(filter);
                        }
                        return acc;
                      },
                      {
                        globalFilters: [] as string[],
                        filters: [] as string[],
                      },
                    );
                  setFilters(localFilters);
                  if (globalFilters.length === 0) {
                    const defaultGlobalFilters =
                      coordinates.globalFilters.flatMap((filter) =>
                        filter.values.flatMap((value) =>
                          value.defaultOn ? value.id : [],
                        ),
                      );
                    setGlobalFilters(defaultGlobalFilters);
                  } else {
                    setGlobalFilters(globalFilters);
                  }
                }}
                className="grow"
              >
                {name}
              </DropdownMenuItem>
              <Button
                className="shrink-0"
                variant="ghost"
                size="icon"
                onClick={() => removePreset(name)}
                type="button"
              >
                <Delete className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {Object.keys(presets).length === 0 && (
            <DropdownMenuItem disabled>No presets saved</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <form className="flex flex-col gap-2 p-1" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Preset name"
              value={presetName}
              onChange={(event) => {
                setPresetName(event.target.value);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
              required
            />
            <Button className="w-full" size="sm" type="submit">
              Save Preset
            </Button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
