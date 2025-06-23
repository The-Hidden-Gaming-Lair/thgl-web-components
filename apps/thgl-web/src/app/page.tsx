import Link from "next/link";
import { Button, Card } from "@repo/ui/controls";
import { Subtitle } from "@/components/subtitle";
import { games, testimonials } from "@repo/lib";
import { GameCard } from "@/components/game-card";
import { blogEntries } from "@/lib/blog-entries";

const featuredGames = games.slice(0, 6); // Adjust how many to feature

export const metadata = {
  title: "TH.GL – All-in-One Companion App & Game Tools",
  description:
    "Smarter tools for gamers. Use real-time overlays, second-screen maps, and web tools to enhance your play across supported games.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <section className="space-y-16 px-4 pt-10 pb-20 mx-auto">
      <div className="text-center space-y-6">
        <Subtitle>Smarter Tools for Gamers</Subtitle>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore real-time overlays, interactive maps, and companion tools for
          your favorite games — powered by the TH.GL Companion App, Overwolf, or
          your browser.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button asChild>
            <Link href="/apps">Explore Games</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/companion-app">Get Companion App</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <div>
          <h3 className="font-semibold text-lg mb-2">🗺️ Interactive Maps</h3>
          <p className="text-muted-foreground text-sm">
            See everything — nodes, paths, collectibles and more, in real-time.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">🖥️ Companion App</h3>
          <p className="text-muted-foreground text-sm">
            Overlay or second-screen. Switch anytime. No Overwolf required.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">🔐 Privacy Friendly</h3>
          <p className="text-muted-foreground text-sm">
            No account required. Local-first. Ad-free for subscribers.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">🎮 Popular Games</h3>
          <p className="text-muted-foreground text-sm">
            Supports Palworld, Wuthering Waves, Once Human, and many more.
          </p>
        </div>
      </div>

      {/* Featured Games */}
      <div className="space-y-6">
        <Subtitle>Featured Games</Subtitle>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        <div className="text-center pt-2">
          <Link
            href="/apps"
            className="underline text-sm text-muted-foreground hover:text-white"
          >
            View all supported games →
          </Link>
        </div>
      </div>

      {/* Community & Support */}
      <div className="p-6 rounded-lg text-center space-y-4">
        <Subtitle>Join the Community</Subtitle>
        <p className="text-sm text-muted-foreground">
          Join <strong>tens of thousands</strong> of players using TH.GL every
          day. Get help, share tips, or just hang out.
        </p>
        <Button asChild>
          <Link href="https://th.gl/discord" target="_blank">
            Join the Discord
          </Link>
        </Button>
      </div>

      <div className="space-y-4 text-center">
        <Subtitle>What Players Are Saying</Subtitle>
        <div className="grid sm:grid-cols-2 gap-4">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-4">
              <blockquote className="text-sm text-muted-foreground italic">
                “{t.message}”
              </blockquote>
              <footer className="pt-2 text-xs text-right text-muted-foreground">
                — {t.author}
              </footer>
            </Card>
          ))}
        </div>
      </div>

      {/* Blog Teaser */}
      <div className="space-y-4 text-center">
        <Subtitle>From the Blog</Subtitle>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <Card className="p-4 w-full max-w-sm text-left">
            <Link
              href={`/blog/${blogEntries[0].id}`}
              className="space-y-2 block"
            >
              <h3 className="text-lg font-semibold text-brand">
                {blogEntries[0].title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {blogEntries[0].description}
              </p>
              <span className="text-sm underline text-brand">Read more →</span>
            </Link>
          </Card>
        </div>
        <div className="pt-2">
          <Link
            href="/blog"
            className="underline text-sm text-muted-foreground hover:text-white"
          >
            View all blog posts →
          </Link>
        </div>
      </div>

      {/* Support CTA */}
      <div className="text-center space-y-3 pt-10">
        <Subtitle>Support Development</Subtitle>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          TH.GL is free to use and ad-supported. You can unlock a better
          experience by becoming a supporter on Patreon.
        </p>
        <Button asChild>
          <Link href="/support-me">Support Me on Patreon</Link>
        </Button>
        <p className="text-xs text-muted-foreground pt-2 italic">
          Built and maintained by a solo developer — thank you for your support!
        </p>
      </div>
    </section>
  );
}
