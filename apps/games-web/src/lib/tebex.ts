import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { type Game } from "@repo/lib";
import { arg, libsql } from "@/lib/libsql";
import {
  getPerksForTierIds,
  isSupporterTierIds,
} from "@/games/thgl-web/lib/patreon";

/**
 * Tebex (Headless API, merchant of record) as a second way to become a
 * supporter, next to Patreon — mainly so players without Patreon access
 * (e.g. mainland China → Alipay) can subscribe.
 *
 * Identity: a Tebex buyer gets an opaque account id `tebex:<uuid>`, signed
 * into the same `userId` cookie/secret as a Patreon id. Every account
 * resolver short-circuits these ids (like the dev test-supporter) and reads
 * the entitlement from Bunny DB instead of Patreon.
 *
 * Entitlements: the webhook (www/api/tebex/webhook) is the source of truth.
 * Each Tebex package maps onto the Patreon tier id with the same perks, so
 * getPerksForTierIds/isSupporterTierIds (and per-game patreonTierIDs) apply
 * unchanged.
 *
 * Schema (scripts/apply-tebex-schema.mjs):
 *   CREATE TABLE tebex_entitlements (
 *     ref        TEXT PRIMARY KEY,  -- tbx-r-… (recurring) or tbx-… (one-off txn)
 *     user_id    TEXT NOT NULL,     -- tebex:<uuid>
 *     package_id TEXT NOT NULL,
 *     tier_id    TEXT NOT NULL,     -- Patreon tier id with the same perks
 *     status     TEXT NOT NULL,     -- Tebex status description / event outcome
 *     revoked    INTEGER NOT NULL,  -- 1 = refunded / charged back / ended
 *     expires_at INTEGER NOT NULL,  -- unix seconds; perks while now < expires_at
 *     email      TEXT,
 *     event_at   INTEGER NOT NULL,  -- webhook `date`; older events never overwrite newer ones
 *     updated_at INTEGER NOT NULL
 *   );
 *   CREATE INDEX tebex_entitlements_user ON tebex_entitlements(user_id);
 */

export const TEBEX_ID_PREFIX = "tebex:";

export function isTebexUserId(userId: string): boolean {
  return userId.startsWith(TEBEX_ID_PREFIX);
}

export function newTebexUserId(): string {
  return `${TEBEX_ID_PREFIX}${randomUUID()}`;
}

export type TebexTierKey = "free" | "pro" | "elite";

/**
 * The $0 "Free" package: a Tebex account without paid perks, so players who
 * can't sign in with Patreon (mainland China) still get an account for
 * comments. Not a Patreon tier id, so it grants no perks.
 */
export const TEBEX_FREE_TIER_ID = "tebex-free";

// Tebex package (env) → Patreon tier id with the same perks (tiers.ts).
const TIER_BY_KEY: Record<TebexTierKey, { env: string; tierId: string }> = {
  free: { env: "TEBEX_PACKAGE_FREE", tierId: TEBEX_FREE_TIER_ID },
  pro: { env: "TEBEX_PACKAGE_PRO", tierId: "21470809" },
  elite: { env: "TEBEX_PACKAGE_ELITE", tierId: "21470797" },
};

/**
 * China test (Leon 2026-10-07): Tebex only offers Alipay + WeChat Pay, with
 * China regional prices set per package in the Tebex panel (USD overrides,
 * shown to buyers as CNY). Display copy only - Tebex decides the real price.
 */
export const TEBEX_CN_PRICES: Record<
  TebexTierKey,
  { cny: string; usd: string }
> = {
  free: { cny: "0", usd: "0" },
  pro: { cny: "14.95", usd: "2.23" },
  elite: { cny: "29.90", usd: "4.46" },
};

export function isTebexTierKey(value: unknown): value is TebexTierKey {
  return typeof value === "string" && value in TIER_BY_KEY;
}

export function tebexPackageId(key: TebexTierKey): string | undefined {
  return process.env[TIER_BY_KEY[key].env];
}

function tierIdForPackage(packageId: string): string | null {
  for (const { env, tierId } of Object.values(TIER_BY_KEY)) {
    if (process.env[env] === packageId) return tierId;
  }
  return null;
}

