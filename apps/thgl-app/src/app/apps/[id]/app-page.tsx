import { fetchVersion, games } from "@repo/lib";
import { AdditionalContent } from "@repo/ui/content";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import type { Dict } from "@repo/ui/providers";
import { App } from "@repo/ui/thgl-app";
import { notFound } from "next/navigation";

export function createAppPage(isOverlay: boolean) {
  return async function ({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    const game = games.find((game) => game.id === id);
    if (!game) {
      notFound();
    }
    const companion = game.companion;
    if (!companion) {
      notFound();
    }

    const version = await fetchVersion(game.id);
    const enDictMerged = { ...enDictGlobal, ...version.data.enDict } as Dict;
    const domain = game.web ? new URL(game.web).host.split(".")[0] : "";
    return (
      <App
        appConfig={{
          name: game.id,
          title: game.title,
          domain: domain,
          withoutOverlayMode: !game.companion?.overlayURL,
          withoutLiveMode: Object.keys(version.data.typesIdMap).length === 0,
          markerOptions: companion.markerOptions,
          defaultHotkeys: companion.defaultHotkeys,
        }}
        dict={enDictMerged}
        filters={version.data.filters}
        regions={version.data.regions}
        tiles={version.data.tiles}
        typesIdMap={version.data.typesIdMap}
        globalFilters={version.data.globalFilters}
        version={version}
        isOverlay={isOverlay}
        lockedWindowComponents={
          game.lockedWindowComponents ? (
            <AdditionalContent items={game.lockedWindowComponents} />
          ) : null
        }
        additionalComponents={
          game.additionalComponents ? (
            <AdditionalContent items={game.additionalComponents} />
          ) : null
        }
        additionalFilters={
          game.additionalFilters ? (
            <AdditionalContent items={game.additionalFilters} />
          ) : null
        }
      />
    );
  };
}
