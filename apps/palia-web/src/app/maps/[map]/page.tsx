import type { Metadata } from "next";
import { fetchVersion, getMapNameFromVersion } from "@repo/lib";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { MarkersSearch } from "@repo/ui/controls";
import { FloatingAds } from "@repo/ui/ads";
import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { PaliaGrid, PaliaGridToggle, PaliaTime } from "@repo/ui/data";

interface PageProps {
  params: Promise<{ map: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const map = (await params).map;
  let decodedMap = decodeURIComponent(map);
  if (!decodedMap.endsWith(" Map")) {
    decodedMap += " Map";
  }

  const title = `${decodedMap} – ${APP_CONFIG.title} Interactive Map`;

  let description = `Explore ${decodedMap} in ${APP_CONFIG.title} with `;
  if (APP_CONFIG.keywords) {
    description += `${APP_CONFIG.keywords.join(", ")}, plus more locations.`;
  } else {
    description += "locations, points of interest, and more.";
  }

  return {
    title,
    description,
    alternates: { canonical: `/maps/${map}` },
  };
}

export default async function Map({ params }: PageProps) {
  const map = (await params).map;
  const version = await fetchVersion(APP_CONFIG.name);
  const mapName = getMapNameFromVersion(version, map);
  if (!mapName) {
    notFound();
  }

  return (
    <CoordinatesProvider
      appName={APP_CONFIG.name}
      staticDrawings={version.data.drawings}
      filters={version.data.filters}
      mapNames={Object.keys(version.data.tiles)}
      useCbor
      regions={version.data.regions}
      typesIdMap={version.data.typesIdMap}
      nodesPaths={version.more.nodes}
      map={mapName}
    >
      <HeaderOffset full>
        <FullMapDynamic
          appConfig={APP_CONFIG}
          tilesConfig={version.data.tiles}
          iconsPath={version.more.icons}
        />
        <MarkersSearch
          lastMapUpdate={version.createdAt}
          tileOptions={version.data.tiles}
          appName={APP_CONFIG.name}
          iconsPath={version.more.icons}
          additionalFilters={
            <>
              <PaliaTime />
              <PaliaGridToggle />
            </>
          }
        >
          <FloatingAds id={APP_CONFIG.name} />
        </MarkersSearch>
        <PaliaGrid />
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
