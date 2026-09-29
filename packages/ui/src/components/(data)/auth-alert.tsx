"use client";

import { LogIn } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useAccountStore } from "@repo/lib";
import { Button } from "../(controls)";

/**
 * Sign-in prompt for community actions (comments, tips, votes, reports).
 *
 * Posting only needs a signed-in account — api-forge verifies the account
 * token and checks no tier or perk — so this never mentions a subscription.
 * (It used to say "Requires a subscription" to signed-in users, which was
 * wrong for every place it is used.) Renders nothing once signed in.
 */
export function AuthAlert({
  className,
  message = "Sign in to comment. No subscription needed.",
}: {
  className?: string;
  message?: string;
}) {
  const userId = useAccountStore((state) => state.userId);
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  if (userId) return null;

  return (
    <Alert className={className}>
      <AlertDescription className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{message}</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-6 text-xs gap-1 shrink-0"
          onClick={() => setShowUserDialog(true)}
        >
          <LogIn className="w-3 h-3" />
          Sign In
        </Button>
      </AlertDescription>
    </Alert>
  );
}
