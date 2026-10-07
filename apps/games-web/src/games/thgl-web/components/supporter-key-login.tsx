"use client";

import { useState } from "react";
import { Button } from "@repo/ui/controls";
import { restoreUserIdCookie } from "@repo/ui/header";

/**
 * Sign-in with a Supporter Key on the www account page. Accounts without a
 * Patreon login (Tebex purchases, e.g. the China Alipay / WeChat Pay
 * checkout) restore themselves on another browser or device with the key
 * from their account page. Same verification as the header dialog's key
 * form (/api/patreon/overwolf): 200 = supporter, 403 = valid account without
 * a paid tier (Free), 404 = unknown key.
 */
export function SupporterKeyLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || !key) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/patreon/overwolf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: key }),
      });
      if (response.ok || response.status === 403) {
        const body = (await response.json().catch(() => ({}))) as {
          secret?: string;
        };
        restoreUserIdCookie(body.secret ?? key);
        location.reload();
        return;
      }
      setError(
        response.status === 404 || response.status === 400
          ? "Invalid key. / 密钥无效。"
          : "Please try again in a moment. / 请稍后再试。",
      );
    } catch {
      setError("Please try again in a moment. / 请稍后再试。");
    }
    setLoading(false);
  };

  return (
    <details className="text-sm mt-6">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Have a Supporter Key? / 有支持者密钥？
      </summary>
      <form onSubmit={submit} className="flex gap-2 mt-3 max-w-md mx-auto">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value.trim())}
          placeholder="Paste your Supporter Key / 粘贴你的支持者密钥"
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs"
        />
        <Button type="submit" size="sm" disabled={!key || loading}>
          Unlock / 解锁
        </Button>
      </form>
      {error && <p className="text-amber-500 text-xs mt-2">{error}</p>}
    </details>
  );
}
