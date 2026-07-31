import Link from "next/link";
import { Button, Card } from "@repo/ui/controls";
import {
  games,
  testimonials,
  getUpdateMessages,
  hasReleasedCompanion,
  mergeUpdates,
  Game,
  DiscordMessageData,
  ChangelogEntry,
} from "@repo/lib";
import { WhatsNew } from "@repo/ui/content";
import { GameGrid } from "@/games/thgl-web/components/game-grid";
import { blogEntries } from "@/games/thgl-web/lib/blog-entries";
import { Download, Monitor, Gamepad2, Shield } from "lucide-react";
import {
  PageHero,
  FeatureCard,
  FeatureGrid,
  ImageShowcase,
  ComparisonCards,
  SectionHeader,
  CTASection,
} from "@/games/thgl-web/components/sections";
import { BlogPostCard } from "@/games/thgl-web/components/blog-post-card";

const featuredGames = games.slice(0, 6);
const companionGames = games.filter(hasReleasedCompanion);

async function getWhatsNewUpdates() {
  const gameUpdates: Array<{ game: Game; message: DiscordMessageData }> = [];

  // Fetch updates for featured companion games and app changelog in parallel
  const [, appUpdates] = await Promise.all([
    Promise.all(
      companionGames.slice(0, 6).map(async (game) => {
        const messages = await getUpdateMessages(game.discordId);
        if (messages.length > 0) {
          gameUpdates.push({ game, message: messages[0] });
        }
      }),
    ),
    // Get app changelog from Discord API
    getUpdateMessages("thgl-companion-app"),
  ]);

  // Convert app updates to changelog entries
  const changelogEntries: ChangelogEntry[] = appUpdates
    .slice(0, 3)
    .map((msg) => {
      const versionMatch = msg.text.match(
        /\*\*(\d+\.\d+\.\d+)\*\*|^#?\s*(\d+\.\d+\.\d+)/m,
      );
      const version = versionMatch?.[1] || versionMatch?.[2];

      return {
        version,
        date: new Date(msg.timestamp).toISOString().split("T")[0],
        content: msg.text,
        timestamp: msg.timestamp,
      };
    });

  return mergeUpdates(gameUpdates, changelogEntries, 5);
}

export const metadata = {
  title: "TH.GL – Interactive Maps, Overlays & Gaming Tools",
  description:
    "Get in-game overlays, real-time position tracking, and interactive maps for 20+ games. Use the TH.GL Companion App or browser-based tools — completely free.",
  keywords:
    "gaming tools, interactive maps, game overlay, companion app, palworld map, dune awakening, once human, gaming companion, position tracking",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "TH.GL – Gaming Overlays & Interactive Maps",
    description:
      "Real-time overlays, position tracking, and interactive maps for 20+ games. Lightweight companion app or browser-based tools.",
    images: [
      {
        url: "/games/thgl-web/images/overlay-palworld.webp",
        width: 1200,
        height: 630,
        alt: "TH.GL Gaming Companion Tools",
      },
    ],
  },
};

