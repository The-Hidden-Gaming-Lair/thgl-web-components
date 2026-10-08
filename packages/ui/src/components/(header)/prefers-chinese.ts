import { useEffect, useState } from "react";

/**
 * The Alipay / WeChat Pay (Tebex) account flows are a China test: Chinese
 * copy only for visitors whose browser prefers Chinese, English for everyone
 * else (Leon 2026-10-08: no mixed English + Chinese texts).
 */
export function prefersChinese(): boolean {
  if (typeof navigator === "undefined") return false;
  const first = navigator.languages?.[0] ?? navigator.language ?? "";
  return first.toLowerCase().startsWith("zh");
}

/** `en` or `zh` copy, by the browser's preferred language. */
export function zhOr(en: string, zh: string): string {
  return prefersChinese() ? zh : en;
}

/**
 * The same, as a hook: "en" on the server and the first client render, then
 * the browser's choice - server-rendered forms don't hit a hydration mismatch.
 */
export function useZh(): boolean {
  const [zh, setZh] = useState(false);
  useEffect(() => setZh(prefersChinese()), []);
  return zh;
}
