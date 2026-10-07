"use client";

import { useState } from "react";
import { Button } from "@repo/ui/controls";
import { Check, Copy } from "lucide-react";

/**
 * The account secret of a Tebex-purchased account — its only way back in on
 * another browser/device (paste it in the account dialog), since there is no
 * Patreon login behind it.
 */
export function SupporterKey({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <code className="block break-all rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
        {secret}
      </code>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(secret);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        }}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy Supporter Key
          </>
        )}
      </Button>
    </div>
  );
}
