import { redirect } from "next/navigation";
import { Button, Card, CardContent } from "@repo/ui/controls";
import { games, getUpdateMessages } from "@repo/lib";
import Image from "next/image";
import Link from "next/link";
import { ReleaseNotes } from "./release-notes";
import { PartnerCard } from "@/components/partner-card";
import { Subtitle } from "@repo/ui/content";

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
    <section className="mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-4">
        <Image
          src={game.logo}
          alt={`${game.title} logo`}
          width={80}
          height={80}
          className="mx-auto"
        />
        <Subtitle title={`${game.title} Apps & Overlays`} />
        <p className="text-muted-foreground">
          Explore overlays, interactive maps, and tracking tools available for
          this game.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {game.companion && (
          <Card>
            <CardContent className="p-6 space-y-2">
              <h2 className="text-xl font-semibold">Companion App</h2>
              <p className="text-muted-foreground text-sm">
                Run the map inside the TH.GL Companion App with live position
                tracking, second-screen support, and hotkey toggles.
              </p>
              <Button asChild>
                <Link href="/companion-app">Open Companion App Info</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {game.overwolf && (
          <Card>
            <CardContent className="p-6 space-y-2">
              <h2 className="text-xl font-semibold">Overwolf App</h2>
              <p className="text-muted-foreground text-sm">
                Available in the Overwolf store. Works in-game with hotkeys and
                overlays.
              </p>
              <Button asChild>
                <Link href={game.overwolf.url} target="_blank">
                  View on Overwolf
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {game.web && (
          <Card>
            <CardContent className="p-6 space-y-2">
              <h2 className="text-xl font-semibold">Web Tool</h2>
              <p className="text-muted-foreground text-sm">
                Use the tool or tracker in your browser — no install required.
              </p>
              <Button asChild>
                <Link href={game.web} target="_blank">
                  Open Website
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {game.partnerApps && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Partner Apps</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {game.partnerApps.map((app) => (
              <PartnerCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Release Notes</h2>
        <ReleaseNotes updateMessages={updateMessages} />
      </div>
    </section>
  );
}
