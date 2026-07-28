import { Check, ChevronDown, Map } from "lucide-react";
import { useUserStore } from "../(providers)";
import { useLocale, useT } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useState, type JSX } from "react";
import { cn, localizePath } from "@repo/lib";
import { ScrollArea } from "../ui/scroll-area";
import { MapSettingsPopover } from "./map-settings-popover";

export function MapSelect({
  mapNames,
}: {
  mapNames: {
    name: string;
    defaultTitle: string;
  }[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
  const locale = useLocale();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* The gear (per-map settings for the SELECTED map) must live outside
          the combobox button — nested buttons are invalid HTML and would
          toggle the dropdown. */}
      <div className="flex items-center w-full pr-1">
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            aria-label="Select map"
            className="flex items-center flex-1 min-w-0 px-2.5 py-1.5 text-sm transition-colors hover:text-primary group"
            type="button"
          >
            <Map className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {/* `mapName` comes from the client-authoritative user store, which
                can differ from the SSR-rendered value (the store is a
                module-level singleton reused across SSR requests). The client
                value is the correct one, so suppress the expected text-only
                hydration mismatch here rather than flashing a placeholder. */}
            <span className="truncate font-medium" suppressHydrationWarning>
              {t(mapName) || mapName}
            </span>
            <ChevronDown
              className={cn(
                "ml-auto h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <MapSettingsPopover
          mapName={mapName}
          mapLabel={t(mapName) || mapName}
        />
      </div>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[200px] md:w-[300px]">
          <CommandInput placeholder="Search map..." />
          <CommandEmpty className="w-full">No map found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="p-0 grid">
              <ScrollArea className="h-full max-h-96">
                {mapNames.map(({ name, defaultTitle }) => (
                  <CommandItem
                    key={name}
                    value={t(name)}
                    onSelect={() => {
                      if (name === mapName) {
                        setOpen(false);
                        return;
                      }

                      setMapName(name);
                      setOpen(false);
                      if (location.pathname.includes("/maps/")) {
                        window.history.pushState(
                          {},
                          "",
                          localizePath(`/maps/${defaultTitle}`, locale),
                        );
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        mapName === name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{t(name)}</span>
                    <span className="ml-auto">
                      <MapSettingsPopover
                        mapName={name}
                        mapLabel={t(name) || name}
                      />
                    </span>
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
