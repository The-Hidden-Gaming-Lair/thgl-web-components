import { ReactNode } from "react";
import { useCoordinates } from "../(providers)";
import { Separator } from "../ui/separator";
import { Presets } from "./presets";
import { MapSelect } from "./map-select";
import { GlobalFilters } from "./global-filters";
import { MyFilters } from "./my-filters";
import { CollapsibleFilter } from "./collapsible-filter";
import { RegionFilters } from "./region-filters";

export function MarkersFilters({
  mapNames,
  children,
}: {
  mapNames: string[];
  children?: ReactNode;
}): JSX.Element {
  const { filters: filterDetails } = useCoordinates();

  return (
    <>
      {children && (
        <>
          {children}
          <Separator />
        </>
      )}
      {mapNames.length > 1 && (
        <>
          <MapSelect mapNames={mapNames} />
          <Separator />
        </>
      )}
      <Presets />
      <Separator />
      <GlobalFilters />
      <MyFilters />
      <RegionFilters />
      <div className="flex flex-col w-[175px] md:w-full">
        {filterDetails.map((f) => (
          <CollapsibleFilter key={f.group} filter={f} />
        ))}
      </div>
    </>
  );
}
