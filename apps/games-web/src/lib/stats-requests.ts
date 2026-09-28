import { BadRequestError, ForbiddenError } from "@/lib/api-errors";
import {
  addVote,
  countRecentRequests,
  getGame,
  getGameBySteamAppId,
  insertGame,
  recordSamples,
  type Sample,
} from "@/lib/stats-db";
import {
  fetchSteamAppDetails,
  fetchSteamCcu,
  fetchSteamFollowers,
  steamPlatformEntry,
} from "@/lib/stats-sources";
import { type StatsStatus } from "@/lib/stats-types";

/**
 * Game requests, shared by the website (/api/stats/requests, Patreon user
 * ids) and the Discord bot (/api/stats/discord, `discord:<id>` user ids).
 *
 * A Steam game is validated against the store and goes public right away
 * (status "requested") so collection starts immediately. A game that isn't
 * on Steam goes to "pending" until an admin reviews it. Requesting an
 * already-tracked game just votes.
 */

export type RequestResult = {
  id: string;
  title: string;
  status: StatsStatus;
  created: boolean;
  voteCount: number;
};

const MAX_NEW_REQUESTS_PER_DAY = 5;

function slugify(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[®™©]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "game"
  );
}

async function uniqueId(base: string, suffix: string): Promise<string> {
  if (!(await getGame(base))) return base;
  return `${base}-${suffix}`;
}

async function enforceLimit(userId: string) {
  if ((await countRecentRequests(userId, 86400)) >= MAX_NEW_REQUESTS_PER_DAY) {
    throw new ForbiddenError(
      `You can request up to ${MAX_NEW_REQUESTS_PER_DAY} new games per day. Voting on existing requests is unlimited.`,
    );
  }
}

export async function requestSteamGame(
  userId: string,
  appId: number,
): Promise<RequestResult> {
  if (!Number.isInteger(appId) || appId <= 0) {
    throw new BadRequestError("Invalid Steam app id");
  }
  const existing = await getGameBySteamAppId(appId);
  if (existing && existing.status !== "pending") {
    const voteCount =
      existing.status === "supported" || existing.status === "declined"
        ? existing.voteCount
        : await addVote(existing.id, userId);
    return {
      id: existing.id,
      title: existing.title,
      status: existing.status,
      created: false,
      voteCount,
    };
  }
  await enforceLimit(userId);
  const details = await fetchSteamAppDetails(appId);
  if (!details || details.type !== "game") {
    throw new BadRequestError("That Steam app isn't a game");
  }
  const id = await uniqueId(slugify(details.name), String(appId));
  await insertGame({
    id,
    title: details.name,
    status: "requested",
    steamAppId: appId,
    platforms: [steamPlatformEntry(appId, details.comingSoon)],
    imageUrl: details.imageUrl,
    releaseDate: details.releaseDate,
    requestedBy: userId,
  });
  const voteCount = await addVote(id, userId);
  // First sample right away so the new entry isn't empty until the next
  // collector run; best-effort.
  const [ccu, followers] = await Promise.all([
    fetchSteamCcu(appId),
    fetchSteamFollowers(appId),
  ]);
  const ccuSamples: Sample[] =
    ccu !== null ? [{ gameId: id, metric: "steam_ccu", value: ccu }] : [];
  const dailySamples: Sample[] =
    followers !== null
      ? [{ gameId: id, metric: "steam_followers", value: followers }]
      : [];
  await Promise.all([
    recordSamples(ccuSamples, { hourly: true }),
    recordSamples(dailySamples, { hourly: false }),
  ]).catch(() => undefined);
  return {
    id,
    title: details.name,
    status: "requested",
    created: true,
    voteCount,
  };
}

/** Not on Steam: title + official page, reviewed before it goes public. */
export async function requestOtherGame(
  userId: string,
  rawTitle: unknown,
  rawUrl: unknown,
): Promise<RequestResult> {
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (title.length < 2 || title.length > 80) {
    throw new BadRequestError("Title must be 2-80 characters");
  }
  if (!/^https:\/\/[^\s]+$/.test(url) || url.length > 300) {
    throw new BadRequestError("Please add the game's official https:// page");
  }
  await enforceLimit(userId);
  const id = await uniqueId(slugify(title), String(Date.now()).slice(-6));
  await insertGame({ id, title, status: "pending", url, requestedBy: userId });
  await addVote(id, userId);
  return { id, title, status: "pending", created: true, voteCount: 1 };
}
