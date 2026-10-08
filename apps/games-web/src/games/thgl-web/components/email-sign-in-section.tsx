"use client";

import { EmailSignIn } from "@repo/ui/header";

/**
 * Email sign-in on the www account page (anchor #email-sign-in - the China
 * page's Free card links here). Reloads after signing in so the
 * server-rendered account view picks up the new cookie.
 */
export function EmailSignInSection() {
  return (
    <div
      id="email-sign-in"
      className="mt-8 pt-6 border-t border-border text-left max-w-md mx-auto space-y-2"
    >
      <p className="font-semibold text-sm">Sign in with email / 用邮箱登录</p>
      <EmailSignIn
        onSignedIn={() => setTimeout(() => location.reload(), 800)}
      />
    </div>
  );
}
