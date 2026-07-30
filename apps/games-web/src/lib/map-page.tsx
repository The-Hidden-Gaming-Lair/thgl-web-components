import { games, type AppConfig } from "@repo/lib";
import { createMapPage } from "@repo/ui/apps";
import { AdditionalContent } from "@repo/ui/content";
import { getAppConfig } from "./get-app-config";

/**
 * Look up a game's per-game extras (additionalFilters, additionalTooltip)
 * from the registry in @repo/lib/games. Match is by Game.id == AppConfig.name.
 *
 * Returns the JSX + tooltip array to pass into createMapPage.
 */
function getMapExtras(appConfig: AppConfig) {
  const game = games.find((g) => g.id === appConfig.name);
  const additionalFilters =
    game?.additionalFilters && game.additionalFilters.length > 0 ? (
      <AdditionalContent items={game.additionalFilters} />
    ) : undefined;
  // Invisible map-layer components (e.g. PaliaGrid). The old per-game *-web
  // apps mounted these inline; the consolidated page must wire them too, or
  // toggles like Palia's "Show Grid" render but control nothing.
  const additionalComponents =
    game?.additionalComponents && game.additionalComponents.length > 0 ? (
      <AdditionalContent items={game.additionalComponents} />
    ) : undefined;
  return {
    additionalFilters,
    additionalComponents,
    additionalTooltip: game?.additionalTooltip,
  };
}

/**
 * Multi-tenant version of createMapPage that also wires the game's
 * AdditionalFilters / AdditionalTooltip from the global games registry.
 *
 * Restores the per-game side panel widgets (e.g. CrimsonDesertSaveImport,
 * CrimsonDesertZones, DuneDeepDesertGrid, etc.) that the old per-game
 * *-web apps used to pass explicitly to createMapPage.
 */
type MapPageProps = Parameters<ReturnType<typeof createMapPage>>[0];

export function multiTenantMapPage() {
  return async (props: MapPageProps) => {
    const config = await getAppConfig();
    const { additionalFilters, additionalComponents, additionalTooltip } =
      getMapExtras(config);
    const Page = createMapPage(
      config,
      additionalFilters,
      additionalTooltip,
      additionalComponents,
    );
    return Page(props);
  };
}
