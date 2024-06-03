import Image from "next/image";
import Link from "next/link";
import type { App } from "@/lib/apps";

export function CardLink({ app }: { app: App }) {
  return (
    <Link
      className="group rounded-lg border border-brand/50 bg-zinc-900/20 overflow-hidden relative"
      href={`/apps/${encodeURIComponent(app.title)}`}
    >
      <Image
        alt={app.title}
        draggable={false}
        height={213}
        src={app.tileSrc}
        width={277}
      />
      <h3 className="m-3 text-lg font-semibold text-center group-hover:text-brand transition-colors duration-500">
        {app.title}
      </h3>
      <p className="m-3 max-w-[30ch] text-sm opacity-50 text-center">
        {app.description}
      </p>
      {app.isPartnerApp ? (
        <p className="absolute top-3 right-3 text-xs uppercase bg-[#16727a] px-2 py-1 rounded-xl">
          Partner App
        </p>
      ) : null}
    </Link>
  );
}
