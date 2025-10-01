"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@repo/lib";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { trackOutboundLinkClick } from "@repo/ui/header";
import { useLocale } from "../(providers)";

// Matches raw or escaped Discord timestamp tags like <t:1234567890:R>
const DISCORD_TIMESTAMP_REGEX =
  /&lt;t:(\d+):([a-zA-Z])&gt;|<t:(\d+):([a-zA-Z])>/g;

function renderDiscordTimestamp(
  unix: string,
  format: string,
  locale: string,
): string {
  const date = new Date(Number(unix) * 1000);

  if (format === "R") {
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const abs = Math.abs(diffSeconds);
    let unit: Intl.RelativeTimeFormatUnit = "second";
    let value = diffSeconds;

    if (abs >= 60 * 60 * 24) {
      unit = "day";
      value = Math.round(diffSeconds / (60 * 60 * 24));
    } else if (abs >= 60 * 60) {
      unit = "hour";
      value = Math.round(diffSeconds / (60 * 60));
    } else if (abs >= 60) {
      unit = "minute";
      value = Math.round(diffSeconds / 60);
    }

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(value, unit);
  }

  if (format === "F") {
    return date.toLocaleString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleString(locale);
}

function replaceTimestampsWithJSX(content: string, locale: string) {
  return content.replace(DISCORD_TIMESTAMP_REGEX, (_, u1, f1, u2, f2) => {
    const unix = u1 || u2;
    const format = f1 || f2;
    const rendered = renderDiscordTimestamp(unix, format, locale);
    return `<span class="discord-timestamp">${rendered}</span><br />`;
  });
}

export function DiscordMessage({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const locale = useLocale();
  const processed = replaceTimestampsWithJSX(children, locale);

  return (
    <div className={cn("space-y-4", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, ...props }) {
            return (
              <code
                {...props}
                className="select-text inline-block bg-muted text-muted-foreground rounded-md px-1 py-0.5 text-sm"
              />
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside [&_ul]:ml-4 [&_ul]:list-[circle]">
                {children}
              </ol>
            );
          },
          a({ node, ...props }) {
            const href = props.href ?? "#";
            const isExternalLink = href.startsWith("http");
            return (
              <Link
                className={cn(
                  "inline-flex items-center gap-1 font-bold text-sm text-secondary-foreground",
                  className,
                )}
                href={href}
                onClick={() => trackOutboundLinkClick(href)}
                target={isExternalLink ? "_blank" : undefined}
              >
                <span className="max-w-64 truncate">{props.children}</span>
                {isExternalLink && <ExternalLinkIcon className="w-3 h-3" />}
              </Link>
            );
          },
          h1({ node, ...props }) {
            return (
              <div
                className="text-2xl md:text-3xl font-bold w-full text-left border-b-2 pb-2 mt-4 mb-2"
                {...props}
              />
            );
          },
          h2({ node, ...props }) {
            return (
              <div
                className="text-xl md:text-2xl font-bold w-full text-left border-b pb-2 mt-4 mb-2"
                {...props}
              />
            );
          },
          h3({ node, ...props }) {
            return (
              <div
                className="text-lg md:text-xl font-semibold w-full text-left mt-3 mb-2"
                {...props}
              />
            );
          },
          h4({ node, ...props }) {
            return (
              <div
                className="text-base md:text-lg font-semibold w-full text-left mt-3 mb-2"
                {...props}
              />
            );
          },
          h5({ node, ...props }) {
            return (
              <div
                className="text-sm md:text-base font-semibold w-full text-left mt-2 mb-1"
                {...props}
              />
            );
          },
          h6({ node, ...props }) {
            return (
              <div
                className="text-sm font-semibold w-full text-left mt-2 mb-1"
                {...props}
              />
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc list-inside [&_ul]:ml-4 [&_ul]:list-[circle]">
                {children}
              </ul>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-2 italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          img({ src = "#", alt = "" }) {
            return (
              <span className="block my-6 space-y-2 text-center">
                <span className="block relative mx-auto aspect-video w-full max-w-3xl rounded overflow-hidden">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </span>
                {alt && (
                  <span className="block text-xs text-muted-foreground italic">
                    {alt}
                  </span>
                )}
              </span>
            );
          },
          p({ children, ...props }) {
            // Check if the only child is an img (span with block class)
            if (
              React.Children.count(children) === 1 &&
              React.isValidElement(children) &&
              children.props?.className?.includes("block my-6")
            ) {
              // Return the image directly without the p wrapper
              return <>{children}</>;
            }
            return <p {...props}>{children}</p>;
          },
          span({ node, className, children }) {
            if (className === "discord-timestamp") {
              return (
                <span className="font-mono text-primary bg-muted px-1 py-0.5 rounded text-sm">
                  {children}
                </span>
              );
            }
            return <span>{children}</span>;
          },
        }}
      >
        {processed}
      </Markdown>
    </div>
  );
}
