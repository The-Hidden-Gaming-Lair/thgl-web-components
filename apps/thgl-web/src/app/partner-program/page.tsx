import { PartnerCard } from "@/components/partner-card";
import { Subtitle } from "@/components/subtitle";
import { games } from "@repo/lib";

export const metadata = {
  title: "Partner With TH.GL – Streamers, Creators & Sharers",
  description:
    "Partner with The Hidden Gaming Lair and get free perks, exposure, and more for sharing my tools or featuring them in your content.",
  alternates: {
    canonical: "/partner-program",
  },
};

export default function PartnerProgramPage() {
  return (
    <div className="space-y-12 px-4 pt-10 pb-20 max-w-2xl mx-auto text-center">
      <Subtitle>Partner With TH.GL</Subtitle>
      <p className="text-muted-foreground">
        Are you a streamer, content creator, or someone who shares useful tools
        with others? Partner with TH.GL and get rewarded for spreading the word.
      </p>

      <section className="space-y-6">
        <Subtitle order={3}>Why Partner?</Subtitle>
        <ul className="text-left space-y-2 text-muted-foreground">
          <li>
            <strong>🎁 Free Perks:</strong> Get a free or discounted premium
            subscription (up to 100% off).
          </li>
          <li>
            <strong>📢 Visibility:</strong> I can promote you on my Discord or
            even inside the apps (as fallback instead of ads).
          </li>
          <li>
            <strong>🔗 SEO Backlinks:</strong> I’ll link to your website or
            channel — helpful for exposure and search engines.
          </li>
          <li>
            <strong>📣 Referral Codes:</strong> Get your own discount code to
            share with your community.
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        <Subtitle order={3}>Who It's For</Subtitle>
        <ul className="text-left space-y-2 text-muted-foreground">
          <li>🎬 Streamers using overlays or tools during gameplay</li>
          <li>📺 YouTubers including TH.GL in guides or descriptions</li>
          <li>🔗 Website/blog owners linking to TH.GL or partner apps</li>
          <li>📣 Anyone who shares useful tools and drives visibility</li>
        </ul>
      </section>

      <section className="space-y-6">
        <Subtitle order={3}>How to Join</Subtitle>
        <ol className="text-left space-y-2 text-muted-foreground list-decimal list-inside">
          <li>
            Join the{" "}
            <a
              href="https://th.gl/discord"
              target="_blank"
              className="text-brand underline"
            >
              Discord server
            </a>
          </li>
          <li>
            Send me a DM (<strong>devleon</strong>) and tell me what you do
          </li>
          <li>I’ll set you up with access, a code, and shareable assets</li>
        </ol>
        <p className="text-sm italic text-muted-foreground">
          It’s casual and low-pressure — just reach out if you’re interested!
        </p>
      </section>

      <section className="space-y-2 text-muted-foreground text-sm">
        <p>
          Whether you bring clicks or content, I’d love to support creators who
          support TH.GL.
        </p>
        <p className="italic">Not sure if you qualify? DM me anyway.</p>
      </section>

      {/* Partner Apps */}
      <div className="space-y-6">
        <Subtitle>Partners</Subtitle>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games
            .filter((g) => g.partnerApps)
            .flatMap((game) =>
              game.partnerApps!.map((app) => (
                <PartnerCard key={app.id} app={app} />
              )),
            )}
        </div>
      </div>
    </div>
  );
}
