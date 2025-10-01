"use client";

import Link from "next/link";
import { ForumPost, ForumPostDetail, ForumTag } from "@repo/lib";
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
      <p className={`whitespace-pre-wrap break-words ${className}`.trim()} />
    );
  }

  const parts = text.split(urlSplitRegex);

  return (
    <p className={`whitespace-pre-wrap break-words ${className}`.trim()}>
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

export function SuggestionsIssuesList({
  posts,
  initialLimit = 10,
}: {
  posts: ForumPost[];
  initialLimit?: number;
}) {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const allTags = useMemo(() => {
    const unique = new Map<string, ForumTag>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (!unique.has(tag.id)) {
          unique.set(tag.id, tag);
        }
      });
    });
    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesTags =
        selectedTagIds.length === 0 ||
        post.tags.some((tag) => selectedTagIds.includes(tag.id));

      if (!matchesTags) {
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
  }, [posts, searchQuery, selectedTagIds]);

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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const hasTag = prev.includes(tagId);
      const next = hasTag
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];

      return next;
    });
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const clearFilters = () => {
    setSelectedTagIds([]);
    setSearchQuery("");
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchQuery(event.target.value);
    setDisplayLimit(initialLimit);
    setExpandedPosts(new Set());
  };

  const visiblePosts = filteredPosts.slice(0, displayLimit);
  const hasMore = filteredPosts.length > displayLimit;

  const hasActiveFilters =
    selectedTagIds.length > 0 || searchQuery.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title or first message"
            aria-label="Search suggestions and issues"
            className="w-full rounded-md border border-muted-foreground/30 bg-background px-3 py-2 text-sm shadow-sm outline-none ring-brand/20 focus:border-brand focus:ring-2"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-brand/60 bg-brand/10 text-brand"
                      : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <TagBadgeContent tag={tag} />
                </button>
              );
            })}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {filteredPosts.length} of {posts.length} posts
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-brand hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {visiblePosts.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 py-12 text-center text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <p>No posts match the current filters yet.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-brand hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <p>No suggestions or issues found.</p>
          )}
        </div>
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg text-left">
              <Link
                href={`/suggestions-issues/${post.id}`}
                className="hover:underline focus-visible:underline"
              >
                {post.name}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="flex items-center gap-2 text-xs">
                <User className="h-3 w-3" />
                {post.author.username}
                <span className="text-muted-foreground">|</span>
                {new Date(post.createdAt).toLocaleDateString()}
                <span className="text-muted-foreground">|</span>
                <MessageSquare className="h-3 w-3" />
                {post.messageCount} replies
              </span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            type="button"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

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






