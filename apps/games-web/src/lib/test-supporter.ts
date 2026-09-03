/**
 * Dev-only test supporter account, so license/heal testing never needs a real
 * Patreon credential (real secrets otherwise end up in chat/shell history).
 *
 * A secret minted for the fixed id below (scripts\mint-test-secret.mjs signs it
 * with JWT_SECRET) verifies with ALL perks on dev servers — the auth handlers
 * short-circuit before any Patreon/token-store call. Hard-gated on
 * NODE_ENV=development: production builds compile this to `false`, so the id is
 * inert wherever it matters and no extra env/config is involved.
 */
export const TEST_SUPPORTER_ID = "test-supporter";

export function isTestSupporter(userId: string): boolean {
  return process.env.NODE_ENV === "development" && userId === TEST_SUPPORTER_ID;
}

export const TEST_SUPPORTER_PERKS = {
  adRemoval: true,
  previewReleaseAccess: true,
  comments: true,
  premiumFeatures: true,
} as const;

export const TEST_SUPPORTER_EMAIL = "test-supporter@th.gl";
