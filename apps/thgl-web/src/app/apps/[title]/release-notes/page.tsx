import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import DiscordMessage from "@/components/discord-message";
import PreviewImage from "@/components/preview-image";
import { Subtitle } from "@/components/subtitle";
import { apps } from "@/lib/apps";
import { getUpdateMessages } from "@/lib/discord";

type Params = Promise<{ title: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const app = apps.find((a) => a.title === decodedTitle);
  if (!app) {
    notFound();
  }

  return {
    title: `Release Notes - ${app.title} - The Hidden Gaming Lair`,
    alternates: {
      canonical: `/apps/${title}/release-notes`,
    },
  };
}

export default async function AppDescription({
  params,
}: {
  params: Params;
}): Promise<JSX.Element> {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const app = apps.find((a) => a.title === decodedTitle);
  if (!app) {
    notFound();
  }
  const updateMessages = await getUpdateMessages(app);

  return (
    <section className="bg-zinc-600/20 p-4 space-y-4">
      <Subtitle>Release Notes</Subtitle>
      {updateMessages.length === 0 && (
        <p className="text-left text-zinc-200 text-sm">
          No release notes available.
        </p>
      )}
      {updateMessages.map((updateMessage) => (
        <Fragment key={updateMessage.timestamp}>
          <Subtitle order={3}>
            {new Date(updateMessage.timestamp).toDateString()}
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
        </Fragment>
      ))}
    </section>
  );
}