export default async function HomePage() {
  const updates = await getWhatsNewUpdates();

  return (
    <section className="space-y-16 px-4 pt-10 pb-20 mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "The Hidden Gaming Lair",
            alternateName: "TH.GL",
            url: "https://www.th.gl",
            description:
              "Interactive maps, in-game overlays, and real-time position tracking for 20+ games.",
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      {/* Hero Section */}
      <PageHero
        badge="20+ Games Supported • 10,000+ Daily Users"
        title={
          <>
            Interactive Maps & Overlays
            <br />
            <span className="text-primary">For Your Favorite Games</span>
          </>
        }
        description="Get real-time in-game overlays, position tracking, and interactive maps. Use our lightweight companion app or browser-based tools."
        ctaButtons={[
          {
            label: "Get Companion App",
            href: "/companion-app",
            icon: Download,
          },
          {
            label: "Browse All Games",
            href: "/apps",
            variant: "outline",
          },
        ]}
        metaInfo="Windows 10/11 • Free Download • ~7MB • No Account Required"
      />

      {/* Companion App Showcase */}
      <div className="bg-linear-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-primary/20 rounded-full text-xs text-primary font-semibold">
              FEATURED
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              TH.GL Companion App
            </h2>
            <p className="text-lg text-muted-foreground">
              Standalone Windows app with in-game overlays, live position
              tracking, and second-screen support for {companionGames.length}+
              games.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Gamepad2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">In-Game Overlays</p>
                  <p className="text-xs text-muted-foreground">
                    No alt-tabbing needed
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Monitor className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Second Screen</p>
                  <p className="text-xs text-muted-foreground">
                    Dual monitor support
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Safe & Approved</p>
                  <p className="text-xs text-muted-foreground">
                    Officially permitted
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Free Download</p>
                  <p className="text-xs text-muted-foreground">~7MB only</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <a href="https://app.th.gl/THGL_Installer.exe" download>
                  <Download className="mr-2 h-4 w-4" /> Download for Windows
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/companion-app">
                  Learn More About Companion App
                </Link>
              </Button>
            </div>
          </div>
          <ImageShowcase
            src="/games/thgl-web/images/overlay-palworld.webp"
            alt="TH.GL Companion App showing in-game overlay"
            width={600}
            height={400}
            priority
            sizes="(max-width: 768px) 90vw, (max-width: 1280px) 40vw, 400px"
            badge={{
              primary: `${companionGames.length} Games Supported`,
              secondary: "Palworld, Dune, Once Human & more",
            }}
          />
        </div>
      </div>

      {/* Features */}
      <FeatureGrid columns={4}>
        <FeatureCard
          icon="🗺️"
          title="Interactive Maps"
          description="Track nodes, collectibles, NPCs, and resources with comprehensive filters. Create custom markers and routes to share with friends."
        />
        <FeatureCard
          icon="📍"
          title="Live Tracking"
          description="See your exact position and nearby actors in real-time. Use Peer Link to sync with your phone or tablet as a live minimap."
        />
        <FeatureCard
          icon="🔐"
          title="Privacy First"
          description="No account required. Local-first. Anonymous analytics. Mark unlimited locations as discovered — completely free."
        />
        <FeatureCard
          icon="🎮"
          title="20+ Games"
          description="Supports popular titles like Palworld, Dune Awakening, Wuthering Waves, and more. New games added regularly."
        />
      </FeatureGrid>

      {/* Featured Games */}
      <GameGrid
        games={featuredGames}
        title="Featured Games"
        showViewAll
        viewAllHref="/apps"
        viewAllLabel="View all supported games →"
      />

      {/* What's New */}
      {updates.length > 0 && (
        <div className="space-y-4 text-center">
          <SectionHeader
            title="What's New"
            description="Latest game and app updates"
          />
          <div className="max-w-3xl mx-auto text-left">
            <WhatsNew
              updates={updates}
              gameBasePath="/apps"
              changelogPath="/companion-app#updates"
              showGameLinks={true}
              showChangelogLinks={true}
              showHeader={false}
            />
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
        <SectionHeader
          title="Choose Your Experience"
          description="Use the companion app for overlays or access web tools from any device"
        />
        <ComparisonCards
          cards={[
            {
              icon: Gamepad2,
              title: "Companion App",
              features: [
                {
                  text: "In-game overlays with real-time tracking",
                  enabled: true,
                },
                { text: "Second screen mode for dual monitors", enabled: true },
                { text: "Auto-updates and hotkey controls", enabled: true },
                { text: "Windows 10/11 only", enabled: true },
              ],
              cta: {
                label: "Learn More About Companion App",
                href: "/companion-app",
              },
              highlighted: true,
            },
            {
              icon: Monitor,
              title: "Web-Based Tools",
              features: [
                { text: "Works on any device and platform", enabled: true },
                { text: "Full interactive map features", enabled: true },
                { text: "No download required", enabled: true },
                { text: "No overlay or position tracking", enabled: false },
              ],
              cta: { label: "Browse Games", href: "/apps", variant: "outline" },
            },
          ]}
        />
      </div>

      {/* Community & Support */}
      <CTASection
        title="Join the Community"
        description={
          <>
            Join <strong>tens of thousands</strong> of players using TH.GL every
            day. Get help, share tips, or just hang out.
          </>
        }
        ctaLabel="Join the Discord"
        ctaHref="https://th.gl/discord"
      />

      <div className="space-y-4 text-center">
        <SectionHeader title="What Players Are Saying" />
        <div className="grid sm:grid-cols-2 gap-4">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-4">
              <blockquote className="text-sm text-muted-foreground italic">
                "{t.message}"
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
        <SectionHeader title="From the Blog" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 text-left">
          {blogEntries.slice(0, 3).map((entry) => (
            <BlogPostCard key={entry.id} entry={entry} variant="compact" />
          ))}
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
      <CTASection
        title="Support Development"
        description="TH.GL is free to use and ad-supported. You can unlock a better experience by becoming a supporter on Patreon."
        ctaLabel="Support Me on Patreon"
        ctaHref="/support-me"
        footer={
          <>
            <p className="italic">
              Built and maintained by a solo developer — thank you for your
              support!
            </p>
            <p className="pt-4">
              Want to contribute?{" "}
              <Link
                href="https://github.com/The-Hidden-Gaming-Lair"
                target="_blank"
                className="underline hover:text-white"
              >
                View the source code on GitHub
              </Link>{" "}
              and submit a pull request.
            </p>
          </>
        }
        className="pt-10"
      />
    </section>
  );
}
