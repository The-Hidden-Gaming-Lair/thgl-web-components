"use client";

import { DiscordMessageData } from "@repo/lib";
import { DiscordMessage } from "./discord-message";
import { PreviewImage } from "./preview-image";
import { Subtitle } from "./subtitle";
import Link from "next/link";
import { useLocale, useT } from "../(providers)";

export function ReleaseNotes({
  updateMessages,
}: {
  updateMessages: DiscordMessageData[];
}) {
  const locale = useLocale();
  const t = useT();

  return (
    <>
      <Subtitle title={t("release.title")} />

      {locale !== "en" && (
        <p className="text-muted-foreground text-sm italic mb-2">
          {t("release.translationNote")}
        </p>
      )}

      {updateMessages.length === 0 && (
        <p className="text-left text-zinc-200 text-sm">{t("release.none")}</p>
      )}

      {updateMessages.map((updateMessage) => (
        <article key={updateMessage.timestamp} className="space-y-4">
          <h3 className="text-brand text-xl uppercase text-shadow">
            {new Date(updateMessage.timestamp).toLocaleDateString(locale, {
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
        {t.rich("release.moreWithLink", {
          components: {
            discord: (
              <Link
                href="https://th.gl/discord"
                rel="noopener noreferrer"
                target="_blank"
                className="text-sm underline text-muted-foreground hover:text-white"
              >
                {t("release.discordLink")}
              </Link>
            ),
          },
        })}
      </p>
    </>
  );
}
