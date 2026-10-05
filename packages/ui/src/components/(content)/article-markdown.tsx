import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

/** A pre-resolved sprite crop for an inline entity link (absolute sheet URL). */
export type ArticleLinkIcon = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const ICON_SIZE = 20;

/**
 * Long-form article prose (written guides): real heading elements, readable inline
 * links and tables. Unlike `DiscordMessage` (chat-style, headings as divs, bold
 * truncated links) this is for a page's main content.
 *
 * `linkIcons` maps an internal href (`/db/<section>/<id>`) to its entry icon, shown
 * in front of the link text like a wiki item link. Hover cards for those links come
 * from `tooltips.js` (load it on the page) — they are plain codex links.
 */
export function ArticleMarkdown({
  children,
  linkIcons = {},
}: {
  children: string;
  linkIcons?: Record<string, ArticleLinkIcon>;
}) {
  return (
    <div className="space-y-4 text-base leading-relaxed">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl md:text-2xl font-bold border-b pb-2 mt-8 mb-3"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-lg md:text-xl font-semibold mt-6 mb-2"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-4 mb-2" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 space-y-1" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="border-b px-3 py-2 text-left font-semibold"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="border-b border-border/50 px-3 py-2" {...props} />
          ),
          a: ({ node, href = "#", children }) => {
            const icon = linkIcons[href];
            const className =
              "font-medium text-foreground underline decoration-primary/60 underline-offset-2 hover:decoration-primary whitespace-nowrap";
            if (!href.startsWith("/"))
              return (
                <a
                  href={href}
                  className={className}
                  target="_blank"
                  rel="noopener"
                >
                  {children}
                </a>
              );
            return (
              <Link href={href} className={className}>
                {icon && (
                  <img
                    src={icon.src}
                    alt=""
                    aria-hidden
                    width={icon.width}
                    height={icon.height}
                    className="inline-block object-none align-text-bottom mr-1 rounded-sm"
                    style={{
                      width: icon.width,
                      height: icon.height,
                      objectPosition: `-${icon.x}px -${icon.y}px`,
                      zoom: ICON_SIZE / (icon.width || 64),
                    }}
                  />
                )}
                {children}
              </Link>
            );
          },
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
