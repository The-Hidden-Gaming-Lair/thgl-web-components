import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import { RequestsBoard } from "@/games/thgl-web/components/stats/requests-board";
import { listGamesWithSummary } from "@/lib/stats-db";
import { VOTABLE_STATUSES, type StatsGameWithSummary } from "@/lib/stats-types";

// Public list from Bunny DB, edge-cached 10 min; per-user state loads client-side.
export const dynamic = "force-dynamic";

const TITLE = "Request a Game | TH.GL";
const DESCRIPTION =
  "Tell TH.GL which game should get an interactive map, overlay or companion app next. Request a game and vote for the ones you want.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/requests" },
  openGraph: { url: "/requests" },
};

const STEPS = [
  { label: "Requested", text: "Players ask for it and vote." },
  { label: "Watching", text: "I follow its player numbers and news." },
  { label: "In progress", text: "Maps and tools are being built." },
  { label: "Supported", text: "Live on TH.GL." },
];

export default async function RequestsPage() {
  let games: StatsGameWithSummary[] | null = null;
  try {
    games = await listGamesWithSummary(VOTABLE_STATUSES);
  } catch (err) {
    console.error(
      "[requests] list failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return (
    <PageShell className="max-w-5xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: TITLE,
            description: DESCRIPTION,
            url: "https://www.th.gl/requests",
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
          <li aria-current="page">Request a Game</li>
        </ol>
      </nav>
      <PageHeader
        title="Which game should be next?"
        description="Request the game you want maps, overlays and tools for, and vote for other requests. Votes, together with player numbers, decide what TH.GL supports next."
      />
      <ol className="grid gap-3 sm:max-md:grid-cols-2 md:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.label} className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Step {i + 1}</div>
            <div className="font-medium">{step.label}</div>
            <div className="text-sm text-muted-foreground">{step.text}</div>
          </li>
        ))}
      </ol>
      {games ? (
        <RequestsBoard games={games} />
      ) : (
        <p className="text-center text-muted-foreground">
          Requests are temporarily unavailable. Please try again in a few
          minutes.
        </p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        See player numbers for every tracked game on the{" "}
        <Link href="/stats" className="text-primary hover:underline">
          stats page
        </Link>
        .
      </p>
    </PageShell>
  );
}
