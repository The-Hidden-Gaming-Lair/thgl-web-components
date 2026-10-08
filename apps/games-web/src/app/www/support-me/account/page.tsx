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
import { decodeUserSecret } from "@/lib/token-cookie";
import {
  TEBEX_FREE_TIER_ID,
  type TebexAccount,
  type TebexTierKey,
  isTebexTierKey,
  isTebexUserId,
  resolveTebexAccount,
} from "@/lib/tebex";
import { SupporterKey } from "@/games/thgl-web/components/supporter-key";
import { emailsForAccount } from "@/lib/email-login";
import { SupporterKeyLogin } from "@/games/thgl-web/components/supporter-key-login";
import { EmailSignInSection } from "@/games/thgl-web/components/email-sign-in-section";

// Tebex's customer portal: buyers sign in with their purchase email to view
// payments and cancel their subscription.
const TEBEX_PAYMENT_HISTORY_URL =
  "https://checkout.tebex.io/payment-history/login";

function TebexAccountContent({
  secret,
  tebexId,
  tebex,
  pending,
  emails,
}: {
  secret: string;
  tebexId: string;
  tebex: TebexAccount | null;
  /** Emails that sign in to this account (lib/email-login.ts). */
  emails: string[];
  /** Tier of a just-finished checkout (?tebex=complete&tier=…), else null. */
  pending: TebexTierKey | null;
}) {
  const all = tebex?.entitlements ?? [];
  // The Free package only marks the account as existing; the paid ones carry
  // perks and an expiry.
  const active = all.filter((e) => e.tierId !== TEBEX_FREE_TIER_ID);
  const account: THGLAccount | null = tebex
    ? {
        userId: secret,
        decryptedUserId: tebexId,
        email: tebex.email,
        perks: tebex.perks,
        username: null,
        avatarUrl: null,
      }
    : null;
  // Right after checkout the webhook may not have landed yet — re-render
  // every few seconds until the entitlement shows up (a paid tier for a
  // paid checkout; any entitlement for the Free one).
  const waiting =
    pending !== null &&
    tebex !== null &&
    (pending === "free" ? all.length === 0 : active.length === 0);
  return (
    <>
      {account && <InitializeAccount account={account} />}
      {waiting && <meta httpEquiv="refresh" content="4" />}
      <div className="bg-muted/30 rounded-lg p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">Account</h2>
        {tebex === null ? (
          <p className="text-amber-500 text-center text-sm">
            Your subscription status is temporarily unavailable. Please try
            again in a minute.
            <br />
            暂时无法获取订阅状态，请一分钟后再试。
          </p>
        ) : waiting ? (
          <p className="text-center text-sm text-muted-foreground">
            Thank you! Processing your payment — this page updates
            automatically.
            <br />
            谢谢！正在处理你的付款，此页面会自动更新。
          </p>
        ) : active.length > 0 ? (
          <div className="text-center space-y-2">
            <div className="flex gap-2 justify-center flex-wrap">
              {[...new Set(active.map((e) => e.tierId))].map((tierId) => (
                <span
                  key={tierId}
                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                >
                  {tiers.find((tier) => tier.id === tierId)?.title ?? "Unknown"}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Active until{" "}
              {new Date(active[0].expiresAt * 1000).toLocaleDateString(
                "en-US",
                { dateStyle: "medium" },
              )}
              {active[0].status === "Active" && " · renews automatically"}
            </p>
          </div>
        ) : all.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Free account - you can write comments.{" "}
            <Link href="/support-me/tebex" className="text-primary underline">
              Upgrade to Pro or Elite
            </Link>
            <br />
            免费账户：可以发表评论。
            <Link href="/support-me/tebex" className="text-primary underline">
              升级到 Pro 或 Elite
            </Link>
          </p>
        ) : (
          <p className="text-amber-500 font-medium text-center text-sm">
            You have no active subscription.{" "}
            <Link href="/support-me/tebex" className="text-primary underline">
              Choose a tier
            </Link>
          </p>
        )}

        {emails.length > 0 && (
          <div className="border-t border-border pt-4 space-y-1 text-sm">
            <p className="font-semibold">
              Email
              <span className="block">邮箱</span>
            </p>
            <p className="break-all">{emails.join(", ")}</p>
            <p className="text-muted-foreground">
              Sign in on other devices and in the Companion App with &quot;Sign
              in with email&quot; - we send you a one-time code.
            </p>
            <p className="text-muted-foreground">
              在其他设备或伴侣应用中，点击“Sign in with
              email”，我们会向此邮箱发送一次性验证码。
            </p>
          </div>
        )}

        <div className="border-t border-border pt-4 space-y-3 text-sm">
          <p className="font-semibold">
            Your Account Key
            <span className="block">你的账户密钥</span>
          </p>
          <p className="text-muted-foreground">
            Keep this key safe. To unlock your perks in the Companion App, in
            another browser or on another device, open the sign-in dialog there,
            click &quot;Have an Account Key?&quot; and paste it.
          </p>
          <p className="text-muted-foreground">
            请妥善保存此密钥。在伴侣应用、其他浏览器或其他设备中，打开登录窗口，点击“Have
            an Account Key?”并粘贴此密钥，即可恢复你的账户和权益。
          </p>
          <SupporterKey secret={secret} />
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-center pt-4 border-t border-border">
          <Button variant="secondary" asChild>
            <Link href={TEBEX_PAYMENT_HISTORY_URL} target="_blank">
              Manage Subscription
            </Link>
          </Button>
          <SignOut isTebexAccount />
        </div>
      </div>
    </>
  );
}

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

export default async function SupportMeAccount({
  searchParams,
}: {
  searchParams: Promise<{ tebex?: string; tier?: string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");
  const { tebex: tebexParam, tier: tierParam } = await searchParams;

  let content;
  let entitledTierIDs: string[] = [];
  // Secret handed to Overwolf apps (Unlock App deep link / Copy
  // Secret). When the Patreon token is available we mint an ENRICHED
  // secret carrying it ({u, t} — same shape as the patreonToken
  // cookie), so the OW flow keeps working when the token store is
  // unreachable. Falls back to the plain signed userId.
  let owSecret = userId?.value;

  const tebexId = userId?.value
    ? (() => {
        const decoded = decodeUserSecret(userId.value);
        return decoded && isTebexUserId(decoded.userId) ? decoded.userId : null;
      })()
    : null;

  if (tebexId && userId?.value) {
    const [tebex, emails] = await Promise.all([
      resolveTebexAccount(tebexId),
      emailsForAccount(tebexId).catch(() => [] as string[]),
    ]);
    entitledTierIDs = tebex?.tierIds ?? [];
    content = (
      <TebexAccountContent
        secret={userId.value}
        tebexId={tebexId}
        tebex={tebex}
        emails={emails}
        pending={
          tebexParam === "complete"
            ? isTebexTierKey(tierParam)
              ? tierParam
              : "pro"
            : null
        }
      />
    );
  } else if (userId?.value) {
    try {
      const id = verify(userId.value, process.env.JWT_SECRET!) as string;
      // Cookie fallback keeps this page working when the token store
      // is unreachable — see lib/token-cookie.ts.
      const storedToken = await getToken(id).catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[support-me/account] getToken failed: ${msg}`);
        return null;
      });
      const cookieToken = parseTokenCookie(
        cookieStore.get(TOKEN_COOKIE_NAME)?.value,
        id,
      );
      const patreonToken = storedToken ?? cookieToken;

      if (patreonToken) {
        owSecret = signTokenCookie(id, patreonToken);
        let currentUserResponse = await getCurrentUser(patreonToken);
        let currentUserResult = (await currentUserResponse.json()) as
          | PatreonUser
          | PatreonError;
        if (
          ("error" in currentUserResult || "errors" in currentUserResult) &&
          currentUserResponse.status < 500 &&
          cookieToken &&
          patreonToken !== cookieToken &&
          cookieToken.access_token !== patreonToken.access_token
        ) {
          // The stored token can be STALE when store writes fail after a
          // login rotated it (the fresh copy lives only in the cookie) —
          // without this retry the page shows "not authenticated" right
          // after a successful sign-in. Mirrors getAccount()/api/patreon.
          console.warn(
            `[support-me/account] stored token rejected (${currentUserResponse.status}) for ${id} — retrying with cookie token`,
          );
          owSecret = signTokenCookie(id, cookieToken);
          currentUserResponse = await getCurrentUser(cookieToken);
          currentUserResult = (await currentUserResponse.json()) as
            | PatreonUser
            | PatreonError;
        }

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
                    {/* Patreon only returns the address when the token
                        carries the identity[email] scope — tokens minted
                        before that scope was requested resolve to
                        undefined, so the line is conditional. */}
                    {currentUserResult.data.attributes.email && (
                      <p className="text-sm text-muted-foreground">
                        {currentUserResult.data.attributes.email}
                      </p>
                    )}
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
        <EmailSignInSection />
        <SupporterKeyLogin />
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
