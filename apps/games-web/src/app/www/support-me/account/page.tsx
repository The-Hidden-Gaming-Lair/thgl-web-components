import { getToken } from "@/lib/tokens";
import {
  TOKEN_COOKIE_NAME,
  parseTokenCookie,
  signTokenCookie,
} from "@/lib/token-cookie";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppSubscriptionCard } from "@/games/thgl-web/components/app-subscription-card";
import { ProfileEditor } from "@/games/thgl-web/components/profile-editor";
import { Button } from "@repo/ui/controls";
import { SignOut } from "@/games/thgl-web/components/sign-out";
import {
  type PatreonError,
  type PatreonUser,
  getCurrentEntitledTiers,
  getCurrentUser,
} from "@/games/thgl-web/lib/patreon";
import { tiers } from "@/games/thgl-web/lib/tiers";
import { games, API_FORGE_URL, type THGLAccount } from "@repo/lib";
import { getPerks } from "@/games/thgl-web/lib/patreon";
import { InitializeAccount } from "@repo/ui/thgl-app";

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
  // Secret handed to Overwolf apps (Unlock App deep link / Copy
  // Secret). When the Patreon token is available we mint an ENRICHED
  // secret carrying it ({u, t} — same shape as the patreonToken
  // cookie), so the OW flow keeps working when the token store is
  // unreachable. Falls back to the plain signed userId.
  let owSecret = userId?.value;

  if (userId?.value) {
    try {
      const id = verify(userId.value, process.env.JWT_SECRET!) as string;
      // Cookie fallback keeps this page working when the token store
      // is unreachable — see lib/token-cookie.ts.
      const patreonToken =
        (await getToken(id).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[support-me/account] getToken failed: ${msg}`);
          return null;
        })) ?? parseTokenCookie(cookieStore.get(TOKEN_COOKIE_NAME)?.value, id);

      if (patreonToken) {
        owSecret = signTokenCookie(id, patreonToken);
        const currentUserResponse = await getCurrentUser(patreonToken);
        const currentUserResult = (await currentUserResponse.json()) as
          | PatreonUser
          | PatreonError;

        if (
          !("error" in currentUserResult) &&
          !("errors" in currentUserResult)
        ) {
          entitledTierIDs = getCurrentEntitledTiers(currentUserResult);
          const perks = getPerks(currentUserResult);

          // Fetch user profile from api-forge
          let username: string | null = null;
          let avatarUrl: string | null = null;
          try {
            const profileRes = await fetch(
              `${API_FORGE_URL}/users?userId=${encodeURIComponent(userId.value)}`,
            );
            if (profileRes.ok) {
              const profile = await profileRes.json();
              username = profile.username ?? profile.generatedUsername;
              avatarUrl = profile.avatarUrl;
            }
          } catch {
            // Profile fetch failed, continue with defaults
          }

          const account: THGLAccount = {
            userId: userId.value,
            decryptedUserId: id,
            email: currentUserResult.data.attributes.email,
            perks,
            username,
            avatarUrl,
          };

          content = (
            <>
              <InitializeAccount account={account} />
              <div className="bg-muted/30 rounded-lg p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">Account</h2>

                {/* User Info */}
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Logged in as
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {currentUserResult.data.attributes.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {currentUserResult.data.id}
                    </p>
                  </div>

                  {/* Current Tiers */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-semibold text-center mb-3">
                      Active Subscription Tier(s)
                    </p>
                    {entitledTierIDs.length > 0 ? (
                      <div className="flex gap-2 justify-center flex-wrap">
                        {entitledTierIDs.map((tierId) => (
                          <span
                            key={tierId}
                            className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                          >
                            {tiers.find((tier) => tier.id === tierId)?.title ??
                              "Unknown"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-amber-500 font-medium text-center text-sm">
                        You are not subscribed to any tier.
                      </p>
                    )}

                    {entitledTierIDs.includes("21470801") && (
                      <p className="text-sm text-amber-500 text-center mt-3">
                        The Enthusiast tier does not include Ad Removal.
                      </p>
                    )}
                  </div>

                  {/* Perks */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-semibold text-center mb-3">
                      Perks
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      {(
                        [
                          {
                            label: "Comments",
                            // Free for every signed-in account
                            active: true,
                            tier: "Free",
                          },
                          {
                            label: "Ad-Free",
                            active: perks.adRemoval,
                            tier: "Pro+",
                          },
                          {
                            label: "Premium",
                            active: perks.premiumFeatures,
                            tier: "Pro+",
                          },
                          {
                            label: "Preview Access",
                            active: perks.previewReleaseAccess,
                            tier: "Elite",
                          },
                        ] as const
                      ).map((perk) => (
                        <div
                          key={perk.label}
                          className={
                            perk.active
                              ? "flex items-center justify-between text-sm text-foreground py-1"
                              : "flex items-center justify-between text-sm text-muted-foreground/40 py-1"
                          }
                        >
                          <span>{perk.label}</span>
                          <span className="text-xs text-muted-foreground/50">
                            {perk.tier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
                  <p>
                    This page activates your perks for{" "}
                    <strong className="text-foreground">
                      Overwolf apps and *.th.gl websites
                    </strong>
                    .
                  </p>
                  <p>
                    If you're using the{" "}
                    <Link
                      href="/companion-app"
                      className="text-primary hover:underline font-medium"
                    >
                      Companion App
                    </Link>
                    , perks are unlocked directly inside the app — no action
                    needed here.
                  </p>
                  <p>
                    <strong className="text-foreground">Discord Role:</strong>{" "}
                    To get your Discord supporter role,{" "}
                    <Link
                      href="/faq/discord-supporter-role"
                      className="text-primary hover:underline"
                    >
                      link your Discord account to Patreon
                    </Link>
                    .
                  </p>
                </div>

                {/* Profile */}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-semibold text-center mb-4">
                    Profile
                  </p>
                  <ProfileEditor />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center mt-6 pt-4 border-t border-border">
                  <Button variant="secondary" asChild>
                    <Link href="/support-me/patreon" prefetch={false}>
                      Change Patreon Account
                    </Link>
                  </Button>
                  <SignOut />
                </div>
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
      <div className="bg-muted/30 rounded-lg p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">Activate Your Perks</h2>
        <p className="text-muted-foreground mb-6">
          You are not authenticated. Connect your Patreon account to activate
          your perks for Overwolf apps and web tools.
        </p>
        <Button size="lg" asChild>
          <Link href="/support-me/patreon" prefetch={false}>
            Authenticate with Patreon
          </Link>
        </Button>
        <p className="italic text-sm text-muted-foreground mt-4">
          This will store a cookie in your browser to remember your Patreon
          account. You can sign out at any time.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-16 px-4 pt-10 pb-20 max-w-7xl mx-auto">
      {content}

      {/* Overwolf Apps Section */}
      <div className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold">Unlock Overwolf Apps</h2>
          <p className="text-sm text-muted-foreground">
            For each app you support, click <strong>Unlock App</strong> to open
            and unlock it directly. If it doesn&apos;t open, click{" "}
            <strong>Copy Secret</strong> and paste it into the app&apos;s
            account window. (The Companion App and website don&apos;t need a
            secret — just sign in with Patreon.)
          </p>
        </div>

        <div className="flex flex-wrap gap-6 justify-center">
          {games
            .filter((game) => "overwolf" in game)
            .map((game) => (
              <AppSubscriptionCard
                key={game.title}
                game={game}
                userId={owSecret}
                hasTier={game.patreonTierIDs?.some((tierId) =>
                  entitledTierIDs.includes(tierId),
                )}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
