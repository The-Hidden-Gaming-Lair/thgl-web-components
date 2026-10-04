"use client";
import { cn, PREVIEW_FEATURES, useAccountStore } from "@repo/lib";
import { toast } from "sonner";

const PREVIEW_BADGE_TITLE =
  "Preview for Elite Supporters, coming to everyone later";

/**
 * The "Preview" mark for a feature in Elite Supporter preview (PREVIEW_FEATURES
 * in @repo/lib preview-release.ts). Put it next to the feature's label/button,
 * rendered only while `usePreviewFeature(id).preview` is true — so it disappears
 * by itself when the feature goes public.
 */
export function PreviewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "ml-1.5 inline-block rounded border border-primary/60 px-1 text-[10px] leading-4 font-normal text-primary",
        className,
      )}
      title={PREVIEW_BADGE_TITLE}
    >
      Preview
    </span>
  );
}

/** Lock text for a preview feature the account can't use (tooltips, toasts). */
export function previewLockedText(id: string): string {
  const title = PREVIEW_FEATURES[id]?.title ?? "This feature";
  return `${title} is a Preview for Elite Supporters, coming to everyone later.`;
}

/**
 * The Elite upsell for a locked preview feature: a toast with the lock text and
 * an "Unlock" action that opens the account dialog (sign in / become an Elite
 * Supporter) — the same dialog the PreviewReleaseGate paywall opens.
 */
export function showPreviewUpsell(id: string, detail?: string) {
  toast(previewLockedText(id), {
    id: `preview-locked-${id}`,
    description: detail,
    duration: 8000,
    action: {
      label: "Unlock",
      onClick: () => useAccountStore.getState().setShowUserDialog(true),
    },
  });
}
