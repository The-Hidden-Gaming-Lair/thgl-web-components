import { ChevronsUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@repo/lib";
import { useCoordinates, useT, useUserStore } from "../(providers)";

export function GlobalFilters() {
  const t = useT();
  const { globalFilters } = useCoordinates();
  const myGlobalFilters = useUserStore((state) => state.globalFilters);
  const toggleGlobalFilter = useUserStore((state) => state.toggleGlobalFilter);

  if (globalFilters.length === 0) {
    return null;
  }
  return (
    <div className="flex justify-center p-1">
      {globalFilters.map((globalFilter) => (
        <Popover key={globalFilter.group}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" type="button">
              {t(globalFilter.group)}
              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0 flex flex-col text-sm">
            {globalFilter.values
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((filter) => (
                <button
                  key={filter.id}
                  className={cn(
                    "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                    {
                      "text-muted-foreground": !myGlobalFilters.includes(
                        filter.id,
                      ),
                    },
                  )}
                  onClick={() => {
                    toggleGlobalFilter(filter.id);
                  }}
                  type="button"
                >
                  {t(filter.id)}
                </button>
              ))}
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}
