import ExternalLink from "@/components/external-link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DiscordMessage({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <Markdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={{
        a(props) {
          return (
            <ExternalLink href={props.href ?? "#"}>
              {props.children}
            </ExternalLink>
          );
        },
        ul(props) {
          return <ul className="list-disc list-inside" {...props} />;
        },
      }}
    >
      {children}
    </Markdown>
  );
}
