export function postToDiscord(
  content: string,
  webhook: string,
  username: string,
) {
  const payload = {
    content,
    username,
  };
  return fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export type DiscordMessageData = {
  text: string;
  images: string[];
  timestamp: number;
};

export async function getInfoMessages(appId: string) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/info/${appId}`,
      {
        // @ts-ignore
        next: { revalidate: 60 },
      },
    );
    const data = (await response.json()) as DiscordMessageData[];

    return data.reverse();
  } catch (e) {
    return [];
  }
}

export async function getUpdateMessages(appId: string) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/updates/${appId}`,
      {
        // @ts-ignore
        next: { revalidate: 60 },
      },
    );

    let data = (await response.json()) as DiscordMessageData[];

    data = data.map((message) => {
      const match = [...message.text.matchAll(/(?<!_)\*\*(?!_)/g)];
      const firstValid = match?.[0]?.index;

      if (typeof firstValid !== "number") {
        return message;
      }

      return {
        ...message,
        text: message.text.slice(firstValid),
      };
    });

    return data;
  } catch (e) {
    return [];
  }
}

export type ForumTagEmoji = {
  id?: string;
  name?: string;
  animated?: boolean;
  url?: string;
};

export type ForumTag = {
  id: string;
  name: string;
  moderated?: boolean;
  emoji?: ForumTagEmoji;
};

export type ForumPostReply = {
  id: string;
  content: string;
  images: string[];
  author: {
    username: string;
    avatar?: string;
  };
  createdAt: string;
};

export type ForumPost = {
  id: string;
  name: string;
  content: string;
  images: string[];
  createdAt: string;
  tags: ForumTag[];
  messageCount: number;
  recentReplies: ForumPostReply[];
  author: {
    username: string;
    avatar?: string;
  };
};

export type ForumPostDetail = ForumPost & {
  replies: ForumPostReply[];
  reactions: Record<string, number>;
};

type SuggestionsIssuesApiTag = {
  id: string;
  name: string;
  moderated: boolean;
  emoji?: {
    id: string | null;
    name: string | null;
    animated?: boolean;
    url: string | null;
  } | null;
};

type SuggestionsIssuesApiAuthor =
  | string
  | {
      username: string;
      avatar?: string | null;
      bot?: boolean;
    };

type SuggestionsIssuesApiReaction = {
  emoji: string | null | undefined;
  count: number;
};

type SuggestionsIssuesApiReply = {
  id: string;
  author: SuggestionsIssuesApiAuthor;
  text: string;
  timestamp: number;
  images: string[];
  reactions: SuggestionsIssuesApiReaction[];
};

type SuggestionsIssuesApiPost = {
  id: string;
  title: string;
  author: SuggestionsIssuesApiAuthor;
  createdAt: number;
  tags: SuggestionsIssuesApiTag[];
  archived: boolean;
  locked: boolean;
  messageCount: number;
  memberCount: number;
  content: {
    text: string;
    images: string[];
    reactions?: SuggestionsIssuesApiReaction[];
  };
  replies?: SuggestionsIssuesApiReply[];
};

function normalizeAuthor(author: SuggestionsIssuesApiAuthor) {
  if (typeof author === "string") {
    return {
      username: author || "Unknown",
    };
  }

  return {
    username: author?.username || "Unknown",
    avatar: author?.avatar ?? undefined,
  };
}

function normalizeTag(tag: SuggestionsIssuesApiTag): ForumTag {
  return {
    id: tag.id,
    name: tag.name,
    moderated: tag.moderated,
    emoji: tag.emoji
      ? {
          id: tag.emoji.id ?? undefined,
          name: tag.emoji.name ?? undefined,
          animated: tag.emoji.animated ?? false,
          url: tag.emoji.url ?? undefined,
        }
      : undefined,
  };
}

function normalizeReply(reply: SuggestionsIssuesApiReply): ForumPostReply {
  return {
    id: reply.id,
    content: reply.text,
    images: reply.images ?? [],
    author: normalizeAuthor(reply.author),
    createdAt: new Date(reply.timestamp).toISOString(),
  };
}

function normalizePost(
  post: SuggestionsIssuesApiPost,
  recentReplies: ForumPostReply[] = [],
): ForumPost {
  return {
    id: post.id,
    name: post.title,
    content: post.content?.text ?? "",
    images: post.content?.images ?? [],
    createdAt: new Date(post.createdAt).toISOString(),
    tags: (post.tags ?? []).map(normalizeTag),
    messageCount: post.messageCount ?? 0,
    recentReplies,
    author: normalizeAuthor(post.author),
  };
}

function reactionsArrayToRecord(
  reactions: SuggestionsIssuesApiReaction[] | undefined,
) {
  if (!reactions) {
    return {};
  }

  return reactions.reduce<Record<string, number>>((acc, reaction) => {
    const emoji = reaction.emoji ?? "unknown";
    acc[emoji] = (acc[emoji] ?? 0) + reaction.count;
    return acc;
  }, {});
}

export async function getSuggestionsAndIssues(limit?: number) {
  try {
    const url = new URL("https://discord-bot.th.gl/api/suggestions-issues");
    if (limit) {
      url.searchParams.set("limit", limit.toString());
    }

    const response = await fetch(url.toString(), {
      // @ts-ignore
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch suggestions summary: ${response.status}`,
      );
    }

    const data = (await response.json()) as SuggestionsIssuesApiPost[];
    return data.map((post) => normalizePost(post));
  } catch (e) {
    console.error("Failed to fetch suggestions and issues:", e);
    return [];
  }
}

export async function getSuggestionOrIssueDetail(postId: string) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/suggestions-issues/${postId}`,
      {
        // @ts-ignore
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SuggestionsIssuesApiPost;
    const replies = (data.replies ?? []).map(normalizeReply);
    const recentReplies = replies.slice(-3);

    return {
      ...normalizePost(data, recentReplies),
      replies,
      reactions: reactionsArrayToRecord(data.content?.reactions),
    } satisfies ForumPostDetail;
  } catch (e) {
    console.error(`Failed to fetch post ${postId}:`, e);
    return null;
  }
}
