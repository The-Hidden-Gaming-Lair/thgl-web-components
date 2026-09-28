"use client";

import type { ReactNode } from "react";
import { ExternalLink, User } from "lucide-react";
import { PreviewImage } from "@repo/ui/content";
import { ExternalAnchor } from "@repo/ui/header";

/**
 * Discord-forum style reply, shared by /suggestions-issues and the game
 * discussions on /stats/<id> (both render replies read through the bot).
 */

const urlSplitRegex = /(https?:\/\/[^\s]+)/g;
const urlExactRegex = /^https?:\/\/[^\s]+$/i;

export function ContentWithLinks({
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

export function ForumReply({
  authorName,
  authorAvatar,
  createdAt,
  text,
  images,
  badge,
}: {
  authorName: string;
  authorAvatar?: string | null;
  /** ISO string or epoch milliseconds. */
  createdAt: string | number;
  text: string;
  images: string[];
  /** Small label after the name, e.g. "Discord" / "th.gl". */
  badge?: ReactNode;
}) {
  return (
    <div className="pl-4 border-l-2 border-muted">
      <div className="flex items-center gap-2 mb-2">
        {authorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="font-medium text-sm">{authorName}</span>
        {badge}
        <span
          className="text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>
      <ContentWithLinks text={text} className="text-sm text-muted-foreground" />
      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((image) => (
            <PreviewImage
              key={image}
              src={image}
              alt={`Attachment from ${authorName}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
