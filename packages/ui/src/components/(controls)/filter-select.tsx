import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
}: {
  id?: string;
  className?: string;
}): JSX.Element {
  const [value, setValue] = useState("");

  const [open, setOpen] = useState(false);
  const filter = useSettingsStore((state) =>
    state.tempPrivateNode?.filter?.replace("private_", ""),
  );
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const privateNodes = useSettingsStore((state) => state.privateNodes);
  const privateNodesFilters = [
    ...new Set(
      privateNodes.map(
        (privateNode) => privateNode.filter ?? "private_Unsorted",
      ),
    ),
  ];
  const isExistingFilter = filter
    ? privateNodesFilters.includes(filter)
    : false;

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
        >
          <span className="truncate">{filter}</span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full">
        <Command className="w-[175px] md:w-[300px]">
          <CommandInput
            placeholder="Enter filter name..."
            value={value}
            onValueChange={setValue}
          />
          <CommandList>
            <CommandGroup className="p-0 grid">
              <ScrollArea className="h-full max-h-96">
                {privateNodesFilters.map((privateFilter) => (
                  <CommandItem
                    key={privateFilter}
                    value={privateFilter}
                    onSelect={() => {
                      setTempPrivateNode({ filter: privateFilter });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filter === privateFilter ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {privateFilter.replace("private_", "")}
                  </CommandItem>
                ))}
                {!isExistingFilter && (
                  <CommandItem
                    value={value}
                    disabled={value.length === 0}
                    onSelect={() => {
                      setTempPrivateNode({ filter: value });
                      setOpen(false);
                    }}
                  >
                    <Plus className={cn("mr-2 h-4 w-4")} />
                    <span>
                      Add <i>{value}</i>
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
