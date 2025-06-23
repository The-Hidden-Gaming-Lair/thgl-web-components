import { DiscordMessageData } from "@repo/lib";
import Link from "next/link";
import { Subtitle } from "@/components/subtitle";
import { DiscordMessage, PreviewImage } from "@repo/ui/content";

function formatAnchorId(dateStr: string) {
  return dateStr.toLowerCase().replace(/\s+/g, "-"); // "MON OCT 21 2024" → "mon-oct-21-2024"
}

export function ReleaseNotes({
  updateMessages,
}: {
  updateMessages: DiscordMessageData[];
}) {
  if (!updateMessages.length)
    return (
      <p className="text-muted-foreground text-sm">
        No release notes available.
      </p>
    );

  return (
    <div className="space-y-8">
      {updateMessages.map((updateMessage) => {
        const dateFormatted = new Date(updateMessage.timestamp).toDateString();
        const anchorId = formatAnchorId(dateFormatted);
        return (
          <div
            key={updateMessage.timestamp}
            id={anchorId}
            className="scroll-mt-28 space-y-2"
          >
            <Subtitle order={3}>
              <Link href={`#${anchorId}`} className="hover:underline">
                {dateFormatted}
              </Link>
            </Subtitle>
            <DiscordMessage className="text-left space-y-4">
              {updateMessage.text}
            </DiscordMessage>
            {updateMessage.images.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {updateMessage.images.map((image) => (
                  <PreviewImage key={image} src={image} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
