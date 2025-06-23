import { Check, ChevronsUpDown, Map } from "lucide-react";
import { useT } from "../(providers)";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useState } from "react";
import { cn, useUserStore } from "@repo/lib";
import { ScrollArea } from "../ui/scroll-area";

export function MapSelect({ mapNames }: { mapNames: string[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="border-none rounded-none min-w-[200px] justify-between"
        >
          <span className="truncate flex items-center">
            <Map className="mr-2 h-4 w-4" /> {t(mapName) || mapName}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[200px] md:w-[300px]">
          <CommandInput placeholder="Search map..." />
          <CommandEmpty className="w-full">No map found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="p-0 grid">
              <ScrollArea className="h-full max-h-96">
                {mapNames.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      if (name === mapName) {
                        setOpen(false);
                        return;
                      }

                      setMapName(name);
                      setOpen(false);
                      if (location.pathname.includes("/maps/")) {
                        window.history.pushState({}, "", `/maps/${t(name)}`);
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        mapName === name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {t(name) || name}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
