"use client";

import { useState } from "react";
import { TH_GL_URL } from "@repo/lib";
import { Button } from "../(controls)";
import { Input } from "../ui/input";
import { useUnlockWithSecret } from "./use-unlock-with-secret";

// Dev: same-origin (the global /api/auth route answers on every dev host and
// the dev DB/mail config lives there). Prod: www.th.gl, CORS-enabled.
const AUTH_URL =
  process.env.NODE_ENV === "development" ? "" : (TH_GL_URL ?? "");

const MESSAGES = {
  "invalid-email":
    "Please enter a valid email address. / 请输入有效的邮箱地址。",
  "rate-limited":
    "Too many codes requested. Please wait a bit and try again. / 请求次数过多，请稍后再试。",
  "send-failed":
    "The email could not be sent. Please try again later. / 邮件发送失败，请稍后再试。",
  invalid: "Wrong code. / 验证码错误。",
  expired:
    "The code has expired. Request a new one. / 验证码已过期，请重新获取。",
  "too-many-attempts":
    "Too many attempts. Request a new code. / 尝试次数过多，请重新获取验证码。",
  unavailable: "Please try again in a moment. / 请稍后再试。",
} as const;

/**
 * Passwordless email sign-in (one-time code), for accounts without a Patreon
 * login: Tebex / Alipay / WeChat Pay buyers. It never creates accounts. Used by the header sign-in dialog,
 * the Companion App's account dialog and the www account page.
 */
export function EmailSignIn({
  onSignedIn,
  className,
}: {
  /** Called after a successful sign-in (e.g. reload a server-rendered page). */
  onSignedIn?: () => void;
  className?: string;
}) {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { unlock } = useUnlockWithSecret();
  const lang =
    typeof navigator !== "undefined" && navigator.language.startsWith("zh")
      ? "zh"
      : "en";

  const post = async (path: string, body: object) => {
    const res = await fetch(`${AUTH_URL}/api/auth/email/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: keyof typeof MESSAGES;
      secret?: string;
    };
    return { ok: res.ok, data };
  };

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { ok, data } = await post("request", { email, lang });
      if (ok) {
        setStep("code");
      } else {
        setMessage(
          MESSAGES[data.error ?? "unavailable"] ?? MESSAGES.unavailable,
        );
      }
    } catch {
      setMessage(MESSAGES.unavailable);
    }
    setBusy(false);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { ok, data } = await post("verify", { email, code });
      if (ok && data.secret) {
        const outcome = await unlock(data.secret, { silent: true });
        if (outcome === "ok" || outcome === "free") {
          setStep("done");
          setMessage("You're signed in. / 你已登录。");
          onSignedIn?.();
        } else {
          setMessage(MESSAGES.unavailable);
        }
      } else {
        setMessage(
          MESSAGES[data.error ?? "unavailable"] ?? MESSAGES.unavailable,
        );
      }
    } catch {
      setMessage(MESSAGES.unavailable);
    }
    setBusy(false);
  };

  return (
    <div className={className}>
      {step === "email" && (
        <form onSubmit={requestCode} className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Paid with Alipay or WeChat Pay? Enter the email from your purchase
            and we send you a one-time code - no password. /
            使用支付宝或微信支付付款？输入付款时填写的邮箱，我们会发送一次性验证码，无需密码。
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Email / 邮箱"
              autoComplete="email"
              className="text-xs h-8"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 shrink-0"
              disabled={!email || busy}
            >
              Send code / 发送验证码
            </Button>
          </div>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={verifyCode} className="space-y-2">
          <p className="text-xs text-muted-foreground">
            If {email} belongs to an account, we sent it a 6-digit code. Check
            your spam folder if it doesn't arrive. / 如果 {email}
            已关联账户，我们已向其发送 6
            位验证码。如未收到，请检查垃圾邮件文件夹。
          </p>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-xs h-8 tracking-widest"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 shrink-0"
              disabled={code.length !== 6 || busy}
            >
              Sign in / 登录
            </Button>
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage(null);
            }}
          >
            Use another email / 使用其他邮箱
          </button>
        </form>
      )}
      {message && (
        <p
          className={
            step === "done"
              ? "text-xs text-primary mt-2"
              : "text-xs text-amber-500 mt-2"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
