"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { localizePath } from "@repo/lib";
import { useLocale, useT } from "../(providers)";

// A soft-nav link from a map marker to its codex/database entry. Rendered by the marker panel and
// hover tooltip whenever the marker's filter value carries a `dbSection` (see config.ts). The entry
// is keyed by the spawn id (per-instance entries — landmarks) or the type id (per-type entries — a
// bestiary species); the caller passes whichever it is as `entryId`. Generic across all games.
export function DbEntryLink({
  section,
  entryId,
}: {
  section: string;
  entryId: string;
}) {
  const locale = useLocale();
  const t = useT();
  if (!section || !entryId) return null;
  return (
    <Link
      href={localizePath(
        `/db/${section}/${encodeURIComponent(entryId)}`,
        locale,
      )}
      prefetch={false}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-sm text-amber-400 underline underline-offset-2 hover:text-amber-300"
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0" />
      {t("db.viewInCodex", { fallback: "View in Codex" })}
    </Link>
  );
}
