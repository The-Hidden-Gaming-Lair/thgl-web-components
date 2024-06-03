import { kv } from "@vercel/kv";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppSubscriptionCard } from "@/components/app-subscription-card";
import { Button } from "@/components/button";
import { SignOut } from "@/components/sign-out";
import { Subtitle } from "@/components/subtitle";
import { apps } from "@/lib/apps";
import {
  type PatreonError,
  type PatreonToken,
  type PatreonUser,
  getCurrentEntitledTiers,
  getCurrentUser,
} from "@/lib/patreon";
import { tiers } from "@/lib/tiers";

export const metadata = {
  title: "Account - The Hidden Gaming Lair",
  alternates: {
    canonical: "/support-me/account",
  },
};

export default async function SupportMeAccount() {
  const cookieStore = cookies();
  const userId = cookieStore.get("userId");

  let content;
  let entitledTierIDs: string[] = [];
  if (userId?.value) {
    const id = jwt.verify(userId.value, process.env.JWT_SECRET!) as string;
    const patreonToken = await kv.get<PatreonToken>(`token:${id}`);

    if (patreonToken) {
      const currentUserResponse = await getCurrentUser(patreonToken);
      const currentUserResult = (await currentUserResponse.json()) as
        | PatreonUser
        | PatreonError;
      if (!("error" in currentUserResult) && !("errors" in currentUserResult)) {
        entitledTierIDs = getCurrentEntitledTiers(currentUserResult);

        content = (
          <>
            <Subtitle>Activate Subscriptions</Subtitle>
            <p className="max-w-xl mx-auto">
              The *.th.gl websites will load your subscription status
              automatically after reload, if this page is opened in the same
              browser.
            </p>
            <section>
              <h3>User</h3>
              <p className="text-bold text-brand">
                {currentUserResult.data.attributes.full_name} (
                {currentUserResult.data.id})
              </p>
              <h3>Current subscription:</h3>
              {entitledTierIDs.length > 0 ? (
                <ul className="text-brand flex gap-2 justify-center flex-wrap">
                  {entitledTierIDs.map((tierId) => (
                    <li key={tierId}>
                      {tiers.find((tier) => tier.id === tierId)?.title ??
                        "Unknown"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-bold text-amber-500">
                  You are not subscribed to any tier.
                </p>
              )}
              {entitledTierIDs.includes("21470801") && (
                <p className="text-bold text-amber-500">
                  The Enthusiast tier doesn&apos;t include Ad-Removal.
                </p>
              )}
            </section>
            <div className="space-y-2">
              <Link href="/support-me/patreon" passHref>
                <Button>Change Patreon Account</Button>
              </Link>
              <SignOut />
            </div>
          </>
        );
      }
    }
  }
  if (!content) {
    content = (
      <>
        <Subtitle>Activate Subscriptions</Subtitle>
        <p>
          You are not authenticated. Please click the following button to
          authenticate with Patreon and unlock your perks!
        </p>
        <Link href="/support-me/patreon" passHref className="block">
          <Button>Authenticate with Patreon</Button>
        </Link>
        <p className="italic text-sm">
          By authenticating with Patreon, a cookie will be stored in your
          browser to remember your Patreon account. You can delete this cookie
          at any time by clicking the "Sign out" button.
        </p>
      </>
    );
  }
  return (
    <section className="space-y-8 px-4 pt-10 pb-20 text-center">
      {content}
      <Subtitle order={3}>Link In-Game Apps</Subtitle>
      <p>
        Please click the following buttons to sync your subscription status with
        the in-game apps.
      </p>
      <div className="flex flex-wrap gap-8 justify-center">
        {apps
          .filter((app) => "overwolf" in app)
          .map((app) => (
            <AppSubscriptionCard
              key={app.title}
              app={app}
              userId={userId?.value}
              hasTier={app.patreonTierIDs?.some((tierId) =>
                entitledTierIDs.includes(tierId)
              )}
            />
          ))}
      </div>
    </section>
  );
}
