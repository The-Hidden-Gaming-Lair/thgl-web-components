import { type THGLAccount } from "@repo/lib";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { kv } from "@vercel/kv";
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

export function postToken(code: string) {
  return fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.PATREON_CLIENT_ID!,
      client_secret: process.env.PATREON_CLIENT_SECRET_V2!,
      redirect_uri: process.env.PATREON_REDIRECT_URL!,
    }),
  });
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
      client_secret: process.env.PATREON_CLIENT_SECRET_V2!,
    }),
  });
}

export function getCurrentUser(token: PatreonToken) {
  return fetch(
    `https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields%5Buser%5D=full_name`,
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
  return `userId=${userId}; path=/; Max-Age=${expiresIn}; domain=${process.env.COOKIE_DOMAIN}; SameSite=Lax;`;
}

export function toCookieStringEmpty() {
  return `userId=; path=/; Max-Age=0; domain=${process.env.COOKIE_DOMAIN}; SameSite=Lax;`;
}

export async function getAccount() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  const account: THGLAccount = {
    userId: null,
    decryptedUserId: null,
    perks: {
      adRemoval: false,
      comments: false,
      premiumFeatures: false,
      previewReleaseAccess: false,
    },
  };

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
          account.userId = userId.value;
          account.decryptedUserId = id;
          account.perks = getPerks(currentUserResult);
        }
      }
    } catch (error) {
      //
    }
  }
  return account;
}
