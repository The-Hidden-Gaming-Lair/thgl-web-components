import { Fragment } from "react";
import { notFound } from "next/navigation";
import DiscordMessage from "@/components/discord-message";
import PreviewImage from "@/components/preview-image";
import { Subtitle } from "@/components/subtitle";
import { apps } from "@/lib/apps";
import { getInfoMessages } from "@/lib/discord";

type Params = Promise<{ title: string }>;

export default async function AppDescription({ params }: { params: Params }) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const app = apps.find((app) => app.title === decodedTitle);
  if (!app) {
    notFound();
  }
  const infoMessages = await getInfoMessages(app);

  return (
    <section className="bg-zinc-600/20 p-4 space-y-4">
      <Subtitle>Description</Subtitle>
      {infoMessages.length === 0 && (
        <p className="text-left text-zinc-200 text-sm">
          No info message available.
        </p>
      )}
      {infoMessages.map((infoMessage) => (
        <Fragment key={infoMessage.timestamp}>
          <DiscordMessage className="text-left space-y-4">
            {infoMessage.text}
          </DiscordMessage>
          {infoMessage.images.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {infoMessage.images.map((image) => (
                <PreviewImage key={image} src={image} />
              ))}
            </div>
          )}
          <p className="text-left text-zinc-200 text-xs">
            Updated at {new Date(infoMessage.timestamp).toDateString()}
          </p>
        </Fragment>
      ))}
    </section>
  );
}
