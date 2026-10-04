"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import {
  games,
  getCurrentGameId,
  isAppOverlayPath,
  isThglApp,
  localizePath,
  TH_GL_URL,
  toAppSurfacePath,
  useHasMounted,
} from "@repo/lib";
import { openInBrowser } from "@repo/lib/thgl-app";
import { useLocale, useT } from "../(providers)";

// A soft-nav link from a map marker to its codex/database entry. Rendered by the marker panel and
// hover tooltip whenever the marker's filter value carries a `dbSection` (see config.ts). The entry
// is named by the spawn's own `dbEntryId` when it carries one, else keyed by the spawn id
// (per-instance entries — landmarks) or the type id (per-type entries — a bestiary species); the
// caller passes whichever it is as `entryId`. Generic across all games.
//
// Inside the companion app the codex opens IN the app, under app.th.gl/apps/<id>/db/… (the app's
// content pages with their own title bar + back button, see @repo/lib app-surface.ts) — a bare
// /db/… path would 404 on the app tenant. The in-game overlay stays map-only: there the entry opens
// on the game's public site in the default browser ("openInBrowser"). Decided after mount only —
// `isThglApp` is browser-only, and deciding on it during the first render made the client disagree
// with the server HTML (the account-gate hydration lesson, resolveAccountGate).
export type AppLinkMode =
  | { kind: "app"; gameId: string }
  | { kind: "browser"; site: string }
  | null;

/** How internal game links behave here: in-app (/apps/<id>/…), via the browser, or plain web (null). */
export function useAppLinkMode(): AppLinkMode {
  const mounted = useHasMounted();
  if (!mounted || !isThglApp) return null;
  const gameId = getCurrentGameId();
  if (gameId && !isAppOverlayPath(window.location.pathname)) {
    return { kind: "app", gameId };
  }
  return {
    kind: "browser",
    site: games.find((g) => g.id === gameId)?.web ?? TH_GL_URL,
  };
}

export function DbEntryLink({
  section,
  entryId,
}: {
  section: string;
  entryId: string;
}) {
  const locale = useLocale();
  const t = useT();
  const mode = useAppLinkMode();
  if (!section || !entryId) return null;
  const path = localizePath(
    `/db/${section}/${encodeURIComponent(entryId)}`,
    locale,
  );
  const className =
    "inline-flex items-center gap-1.5 text-sm text-amber-400 underline underline-offset-2 hover:text-amber-300";
  const label = (
    <>
      <BookOpen className="h-3.5 w-3.5 shrink-0" />
      {t("db.viewInCodex", { fallback: "View in Codex" })}
    </>
  );
  if (mode?.kind === "browser") {
    const href = `${mode.site}${path}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void openInBrowser(href);
        }}
        className={className}
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      href={
        mode?.kind === "app"
          ? toAppSurfacePath(path, mode.gameId, [locale])
          : path
      }
      prefetch={false}
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {label}
    </Link>
  );
}
