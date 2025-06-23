"use client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { cn } from "@repo/lib";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { trackOutboundLinkClick } from "@repo/ui/header";
import Image from "next/image";

export function DiscordMessage({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ node, ...props }) {
            return <div className="whitespace-break-spaces" {...props} />;
          },
          code({ node, ...props }) {
            return (
              <code
                className="select-text bg-muted text-muted-foreground rounded-md px-1 py-0.5 text-sm"
                {...props}
              />
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
                onClick={() => {
                  trackOutboundLinkClick(href);
                }}
                target={isExternalLink ? "_blank" : undefined}
              >
                <span className="max-w-64 truncate">{props.children}</span>
                {isExternalLink && <ExternalLinkIcon className="w-3 h-3" />}
              </Link>
            );
          },
          h3({ node, ...props }) {
            return (
              <h3
                className="text-lg md:text-xl w-full text-left border-b-2 pb-2"
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
          img({ src = "#", alt = "" }) {
            return (
              <div className="my-6 space-y-2 text-center">
                <div className="relative mx-auto aspect-video w-full max-w-3xl rounded overflow-hidden">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
                {alt && (
                  <p className="text-xs text-muted-foreground italic">{alt}</p>
                )}
              </div>
            );
          },
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
