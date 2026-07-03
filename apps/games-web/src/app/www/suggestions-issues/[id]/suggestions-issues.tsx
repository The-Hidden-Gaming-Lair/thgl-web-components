"use client";

import Link from "next/link";
import {
  ForumPost,
  ForumPostCategory,
  ForumPostDetail,
  ForumTag,
  games as allGames,
} from "@repo/lib";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/controls";
import { ExternalAnchor } from "@repo/ui/header";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  User,
} from "lucide-react";
import { PreviewImage } from "@repo/ui/content";

const urlSplitRegex = /(https?:\/\/[^\s]+)/g;
const urlExactRegex = /^https?:\/\/[^\s]+$/i;

function ContentWithLinks({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) {
    return (
      <p
        className={`whitespace-pre-wrap wrap-break-word ${className}`.trim()}
      />
    );
  }

  const parts = text.split(urlSplitRegex);

  return (
    <p className={`whitespace-pre-wrap wrap-break-word ${className}`.trim()}>
      {parts.map((part, index) => {
        if (urlExactRegex.test(part)) {
          const label = part.replace(/^https?:\/\//i, "");
          return (
            <ExternalAnchor
              key={`${part}-${index}`}
              href={part}
              title={part}
              className="inline-flex max-w-[18rem] min-w-0 items-center gap-1 text-primary hover:underline"
            >
              <span className="truncate max-w-full">{label}</span>
              <ExternalLink className="h-3 w-3" />
            </ExternalAnchor>
          );
        }

        return <span key={`text-${index}`}>{part}</span>;
      })}
    </p>
  );
}

function TagBadgeContent({ tag }: { tag: ForumTag }) {
  const hasEmojiImage = Boolean(tag.emoji?.url);
  const hasEmojiName = tag.emoji?.name && !hasEmojiImage;

  return (
    <span className="flex items-center gap-1">
      {hasEmojiImage ? (
        <img
          src={tag.emoji?.url ?? undefined}
          alt={tag.emoji?.name ?? `${tag.name} emoji`}
          className="h-3 w-3"
        />
      ) : null}
      {hasEmojiName ? <span aria-hidden="true">{tag.emoji?.name}</span> : null}
      <span>{tag.name}</span>
    </span>
  );
}

const ALL_GAMES_VALUE = "__all__";
const CODING_VALUE = "__coding__";

const CATEGORY_OPTIONS: { value: ForumPostCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "question", label: "Question" },
];

