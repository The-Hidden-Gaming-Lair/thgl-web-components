import { App } from "./apps";
import { tiers } from "./tiers";

export type PatreonToken = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
};

export type PatreonUser = {
  data: {
    attributes: {
      full_name: string;
    };
    id: string;
    relationships: {
      memberships: {
        data: Array<{
          id: string;
          type: string;
        }>;
      };
    };
    type: string;
  };
  included: Array<{
    attributes: {};
    id: string;
    relationships?: {
      currently_entitled_tiers: {
        data: Array<{
          id: string;
          type: string;
        }>;
      };
    };
    type: string;
  }>;
  links: {
    self: string;
  };
};

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
      incl.relationships?.currently_entitled_tiers?.data?.flatMap((tier) =>
        tiers.some((t) => t.id === tier.id) ? tier.id : undefined,
      ),
    )
    .filter((tierId) => tierId !== undefined) as string[];
}

export function hasPreviewAccess(currentUser: PatreonUser, app: App) {
  const entitledTierIDs = getCurrentEntitledTiers(currentUser);
  const appTiers =
    app.patreonTierIDs?.map((tierId) => tiers.find((t) => t.id === tierId)!) ??
    [];
  const validTiersIds = appTiers
    .filter((tier) => tier.perks.includes("preview-access"))
    .map((tier) => tier.id);
  return entitledTierIDs.some((tierId) => validTiersIds.includes(tierId));
}

export function isSupporter(currentUser: PatreonUser, app: App) {
  const entitledTierIDs = getCurrentEntitledTiers(currentUser);
  return app.patreonTierIDs?.some((tierId) => entitledTierIDs.includes(tierId));
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
