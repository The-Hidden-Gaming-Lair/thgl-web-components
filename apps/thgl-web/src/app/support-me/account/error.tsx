"use client";

import { Button } from "@repo/ui/controls";
import { SignOut } from "@/components/sign-out";
import { Subtitle } from "@repo/ui/content";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="space-y-8 px-4 pt-10 pb-20 text-center max-w-xl mx-auto">
      <Subtitle title="Authentication Failed" />
      <p className="text-muted-foreground">
        The Patreon authentication link may have expired or is invalid.
        <br />
        Please try again or log out and start over.
      </p>

      <div className="flex flex-col gap-4 items-center justify-center">
        <Button onClick={() => window.location.reload()}>Try Again</Button>
        <SignOut />
      </div>

      <pre className="text-xs text-muted-foreground break-words whitespace-pre-wrap border-t pt-4 border-muted">
        {error.message}
      </pre>
    </div>
  );
}
