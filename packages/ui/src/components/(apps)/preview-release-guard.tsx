"use client";
import type { ReactNode } from "react";
import { isPreviewReleaseApp, useAccountStore } from "@repo/lib";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Button } from "../(controls)";

/**
 * Full-page "sign in / become an Elite Supporter" gate for a pre-release game's
 * web pages (map, db). Shown INSTEAD of the content to non-Elite users.
 */
function PreviewReleasePage({ title }: { title: string }) {
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
  if (!hasHydrated) return null;
  if (!previewAccess) return <PreviewReleasePage title={title} />;
  return <>{children}</>;
}
