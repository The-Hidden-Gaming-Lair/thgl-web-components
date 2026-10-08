"use client";

import { useState } from "react";
import { TH_GL_URL } from "@repo/lib";
import { Button } from "../(controls)";
import { Input } from "../ui/input";
import { useUnlockWithSecret } from "./use-unlock-with-secret";
import { useZh } from "./prefers-chinese";

// Dev: same-origin (the global /api/auth route answers on every dev host and
// the dev DB/mail config lives there). Prod: www.th.gl, CORS-enabled.
const AUTH_URL =
  process.env.NODE_ENV === "development" ? "" : (TH_GL_URL ?? "");

const TEXT = {
  en: {
    intro:
      "For supporters who paid with Alipay or WeChat Pay through Tebex (currently available in China only). Enter the email from your purchase and we send you a one-time code - no password.",
    email: "Email",
    send: "Send code",
    sent: (email: string) =>
      `If ${email} has an active Tebex purchase, we sent it a 6-digit code. Check your spam folder if it doesn't arrive.`,
    signIn: "Sign in",
    other: "Use another email",
    done: "You're signed in.",
    "invalid-email": "Please enter a valid email address.",
    "rate-limited":
      "Too many codes requested. Please wait a bit and try again.",
    "send-failed": "The email could not be sent. Please try again later.",
    invalid: "Wrong code.",
    expired: "The code has expired. Request a new one.",
    "too-many-attempts": "Too many attempts. Request a new code.",
    unavailable: "Please try again in a moment.",
  },
  zh: {
    intro:
      "适用于通过 Tebex 使用支付宝或微信支付付款的支持者（目前仅限中国）。输入付款时填写的邮箱，我们会发送一次性验证码，无需密码。",
    email: "邮箱",
    send: "发送验证码",
    sent: (email: string) =>
      `如果 ${email} 有有效的 Tebex 购买记录，我们已向其发送 6 位验证码。如未收到，请检查垃圾邮件文件夹。`,
    signIn: "登录",
    other: "使用其他邮箱",
    done: "你已登录。",
    "invalid-email": "请输入有效的邮箱地址。",
    "rate-limited": "请求次数过多，请稍后再试。",
    "send-failed": "邮件发送失败，请稍后再试。",
    invalid: "验证码错误。",
    expired: "验证码已过期，请重新获取。",
    "too-many-attempts": "尝试次数过多，请重新获取验证码。",
    unavailable: "请稍后再试。",
  },
} as const;

type ErrorKey =
  | "invalid-email"
  | "rate-limited"
  | "send-failed"
  | "invalid"
  | "expired"
  | "too-many-attempts"
  | "unavailable";

/**
 * "Sign in with E-Mail" (one-time code) for accounts without a Patreon login:
 * Tebex / Alipay / WeChat Pay buyers with an active purchase. It never
 * creates accounts. Used by the header sign-in dialog, the Companion App's
 * account dialog and the www account page. Chinese copy for Chinese browsers,
 * English otherwise.
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
  const lang = useZh() ? "zh" : "en";
  const t = TEXT[lang];
  const errorText = (key?: string) =>
    t[(key && key in t ? key : "unavailable") as ErrorKey];

  const post = async (path: string, body: object) => {
    const res = await fetch(`${AUTH_URL}/api/auth/email/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
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
      if (ok) setStep("code");
      else setMessage(errorText(data.error));
    } catch {
      setMessage(t.unavailable);
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
          setMessage(t.done);
          onSignedIn?.();
        } else {
          setMessage(t.unavailable);
        }
      } else {
        setMessage(errorText(data.error));
      }
    } catch {
      setMessage(t.unavailable);
    }
    setBusy(false);
  };

  return (
    <div className={className}>
      {step === "email" && (
        <form onSubmit={requestCode} className="space-y-2">
          <p className="text-xs text-muted-foreground">{t.intro}</p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder={t.email}
              autoComplete="email"
              className="text-xs h-8"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 shrink-0"
              disabled={!email || busy}
            >
              {t.send}
            </Button>
          </div>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={verifyCode} className="space-y-2">
          <p className="text-xs text-muted-foreground">{t.sent(email)}</p>
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
              {t.signIn}
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
            {t.other}
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
