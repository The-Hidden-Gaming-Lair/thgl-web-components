"use client";
import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import { Alert, AlertDescription } from "../ui/alert";
import { useAccountStore } from "@repo/lib";

export function AuthAlert({ className }: { className?: string }) {
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  return (
    <Alert className={className}>
      <AlertDescription>
        You need to sign up for this feature.
        <ExternalAnchor
          href="https://www.th.gl/support-me"
          className="flex gap-1 text-primary hover:underline"
          onClick={() => setShowUserDialog(true)}
        >
          <span>Sign Up</span>
          <ExternalLink className="w-3 h-3" />
        </ExternalAnchor>
      </AlertDescription>
    </Alert>
  );
}
