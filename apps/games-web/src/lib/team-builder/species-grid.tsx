import Link from "next/link";
import { localizePath, type TeamBuilderData } from "@repo/lib";
import type { TeamBuilderNames } from "./data";
import { chipFor, SpeciesIcon } from "./parts";

/** Server-rendered link grid to every per-Aniimo matchup page. */
export function TeamSpeciesGrid({
  data,
  names,
  appName,
  iconsHash,
  locale,
}: {
  data: TeamBuilderData;
  names: TeamBuilderNames;
  appName: string;
  iconsHash?: string;
  locale: string;
}) {
  const Chip = chipFor(data, names, appName, iconsHash);
  return (
    <ul className="grid gap-1 [grid-template-columns:repeat(auto-fill,minmax(min(100%,13rem),1fr))]">
      {names.species.map((s) => (
        <li key={s.id}>
          <Link
            href={localizePath(`/team-builder/${s.id}`, locale)}
            className="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-accent"
          >
            <SpeciesIcon
              info={s}
              size={28}
              appName={appName}
              iconsHash={iconsHash}
            />
            <span className="truncate">{s.name}</span>
            <span className="ml-auto">
              <Chip id={data.species[s.id].main} compact />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
