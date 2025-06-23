import { Subtitle } from "@/components/subtitle";
import Link from "next/link";

export const metadata = {
  title: "Sponsor TH.GL – Reach Thousands of Gamers",
  description:
    "TH.GL reaches thousands of players daily through interactive maps, overlays, and game tools. Explore sponsorship options to promote your brand.",
  alternates: {
    canonical: "/advertise",
  },
};

export default function AdvertisePage() {
  return (
    <section className="space-y-12 px-4 pt-10 pb-20 max-w-2xl mx-auto text-center">
      <div className="flex flex-col items-center gap-2">
        <Subtitle>Sponsor TH.GL</Subtitle>
      </div>

      <p className="text-muted-foreground">
        TH.GL reaches <strong>tens of thousands of players daily</strong>{" "}
        through interactive maps, in-game overlays, and second-screen tools.
        From games like <em>Palworld</em>, <em>Once Human</em>, and{" "}
        <em>Wuthering Waves</em> to niche communities, the Companion App and
        web-based tools are used across platforms by engaged, genre-savvy
        players.
      </p>

      <section className="space-y-6">
        <Subtitle order={3}>Why Sponsor?</Subtitle>
        <ul className="text-left space-y-2 text-muted-foreground">
          <li>🚫 Reach gamers directly — without intrusive third-party ads</li>
          <li>🎯 Target specific audiences based on the games they play</li>
          <li>📈 Build brand trust by supporting a creator-driven project</li>
          <li>📢 Appear in-app, on the web, or even on Discord</li>
        </ul>
      </section>

      <section className="space-y-6">
        <Subtitle order={3}>Audience Snapshot</Subtitle>
        <ul className="text-left space-y-2 text-muted-foreground">
          <li>
            🌍 Tens of thousands of daily users across Companion App and tools
          </li>
          <li>💬 21,000+ members in the Discord server</li>
          <li>📊 High engagement in niche gaming communities</li>
        </ul>
      </section>

      <section className="space-y-6">
        <Subtitle order={3}>What’s Possible?</Subtitle>
        <ul className="text-left space-y-2 text-muted-foreground">
          <li>🖼️ Banner or logo placements in specific games or tools</li>
          <li>🔗 Sponsored links or SEO-friendly mentions</li>
          <li>📣 Feature shoutouts in release notes or Discord</li>
          <li>🧪 Custom ideas? I'm open to creative partnerships</li>
        </ul>
      </section>

      <section className="space-y-6">
        <Subtitle order={3}>Interested?</Subtitle>
        <p className="text-muted-foreground">
          I’m open to sponsorships that are relevant, respectful, and help grow
          the tools I maintain for the gaming community.
        </p>
        <p className="text-muted-foreground">
          Reach out via{" "}
          <Link
            href="https://th.gl/discord"
            target="_blank"
            className="text-brand underline"
          >
            Discord
          </Link>{" "}
          and DM me (<strong>devleon</strong>).
        </p>
        <p className="text-sm text-muted-foreground italic">
          Let's see if it’s a good fit. No pressure, no formality.
        </p>
      </section>
    </section>
  );
}
