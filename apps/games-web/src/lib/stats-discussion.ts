import { listComments } from "@/lib/stats-db";
import { type DiscussionEntry, type StatsGame } from "@/lib/stats-types";

/**
 * A requested game's discussion = its #game-requests thread replies (read
 * through the Discord bot, like /suggestions-issues) + comments written on
 * th.gl. Web comments the bot already mirrored into the thread are shown
 * once, as the web comment.
 */

const BOT_API = "https://discord-bot.th.gl/api/game-requests";

type BotReply = {
  id: string;
  author: { username: string; avatar?: string; bot?: boolean };
  text: string;
  timestamp: number;
  images?: string[];
};

async function fetchThreadReplies(threadId: string): Promise<BotReply[]> {
  try {
    const res = await fetch(`${BOT_API}/${threadId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { replies?: BotReply[] };
    return data.replies ?? [];
  } catch {
    return [];
  }
}

export async function getDiscussion(
  game: Pick<StatsGame, "id" | "discordThreadId">,
): Promise<DiscussionEntry[]> {
  const [comments, replies] = await Promise.all([
    listComments(game.id).catch(() => []),
    game.discordThreadId
      ? fetchThreadReplies(game.discordThreadId)
      : Promise.resolve([]),
  ]);
  const mirrored = new Set(
    comments.map((c) => c.discordMessageId).filter(Boolean),
  );
  const entries: DiscussionEntry[] = [
    ...comments.map(
      (c): DiscussionEntry => ({
        id: c.id,
        source: "web",
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        bot: false,
        text: c.body,
        images: [],
        createdAt: c.createdAt,
      }),
    ),
    ...replies
      .filter((r) => !mirrored.has(r.id))
      .map(
        (r): DiscussionEntry => ({
          id: r.id,
          source: "discord",
          authorName: r.author.username,
          authorAvatar: r.author.avatar ?? null,
          bot: Boolean(r.author.bot),
          text: r.text,
          images: r.images ?? [],
          createdAt: Math.floor(r.timestamp / 1000),
        }),
      ),
  ];
  return entries.sort((a, b) => a.createdAt - b.createdAt);
}