function prettifySlug(slug: string) {
  return slug
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function gameLabelForSlug(slug: string) {
  const game = allGames.find((game) => game.discordId === slug);
  return game?.title ?? prettifySlug(slug);
}

export function SuggestionsIssuesList({
  posts,
  initialLimit = 10,
}: {
  posts: ForumPost[];
  initialLimit?: number;
}) {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [selectedGame, setSelectedGame] = useState(ALL_GAMES_VALUE);
  const [selectedCategories, setSelectedCategories] = useState<
    ForumPostCategory[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  const gameOptions = useMemo(() => {
    const slugs = new Set<string>();
    posts.forEach((post) => {
      post.games.forEach((slug) => {
        slugs.add(slug);
      });
    });
    return Array.from(slugs)
      .map((slug) => ({ value: slug, label: gameLabelForSlug(slug) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesGame =
        selectedGame === ALL_GAMES_VALUE ||
        (selectedGame === CODING_VALUE
          ? post.tags.some((tag) => tag.name === "Coding")
          : post.games.includes(selectedGame));

      if (!matchesGame) {
        return false;
      }

      const matchesCategory =
        selectedCategories.length === 0 ||
        (post.category !== null && selectedCategories.includes(post.category));

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        (post.name?.toLowerCase() ?? "").includes(normalizedQuery) ||
        (post.content?.toLowerCase() ?? "").includes(normalizedQuery)
      );
    });
  }, [posts, searchQuery, selectedGame, selectedCategories]);

  const toggleExpanded = (postId: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleGameChange = (value: string) => {
    setSelectedGame(value);
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const toggleCategory = (category: ForumPostCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((value) => value !== category)
        : [...prev, category],
    );
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const clearFilters = () => {
    setSelectedGame(ALL_GAMES_VALUE);
    setSelectedCategories([]);
    setSearchQuery("");
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const visiblePosts = filteredPosts.slice(0, displayLimit);
  const hasMore = filteredPosts.length > displayLimit;

  const hasActiveFilters =
    selectedGame !== ALL_GAMES_VALUE ||
    selectedCategories.length > 0 ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="space-y-4">
        <input
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search suggestions and issues..."
          aria-label="Search suggestions and issues"
          className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm shadow-xs outline-hidden ring-primary/20 focus:border-primary focus:ring-2"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedGame} onValueChange={handleGameChange}>
              <SelectTrigger className="w-56" aria-label="Filter by game">
                <SelectValue placeholder="All games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GAMES_VALUE}>All games</SelectItem>
                {gameOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                <SelectItem value={CODING_VALUE}>Coding</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = selectedCategories.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleCategory(option.value)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        )}
      </div>

      {visiblePosts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            {hasActiveFilters ? (
              <>
                <p className="text-muted-foreground mb-4">
                  No posts match the current filters.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                No suggestions or issues found.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {visiblePosts.map((post) => (
        <SuggestionIssueCard
          key={post.id}
          post={post}
          isExpanded={expandedPosts.has(post.id)}
          onToggle={() => toggleExpanded(post.id)}
        />
      ))}

      {hasMore && (
        <Button
          variant="outline"
          onClick={() => setDisplayLimit((prev) => prev + 10)}
          className="w-full"
        >
          Show More ({filteredPosts.length - displayLimit} remaining)
        </Button>
      )}
    </div>
  );
}

function SuggestionIssueCard({
  post,
  isExpanded,
  onToggle,
}: {
  post: ForumPost;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const contentId = `suggestion-${post.id}-content`;

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-xl text-left">
              <Link
                href={`/suggestions-issues/${post.id}`}
                className="hover:text-primary transition-colors"
              >
                {post.name}
              </Link>
            </CardTitle>
            <CardDescription>
              <span className="flex items-center gap-2 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.author.username}
                </span>
                <span className="text-border">•</span>
                <span>
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {post.messageCount}{" "}
                  {post.messageCount === 1 ? "reply" : "replies"}
                </span>
              </span>
            </CardDescription>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    <TagBadgeContent tag={tag} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            type="button"
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent id={contentId} className="text-left">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ContentWithLinks text={post.content} className="text-sm" />
          </div>

          {post.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {post.images.map((image) => (
                <PreviewImage
                  key={image}
                  src={image}
                  alt={`Attachment for ${post.name}`}
                />
              ))}
            </div>
          )}

          {post.recentReplies.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Recent Replies:</h4>
              {post.recentReplies.map((reply) => (
                <div key={reply.id} className="pl-4 border-l-2 border-muted">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {reply.author.username}
                    <span>|</span>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </div>
                  <ContentWithLinks
                    text={reply.content}
                    className="text-sm mt-1 text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function SuggestionIssueDetail({ post }: { post: ForumPostDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-left">{post.name}</CardTitle>
        <CardDescription>
          <span className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            {post.author.username}
            <span className="text-muted-foreground">|</span>
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </CardDescription>

        {post.tags.length > 0 && (
          <div className="flex gap-2 mt-2">
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                <TagBadgeContent tag={tag} />
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 text-left">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ContentWithLinks text={post.content} />
        </div>

        {post.images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {post.images.map((image) => (
              <PreviewImage
                key={image}
                src={image}
                alt={`Attachment for ${post.name}`}
              />
            ))}
          </div>
        )}

        {Object.keys(post.reactions).length > 0 && (
          <div className="flex gap-2">
            {Object.entries(post.reactions).map(([emoji, count]) => (
              <Badge key={emoji} variant="outline">
                {emoji} {count}
              </Badge>
            ))}
          </div>
        )}

        {post.replies.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Replies ({post.replies.length})</h3>
            {post.replies.map((reply) => (
              <div key={reply.id} className="pl-4 border-l-2 border-muted">
                <div className="flex items-center gap-2 mb-2">
                  {reply.author.avatar ? (
                    <img
                      src={reply.author.avatar}
                      alt={reply.author.username}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="font-medium text-sm">
                    {reply.author.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <ContentWithLinks
                  text={reply.content}
                  className="text-sm text-muted-foreground"
                />
                {reply.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reply.images.map((image) => (
                      <PreviewImage
                        key={image}
                        src={image}
                        alt={`Attachment from ${reply.author.username}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
