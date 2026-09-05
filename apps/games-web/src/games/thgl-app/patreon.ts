import { type THGLAccount } from "@repo/lib";
import { cookies } from "next/headers";
import { getToken } from "@/lib/tokens";
import {
  TOKEN_COOKIE_NAME,
  decodeUserSecret,
  parseTokenCookie,
} from "@/lib/token-cookie";
import {
  TEST_SUPPORTER_EMAIL,
  TEST_SUPPORTER_PERKS,
  isTestSupporter,
} from "@/lib/test-supporter";
import { tiers } from "./tiers";

interface App {
  id: string;
  title: string;
  description: string;

  url: string;
  tileSrc: string;
  overwolf?: {
    id: string;
    protocol: string;
    url?: string;
    supportsCopySecret?: boolean;
  };
  patreonTierIDs?: string[];
  premiumFeatures?: string[];
  isPartnerApp?: boolean;
  isExternal?: boolean;
}

const DEFAULT_PATREON_TIER_IDS = [
  "21470801",
  "21470797",
  "21470809",
  "special",
];

export interface PatreonToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
}

export interface PatreonUser {
  data: {
    attributes: {
      full_name: string;
      email: string;
    };
    id: string;
    relationships: {
      memberships: {
        data: {
          id: string;
          type: string;
        }[];
      };
    };
    type: string;
  };
  included: {
    attributes: {};
    id: string;
    relationships?: {
      currently_entitled_tiers: {
        data: {
          id: string;
          type: string;
        }[];
      };
    };
    type: string;
  }[];
  links: {
    self: string;
  };
}

export type PatreonError =
  | {
      error: string;
    }
  | {
      errors: {
        challenge_metadata: null;
        code: number;
        code_name: string;
        detail: string;
        id: string;
        status: string;
        title: string;
      }[];
    };

export function postToken(code: string, redirectUri: string) {
  return fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.PATREON_CLIENT_ID!,
      client_secret: process.env.PATREON_CLIENT_SECRET!,
      // Must match the redirect_uri used in the authorize step (Patreon
      // enforces exact equality). Derived from the request host by the
      // caller so app.th.gl and www.th.gl each round-trip to themselves.
      redirect_uri: redirectUri,
    }),
  });
}

/**
 * Derive the Patreon OAuth redirect_uri from the incoming request's
 * host header. Both `/authenticate` (kicks off OAuth) and
 * `/api/patreon/redirect` (consumes the code) need to produce the
 * exact same value — Patreon enforces strict equality between the
 * authorize step and the token-exchange step. Reading from `host`
 * means each tenant (app.th.gl vs www.th.gl vs *.localhost) hands
 * Patreon its own URL.
 */
