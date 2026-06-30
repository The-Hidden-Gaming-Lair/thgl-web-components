"use client";

import { ChangelogEntry, UpdateItem } from "@repo/lib";
import { Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "../(controls)";
import { DiscordMessage } from "./discord-message";

export type { UpdateItem };

// Render inline markdown (bold, italic, code)
function renderInlineMarkdown(text: string): React.ReactNode {
  // Split by **bold**, *italic*, and `code` patterns
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function ChangelogContent({ content }: { content: string }) {
  // Split content by code blocks (```...```)
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-sm text-muted-foreground">
      {parts.map((part, partIndex) => {
        // Handle code blocks
        if (part.startsWith("```") && part.endsWith("```")) {
          const codeContent = part.slice(3, -3).replace(/^\w*\n/, ""); // Remove language hint
          return (
            <pre
              key={partIndex}
              className="my-2 p-2 bg-muted rounded text-xs overflow-x-auto"
            >
              {codeContent}
            </pre>
          );
        }

        // Handle regular content line by line
        return part.split("\n").map((line, i) => {
          const trimmed = line.trim();
          const key = `${partIndex}-${i}`;
          if (trimmed.startsWith("- ")) {
            return (
              <p key={key} className="my-1 flex gap-2">
                <span className="text-muted-foreground/60">•</span>
                <span>{renderInlineMarkdown(trimmed.slice(2))}</span>
              </p>
            );
          }
          if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
            return (
              <p
                key={key}
                className="font-semibold text-foreground text-base mt-3 mb-1"
              >
                {renderInlineMarkdown(trimmed.slice(2))}
              </p>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <p key={key} className="font-medium text-foreground mt-3 mb-1">
                {renderInlineMarkdown(trimmed.slice(3))}
              </p>
            );
          }
          if (trimmed) {
            return (
              <p key={key} className="my-1">
                {renderInlineMarkdown(trimmed)}
              </p>
            );
          }
          return null;
        });
      })}
    </div>
  );
}

type WhatsNewProps = {
  updates: UpdateItem[];
  /** Base path for game links, defaults to "/dashboard/games" for thgl-app */
  gameBasePath?: string;
  /** Path for changelog/app update links, defaults to "/companion-app#updates" */
  changelogPath?: string;
  /** Whether to show game update links */
  showGameLinks?: boolean;
  /** Whether to show changelog links */
  showChangelogLinks?: boolean;
  /** Whether to show the section header */
  showHeader?: boolean;
  /** Custom class for the container */
  className?: string;
  /** HTML id attribute for the container */
  id?: string;
};

export function WhatsNew({
  updates,
  gameBasePath = "/dashboard/games",
  changelogPath = "/companion-app#updates",
  showGameLinks = true,
  showChangelogLinks = true,
  showHeader = true,
  className,
  id,
}: WhatsNewProps) {
  if (updates.length === 0) {
    return (
      <div id={id} className={className}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">What&apos;s New</h2>
          </div>
        )}
        <p className="text-muted-foreground text-sm">
          No recent updates available.
        </p>
      </div>
    );
  }

  return (
    <div id={id} className={className}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">What&apos;s New</h2>
        </div>
      )}
      <div className="space-y-4">
        {updates.map((update) =>
          update.type === "game" ? (
            <Card key={`game-${update.game.id}-${update.timestamp}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={update.game.logo}
                      unoptimized
                      alt={update.game.title}
                      width={20}
                      height={20}
                      className="rounded"
                    />
                    <span className="font-medium">{update.game.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(update.message.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <DiscordMessage className="text-sm text-muted-foreground line-clamp-3">
                  {update.message.text}
                </DiscordMessage>
                {showGameLinks && (
                  <Link
                    href={`${gameBasePath}/${update.game.id}#${new Date(update.message.timestamp).toDateString().toLowerCase().replace(/\s+/g, "-")}`}
                    prefetch={false}
                    className="text-xs text-primary hover:underline inline-block"
                  >
                    Read more about {update.game.title}
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card key={`changelog-${update.version || update.timestamp}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src="https://www.th.gl/global_icons/thgl.png"
                      unoptimized
                      alt="THGL"
                      width={16}
                      height={16}
                      className="rounded"
                    />
                    <span className="font-medium">
                      {update.version ? `App v${update.version}` : "App Update"}
                    </span>
                  </div>
                  {update.date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <ChangelogContent content={update.content} />
                {showChangelogLinks && changelogPath && (
                  <Link
                    href={changelogPath}
                    className="text-xs text-primary hover:underline inline-block"
                  >
                    View all updates
                  </Link>
                )}
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}

/** Changelog-only display for pages that don't need game updates */
export function ChangelogList({
  entries,
  showHeader = true,
  className,
}: {
  entries: ChangelogEntry[];
  showHeader?: boolean;
  className?: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <Image
            src="https://www.th.gl/global_icons/thgl.png"
            unoptimized
            alt="THGL"
            width={20}
            height={20}
            className="rounded"
          />
          <h2 className="text-lg font-semibold">Recent Updates</h2>
        </div>
      )}
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.version || entry.timestamp}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="https://www.th.gl/global_icons/thgl.png"
                    unoptimized
                    alt="THGL"
                    width={16}
                    height={16}
                    className="rounded"
                  />
                  <span className="font-medium">
                    {entry.version ? `v${entry.version}` : "Update"}
                  </span>
                </div>
                {entry.date && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ChangelogContent content={entry.content} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
