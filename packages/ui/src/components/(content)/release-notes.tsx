import { DiscordMessageData } from "@repo/lib";
import { DiscordMessage } from "./discord-message";
import { PreviewImage } from "./preview-image";
import { Subtitle } from "./subtitle";
import Link from "next/link";
import Image from "next/image";

export function ReleaseNotes({
  updateMessages,
}: {
  updateMessages: DiscordMessageData[];
}) {
  return (
    <>
      <Subtitle title="Website Updates" />

      {updateMessages.length === 0 && (
        <p className="text-left text-zinc-200 text-sm">
          No release notes available.
        </p>
      )}
      {updateMessages.map((updateMessage) => (
        <article key={updateMessage.timestamp}>
          <h3 className={`text-brand text-xl uppercase from text-shadow`}>
            {new Date(updateMessage.timestamp).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <DiscordMessage className="text-left">
            {updateMessage.text}
          </DiscordMessage>
          {updateMessage.images.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {updateMessage.images.map((image) => (
                <PreviewImage key={image} src={image} />
              ))}
            </div>
          )}
        </article>
      ))}
      <p className="mt-4">
        Looking for more updates? Check out our{" "}
        <Link
          href="https://th.gl/discord"
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm underline text-muted-foreground hover:text-white"
        >
          Discord Server
        </Link>{" "}
        for the most recent changes!
      </p>
    </>
  );
}
