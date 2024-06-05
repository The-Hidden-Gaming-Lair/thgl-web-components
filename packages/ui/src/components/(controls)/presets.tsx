import { useCoordinates, useUserStore } from "../(providers)";
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
  const { allFilters } = useCoordinates();
  const { setFilters, filters } = useUserStore();
  const presets = useSettingsStore((state) => state.presets);
  const addPreset = useSettingsStore((state) => state.addPreset);
  const removePreset = useSettingsStore((state) => state.removePreset);
  const [presetName, setPresetName] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addPreset(presetName, filters);
    setPresetName("");
  };

  return (
    <div className="flex justify-center p-1">
      <Button
        variant="ghost"
        className="grow"
        size="sm"
        onClick={() => {
          setFilters(allFilters);
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
          {Object.entries(presets).map(([name, filters]) => (
            <div key={name} className="flex items-center w-full">
              <DropdownMenuItem
                onClick={() => setFilters(filters)}
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
