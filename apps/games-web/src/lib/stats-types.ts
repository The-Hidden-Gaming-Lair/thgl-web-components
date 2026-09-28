/**
 * Game stats: shared types for the collector (/api/stats/run), the
 * public pages (www.th.gl/stats, /requests) and their client components.
 *
 * Only Steam publishes real player counts. Every other client (Epic,
 * Microsoft/Game Pass, PlayStation, own launchers…) is listed with "no
 * public data" instead of an estimated total. Cross-platform interest
 * comes from Twitch and the official Discord server.
 */

export const STATS_STATUSES = [
  "supported",
  "in_progress",
  "watching",
  "requested",
  "pending",
  "declined",
] as const;
export type StatsStatus = (typeof STATS_STATUSES)[number];

/** Statuses shown publicly (pending = unreviewed non-Steam request). */
export const PUBLIC_STATUSES: StatsStatus[] = [
  "supported",
  "in_progress",
  "watching",
  "requested",
];

/** Statuses users can vote on. */
export const VOTABLE_STATUSES: StatsStatus[] = [
  "in_progress",
  "watching",
  "requested",
];

export const STATUS_LABELS: Record<StatsStatus, string> = {
  supported: "Supported",
  in_progress: "In progress",
  watching: "Watching",
  requested: "Requested",
  pending: "Pending review",
  declined: "Declined",
};

/** TH.GL Discord server; request threads live in its #game-requests forum. */
export const DISCORD_GUILD_ID = "320539672663031818";
export const GAME_REQUESTS_CHANNEL_ID = "1554083192846164008";
export const discordThreadUrl = (threadId: string) =>
  `https://discord.com/channels/${DISCORD_GUILD_ID}/${threadId}`;

export const PLATFORM_CLIENTS = [
  "steam",
  "epic",
  "gog",
  "microsoft",
  "xbox",
  "playstation",
  "switch",
  "battlenet",
  "ea",
  "ubisoft",
  "launcher",
  "ios",
  "android",
  "macos",
] as const;
export type PlatformClient = (typeof PLATFORM_CLIENTS)[number];

export const PLATFORM_LABELS: Record<PlatformClient, string> = {
  steam: "Steam",
  epic: "Epic Games Store",
  gog: "GOG",
  microsoft: "Microsoft Store / Game Pass",
  xbox: "Xbox",
  playstation: "PlayStation",
  switch: "Nintendo Switch",
  battlenet: "Battle.net",
  ea: "EA app",
  ubisoft: "Ubisoft Connect",
  launcher: "Official launcher",
  ios: "iOS",
  android: "Android",
  macos: "Mac App Store",
};

/** Clients that publish a real player count (the rest render "no public data"). */
export const CLIENTS_WITH_PUBLIC_PLAYERS: PlatformClient[] = ["steam"];

export type PlatformEntry = {
  client: PlatformClient;
  url?: string;
  status?: "released" | "early_access" | "upcoming";
};

export const METRICS = [
  "steam_ccu",
  "twitch_viewers",
  "twitch_channels",
  "discord_online",
  "discord_members",
  "steam_reviews",
  "steam_review_positive",
  "steam_followers",
] as const;
export type Metric = (typeof METRICS)[number];

export type StatsGame = {
  id: string;
  title: string;
  status: StatsStatus;
  thglId: string | null;
  steamAppId: number | null;
  platforms: PlatformEntry[];
  imageUrl: string | null;
  releaseDate: string | null;
  url: string | null;
  discordInvite: string | null;
  discordGuildId: string | null;
  /** Thread in the Discord #game-requests forum (bot-managed). */
  discordThreadId: string | null;
  twitchGameId: string | null;
  note: string | null;
  voteCount: number;
  createdAt: number;
  updatedAt: number;
};

/** A comment written on th.gl about a requested game. */
export type RequestComment = {
  id: string;
  gameId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: number;
  /** Set once the bot has mirrored it into the game's Discord thread. */
  discordMessageId: string | null;
};

/** One entry of a game's discussion (Discord thread reply or web comment). */
export type DiscussionEntry = {
  id: string;
  source: "discord" | "web";
  authorName: string;
  authorAvatar: string | null;
  bot: boolean;
  text: string;
  images: string[];
  createdAt: number;
};

/** Latest + windowed numbers for list views. null = no data. */
export type StatsSummary = {
  steamCcu: number | null;
  steamPeak24h: number | null;
  steamPeak30d: number | null;
  steamPeakAllTime: number | null;
  /** % change of the 7-day average vs the 7 days before; null when either is empty. */
  steamTrend7d: number | null;
  twitchViewers: number | null;
  twitchChannels: number | null;
  discordOnline: number | null;
  discordMembers: number | null;
  steamReviews: number | null;
  steamReviewPositive: number | null;
  steamFollowers: number | null;
  lastPatchAt: number | null;
};

export type StatsGameWithSummary = StatsGame & { summary: StatsSummary };

export type SeriesPoint = { t: number; max: number; avg: number };

export type StatsBuild = {
  branch: string;
  buildId: string;
  timeUpdated: number | null;
  seenAt: number;
};

export type StatsGameDetail = StatsGameWithSummary & {
  /** Hour buckets, last 7 days. */
  hourly: Partial<Record<Metric, SeriesPoint[]>>;
  /** Day buckets, all time. */
  daily: Partial<Record<Metric, SeriesPoint[]>>;
  builds: StatsBuild[];
};
