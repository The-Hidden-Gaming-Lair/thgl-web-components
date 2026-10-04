import Link from "next/link";
import { localizePath } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { BreedingPalInfo } from "./data";

/** Server-rendered link grid to every per-pal breeding page. */
export function BreedingPalGrid({
  pals,
  appName,
  iconsHash,
  locale,
}: {
  pals: BreedingPalInfo[];
  appName: string;
  iconsHash?: string;
  locale: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
      {pals.map((p) => (
        <li key={p.id}>
          <Link
            href={localizePath(`/breeding/${p.id}`, locale)}
            className="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-accent"
          >
            {p.icon ? (
              <SpriteIcon
                icon={p.icon}
                appName={appName}
                iconsHash={iconsHash}
                size={28}
              />
            ) : (
              <span className="inline-block h-7 w-7 shrink-0 rounded bg-muted" />
            )}
            <span className="truncate">{p.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              #{p.dex}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
