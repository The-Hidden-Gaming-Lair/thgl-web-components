import { cookies, headers } from "next/headers";
import { API_FORGE_URL } from "@repo/lib";
import {
  BadRequestError,
  corsPreflight,
  ForbiddenError,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { countRecentComments, getGame, insertComment } from "@/lib/stats-db";
import { VOTABLE_STATUSES } from "@/lib/stats-types";

/**
 * Comment on a requested game (signed-in users): what the map or app
 * should cover, useful links. Stored here and mirrored into the game's
 * #game-requests thread by the Discord bot on its next sync.
 */

const MAX_COMMENTS_PER_DAY = 20;
const MIN_LENGTH = 3;
const MAX_LENGTH = 1000;

/** Display name + avatar from the api-forge profile (same as the account page). */
async function getProfile(): Promise<{ name: string; avatar: string | null }> {
  const raw =
    (await cookies()).get("userId")?.value ??
    (await headers()).get("x-user-id");
  const fallback = { name: "TH.GL user", avatar: null };
  if (!raw) return fallback;
  try {
    const res = await fetch(
      `${API_FORGE_URL}/users?userId=${encodeURIComponent(raw)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return fallback;
    const profile = (await res.json()) as {
      username?: string | null;
      generatedUsername?: string | null;
      avatarUrl?: string | null;
    };
    return {
      name: profile.username || profile.generatedUsername || fallback.name,
      avatar: profile.avatarUrl ?? null,
    };
  } catch {
    return fallback;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();
    const game = await getGame(id);
    if (!game || !VOTABLE_STATUSES.includes(game.status)) {
      throw new NotFoundError("Game not found");
    }
    const body = (await request.json().catch(() => null)) as {
      body?: unknown;
    } | null;
    const text =
      typeof body?.body === "string"
        ? body.body
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
        : "";
    if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
      throw new BadRequestError(
        `Comments need ${MIN_LENGTH}-${MAX_LENGTH} characters`,
      );
    }
    if ((await countRecentComments(userId, 86400)) >= MAX_COMMENTS_PER_DAY) {
      throw new ForbiddenError(
        `You can write up to ${MAX_COMMENTS_PER_DAY} comments per day.`,
      );
    }
    const profile = await getProfile();
    const comment = await insertComment({
      gameId: id,
      userId,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      body: text,
    });
    return jsonResponse(comment);
  });
}

export function OPTIONS() {
  return corsPreflight();
}
