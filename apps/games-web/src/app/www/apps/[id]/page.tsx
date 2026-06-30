import { redirect } from "next/navigation";
import { games, getUpdateMessages } from "@repo/lib";
import Image from "next/image";
import Link from "next/link";
import { ReleaseNotes } from "./release-notes";
import { PartnerCard } from "@/games/thgl-web/components/partner-card";
import { PlatformCard } from "@/games/thgl-web/components/platform-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  const game = games.find((g) => g.id === id);
  if (!game) return {};
  return {
    title: `${game.title} – Game Tools & Overlays | TH.GL`,
    description: `Explore overlays, interactive maps, and second-screen tools for ${game.title}. Available via the TH.GL Companion App, Overwolf, or web.`,
    alternates: { canonical: `/apps/${game.id}` },
    openGraph: {
      url: `/apps/${game.id}`,
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const game = games.find((g) => g.id === id);

  if (!game) {
    const decodedId = decodeURIComponent(id);
    const gameByTitle = games.find(
      (g) =>
        g.title === decodedId ||
        g.overwolf?.title === decodedId ||
        g.partnerApps?.some((app) => app.title === decodedId),
    );
    if (gameByTitle) {
      redirect(`/apps/${gameByTitle.id}`);
    }
    redirect(`/apps`);
  }
  const updateMessages = await getUpdateMessages(game.discordId);

  return (
    <section className="mx-auto px-4 py-12 space-y-10 max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${game.title} – Game Tools & Overlays | TH.GL`,
            description: `Explore overlays, interactive maps, and second-screen tools for ${game.title}. Available via the TH.GL Companion App, Overwolf, or web.`,
            url: `https://www.th.gl/apps/${game.id}`,
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
              href="/apps"
              className="hover:text-foreground transition-colors"
            >
              Apps
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{game.title}</li>
        </ol>
      </nav>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Image
            src={game.logo}
            unoptimized
            alt={`${game.title} logo`}
            width={64}
            height={64}
            className="rounded"
            sizes="64px"
          />
          <h1 className="text-4xl font-bold">{game.title}</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore overlays, interactive maps, and tracking tools available for
          this game.
        </p>
      </div>

      {/* Platform Options */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Available Platforms
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {game.companion && (
            <PlatformCard
              type="companion"
              title="Companion App"
              description="Run the map inside the TH.GL Companion App with live position tracking, second-screen support, and hotkey toggles."
              href="/companion-app"
              buttonLabel="Learn More About Companion App"
            />
          )}

          {game.overwolf && (
            <PlatformCard
              type="overwolf"
              title="Overwolf App"
              description="Available in the Overwolf store. Works in-game with hotkeys and overlays."
              href={game.overwolf.url}
              buttonLabel="View on Overwolf"
              external
            />
          )}

          {game.web && (
            <PlatformCard
              type="web"
              title="Web Tool"
              description="Use the tool or tracker in your browser — no install required."
              href={game.web}
              buttonLabel="Open Website"
              external
            />
          )}
        </div>
      </div>

      {game.partnerApps && game.partnerApps.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Partner Apps</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {game.partnerApps.map((app) => (
              <PartnerCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      )}

      {/* Release Notes */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Release Notes</h2>
        <ReleaseNotes updateMessages={updateMessages} />
      </div>
    </section>
  );
}
