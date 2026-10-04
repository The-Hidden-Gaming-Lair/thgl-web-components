import { fetchVersion, games, getUpdateMessages } from "@repo/lib";
import { notFound } from "next/navigation";
import { getAppConfigBySlug } from "@/configs";
import { GamePageClient } from "./client";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = games.find((g) => g.id === id);

  if (!game) {
    notFound();
  }

  // The game's codex / guides open as app windows (/apps/<id>/db, …) — same
  // availability rules as the site nav (database: config.db; guides: filters).
  const siteConfig = getAppConfigBySlug(game.id);
  const [updateMessages, version] = await Promise.all([
    getUpdateMessages(game.discordId),
    siteConfig ? fetchVersion(game.id).catch(() => null) : null,
  ]);
  const appPages = {
    db: !!siteConfig?.db,
    guides: !!version && version.data.filters.length > 0,
  };

  return (
    <GamePageClient
      game={game}
      updateMessages={updateMessages}
      appPages={appPages}
    />
  );
}

// No generateStaticParams: the parent (app)/[locale]/layout.tsx calls
// requireApp("thgl-app") → headers(), which is a dynamic API. Static
// gen of this route would throw DYNAMIC_SERVER_USAGE at build time
// AND at runtime when an unknown id is requested. The dashboard is
// per-user content anyway, so there's no caching benefit lost.
