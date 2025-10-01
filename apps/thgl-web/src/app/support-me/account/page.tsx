import { kv } from "@vercel/kv";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppSubscriptionCard } from "@/components/app-subscription-card";
import { Button } from "@repo/ui/controls";
import { SignOut } from "@/components/sign-out";
import {
  type PatreonError,
  type PatreonToken,
  type PatreonUser,
  getCurrentEntitledTiers,
  getCurrentUser,
} from "@/lib/patreon";
import { tiers } from "@/lib/tiers";
import { games } from "@repo/lib";
import { Subtitle } from "@repo/ui/content";

export const metadata = {
  title: "Account - The Hidden Gaming Lair",
  description:
    "Authenticate your Patreon account to activate ad removal and premium features in TH.GL apps and tools.",
  alternates: {
    canonical: "/support-me/account",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SupportMeAccount() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  let content;
  let entitledTierIDs: string[] = [];

  if (userId?.value) {
    try {
      const id = verify(userId.value, process.env.JWT_SECRET!) as string;
      const patreonToken = await kv.get<PatreonToken>(`token:${id}`);

      if (patreonToken) {
        const currentUserResponse = await getCurrentUser(patreonToken);
        const currentUserResult = (await currentUserResponse.json()) as
          | PatreonUser
          | PatreonError;

        if (
          !("error" in currentUserResult) &&
          !("errors" in currentUserResult)
        ) {
          entitledTierIDs = getCurrentEntitledTiers(currentUserResult);

          content = (
            <>
              <Subtitle title="Account Status" />
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                This page activates your perks for{" "}
                <strong>Overwolf apps and *.th.gl websites</strong>.
                <br />
                If you're using the{" "}
                <Link href="/companion-app" className="text-brand underline">
                  Companion App
                </Link>
                , perks are unlocked directly inside the app — no action needed
                here.
              </p>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold">User</h3>
                <p className="text-brand">
                  {currentUserResult.data.attributes.full_name} (
                  {currentUserResult.data.id})
                </p>

                <h4 className="text-sm font-semibold">Current Tier(s):</h4>
                {entitledTierIDs.length > 0 ? (
                  <ul className="text-brand flex gap-2 justify-center flex-wrap text-sm">
                    {entitledTierIDs.map((tierId) => (
                      <li key={tierId}>
                        {tiers.find((tier) => tier.id === tierId)?.title ??
                          "Unknown"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-warning font-medium">
                    You are not subscribed to any tier.
                  </p>
                )}

                {entitledTierIDs.includes("21470801") && (
                  <p className="text-sm text-amber-500">
                    The Enthusiast tier does not include Ad Removal.
                  </p>
                )}
              </section>

              <div className="space-y-2">
                <Link href="/support-me/patreon" prefetch={false}>
                  <Button>Change Patreon Account</Button>
                </Link>
                <SignOut />
              </div>
            </>
          );
        }
      }
    } catch (error) {
      // invalid token or missing secret
    }
  }

  if (!content) {
    content = (
      <>
        <Subtitle title="Activate Subscriptions" />
        <p className="text-muted-foreground max-w-xl mx-auto">
          You are not authenticated. Click below to connect your Patreon account
          and activate your perks.
        </p>
        <Link href="/support-me/patreon" className="block" prefetch={false}>
          <Button>Authenticate with Patreon</Button>
        </Link>
        <p className="italic text-sm text-muted-foreground">
          This will store a cookie in your browser to remember your Patreon
          account. You can delete it at any time by signing out.
        </p>
      </>
    );
  }

  return (
    <section className="space-y-12 px-4 pt-10 pb-20 text-center max-w-5xl mx-auto">
      {content}

      <div className="space-y-4">
        <Subtitle title="Unlock Overwolf Apps" order={3} />
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Click the buttons below to unlock your perks in Overwolf apps. Some
          apps also support manual unlock via a secret.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 justify-center">
        {games
          .filter((game) => "overwolf" in game)
          .map((game) => (
            <AppSubscriptionCard
              key={game.title}
              game={game}
              userId={userId?.value}
              hasTier={game.patreonTierIDs?.some((tierId) =>
                entitledTierIDs.includes(tierId),
              )}
            />
          ))}
      </div>
    </section>
  );
}
