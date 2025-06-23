import { useCoordinates } from "../(providers)";
import { MyFilters } from "./my-filters";
import { CollapsibleFilter } from "./collapsible-filter";
import { RegionFilters } from "./region-filters";

export function MarkersFilters({
  appName,
  iconsPath,
}: {
  appName?: string;
  iconsPath?: string;
}): JSX.Element {
  const { filters: filterDetails } = useCoordinates();

  return (
    <>
      <MyFilters />
      <RegionFilters />
      <div className="flex flex-col w-[200px] md:w-[300px] lg:w-full">
        {filterDetails.map((f) => (
          <CollapsibleFilter
            key={f.group}
            filter={f}
            appName={appName}
            iconsPath={iconsPath}
          />
        ))}
      </div>
    </>
  );
}
