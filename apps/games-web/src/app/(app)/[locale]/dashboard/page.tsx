import {
  games,
  getUpdateMessages,
  getSuggestionsAndIssues,
  hasReleasedCompanion,
  mergeUpdates,
  Game,
  DiscordMessageData,
  ChangelogEntry,
} from "@repo/lib";
import { HomePageClient } from "./home-client";

export default async function DashboardHome() {
  // Get recent updates from released companion games (excludes `inDevelopment` ones).
  const companionGames = games.filter(hasReleasedCompanion);

  const gameUpdates: Array<{
    game: Game;
    message: DiscordMessageData;
  }> = [];

  // Fetch updates, suggestions, and app changelog in parallel
  const [, suggestions, appUpdates] = await Promise.all([
    // Fetch updates for each game
    Promise.all(
      companionGames.slice(0, 6).map(async (game) => {
        const messages = await getUpdateMessages(game.discordId);
        if (messages.length > 0) {
          gameUpdates.push({ game, message: messages[0] });
        }
      }),
    ),
    // Fetch community suggestions
    getSuggestionsAndIssues(5),
    // Get app changelog from Discord API
    getUpdateMessages("thgl-companion-app"),
  ]);

  // Convert app updates to changelog entries
  const changelogEntries: ChangelogEntry[] = appUpdates
    .slice(0, 5)
    .map((msg) => {
      // Extract version from message (e.g., "**3.0.0**" or "# 3.0.0")
      const versionMatch = msg.text.match(
        /\*\*(\d+\.\d+\.\d+)\*\*|^#?\s*(\d+\.\d+\.\d+)/m,
      );
      const version = versionMatch?.[1] || versionMatch?.[2] || "";

      return {
        version,
        date: new Date(msg.timestamp).toISOString().split("T")[0],
        content: msg.text,
        timestamp: msg.timestamp,
      };
    });

  // Merge game updates and changelog into a single list
  const updates = mergeUpdates(gameUpdates, changelogEntries, 8);

  return <HomePageClient updates={updates} suggestions={suggestions} />;
}
