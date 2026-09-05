import {
  Check,
  ChevronsUpDown,
  Cloud,
  CloudOff,
  Globe,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useState, type JSX } from "react";
import { cn, DrawingsAndNodes, useSettingsStore } from "@repo/lib";
import { ScrollArea } from "../ui/scroll-area";

function FilterIcon({ filter }: { filter: DrawingsAndNodes }) {
  // Public → globe (visible to community)
  // Synced private → cloud (saved to your account)
  // Local only (incl. legacy isShared+url, since the blob backend is gone) → cloud-off
  if (filter.visibility === "public") {
    return <Globe className={cn("h-4 w-4 shrink-0")} />;
  }
  if (filter.id) {
    return <Cloud className={cn("h-4 w-4 shrink-0")} />;
  }
  return <CloudOff className={cn("h-4 w-4 shrink-0")} />;
}

export function FilterSelect({
  id,
  className,
  filter,
  onFilterSelect,
  disabled,
}: {
  id?: string;
  className?: string;
  filter?: string;
  onFilterSelect?: (value: string) => void;
  disabled?: boolean;
}): JSX.Element {
  const [value, setValue] = useState(filter ?? "");

  const [open, setOpen] = useState(false);
  const myFilters = useSettingsStore((state) => state.myFilters);
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const filterNames = myFilters.map((filter) => filter.name);
  // Match the typed name against DISPLAY names too: users see "Campsite", not
  // "my_1712…_Campsite". Comparing raw names only meant re-typing an existing
  // filter's name always offered "Add filter" and minted a duplicate
  // (support ticket: 6× "Campsite").
  const isExistingFilter = filterNames.some(
    (name) => name === value || name.replace(/my_\d+_/, "") === value,
  );
  const myFilter = myFilters.find((f) => f.name === filter);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          id={id}
          className={cn(
            "rounded-md border border-input justify-between",
            className,
          )}
          disabled={disabled}
        >
          {myFilter ? (
            <span className="truncate flex gap-2 items-center">
              <FilterIcon filter={myFilter} />
              <span>{myFilter.name.replace(/my_\d+_/, "")}</span>
            </span>
          ) : (
            <span />
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[200px] md:w-[300px]">
          <CommandInput
            placeholder="Enter filter name..."
            value={value}
            onValueChange={(v) => {
              if (v.startsWith("private_") || v.startsWith("shared_")) {
                return;
              }
              setValue(v);
            }}
          />
          <CommandList>
            <CommandGroup className="p-0 grid">
              <ScrollArea className="h-full max-h-96">
                {myFilters.map((myFilter) => (
                  <CommandItem
                    key={myFilter.name}
                    value={myFilter.name}
                    onSelect={() => {
                      onFilterSelect?.(myFilter.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filter === myFilter.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex gap-2 items-center">
                      <FilterIcon filter={myFilter} />
                      <span>{myFilter.name.replace(/my_\d+_/, "")}</span>
                    </div>
                  </CommandItem>
                ))}
                {!isExistingFilter && (
                  <CommandItem
                    value={`new_${value}`}
                    disabled={value.length === 0}
                    onSelect={() => {
                      const filterName = `my_${Date.now()}_${value}`;
                      addMyFilter({ name: filterName });
                      onFilterSelect?.(filterName);
                      setValue(value);
                      setOpen(false);
                    }}
                  >
                    <Plus className={cn("mr-2 h-4 w-4")} />
                    <span className="flex gap-2 items-center">
                      Add filter <i>{value}</i>
                    </span>
                  </CommandItem>
                )}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
