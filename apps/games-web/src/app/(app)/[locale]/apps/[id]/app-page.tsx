import {
  fetchDict,
  fetchVersion,
  games,
  getAppDomain,
  Dict,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { AdditionalContent } from "@repo/ui/content";
import { getGlobalDictionary } from "@repo/ui/dicts";
import { App, AppPagesNav } from "@repo/ui/thgl-app";
import { notFound } from "next/navigation";
import { getAppConfigBySlug } from "@/configs";

export function createAppPage(isOverlay: boolean) {
  return async function ({
    params,
  }: {
    params: Promise<{ id: string; locale?: string }>;
  }) {
    const { id, locale = DEFAULT_LOCALE } = await params;
    const game = games.find((game) => game.id === id);
    if (!game) {
      notFound();
    }
    const companion = game.companion;
    if (!companion) {
      notFound();
    }

    const [version, dynamicDict, globalDict] = await Promise.all([
      fetchVersion(game.id),
      fetchDict(game.id, locale).catch(() =>
        fetchDict(game.id, DEFAULT_LOCALE),
      ),
      getGlobalDictionary(locale),
    ]);
    const dict = { ...globalDict, ...dynamicDict } as Dict;
    const domain = getAppDomain(game);
    // The game's codex / guides / tools open as app pages (/apps/<id>/db, …).
    const siteConfig = getAppConfigBySlug(game.id);
    return (
      <App
        appConfig={{
          name: game.id,
          title: game.title,
          domain: domain,
          withoutOverlayMode: !game.companion?.overlayURL,
          markerOptions: companion.markerOptions,
          defaultHotkeys: companion.defaultHotkeys,
        }}
        dict={dict}
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
        filterBarExtras={
          game.filterBarComponents ? (
            <AdditionalContent items={game.filterBarComponents} />
          ) : null
        }
        additionalTooltip={game.additionalTooltip}
        pagesNav={
          siteConfig && !isOverlay ? (
            <AppPagesNav
              appConfig={siteConfig}
              gameId={game.id}
              hasMap
              hasGuides={version.data.filters.length > 0}
            />
          ) : null
        }
      />
    );
  };
}
