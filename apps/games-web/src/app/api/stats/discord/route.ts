import {
  BadRequestError,
  ForbiddenError,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import {
  getGame,
  listGames,
  listDeletedMirroredComments,
  listMirroredComments,
  listUnpostedComments,
  markCommentPosted,
  markCommentUnmirrored,
  setDiscordVoters,
  updateGame,
} from "@/lib/stats-db";
import { requestSteamGame } from "@/lib/stats-requests";

/**
 * Bot API for the Discord #game-requests forum sync (thgl-discord-bot,
 * lib/game-requests.ts). Bearer STATS_BOT_SECRET. Discord users vote and
 * request as `discord:<snowflake>`.
 *
 * GET                                                every non-pending game
 * GET ?comments=unposted                             web comments to mirror
 * GET ?comments=mirrored                             mirrored ones (check they still exist)
 * GET ?comments=deleted                              deleted on th.gl, Discord copy to remove
 * POST {action:"thread", gameId, threadId}           remember the forum thread
 * POST {action:"votes", gameId, discordUserIds[]}    👍 reactors = Discord votes
 * POST {action:"request", steamAppId, discordUserId} /request slash command
 * POST {action:"comment-posted", commentId, messageId} web comment mirrored
 * POST {action:"comment-unmirrored", commentId, deleted} Discord copy gone
 *      (deleted: true = it was deleted in Discord, so hide it on th.gl too)
 */

const SNOWFLAKE = /^\d{15,21}$/;

function requireBot(request: Request) {
  const secret = process.env.STATS_BOT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new ForbiddenError();
  }
}

export async function GET(request: Request) {
  return handle(async () => {
    requireBot(request);
    const which = new URL(request.url).searchParams.get("comments");
    if (which === "unposted") {
      return jsonResponse({ comments: await listUnpostedComments() });
    }
    if (which === "mirrored") {
      return jsonResponse({ comments: await listMirroredComments() });
    }
    if (which === "deleted") {
      return jsonResponse({ comments: await listDeletedMirroredComments() });
    }
    const games = await listGames([
      "supported",
      "in_progress",
      "watching",
      "requested",
      "declined",
    ]);
    return jsonResponse({ games });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    requireBot(request);
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) throw new BadRequestError("Invalid JSON");

    if (body.action === "request") {
      const discordUserId = String(body.discordUserId ?? "");
      if (!SNOWFLAKE.test(discordUserId)) {
        throw new BadRequestError("Invalid discordUserId");
      }
      return jsonResponse(
        await requestSteamGame(
          `discord:${discordUserId}`,
          Number(body.steamAppId),
        ),
      );
    }

    if (body.action === "comment-posted") {
      const messageId = String(body.messageId ?? "");
      if (!SNOWFLAKE.test(messageId) || typeof body.commentId !== "string") {
        throw new BadRequestError("Invalid comment-posted payload");
      }
      await markCommentPosted(body.commentId, messageId);
      return jsonResponse({ ok: true });
    }

    if (body.action === "comment-unmirrored") {
      if (typeof body.commentId !== "string") {
        throw new BadRequestError("Invalid comment-unmirrored payload");
      }
      await markCommentUnmirrored(body.commentId, {
        deleted: body.deleted === true,
      });
      return jsonResponse({ ok: true });
    }

    const gameId = String(body.gameId ?? "");
    const game = await getGame(gameId);
    if (!game) throw new NotFoundError("Game not found");

    if (body.action === "thread") {
      const threadId =
        body.threadId === null ? null : String(body.threadId ?? "");
      if (threadId !== null && !SNOWFLAKE.test(threadId)) {
        throw new BadRequestError("Invalid threadId");
      }
      await updateGame(gameId, { discordThreadId: threadId });
      return jsonResponse({ ok: true });
    }

    if (body.action === "votes") {
      const ids = body.discordUserIds;
      if (
        !Array.isArray(ids) ||
        !ids.every((id) => SNOWFLAKE.test(String(id)))
      ) {
        throw new BadRequestError("Invalid discordUserIds");
      }
      const voteCount = await setDiscordVoters(gameId, ids.map(String));
      return jsonResponse({ voteCount });
    }

    throw new BadRequestError("Unknown action");
  });
}