// Paid period + slack for Tebex's renewal retries (3 attempts) before a
// lapsed renewal takes the perks away.
const RENEWAL_GRACE_SECONDS = 3 * 24 * 3600;
// One-off purchase of a monthly package (non-recurring methods, e.g. Alipay
// when it can't renew): one period.
const ONE_OFF_PERIOD_SECONDS = 31 * 24 * 3600;
// The Free account never expires (it only marks the account as existing).
export const TEBEX_FREE_EXPIRES_AT = 4102444800; // 2100-01-01

// ---------------------------------------------------------------------------
// Headless API: checkout
// ---------------------------------------------------------------------------

const HEADLESS_URL = "https://headless.tebex.io/api";

function headlessAuth(): string | null {
  const token = process.env.TEBEX_PUBLIC_TOKEN;
  const key = process.env.TEBEX_PRIVATE_KEY;
  if (!token || !key) return null;
  return `Basic ${Buffer.from(`${token}:${key}`).toString("base64")}`;
}

/**
 * Creates a basket for one subscription package, tagged with our account id
 * (basket- and package-level `custom` — both come back in every webhook), and
 * returns the hosted checkout URL. Server-side basket creation needs Basic
 * auth plus the buyer's IP (Tebex uses it for fraud checks and tax country).
 */
