import { useCoordinates } from "../(providers)";
import { MyFilters } from "./my-filters";
import { CollapsibleFilter } from "./collapsible-filter";
import { RegionFilters } from "./region-filters";

export function MarkersFilters(): JSX.Element {
  const { filters: filterDetails } = useCoordinates();

  return (
    <>
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
