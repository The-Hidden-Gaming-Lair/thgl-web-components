import { Check, ChevronsUpDown } from "lucide-react";
import { useT, useUserStore } from "../(providers)";
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
import { cn } from "@repo/lib";
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
          className="border-none rounded-none w-[175px] md:w-[300px] justify-between"
        >
          <span className="truncate">{t(mapName) || mapName}</span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[175px] md:w-[300px]">
          <CommandInput placeholder="Search map..." />
          <CommandEmpty className="w-full">No map found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="p-0 grid">
              <ScrollArea className="h-full max-h-96">
                {mapNames.map((name) => (
                  <CommandItem
                    key={name}
                    value={t(name) || name}
                    onSelect={() => {
                      setMapName(name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        mapName === name ? "opacity-100" : "opacity-0"
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
