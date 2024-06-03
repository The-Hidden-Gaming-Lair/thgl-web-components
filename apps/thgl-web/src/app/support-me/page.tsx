import Link from "next/link";
import { Button } from "@/components/button";
import { Subtitle } from "@/components/subtitle";
import { TierCard } from "@/components/tier-card";
import { apps } from "@/lib/apps";
import { tiers } from "@/lib/tiers";

export const metadata = {
  title: "Support Me - The Hidden Gaming Lair",
  alternates: {
    canonical: "/support-me",
  },
};

export default function SupportMe() {
  return (
    <div className="space-y-8 px-4 pt-10 pb-20 text-center">
      <Subtitle>Monthly and annual subscriptions</Subtitle>
      <p className="mx-auto max-w-xl text-center">
        I am a solo developer and I am working on these projects in my free
        time. I am not affiliated with any company or organization. If you like
        my work and want to support me, you can do so by subscribing to one of
        the following plans.
      </p>
      <small className="italic">
        Pro Tip: Select annual subscriptions to get a 10% discount
      </small>
      <p className="font-bold">
        You need to{" "}
        <Link className="text-brand" href="/support-me/account">
          unlock your perks
        </Link>{" "}
        after subscribing to remove the ads.
      </p>
      <div className="p-4 flex flex-wrap gap-6 justify-center">
        {tiers
          .filter((tier) => !tier.hidden)
          .map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
      </div>
      <div className="space-y-2">
        <p className="italic text-sm">
          *The <strong>Ad Removal Perk</strong> is only available for these
          apps:
        </p>
        <ul className="italic text-brand flex gap-2 justify-center flex-wrap">
          {apps
            .filter((app) => app.patreonTierIDs)
            .map((app) => (
              <li key={app.title}>{app.title}</li>
            ))}
        </ul>
        <p className="italic text-sm">
          **The <strong>Premium Features perk</strong> unlocks additional
          features in these apps:
        </p>
        <ul className="italic text-brand flex gap-2 justify-center flex-wrap">
          {apps
            .filter((app) => app.premiumFeatures)
            .map((app) => (
              <li key={app.title}>{app.title}</li>
            ))}
        </ul>
        <p className="italic text-sm">
          ***The <strong>Preview Releases Access perk</strong> unlocks a channel
          on my Discord where you can download and test the latest versions of
          my apps before they are released to the public.
        </p>
      </div>
      <section className="space-y-4">
        <Subtitle>Are you a Subscriber already?</Subtitle>
        <p>
          Thank you for your support 🤘. Click the button below to authenticate
          with Patreon and unlock your perks!
        </p>
        <Link className="block" href="/support-me/account" passHref>
          <Button>Unlock your perks</Button>
        </Link>
      </section>
    </div>
  );
}