export async function createTebexCheckout(input: {
  userId: string;
  tier: TebexTierKey;
  ip: string;
  completeUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const auth = headlessAuth();
  const packageId = tebexPackageId(input.tier);
  if (!auth || !packageId) throw new Error("Tebex is not configured");
  const headers = { "content-type": "application/json", authorization: auth };
  const custom = { thgl_user_id: input.userId };

  const basketRes = await fetch(
    `${HEADLESS_URL}/accounts/${process.env.TEBEX_PUBLIC_TOKEN}/baskets`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        complete_url: input.completeUrl,
        cancel_url: input.cancelUrl,
        complete_auto_redirect: true,
        custom,
        ip_address: input.ip,
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const basket = (await basketRes.json()) as {
    data?: { ident: string };
    detail?: string;
  };
  if (!basketRes.ok || !basket.data?.ident) {
    throw new Error(
      `Tebex basket failed (${basketRes.status}): ${basket.detail ?? ""}`,
    );
  }

  const addRes = await fetch(
    `${HEADLESS_URL}/baskets/${basket.data.ident}/packages`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        package_id: Number(packageId),
        quantity: 1,
        custom: { ...custom, tier: input.tier },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const added = (await addRes.json()) as {
    data?: { links?: { checkout?: string } };
    detail?: string;
  };
  const checkout = added.data?.links?.checkout;
  if (!addRes.ok || !checkout) {
    throw new Error(
      `Tebex add package failed (${addRes.status}): ${added.detail ?? ""}`,
    );
  }
  return checkout;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/**
 * X-Signature = HMAC-SHA256(key: webhook secret, data: hex SHA-256 of the RAW
 * body). Verified against real deliveries (2026-09-28).
 */
export function verifyTebexSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const expected = createHmac("sha256", secret).update(bodyHash).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface TebexProduct {
  id: number;
  expires_at?: string | null;
}

interface TebexPaymentSubject {
  transaction_id: string;
  status?: { id: number; description: string };
  created_at?: string;
  customer?: { email?: string };
  products?: TebexProduct[];
  recurring_payment_reference?: string | null;
  custom?: { thgl_user_id?: string } | null;
}

interface TebexRecurringSubject {
  reference: string;
  status: { id: number; description: string };
  next_payment_at?: string | null;
  cancelled_at?: string | null;
  initial_payment?: TebexPaymentSubject;
  last_payment?: TebexPaymentSubject;
}

export interface TebexWebhook {
  id: string;
  type: string;
  date: string;
  subject: unknown;
}

// Recurring-payment status ids that still grant perks: Active, Overdue
// (renewal being retried), Pending Downgrade.
const ACTIVE_RECURRING_STATUS = new Set([2, 3, 7]);

function toUnix(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

function userIdOf(payment: TebexPaymentSubject | undefined): string | null {
  const id = payment?.custom?.thgl_user_id;
  return typeof id === "string" && isTebexUserId(id) ? id : null;
}

interface EntitlementRow {
  ref: string;
  userId: string;
  packageId: string;
  tierId: string;
  status: string;
  revoked: boolean;
  expiresAt: number;
  email: string | null;
  eventAt: number;
}

async function upsertEntitlement(row: EntitlementRow): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await libsql([
    {
      // Out-of-order safe: a delivery older than the stored one is ignored.
      sql: `INSERT INTO tebex_entitlements
              (ref, user_id, package_id, tier_id, status, revoked, expires_at, email, event_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ref) DO UPDATE SET
              package_id = excluded.package_id,
              tier_id = excluded.tier_id, status = excluded.status,
              revoked = excluded.revoked, expires_at = excluded.expires_at,
              email = COALESCE(excluded.email, tebex_entitlements.email),
              event_at = excluded.event_at, updated_at = excluded.updated_at
            WHERE excluded.event_at >= tebex_entitlements.event_at`,
      args: [
        arg.text(row.ref),
        arg.text(row.userId),
        arg.text(row.packageId),
        arg.text(row.tierId),
        arg.text(row.status),
        arg.int(row.revoked ? 1 : 0),
        arg.int(row.expiresAt),
        row.email ? arg.text(row.email) : arg.null(),
        arg.int(row.eventAt),
        arg.int(now),
      ],
    },
    // The purchase email signs in to the account (lib/email-login.ts). Linked
    // to the row's CURRENT owner: user_id is never overwritten above, so a
    // renewal of an entitlement that an email sign-in merged into another
    // account stays there (the webhook still carries the checkout-time id).
    ...(row.email
      ? [
          {
            sql: `INSERT OR IGNORE INTO account_emails (email, user_id, created_at)
                  SELECT ?, user_id, ? FROM tebex_entitlements WHERE ref = ?`,
            args: [
              arg.text(row.email.trim().toLowerCase()),
              arg.int(now),
              arg.text(row.ref),
            ],
          },
        ]
      : []),
  ]);
}

async function revokeEntitlement(
  ref: string,
  status: string,
  eventAt: number,
): Promise<void> {
  await libsql([
    {
      sql: `UPDATE tebex_entitlements
               SET revoked = 1, status = ?, event_at = ?, updated_at = ?
             WHERE ref = ? AND event_at <= ?`,
      args: [
        arg.text(status),
        arg.int(eventAt),
        arg.int(Math.floor(Date.now() / 1000)),
        arg.text(ref),
        arg.int(eventAt),
      ],
    },
  ]);
}

/**
 * Applies one verified webhook delivery. Returns a short outcome string for
 * logging. Throws on DB failure so Tebex retries the delivery.
 */
export async function handleTebexWebhook(event: TebexWebhook): Promise<string> {
  const eventAt = toUnix(event.date) ?? Math.floor(Date.now() / 1000);

  if (event.type.startsWith("recurring-payment.")) {
    const sub = event.subject as TebexRecurringSubject;
    const payment = sub.last_payment ?? sub.initial_payment;
    const userId = userIdOf(payment) ?? userIdOf(sub.initial_payment);
    const packageId = payment?.products?.[0]?.id;
    const tierId = packageId ? tierIdForPackage(String(packageId)) : null;
    if (!userId || !packageId || !tierId) {
      return `ignored ${event.type} ${sub.reference}: no thgl user/package`;
    }
    const ended = event.type === "recurring-payment.ended";
    // Tebex keeps status 2 (Active) on cancellation.requested — the event
    // type (or cancelled_at on later deliveries) is the cancellation signal.
    const cancelled =
      event.type === "recurring-payment.cancellation.requested" ||
      (event.type !== "recurring-payment.cancellation.aborted" &&
        !!sub.cancelled_at);
    const renewing =
      !ended && !cancelled && ACTIVE_RECURRING_STATUS.has(sub.status.id);
    const nextPayment = toUnix(sub.next_payment_at) ?? eventAt;
    // Cancelled-but-paid subscriptions keep their perks until the paid
    // period ends (next_payment_at, no renewal grace).
    const expiresAt = renewing
      ? nextPayment + RENEWAL_GRACE_SECONDS
      : nextPayment;
    const status = ended
      ? "Ended"
      : cancelled
        ? "Cancelled"
        : sub.status.description;
    await upsertEntitlement({
      ref: sub.reference,
      userId,
      packageId: String(packageId),
      tierId,
      status,
      revoked: ended || sub.status.id === 4, // 4 = Expired
      expiresAt,
      email: payment?.customer?.email ?? null,
      eventAt,
    });
    return `${event.type} ${sub.reference} → ${status} until ${new Date(expiresAt * 1000).toISOString()}`;
  }

  const pay = event.subject as TebexPaymentSubject;
  const ref = pay.recurring_payment_reference || pay.transaction_id;
  switch (event.type) {
    case "payment.completed": {
      // Subscriptions are tracked through the recurring-payment.* events;
      // only one-off purchases (non-recurring methods) are granted here.
      if (pay.recurring_payment_reference) {
        return `payment.completed ${pay.transaction_id}: recurring, handled by recurring-payment.*`;
      }
      const userId = userIdOf(pay);
      const packageId = pay.products?.[0]?.id;
      const tierId = packageId ? tierIdForPackage(String(packageId)) : null;
      if (!userId || !packageId || !tierId) {
        return `ignored payment.completed ${pay.transaction_id}: no thgl user/package`;
      }
      const paidAt = toUnix(pay.created_at) ?? eventAt;
      const isFree = tierId === TEBEX_FREE_TIER_ID;
      const expiresAt = isFree
        ? TEBEX_FREE_EXPIRES_AT
        : (toUnix(pay.products?.[0]?.expires_at) ??
          paidAt + ONE_OFF_PERIOD_SECONDS);
      await upsertEntitlement({
        ref: pay.transaction_id,
        userId,
        packageId: String(packageId),
        tierId,
        status: isFree ? "Free" : "One-off",
        revoked: false,
        expiresAt,
        email: pay.customer?.email ?? null,
        eventAt,
      });
      return `payment.completed ${pay.transaction_id} one-off until ${new Date(expiresAt * 1000).toISOString()}`;
    }
    case "payment.refunded":
    case "payment.dispute.lost":
      await revokeEntitlement(
        ref,
        event.type === "payment.refunded" ? "Refunded" : "Chargeback",
        eventAt,
      );
      return `${event.type} → revoked ${ref}`;
    default:
      return `ignored ${event.type}`;
  }
}

// ---------------------------------------------------------------------------
// Account resolution
// ---------------------------------------------------------------------------

export interface TebexEntitlement {
  tierId: string;
  status: string;
  expiresAt: number;
  email: string | null;
}

/** Active (non-revoked, unexpired) entitlements of an account. Throws on DB failure. */
export async function getTebexEntitlements(
  userId: string,
): Promise<TebexEntitlement[]> {
  const [result] = await libsql([
    {
      sql: `SELECT tier_id, status, expires_at, email FROM tebex_entitlements
             WHERE user_id = ? AND revoked = 0 AND expires_at > ?
             ORDER BY expires_at DESC`,
      args: [arg.text(userId), arg.int(Math.floor(Date.now() / 1000))],
    },
  ]);
  return result.rows.map((row) => ({
    tierId: row[0].value,
    status: row[1].value,
    expiresAt: Number(row[2].value),
    email: row[3].type === "null" ? null : row[3].value,
  }));
}

export interface TebexAccount {
  tierIds: string[];
  perks: ReturnType<typeof getPerksForTierIds>;
  isSupporter: boolean;
  email: string | null;
  entitlements: TebexEntitlement[];
}

/**
 * Resolves a `tebex:` account. Returns `null` when the DB is unreachable —
 * callers treat that as UNKNOWN (keep the client's persisted state), matching
 * the Patreon token-store outage contract.
 */
export async function resolveTebexAccount(
  userId: string,
  game?: Game,
): Promise<TebexAccount | null> {
  let entitlements: TebexEntitlement[];
  try {
    entitlements = await getTebexEntitlements(userId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tebex] entitlement lookup failed for ${userId}: ${msg}`);
    return null;
  }
  const tierIds = [...new Set(entitlements.map((e) => e.tierId))];
  return {
    tierIds,
    perks: getPerksForTierIds(tierIds, game),
    isSupporter: isSupporterTierIds(tierIds, game),
    email: entitlements.find((e) => e.email)?.email ?? null,
    entitlements,
  };
}

/** Buyer IP for the basket (first hop of x-forwarded-for behind the CDN). */
export function clientIpFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || null;
}
