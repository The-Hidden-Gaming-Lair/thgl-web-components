"use client";
import { type ReactNode } from "react";
import {
  isPreviewReleaseApp,
  useAccountGate,
  useAccountStore,
} from "@repo/lib";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Button } from "../(controls)";

/**
 * Perk-only preview gate, independent of PREVIEW_RELEASE_APPS — for gating an
 * individual page/component of a LIVE game (e.g. a work-in-progress feature)
 * behind Elite Supporter access.
 *
 * - "allow": show it (Elite, the local dev server, or the THGLApp Debug build).
 * - "pending": account not hydrated yet — render nothing to keep it out of SSR.
 * - "deny": signed-in non-Elite (or signed-out) — hide / show an upsell.
 */
export type PreviewGate = "allow" | "deny" | "pending";
export function usePreviewReleaseGate(): PreviewGate {
  const previewAccess = useAccountStore((s) => s.perks.previewReleaseAccess);
  // `useAccountGate` (@repo/lib) owns the SSR-safe resolution shared by every
  // account gate: "pending" on the server AND on the first client render, then
  // the dev/debug bypass, then the persisted account. Do not re-implement it
  // here — the THGLApp companion paywall used to and that is what put the
  // upsell into the server HTML (visible flash + hydration error).
  return useAccountGate(previewAccess);
}

/**
 * Render children only for Elite Supporters (preview access). `fallback` shows
 * for signed-in non-Elite users; nothing renders until the account hydrates
 * (keeps preview-only content out of the server HTML). Use for WIP features of
 * a live game — a nav link, home card, sidebar panel, etc.
 */
export function PreviewReleaseOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const gate = usePreviewReleaseGate();
  if (gate === "pending") return null;
  if (gate === "deny") return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Full-page "sign in / become an Elite Supporter" gate for a pre-release game's
 * web pages (map, db). Shown INSTEAD of the content to non-Elite users.
 */
export function PreviewReleasePage({ title }: { title: string }) {
  const setShowUserDialog = useAccountStore((s) => s.setShowUserDialog);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <LockClosedIcon className="size-10 text-amber-400" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Elite Supporter Preview
      </p>
      <h1 className="text-2xl font-semibold">{title} is in early access</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {title} is still being finalized and is available early to Elite
        Supporters with Preview Release Access. Sign in with your Elite account
        — or become an Elite Supporter — to get access now.
      </p>
      <Button className="mt-2" onClick={() => setShowUserDialog(true)}>
        Sign in or become an Elite Supporter
      </Button>
    </div>
  );
}

/**
 * Gate a pre-release (preview) game's web content behind Elite Supporter access.
 *
 * Client-side by design: Elite status (perks.previewReleaseAccess) is resolved
 * in the browser (userId cookie -> /api/patreon -> account store), so the server
 * can't know it. Before the gate resolves (incl. SSR) we render nothing — that
 * also keeps the pre-release map out of the server HTML. After mount: Elite
 * users see the content, everyone else sees the upsell page. Non-preview games
 * always render their content unchanged (and pay no hook/render cost — the gate
 * lives in the inner component, which only mounts for gated apps).
 */
export function PreviewReleaseGuard({
  appName,
  title,
  children,
}: {
  appName: string;
  title: string;
  children: ReactNode;
}) {
  // No hooks here on purpose: for the ~40 non-preview tenants this must be a
  // pass-through with no extra state and no post-mount re-render.
  if (!isPreviewReleaseApp(appName)) return <>{children}</>;
  return <PreviewReleaseGate title={title}>{children}</PreviewReleaseGate>;
}

/**
 * The actual gate for a preview app. Uses `usePreviewReleaseGate`, whose
 * post-mount resolution is what keeps SSR and the first client render in sync.
 *
 * ⚠️ Do NOT inline the `isLocalDev || isDebug()` bypass here: both read
 * `window`, so they are false during SSR and true on the dev server / THGLApp
 * Debug build. Deciding on them during the FIRST client render makes that
 * render disagree with the server HTML (server: nothing; client: the whole
 * page), which is a hydration mismatch — React then throws away the server
 * markup and re-renders the entire map subtree. `usePreviewReleaseGate` returns
 * "pending" until `useEffect` has run, so the first client render reproduces
 * the server output exactly and the bypass applies from the second render on.
 */
function PreviewReleaseGate({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const gate = usePreviewReleaseGate();
  if (gate === "pending") return null;
  if (gate === "deny") return <PreviewReleasePage title={title} />;
  return <>{children}</>;
}
