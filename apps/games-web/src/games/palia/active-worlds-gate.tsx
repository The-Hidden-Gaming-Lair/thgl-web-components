"use client";

import type { ReactNode } from "react";
import { PreviewReleaseOnly, PreviewReleasePage } from "@repo/ui/apps";

// Elite-only gate for the WIP Active Worlds page: non-preview visitors get the
// "become an Elite Supporter" upsell instead of the tracker. Dev server and the
// THGLApp Debug build bypass it (see usePreviewReleaseGate).
export default function ActiveWorldsGate({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <PreviewReleaseOnly fallback={<PreviewReleasePage title={title} />}>
      {children}
    </PreviewReleaseOnly>
  );
}
