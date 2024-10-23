import { useMemo, useState } from "react";
import {
  REGION_FILTERS,
  useCoordinates,
  useT,
  useUserStore,
} from "../(providers)";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn } from "@repo/lib";
import { FoldVertical, UnfoldVertical } from "lucide-react";

export function RegionFilters() {
  const { regions } = useCoordinates();

  const [open, setOpen] = useState(true);
  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);
  const activeFiltersLength = useMemo(
    () => REGION_FILTERS.filter((f) => filters.includes(f.id)).length,
    [filters],
  );

  if (regions.length === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !activeFiltersLength,
        })}
      >
        <button
          className={cn(
            "text-left transition-colors hover:text-primary p-1 truncate grow",
          )}
          onClick={() => {
            const newFilters = REGION_FILTERS.some((f) =>
              filters.includes(f.id),
            )
              ? filters.filter(
                  (filter) =>
                    !REGION_FILTERS.some((value) => value.id === filter),
                )
              : [...new Set([...filters, ...REGION_FILTERS.map((f) => f.id)])];
            setFilters(newFilters);
          }}
          title={t("drawings")}
          type="button"
        >
          <span className="font-semibold">{t("drawings")}</span>
          <span className="ml-1 text-xs text-muted-foreground">
            ({activeFiltersLength}/{REGION_FILTERS.length})
          </span>
        </button>
        <CollapsibleTrigger asChild>
          <button className="hover:text-primary p-2">
            {open ? (
              <FoldVertical className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-wrap">
        {REGION_FILTERS.map((filter) => (
          <div
            key={filter.id}
            className={cn("flex md:basis-1/2 overflow-hidden", {
              hidden:
                filter.id === "region_borders" &&
                !regions.some((r) => r.border.length > 0),
            })}
          >
            <button
              className={cn(
                "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                {
                  "text-muted-foreground": !filters.includes(filter.id),
                },
              )}
              onClick={() => {
                toggleFilter(filter.id);
              }}
              title={t(filter.id)}
              type="button"
            >
              <filter.Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(filter.id)}</span>
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
