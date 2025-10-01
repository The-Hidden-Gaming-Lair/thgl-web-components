"use client";
import { cn, THGLAccount } from "@repo/lib";
import { InitializeAccount } from "@repo/ui/thgl-app";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@repo/ui/controls";

export function AuthRedirect({
  isSuccess,
  account,
}: {
  isSuccess: boolean;
  account: THGLAccount;
}) {
  return (
    <div
      className={cn(
        "font-sans min-h-dscreen text-white antialiased select-none overflow-hidden w-full bg-black flex items-center justify-center",
      )}
    >
      <div className="container max-w-md text-center space-y-6 p-6">
        {isSuccess ? (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-400 animate-pulse" />
            <h1 className="text-3xl font-bold">Authentication Successful</h1>
            <p className="text-gray-400">You may now close this window.</p>
            <Button
              onClick={() => {
                window.close();
              }}
              className="mt-4"
              variant="outline"
            >
              Click to Close
            </Button>
            <InitializeAccount account={account} />
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-400" />
            <h1 className="text-3xl font-bold text-red-300">
              Authentication Failed
            </h1>
            <p className="text-gray-400">Please try again.</p>
            <Button
              onClick={() => {
                window.close();
              }}
              className="mt-4"
              variant="destructive"
            >
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
