"use client";

import {
  games,
  ForumPost,
  hasReleasedCompanion,
  localizePath,
} from "@repo/lib";
import { openInBrowser, useLiveState } from "@repo/lib/thgl-app";
import { useLocale, useT } from "@repo/ui/providers";
import { ScrollArea } from "@repo/ui/controls";
import { WhatsNew, UpdateItem } from "@repo/ui/content";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import { Circle, Lightbulb, MessageSquare, BookOpen } from "lucide-react";

const blogEntries = [
  {
    id: "ad-blockers-breaking-websites",
    title: "Why Ad Blockers Are Breaking TH.GL (And What You Should Know)",
    description:
      "Ad blockers like uBlock Origin and AdGuard aren't just blocking ads anymore — they're breaking core website features, destroying supporter accounts, and blocking privacy-friendly analytics.",
  },
  {
    id: "duet-night-abyss-launch",
    title: "Duet Night Abyss Support: Interactive Maps & Activity Tracker",
    description:
      "Explore Duet Night Abyss with detailed interactive maps for all major regions, plus a new activity tracker to manage your daily and weekly goals.",
  },
  {
    id: "web-code-now-public",
    title: "The Code Is Now Public — Here's Why",
    description:
      "After years of building TH.GL solo, the web components source code is now available on GitHub. Here's what's open, what's not, and how you can contribute.",
  },
];

export function HomePageClient({
  updates,
  suggestions,
}: {
  updates: UpdateItem[];
  suggestions: ForumPost[];
}) {
  const locale = useLocale();
  const t = useT();
  const runningGames = useLiveState((state) => state.runningGames);

  // Released companion games only — `inDevelopment` ones (e.g. Enshrouded) are hidden from the
  // app's game list + running-game detection until launch (direct /apps/<id> route still works).
  const companionGames = games.filter(hasReleasedCompanion);

  const isGameRunning = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game?.companion?.games) return false;

    const processNames = game.companion.games.flatMap((g) =>
      g.processNames.map((p) => p.toLowerCase()),
    );

    return runningGames?.some((rg) =>
      processNames.includes(rg.processName.toLowerCase()),
    );
  };

  const runningGamesList = companionGames.filter((g) => isGameRunning(g.id));

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 pb-20 space-y-6 max-w-4xl">
        {/* On This Page Navigation */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground">{t("home.onThisPage")}</span>
          <a href="#whats-new" className="hover:text-primary hover:underline">
            {t("home.whatsNew")}
          </a>
          <span className="text-muted-foreground">&bull;</span>
          <a href="#suggestions" className="hover:text-primary hover:underline">
            {t("home.suggestions")}
          </a>
          <span className="text-muted-foreground">&bull;</span>
          <a href="#blog" className="hover:text-primary hover:underline">
            {t("home.blog")}
          </a>
        </div>

        {/* Running Games */}
        {runningGamesList.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                {t("home.runningNow")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {runningGamesList.map((game) => (
                  <Link
                    key={game.id}
                    href={localizePath(`/dashboard/games/${game.id}`, locale)}
                    prefetch={false}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-2 py-1.5 px-3 hover:bg-primary/10 cursor-pointer"
                    >
                      <Image
                        src={game.logo}
                        unoptimized
                        alt={game.title}
                        width={16}
                        height={16}
                        className="rounded"
                      />
                      {game.title}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's New - Combined Updates */}
        <WhatsNew
          updates={updates}
          gameBasePath="/dashboard/games"
          showGameLinks={true}
          showChangelogLinks={false}
          showHeader={true}
          className="scroll-mt-6"
          id="whats-new"
        />

        {/* Community Suggestions */}
        {suggestions.length > 0 && (
          <div id="suggestions" className="space-y-3 scroll-mt-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {t("home.communitySuggestions")}
              </h2>
            </div>

            <div className="space-y-3">
              {suggestions.map((post) => (
                <Card
                  key={post.id}
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() =>
                    openInBrowser(
                      `https://www.th.gl/suggestions-issues/${post.id}`,
                    )
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            by {post.author.username}
                          </span>
                          {post.tags.length > 0 && (
                            <div className="flex gap-1">
                              {post.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-xs py-0"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{post.messageCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              {t.rich("home.discordJoin", {
                components: {
                  discord: (
                    <button
                      onClick={() => openInBrowser("https://th.gl/discord")}
                      className="text-primary hover:underline"
                    >
                      {t("home.discordServer")}
                    </button>
                  ),
                },
              })}
            </p>
          </div>
        )}

        {/* From the Blog */}
        <div id="blog" className="space-y-3 scroll-mt-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("home.fromTheBlog")}</h2>
          </div>

          <div className="space-y-3">
            {blogEntries.slice(0, 3).map((entry) => (
              <Card
                key={entry.id}
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() =>
                  openInBrowser(`https://www.th.gl/blog/${entry.id}`)
                }
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium hover:text-primary">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.description}
                    </p>
                    <span className="text-xs text-primary hover:underline">
                      {t("home.readMore")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
