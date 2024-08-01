import { Check, ChevronsUpDown, Plus, User, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useState } from "react";
import { cn, useSettingsStore } from "@repo/lib";
import { ScrollArea } from "../ui/scroll-area";

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
  const isExistingFilter = filterNames.includes(value);
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
              {!myFilter.isShared ? (
                <User className={cn("h-4 w-4 shrink-0")} />
              ) : (
                <Users className={cn("h-4 w-4 shrink-0")} />
              )}
              <span>{myFilter.name.replace(/my_\d+_/, "")}</span>
            </span>
          ) : (
            <span />
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[175px] md:w-[300px]">
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
                      {!myFilter.isShared ? (
                        <User className={cn("h-4 w-4 shrink-0")} />
                      ) : (
                        <Users className={cn("h-4 w-4 shrink-0")} />
                      )}
                      <span>{myFilter.name.replace(/my_\d+_/, "")}</span>
                    </div>
                  </CommandItem>
                ))}
                {!isExistingFilter && (
                  <>
                    <CommandItem
                      value={`private_${value}`}
                      disabled={value.length === 0}
                      onSelect={() => {
                        const filterName = `my_${Date.now()}_${value}`;
                        addMyFilter({
                          name: filterName,
                        });
                        onFilterSelect?.(filterName);
                        setValue(value);
                        setOpen(false);
                      }}
                    >
                      <Plus className={cn("mr-2 h-4 w-4")} />
                      <span className="flex gap-2 items-center">
                        <User className={cn("h-4 w-4 shrink-0")} /> Add private{" "}
                        <i>{value}</i>
                      </span>
                    </CommandItem>
                    <CommandItem
                      value={`shared_${value}`}
                      disabled={value.length === 0}
                      onSelect={() => {
                        const filterName = `my_${Date.now()}_${value}`;
                        addMyFilter({
                          name: filterName,
                          isShared: true,
                        });
                        onFilterSelect?.(value);
                        setValue(value);
                        setOpen(false);
                      }}
                    >
                      <Plus className={cn("mr-2 h-4 w-4")} />
                      <span className="flex gap-2 items-center">
                        <Users className={cn("h-4 w-4 shrink-0")} /> Add shared{" "}
                        <i>{value ?? "filter"}</i>
                      </span>
                    </CommandItem>
                  </>
                )}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
