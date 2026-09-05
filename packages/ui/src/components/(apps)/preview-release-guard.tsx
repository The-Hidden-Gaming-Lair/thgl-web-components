"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  isDebug,
  isLocalDev,
  isPreviewReleaseApp,
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
  const hasHydrated = useAccountStore((s) => s._hasHydrated);
  const previewAccess = useAccountStore((s) => s.perks.previewReleaseAccess);
  // SSR-safe: the server has no `window` (isLocalDev/isDebug read location), so
  // it always renders "pending". Stay "pending" on the first client render too
  // (mounted === false) so hydration matches, then resolve after mount. Without
  // this, dev/Elite would flip to "allow" on the first client paint and mismatch
  // the server HTML (e.g. a gated nav link appearing where another link was).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return "pending";
  // Same dev/debug bypass as PreviewReleaseGuard: local dev server + THGLApp
  // Debug build (which serves the production frontend in its WebView2).
  if (isLocalDev || isDebug()) return "allow";
  if (!hasHydrated) return "pending";
  return previewAccess ? "allow" : "deny";
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
 * can't know it. Before the persisted account hydrates (incl. SSR) we render
 * nothing — that also keeps the pre-release map out of the server HTML. After
 * hydration: Elite users see the content, everyone else sees the upsell page.
 * Non-preview games always render their content unchanged.
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
  const hasHydrated = useAccountStore((s) => s._hasHydrated);
  const previewAccess = useAccountStore((s) => s.perks.previewReleaseAccess);

  if (!isPreviewReleaseApp(appName)) return <>{children}</>;
  // Dev/debug bypass: skip the Elite gate so we can work on a pre-release game without signing in.
  //  • isLocalDev — RUNTIME host check (*-dev.localhost / *.localhost). Covers the games-web dev
  //    server AND the THGLApp DEBUG build (it navigates to app-dev.localhost:3100; release loads
  //    app.th.gl). Preferred over process.env.NODE_ENV, which the prebuilt package dist inlines as
  //    "production" so it read false inside the WebView2 — the reason the gate still showed.
  //  • isDebug() — manual localStorage DEBUG === "true" escape hatch.
  // Production web (th.gl) is unaffected. Hooks above stay called unconditionally per build.
  if (isLocalDev || isDebug()) return <>{children}</>;
  if (!hasHydrated) return null;
  if (!previewAccess) return <PreviewReleasePage title={title} />;
  return <>{children}</>;
}
