"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { dialogueCorpusUrl, localizePath } from "@repo/lib";
import { DialogueText } from "@/lib/db/dialogue-text";

export type QuoteSpeaker = {
  id: string;
  name: string;
  /** Codex page of the speaker (e.g. /db/characters/<id>). */
  href?: string;
  count: number;
};

type Labels = {
  title: string;
  intro: string;
  placeholder: string;
  loading: string;
  hint: string;
  results: string;
  empty: string;
  error: string;
};

const MAX_RESULTS = 200;
const fold = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/**
 * Client-side search over every character's lines (`config/dialogue/<locale>.json`,
 * entry id → lines). The corpus is megabytes, so it loads in the browser once the
 * page is open; a query matches the line text or the speaker's name.
 */
export function QuotesSearch({
  appName,
  locale,
  contentHash,
  speakers,
  labels,
}: {
  appName: string;
  locale: string;
  contentHash?: string;
  speakers: QuoteSpeaker[];
  labels: Labels;
}) {
  const [corpus, setCorpus] = useState<Record<string, string[]> | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (loc: string): Promise<Record<string, string[]>> => {
      const res = await fetch(dialogueCorpusUrl(appName, loc, contentHash));
      if (res.ok) return res.json();
      if (loc !== "en") return load("en");
      throw new Error(String(res.status));
    };
    load(locale)
      .then((c) => !cancelled && setCorpus(c))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [appName, locale, contentHash]);

  // Folded once per corpus: [speaker, line, folded line]
  const rows = useMemo(() => {
    if (!corpus) return [];
    const out: { speaker: QuoteSpeaker; line: string; key: string }[] = [];
    for (const s of speakers)
      for (const line of corpus[s.id] ?? [])
        out.push({ speaker: s, line, key: fold(line) });
    return out;
  }, [corpus, speakers]);

  const q = fold(query.trim());
  const matches = useMemo(() => {
    if (q.length < 3) return [];
    const bySpeaker = new Set(
      speakers.filter((s) => fold(s.name).includes(q)).map((s) => s.id),
    );
    return rows.filter((r) => r.key.includes(q) || bySpeaker.has(r.speaker.id));
  }, [rows, q, speakers]);

  const onChange = (v: string) => {
    setQuery(v);
    const url = new URL(window.location.href);
    if (v.trim()) url.searchParams.set("q", v.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{labels.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">{labels.intro}</p>
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={labels.placeholder}
        className="w-full rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-amber-700/70"
        autoFocus
      />
      <div className="mt-3 text-xs text-muted-foreground">
        {failed
          ? labels.error
          : !corpus
            ? labels.loading
            : q.length < 3
              ? labels.hint
              : matches.length
                ? labels.results.replace("{{count}}", String(matches.length))
                : labels.empty}
      </div>
      {matches.length > 0 && (
        <ol className="mt-3 divide-y divide-slate-800/60 rounded border border-slate-800">
          {matches.slice(0, MAX_RESULTS).map((m, i) => (
            <li key={i} className="px-3 py-2 text-sm">
              <p className="text-slate-100">
                “<DialogueText text={m.line} />”
              </p>
              <p className="mt-0.5 text-xs">
                —{" "}
                {m.speaker.href ? (
                  <Link
                    href={localizePath(m.speaker.href, locale)}
                    prefetch={false}
                    className="text-primary hover:underline"
                  >
                    {m.speaker.name}
                  </Link>
                ) : (
                  m.speaker.name
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
      {matches.length > MAX_RESULTS && (
        <p className="mt-2 text-xs text-muted-foreground">
          {MAX_RESULTS} / {matches.length}
        </p>
      )}
    </div>
  );
}
