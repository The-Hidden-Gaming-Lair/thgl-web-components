import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { games as thglGames } from "@repo/lib";
import { Button } from "@repo/ui/controls";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { AdminGameEditor } from "@/games/thgl-web/components/stats/admin-game-editor";
import { GameStatsView } from "@/games/thgl-web/components/stats/game-stats-view";
import { GameVote } from "@/games/thgl-web/components/stats/game-vote";
import { StatusBadge } from "@/games/thgl-web/components/stats/status-badge";
import { formatExact } from "@/games/thgl-web/components/stats/format";
import { getGame, getGameDetail } from "@/lib/stats-db";
import {
  discordThreadUrl,
  PUBLIC_STATUSES,
  VOTABLE_STATUSES,
} from "@/lib/stats-types";
import { getAppConfigBySlug } from "@/configs";
import { getSiteKind, siteLinkLabel } from "@/lib/site-kind";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id).catch(() => null);
  if (!game || !PUBLIC_STATUSES.includes(game.status)) return {};
  const title = `${game.title} Player Count & Stats | TH.GL`;
  const description = `How many people play ${game.title}? Live Steam player count, 24-hour and 30-day peaks, trend, Twitch viewers, Discord activity, platforms and patch history.`;
  return {
    title,
    description,
    alternates: { canonical: `/stats/${game.id}` },
    openGraph: {
      url: `/stats/${game.id}`,
      ...(game.imageUrl ? { images: [game.imageUrl] } : {}),
    },
  };
}

export default async function GameStatsPage({ params }: Props) {
  const { id } = await params;
  const game = await getGameDetail(id);
  if (!game || !PUBLIC_STATUSES.includes(game.status)) notFound();
  const thgl = game.thglId
    ? thglGames.find((g) => g.id === game.thglId)
    : undefined;
  const tenant = thgl?.web ? getAppConfigBySlug(thgl.id) : null;
  const siteLabel = tenant
    ? siteLinkLabel(await getSiteKind(tenant))
    : "Open the website";

  return (
    <PageShell className="max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${game.title} Player Count & Stats`,
            url: `https://www.th.gl/stats/${game.id}`,
          }).replace(/</g, "\\u003c"),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/stats"
              className="hover:text-foreground transition-colors"
            >
              Stats
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{game.title}</li>
        </ol>
      </nav>

      <header className="flex flex-col items-center gap-4 text-center">
        {game.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.imageUrl}
            alt={`${game.title} key art`}
            width={460}
            height={215}
            className="w-full max-w-md rounded-lg border object-cover"
          />
        )}
        <div className="space-y-2">
          <h1 className="font-bold max-md:text-3xl md:text-4xl">
            {game.title} Player Count
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={game.status} />
            {game.releaseDate && <span>Release: {game.releaseDate}</span>}
          </div>
          {game.summary.steamCcu !== null && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatExact(game.summary.steamCcu)}
              </span>{" "}
              people are playing {game.title} on Steam right now.
            </p>
          )}
        </div>
        {thgl ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href={`/apps/${thgl.id}`}>All {game.title} tools</Link>
            </Button>
            {thgl.web && (
              <Button asChild variant="outline">
                <a href={thgl.web}>{siteLabel}</a>
              </Button>
            )}
          </div>
        ) : VOTABLE_STATUSES.includes(game.status) ? (
          <GameVote gameId={game.id} voteCount={game.voteCount} />
        ) : null}
        {game.discordThreadId && (
          <a
            href={discordThreadUrl(game.discordThreadId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Discuss {game.title} on Discord
          </a>
        )}
        {game.note && (
          <p className="max-w-2xl text-sm text-muted-foreground">{game.note}</p>
        )}
      </header>

      <GameStatsView game={game} />

      {/* The plain row, not a second copy of the series in the RSC payload. */}
      <AdminGameEditor
        game={{
          id: game.id,
          title: game.title,
          status: game.status,
          thglId: game.thglId,
          steamAppId: game.steamAppId,
          platforms: game.platforms,
          imageUrl: game.imageUrl,
          releaseDate: game.releaseDate,
          url: game.url,
          discordInvite: game.discordInvite,
          discordGuildId: game.discordGuildId,
          discordThreadId: game.discordThreadId,
          twitchGameId: game.twitchGameId,
          note: game.note,
          voteCount: game.voteCount,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        }}
      />

      {!thgl && (
        <p className="text-center text-sm text-muted-foreground">
          Want TH.GL to support a different game?{" "}
          <Link href="/requests" className="text-primary hover:underline">
            Request it here
          </Link>
          .
        </p>
      )}
    </PageShell>
  );
}
