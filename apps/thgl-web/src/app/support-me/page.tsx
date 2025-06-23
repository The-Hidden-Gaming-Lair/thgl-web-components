import Link from "next/link";
import { Subtitle } from "@/components/subtitle";
import { TierCard } from "@/components/tier-card";
import { tiers } from "@/lib/tiers";
import { Button } from "@repo/ui/controls";

export const metadata = {
  title: "Support TH.GL – Unlock Ad-Free Access & Perks",
  description:
    "Become a supporter of TH.GL and unlock ad-free access, premium features, and preview releases across all tools and platforms.",

  alternates: {
    canonical: "/support-me",
  },
};

export default function SupportMe() {
  return (
    <div className="space-y-12 px-4 pt-10 pb-20 text-center max-w-5xl mx-auto">
      {/* Intro */}
      <div className="space-y-4">
        <Subtitle>Monthly and Annual Subscriptions</Subtitle>
        <p className="mx-auto max-w-xl text-muted-foreground">
          I’m working full time on TH.GL as a solo developer — building
          companion apps, overlays, and websites to support a wide range of
          games.
        </p>
        <p className="text-sm italic text-muted-foreground">
          Pro Tip: Annual plans include a 10% discount.
        </p>
        <p className="font-semibold text-sm">
          After subscribing, make sure to{" "}
          <Link href="/support-me/account" className="text-brand underline">
            activate your account
          </Link>{" "}
          to enable perks for the{" "}
          <strong>Overwolf apps and game websites</strong>.
          <br />
          For the Companion App, you can unlock perks directly inside the app.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {tiers
          .filter((tier) => !tier.hidden)
          .map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
      </div>

      {/* Perk Explanations */}
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="italic">
          * <strong>Ad Removal</strong> is available in all official TH.GL
          projects — including the Companion App, Overwolf apps, and
          browser-based tools.
        </p>
        <p className="italic">
          ** <strong>Premium Features</strong> unlock advanced tools and options
          highlighted directly inside supported apps and websites.
        </p>
        <p className="italic">
          *** <strong>Preview Release Access</strong> gives early access to
          upcoming features and app updates — available through the apps and
          websites.
        </p>
      </div>

      {/* Authentication Section */}
      <section className="space-y-4">
        <Subtitle>Already a Subscriber?</Subtitle>
        <div className="space-y-2 text-muted-foreground">
          <p>Thank you for supporting TH.GL ❤️</p>
          <p>
            Click below to authenticate with Patreon and unlock your perks for
            Overwolf and web apps.
          </p>
        </div>
        <Link href="/support-me/account" passHref>
          <Button className="mt-4">Unlock Your Perks</Button>
        </Link>
      </section>
    </div>
  );
}
