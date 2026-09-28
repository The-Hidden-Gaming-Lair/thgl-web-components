import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import { StatsTable } from "@/games/thgl-web/components/stats/stats-table";
import { listGamesWithSummary } from "@/lib/stats-db";
import { PUBLIC_STATUSES, type StatsGameWithSummary } from "@/lib/stats-types";
import { Button } from "@repo/ui/controls";

// Reads Bunny DB per render; the edge caches it for 10 min (next.config.js statsCache).
export const dynamic = "force-dynamic";

const TITLE = "Game Player Counts & Stats | TH.GL";
const DESCRIPTION =
  "Live Steam player counts, peaks, trends, Twitch viewers, Discord activity and patch history for every game TH.GL supports, is working on, or players have requested.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/stats" },
  openGraph: { url: "/stats" },
};

export default async function StatsPage() {
  let games: StatsGameWithSummary[] | null = null;
  try {
    games = await listGamesWithSummary(PUBLIC_STATUSES);
  } catch (err) {
    console.error(
      "[stats] list failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return (
    <PageShell className="max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: TITLE,
            description: DESCRIPTION,
            url: "https://www.th.gl/stats",
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
          <li aria-current="page">Stats</li>
        </ol>
      </nav>
      <PageHeader
        title="Game Stats"
        description="Player counts, trends and patches for the games TH.GL supports, is building, and that players have asked for. Updated every 10 minutes."
      />
      <div className="flex justify-center">
        <Button asChild>
          <Link href="/requests">Request a game</Link>
        </Button>
      </div>
      {games ? (
        <StatsTable games={games} />
      ) : (
        <p className="text-center text-muted-foreground">
          Stats are temporarily unavailable. Please try again in a few minutes.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Player numbers are Steam&apos;s live counts — the only store that
        publishes them. Games on other stores or their own launchers show Twitch
        and Discord activity instead.
      </p>
    </PageShell>
  );
}
