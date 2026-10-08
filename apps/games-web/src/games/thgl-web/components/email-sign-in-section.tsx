"use client";

import { useEffect, useState } from "react";
import { EmailSignIn } from "@repo/ui/header";

/**
 * "Sign in with E-Mail" on the www account page, next to "Sign in with
 * Patreon": a one-time code for Tebex (Alipay / WeChat Pay) supporters.
 * Opens on its own for #email-sign-in links. Reloads after signing in so the
 * server-rendered account view picks up the new cookie.
 */
export function EmailSignInSection({ zh }: { zh: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (location.hash === "#email-sign-in") setOpen(true);
  }, []);
  return (
    <details
      id="email-sign-in"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="text-left"
    >
      <summary className="list-none [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input text-sm font-medium hover:bg-accent">
          {zh ? "使用邮箱登录" : "Sign in with E-Mail"}
        </span>
      </summary>
      <EmailSignIn
        className="mt-3"
        onSignedIn={() => setTimeout(() => location.reload(), 800)}
      />
    </details>
  );
}
