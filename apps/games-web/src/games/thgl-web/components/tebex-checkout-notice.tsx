"use client";

import { useSearchParams } from "next/navigation";

// Feedback for /api/tebex/checkout redirects back to /support-me/tebex
// (?tebex=…). Client-side so the page itself stays static. Chinese first:
// the page is the China (Alipay / WeChat Pay) checkout.
const MESSAGES: Record<string, { text: string; tone: "info" | "warn" }> = {
  cancel: {
    text: "已取消结账，未扣款。 Checkout cancelled - nothing was charged.",
    tone: "info",
  },
  "patreon-session": {
    text: "你已使用 Patreon 登录。请先在账户页面退出登录，再使用支付宝或微信支付订阅。 You're signed in with Patreon - sign out on your account page first.",
    tone: "warn",
  },
  error: {
    text: "无法开始结账，请稍后再试。 The checkout could not be started - please try again in a moment.",
    tone: "warn",
  },
  "invalid-tier": { text: "未知的等级。 Unknown tier.", tone: "warn" },
};

export function TebexCheckoutNotice() {
  const status = useSearchParams().get("tebex");
  const message = status ? MESSAGES[status] : undefined;
  if (!message) return null;
  return (
    <p
      className={
        message.tone === "warn"
          ? "text-center text-sm text-amber-500"
          : "text-center text-sm text-muted-foreground"
      }
    >
      {message.text}
    </p>
  );
}
