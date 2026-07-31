import {
  games,
  getUpdateMessages,
  hasReleasedCompanion,
  ChangelogEntry,
} from "@repo/lib";
import { ChangelogList } from "@repo/ui/content";
import {
  Button,
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@repo/ui/controls";
import {
  ChevronDown,
  Download,
  Gamepad2,
  Shield,
  ShieldCheck,
  Zap,
  Monitor,
  Eye,
  Lock,
  Smartphone,
  MapPin,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  PageHero,
  FeatureCard,
  FeatureGrid,
  SectionHeader,
} from "@/games/thgl-web/components/sections";
import { BlogPostCard } from "@/games/thgl-web/components/blog-post-card";
import { blogEntries } from "@/games/thgl-web/lib/blog-entries";
import { faqEntries } from "@/games/thgl-web/lib/faq-entries";

const supportedGames = games.filter(hasReleasedCompanion);
const totalGamesCount = supportedGames.length;

// 36s muted loop cycling the overlay across six games (6s captioned segments,
// 720p30 H264 ~2 Mbps). Regenerate from raw recordings with ffmpeg (cut
// gameplay-only windows, drawtext game caption, concat) — see the memory topic
// companion-app-discoverability. Set to null to fall back to the carousel.
const heroVideoSrc: string | null =
  "/games/thgl-web/videos/companion-app-hero.mp4";

export const metadata = {
  title: "TH.GL Companion App – Gaming Overlays & Interactive Maps for Windows",
  description: `Download the TH.GL Companion App: lightweight Windows app with in-game overlays, real-time position tracking, and maps for ${totalGamesCount}+ games. Free, no account required.`,
  keywords:
    "gaming overlay app, in-game map overlay, companion app, palworld overlay, dune awakening map, game tracker, overwolf alternative, position tracking",
  alternates: {
    canonical: "/companion-app",
  },
  openGraph: {
    title: "TH.GL Companion App – In-Game Overlays & Live Maps",
    description: `Lightweight gaming companion app (7MB) with overlays, live tracking, and interactive maps. Supports ${totalGamesCount}+ games. No additional platform required.`,
    url: "/companion-app",
    type: "website",
    images: [
      {
        url: "/games/thgl-web/images/companion-app-og.jpg",
        width: 1200,
        height: 630,
        alt: `TH.GL Companion App — in-game overlays & live maps for ${totalGamesCount}+ games`,
      },
    ],
  },
};

export default async function CompanionAppPage() {
  // Get app changelog from Discord API
  const appUpdates = await getUpdateMessages("thgl-companion-app");

  // Convert app updates to changelog entries
  const changelogEntries: ChangelogEntry[] = appUpdates
    .slice(0, 5)
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

  return (
    <section className="space-y-16 px-4 pt-10 pb-20 mx-auto max-w-7xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "TH.GL Companion App",
            description:
              "Lightweight gaming companion app with in-game overlays, real-time position tracking, and interactive maps.",
            applicationCategory: "GameApplication",
            operatingSystem: "Windows 10, Windows 11",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://www.th.gl/companion-app",
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.th.gl",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Companion App",
                item: "https://www.th.gl/companion-app",
              },
            ],
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
          <li aria-current="page">Companion App</li>
        </ol>
      </nav>
      {/* Hero Section */}
      <PageHero
        badge="Standalone Windows App • No Platform Required"
        title={
          <>
            Interactive Maps & Overlays
            <br />
            <span className="text-primary">For {totalGamesCount}+ Games</span>
          </>
        }
        description={`Get real-time in-game overlays, interactive maps, and position tracking across ${totalGamesCount}+ supported games. No Overwolf required — just a simple, lightweight app.`}
        ctaButtons={[
          {
            label: "Download for Windows",
            href: "https://app.th.gl/THGL_Installer.exe",
            icon: Download,
            download: true,
          },
          {
            label: "See How It Works",
            href: "#how-it-works",
            variant: "outline",
          },
        ]}
        metaInfo="Windows 10/11 • Free with ads • ~7MB • No account required"
      />

      {/* Social proof + supported-games logo strip */}
      <div className="space-y-5 -mt-6">
        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          <ShieldCheck className="inline h-4 w-4 mr-1.5 text-primary align-text-bottom" />
          Officially approved by the developers of Dune: Awakening, Once Human
          &amp; Palia — used by thousands of players every day.
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {supportedGames.map((game) => (
            <Link
              key={game.id}
              href={game.web || "#"}
              title={game.title}
              className="block h-9 w-9 rounded-md overflow-hidden border border-border/60 hover:border-primary/60 hover:scale-110 transition-all"
            >
              <Image
                src={game.logo}
                unoptimized
                alt={`${game.title} logo`}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {`One app for all ${totalGamesCount} supported games — it auto-detects what you're playing.`}
        </p>
      </div>

      {/* Hero media: muted video loop once recorded, screenshot carousel until then */}
      {heroVideoSrc ? (
        <video
          className="w-full max-w-5xl mx-auto rounded-lg"
          autoPlay
          muted
          loop
          playsInline
          poster="/games/thgl-web/videos/companion-app-hero-poster.webp"
          src={heroVideoSrc}
        />
      ) : (
        <ScreenshotCarousel />
      )}

      {/* Ban-safety Q&A — answer the #1 download objection up front */}
      <div className="max-w-3xl mx-auto rounded-lg border border-primary/30 bg-primary/5 p-6 md:p-8 space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
          Is this allowed? Will I get banned?
        </h2>
        <p className="text-muted-foreground">
          No bans have been reported across supported games. The app is
          read-only — it never modifies the game or injects anything. Several
          studios have officially confirmed it&apos;s allowed: Funcom (Dune:
          Awakening), Starry Studio (Once Human), and Singularity 6 (Palia).
        </p>
        <p className="text-sm">
          <Link
            href="/faq/apps-bannable"
            className="underline text-primary hover:text-primary/80"
          >
            Read the full answer with the official confirmations →
          </Link>
        </p>
      </div>

      {/* Key Features Grid */}
      <div>
        <SectionHeader
          title="Why Choose TH.GL Companion App?"
          description="Everything you need for an enhanced gaming experience"
        />
        <FeatureGrid columns={3}>
          <FeatureCard
            icon={Gamepad2}
            title="In-Game Overlays"
            description="Interactive maps and minimaps that show your live player position, nearby points of interest, and resources — all directly within your game without alt-tabbing."
            variant="bordered"
          />
          <FeatureCard
            icon={Monitor}
            title="Second Screen Mode"
            description="Prefer a separate display? Switch to second-screen mode with one hotkey. Perfect for dual-monitor setups, tracking, routing, or managing multiple maps."
            variant="bordered"
          />
          <FeatureCard
            icon={Eye}
            title="Real-Time Tracking"
            description="See your exact position on the map in real-time as you move in-game. Track nearby collectibles, NPCs, enemies, and resources that are actually spawned right now — like nearby Pals in Palworld."
            variant="bordered"
          />
          <FeatureCard
            icon={Zap}
            title="Lightweight & Fast"
            description="Uses significantly less memory and CPU than Overwolf. No background services eating your resources. Minimal performance impact on your games."
            variant="bordered"
          />
          <FeatureCard
            icon={Lock}
            title="Privacy-Conscious"
            description="The app runs locally on your machine. Uses Plausible for anonymous analytics only. No account required. Ads are served through Nitro — subscribing removes them completely."
            variant="bordered"
          />
          <FeatureCard
            icon={Shield}
            title="Safe & Approved"
            description="Read-only memory access. No game modifications. Officially approved by developers of Dune Awakening, Once Human, and Palia. Thousands of daily users with zero bans reported."
            variant="bordered"
          />
        </FeatureGrid>
      </div>

      {/* Advanced Features Section */}
      <div className="bg-linear-to-b from-primary/5 to-transparent -mx-4 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="More Than Just an Overlay"
            description="Powerful features that set TH.GL apart from competitors"
          />
          <FeatureGrid columns={4}>
            <FeatureCard
              icon={Smartphone}
              title="Peer Link"
              description="Connect your companion app with any device. Use your phone or tablet as a live minimap that syncs your position and live mode in real-time."
              variant="bordered"
            />
            <FeatureCard
              icon={MapPin}
              title="Unlimited Discoveries"
              description="Mark locations as discovered with no limits — completely free. Track your progress across all games without restrictions or paywalls."
              variant="bordered"
            />
            <FeatureCard
              icon={Share2}
              title="Custom Content"
              description="Create custom markers, draw routes, and share them with friends or your guild. Perfect for planning strategies and coordinating group activities."
              variant="bordered"
            />
            <FeatureCard
              icon={Eye}
              title="Smart Live Mode"
              description="When supported, shows monsters, animals, and NPCs in real-time while auto-hiding collected items. Some games only support player position tracking."
              variant="bordered"
            />
          </FeatureGrid>
        </div>
      </div>

      {/* Screenshot carousel keeps the second-screen + launcher shots visible
          when the hero shows the video loop */}
      {heroVideoSrc && (
        <div>
          <SectionHeader
            title="Screenshots"
            description="Second-screen mode, the app launcher, and the overlay in more games"
          />
          <ScreenshotCarousel />
        </div>
      )}

      {/* Supported Games Section */}
      <div id="supported-games">
        <SectionHeader
          title={`${totalGamesCount} Supported Games`}
          description="One download covers every game below — live position tracking, overlays, and interactive maps"
        />
        <details className="group text-center">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            Show all {totalGamesCount} games
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8 text-left">
            {supportedGames.map((game) => (
              <Link
                key={game.id}
                href={game.web || "#"}
                className="group flex flex-col items-center space-y-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={game.logo}
                    unoptimized
                    alt={`${game.title} logo`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform"
                    sizes="80px"
                  />
                </div>
                <p className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                  {game.title}
                </p>
              </Link>
            ))}
          </div>
        </details>
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            More games coming soon! Request support in our{" "}
            <Link href="https://th.gl/discord" className="underline">
              Discord server
            </Link>
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-muted/30 -mx-4 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            title="How It Works"
            description="Get started in 3 simple steps"
          />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold">Download & Install</h3>
              <p className="text-muted-foreground">
                Download the installer (~7MB) and run it. The app installs in
                seconds with no additional setup required.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold">Launch Your Game</h3>
              <p className="text-muted-foreground">
                Start any supported game. The app automatically detects it and
                shows available features for that game.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold">Enable Overlay</h3>
              <p className="text-muted-foreground">
                Press the hotkey (default: F6) to toggle the overlay. Use F9 to
                lock/unlock, F7/F8 to zoom, and F5 for live tracking. All
                hotkeys are fully customizable in settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates Section */}
      {changelogEntries.length > 0 && (
        <div id="updates">
          <SectionHeader
            title="Recent Updates"
            description="Latest changes and improvements to the companion app"
          />
          <div className="max-w-3xl mx-auto">
            <ChangelogList entries={changelogEntries} showHeader={false} />
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div>
        <SectionHeader title="Frequently Asked Questions" />
        <div className="max-w-3xl mx-auto space-y-4">
          {faqEntries
            .filter((entry) => entry.labels.includes("Companion App"))
            .map((entry) => (
              <Card
                key={entry.id}
                className="hover:border-primary transition-colors"
              >
                <CardContent className="p-6">
                  <Link href={`/faq/${entry.id}`} className="block">
                    <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                      {entry.question}
                    </h3>
                  </Link>
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="text-sm underline text-muted-foreground hover:text-white"
          >
            View all frequently asked questions →
          </Link>
        </div>
      </div>

      {/* Download CTA */}
      <div className="bg-linear-to-r from-primary/20 to-primary/5 rounded-lg p-12 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to Enhance Your Gaming?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of players using TH.GL Companion App every day. Free
          with ads — supporters remove them completely. No account required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg" asChild>
            <a href="https://app.th.gl/THGL_Installer.exe" download>
              <Download className="mr-2 h-5 w-5" /> Download Now
            </a>
          </Button>
          <Button size="lg" variant="outline" className="text-lg" asChild>
            <Link href="https://th.gl/discord">Join Discord</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Need help? Visit the{" "}
          <Link href="/faq" className="underline">
            FAQ
          </Link>{" "}
          or join the{" "}
          <Link href="https://th.gl/discord" className="underline">
            Discord server
          </Link>
          .
        </p>
      </div>

      {/* Blog Posts Section */}
      <div>
        <SectionHeader
          title="Learn More"
          description="Read about the companion app development and updates"
        />
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {blogEntries
            .filter(
              (entry) =>
                entry.id === "why-i-built-companion-app" ||
                entry.id === "overlay-input-freeze-fix",
            )
            .map((entry) => (
              <BlogPostCard key={entry.id} entry={entry} variant="compact" />
            ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotCarousel() {
  return (
    <div>
      <Carousel className="w-full max-w-5xl mx-auto">
        <CarouselContent>
          <CarouselItem>
            <div className="relative">
              <Image
                src="/games/thgl-web/images/overlay-dune-awakening.webp"
                alt="Dune Awakening overlay with live map showing player position and nearby points of interest"
                width={1200}
                height={675}
                className="rounded-lg object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 800px"
              />
              <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">
                  Dune Awakening - In-Game Overlay
                </p>
                <p className="text-xs text-muted-foreground">
                  Live position tracking with interactive map
                </p>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="relative">
              <Image
                src="/games/thgl-web/images/overlay-palworld.webp"
                alt="Palworld overlay showing minimap with nearby Pals and resource locations"
                width={1200}
                height={675}
                className="rounded-lg object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 800px"
              />
              <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">
                  Palworld - Real-time Tracking
                </p>
                <p className="text-xs text-muted-foreground">
                  See nearby Pals and resources in real-time
                </p>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="relative">
              <Image
                src="/games/thgl-web/images/second-screen.webp"
                alt="Second screen mode showing full interactive map on external monitor"
                width={1200}
                height={675}
                className="rounded-lg object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 800px"
              />
              <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">Second Screen Mode</p>
                <p className="text-xs text-muted-foreground">
                  Use a separate display for full map view
                </p>
              </div>
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="relative">
              <Image
                src="/games/thgl-web/images/app-launcher.webp"
                alt="TH.GL Companion App launcher showing all supported games"
                width={1200}
                height={675}
                className="rounded-lg object-cover"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 800px"
              />
              <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">Game Launcher</p>
                <p className="text-xs text-muted-foreground">
                  Manage all supported games from one place
                </p>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