export function getRedirectUriFromRequest(request: Request): string {
  const host = request.headers.get("host") ?? "app.th.gl";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}/api/patreon/redirect`;
}

export function postRefreshToken(refreshToken: string) {
  return fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.PATREON_CLIENT_ID!,
      client_secret: process.env.PATREON_CLIENT_SECRET!,
    }),
  });
}

export function getCurrentUser(token: PatreonToken) {
  return fetch(
    `https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields%5Buser%5D=full_name,email`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    },
  );
}

const patreonSpecialUsers = process.env.PATREON_SPECIAL_USERS?.split(",") ?? [];
export function isSpecialUser(userId: string) {
  return patreonSpecialUsers.includes(userId);
}

export function getCurrentEntitledTiers(currentUser: PatreonUser) {
  if (isSpecialUser(currentUser.data.id)) {
    return ["special"];
  }
  if (!currentUser.included) {
    return [];
  }
  return currentUser.included
    .flatMap((incl) =>
      incl.relationships?.currently_entitled_tiers.data.flatMap((tier) =>
        tiers.some((t) => t.id === tier.id) ? tier.id : undefined,
      ),
    )
    .filter((tierId) => tierId !== undefined);
}

export function getPerks(currentUser: PatreonUser, app?: App) {
  const entitledTierIDs = getCurrentEntitledTiers(currentUser);

  const patreonTierIds = app?.patreonTierIDs ?? DEFAULT_PATREON_TIER_IDS;
  const appTiers =
    patreonTierIds.map((tierId) => tiers.find((t) => t.id === tierId)!) ?? [];
  const previewAccessTierIds = appTiers
    .filter((tier) => tier.perks.includes("preview-access"))
    .map((tier) => tier.id);
  const adRemovalTierIds = appTiers
    .filter((tier) => tier.perks.includes("ad-free"))
    .map((tier) => tier.id);
  const commentsTierIds = appTiers
    .filter((tier) => tier.perks.includes("comments"))
    .map((tier) => tier.id);
  const premiumFeaturesTierIds = appTiers
    .filter((tier) => tier.perks.includes("premium-features"))
    .map((tier) => tier.id);
  return {
    previewReleaseAccess: entitledTierIDs.some((tierId) =>
      previewAccessTierIds.includes(tierId),
    ),
    adRemoval: entitledTierIDs.some((tierId) =>
      adRemovalTierIds.includes(tierId),
    ),
    comments: entitledTierIDs.some((tierId) =>
      commentsTierIds.includes(tierId),
    ),
    premiumFeatures: entitledTierIDs.some((tierId) =>
      premiumFeaturesTierIds.includes(tierId),
    ),
  };
}

export function isSupporter(currentUser: PatreonUser, app?: App) {
  const patreonTierIds = app?.patreonTierIDs ?? DEFAULT_PATREON_TIER_IDS;

  const entitledTierIDs = getCurrentEntitledTiers(currentUser);
  return patreonTierIds.some((tierId) => entitledTierIDs.includes(tierId));
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function toCookieString(userId: string, expiresIn: number) {
  // Omit the domain attribute when COOKIE_DOMAIN is unset so the cookie
  // is scoped to the current host. Useful in dev where *.localhost
  // cookie scoping is unreliable across browsers — drop COOKIE_DOMAIN
  // from .env.local and each tenant subdomain gets its own session.
  const domain = process.env.COOKIE_DOMAIN
    ? `; domain=${process.env.COOKIE_DOMAIN}`
    : "";
  return `userId=${userId}; path=/; Max-Age=${expiresIn}${domain}; SameSite=Lax;`;
}

export function toCookieStringEmpty() {
  const domain = process.env.COOKIE_DOMAIN
    ? `; domain=${process.env.COOKIE_DOMAIN}`
    : "";
  return `userId=; path=/; Max-Age=0${domain}; SameSite=Lax;`;
}

/**
 * Resolve the account server-side for the app shell.
 *
 * Returns `null` when the state is UNKNOWN (token store or Patreon
 * unreachable) — consumers must then keep the client's last persisted
 * account state instead of signing the user out. A signed-out user is
 * always a non-null account with `userId: null`.
 */
export async function getAccount(): Promise<THGLAccount | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  const account: THGLAccount = {
    userId: null,
    decryptedUserId: null,
    email: null,
    perks: {
      adRemoval: false,
      comments: false,
      premiumFeatures: false,
      previewReleaseAccess: false,
    },
    username: null,
    avatarUrl: null,
    isSpecial: false,
  };

  if (!userId?.value) {
    return account;
  }
  if (!process.env.JWT_SECRET) {
    console.error("[getAccount] JWT_SECRET is not set");
    return account;
  }
  // decodeUserSecret accepts both cookie formats: the legacy JWT-of-plain-id
  // minted at login AND the enriched { u, t } secret — the client writes the
  // latter back after healing a wiped cookie store from localStorage (see
  // reverifyAccountSecret / restoreUserIdCookie).
  const decoded = decodeUserSecret(userId.value);
  if (!decoded) {
    console.error(`[getAccount] jwt verify failed`);
    return account;
  }
  const id = decoded.userId;

  // Dev-only test account (see lib/test-supporter.ts).
  if (isTestSupporter(id)) {
    account.userId = userId.value;
    account.decryptedUserId = id;
    account.email = TEST_SUPPORTER_EMAIL;
    account.perks = { ...TEST_SUPPORTER_PERKS };
    return account;
  }

  // Primary: token store; fallback: the signed httpOnly cookie set at
  // login. A store outage must not sign the user out.
  let storeUnavailable = false;
  const storedToken = await getToken(id).catch((err) => {
    storeUnavailable = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[getAccount] token fetch failed for ${id}: ${msg}`);
    return null;
  });
  const cookieToken = parseTokenCookie(
    cookieStore.get(TOKEN_COOKIE_NAME)?.value,
    id,
  );
  // Last fallback: the token embedded in an enriched userId cookie — present
  // exactly when the cookie store was healed from localStorage (no separate
  // patreonToken cookie survived the wipe).
  const patreonToken = storedToken ?? cookieToken ?? decoded.token;
  if (!patreonToken) {
    if (storeUnavailable) {
      console.error(
        `[getAccount] token store unavailable and no cookie fallback for id=${id} — account state unknown`,
      );
      return null;
    }
    console.error(
      `[getAccount] no token available for id=${id} (expired or signed out)`,
    );
    return account;
  }

  try {
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
      // The stored token can be stale after a store outage (newest copy
      // lives in the cookie — Patreon rotates tokens on refresh). Retry
      // with the cookie before treating the session as dead.
      console.warn(
        `[getAccount] stored token rejected (${currentUserResponse.status}) for ${id} — retrying with cookie token`,
      );
      currentUserResponse = await getCurrentUser(cookieToken);
      currentUserResult = (await currentUserResponse.json()) as
        | PatreonUser
        | PatreonError;
    }
    if ("error" in currentUserResult || "errors" in currentUserResult) {
      console.error(
        `[getAccount] patreon /identity failed (status=${currentUserResponse.status}): ${JSON.stringify(currentUserResult).slice(0, 300)}`,
      );
      // 5xx = Patreon down; a 4xx on the fallback token during a store
      // outage may just be a stale access token — both are UNKNOWN, not
      // proof the user signed out.
      if (currentUserResponse.status >= 500 || storeUnavailable) {
        return null;
      }
      return account;
    }
    account.userId = userId.value;
    account.decryptedUserId = id;
    account.email = currentUserResult.data.attributes.email;
    account.perks = getPerks(currentUserResult);
    account.isSpecial = isSpecialUser(id);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[getAccount] unexpected: ${msg}`);
    return null;
  }
  return account;
}
