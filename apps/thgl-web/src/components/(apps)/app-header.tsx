import Image from "next/image";
import { type App } from "@/lib/apps";
import DownloadLink from "../download-link";
import ExternalLink from "../external-link";

export default function AppHeader({ app }: { app: App }) {
  return (
    <section className="text-left p-3 flex gap-4 flex-wrap justify-center">
      <Image
        src={app.tileSrc}
        alt=""
        width={258}
        height={198}
        draggable={false}
        className="rounded-lg"
      />
      <div className="grow flex flex-col gap-1 p-2">
        <h2 className="text-2xl">{app.title}</h2>
        <p>
          {app.game ? (
            <span className="text-bold text-sm">{app.game.title} – </span>
          ) : null}
          <span className="text-zinc-300 text-sm">
            Made by {app.author.name}
          </span>
          {app.isPartnerApp ? (
            <span className="text-xs uppercase bg-[#16727a] px-2 py-1 rounded-xl ml-2">
              Partner App
            </span>
          ) : null}
        </p>
        <p className="grow text-zinc-200">{app.description}</p>
      </div>
      <div className="flex flex-col gap-2">
        <ExternalLink
          href={app.url}
          className="border rounded border-brand/50 hover:border-brand py-1 px-2 bg-brand/10 hover:bg-brand/20  transition-all uppercase text-sm"
        >
          Open Website
        </ExternalLink>
        {app.overwolf?.url ? (
          <DownloadLink
            href={app.overwolf.url}
            className="border rounded border-brand/50 hover:border-brand py-1 px-2 bg-brand/10 hover:bg-brand/20  transition-all uppercase text-sm"
          >
            In-Game App
          </DownloadLink>
        ) : null}
      </div>
    </section>
  );
}
