import { PartnerCard } from "@/games/thgl-web/components/partner-card";
import { games } from "@repo/lib";
import { PartnerCarousel } from "./partner-carousel";
import { partners } from "./partners";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import { BenefitList } from "@/games/thgl-web/components/benefit-list";
import { InfoCard } from "@/games/thgl-web/components/info-card";
import { MapIcon, MousePointer2, Video } from "lucide-react";
import Link from "next/link";

const TITLE = "Partner With TH.GL – Streamers, Creators & Websites";
const DESCRIPTION =
  "Share TH.GL maps and tools with your viewers or readers: a creator kit for YouTube and Twitch, embeddable maps and item tooltips for websites, and perks for partners.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/partner-program",
  },
  openGraph: {
    url: "/partner-program",
  },
};

export default function PartnerProgramPage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: TITLE,
            description: DESCRIPTION,
            url: "https://www.th.gl/partner-program",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Partner With TH.GL"
        description="Streaming, making videos or running a guide site? Share our maps and tools with your community. Everything below is free and needs no sign-up, and partners get perks on top."
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Partner Program</li>
        </ol>
      </nav>

      {/* Start Sharing Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Start Sharing</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <InfoCard
            title="Creator kit for YouTube and Twitch"
            description="Paste the map you show and your channel name: get description links, a chat command and an OBS browser source to put the map on stream. Every link carries your own ref tag."
            href="/developers#creators"
            linkLabel="Open the creator kit"
            icon={Video}
          />
          <InfoCard
            title="Embed a map on your website"
            description="Put any TH.GL map on your guide or blog with markers, zoom and your own filters, without our menus or ads. Copy-paste, no API key."
            href="/developers#maps"
            linkLabel="Get the embed code"
            icon={MapIcon}
          />
          <InfoCard
            title="Tooltips for item links"
            description="Add one script line and every link to a TH.GL database entry shows a tooltip with icon, stats and description when readers hover it."
            href="/developers#tooltips"
            linkLabel="Add tooltips"
            icon={MousePointer2}
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* Partners Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Our Partners</h2>
        <PartnerCarousel partners={partners} />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games
            .filter((g) => g.partnerApps)
            .flatMap((game) =>
              game.partnerApps!.map((app) => (
                <PartnerCard key={app.id} app={app} />
              )),
            )}
        </div>
      </section>

      <hr className="border-border" />

      {/* Why Partner Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">Partner Perks</h2>
        <BenefitList
          items={[
            {
              icon: "🎁",
              label: "Free Perks",
              description:
                "Get a free or discounted premium subscription (up to 100% off).",
            },
            {
              icon: "📢",
              label: "Visibility",
              description:
                "I can promote you on my Discord or even inside the apps (as fallback instead of ads).",
            },
            {
              icon: "🔗",
              label: "SEO Backlinks",
              description:
                "I'll link to your website or channel — helpful for exposure and search engines.",
            },
            {
              icon: "📣",
              label: "Referral Codes",
              description:
                "Get your own discount code to share with your community.",
            },
          ]}
        />
      </section>

      <hr className="border-border" />

      {/* How to Join Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">How to Join</h2>
        <ol className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-foreground font-semibold shrink-0">1.</span>
            <div>
              Share TH.GL with the{" "}
              <Link
                href="/developers#creators"
                className="text-primary hover:underline font-medium"
              >
                creator kit
              </Link>
              , a{" "}
              <Link
                href="/developers#maps"
                className="text-primary hover:underline font-medium"
              >
                map embed
              </Link>{" "}
              or plain links in your videos, streams or guides
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-semibold shrink-0">2.</span>
            <div>
              Join the{" "}
              <a
                href="https://th.gl/discord"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                Discord server
              </a>{" "}
              and send me a DM (
              <strong className="text-foreground">devleon</strong>) with your
              channel or site
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-semibold shrink-0">3.</span>
            <div>I'll set you up with your perks and a discount code</div>
          </li>
        </ol>
        <p className="text-sm italic text-muted-foreground text-center pt-4">
          It's casual and low-pressure — just reach out if you're interested!
        </p>
      </section>

      <hr className="border-border" />

      {/* Footer */}
      <section className="space-y-3 text-center text-muted-foreground max-w-2xl mx-auto">
        <p className="text-base">
          Whether you bring clicks or content, I'd love to support creators who
          support TH.GL.
        </p>
        <p className="italic">Not sure if you qualify? DM me anyway.</p>
      </section>
    </PageShell>
  );
}
