import Link from "next/link";
import { fetchDialogue, localizePath, translate } from "@repo/lib";
import { DialogueText } from "@/lib/db/dialogue-text";

/**
 * Everything a character says (`props._dialogue` = line count), each line with
 * the player's reply options. Rendered on the server so the lines are in the
 * page, but collapsed: the list spans the whole story, spoilers included.
 */
export async function EntryDialogue({
  appName,
  id,
  name,
  locale,
  dict,
  count,
}: {
  appName: string;
  id: string;
  name: string;
  locale: string;
  dict: Record<string, string>;
  count: number;
}) {
  const lines = await fetchDialogue(appName, locale, id).catch(() => undefined);
  if (!lines?.length) return null;
  return (
    <section className="mt-8 max-w-3xl">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {translate(dict, "db.dialogue.title", { fallback: "Dialogue" })}
      </h2>
      <details className="group rounded border border-slate-800 bg-slate-900/40">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm text-primary hover:underline">
          {translate(dict, "db.dialogue.show", {
            fallback: "Show all {{count}} lines of {{name}} (story spoilers)",
            vars: { count: String(count || lines.length), name },
          })}
        </summary>
        <ol className="divide-y divide-slate-800/60">
          {lines.map((l, i) => (
            <li key={i} className="px-3 py-2 text-sm">
              <p className="text-slate-100">
                “<DialogueText text={l.t} />”
              </p>
              {l.r?.length ? (
                <ul className="mt-1 space-y-0.5 pl-4">
                  {l.r.map((r, j) => (
                    <li key={j} className="text-xs text-muted-foreground">
                      <span className="text-amber-500/80">→ </span>
                      <DialogueText text={r} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </details>
      <Link
        href={localizePath("/db/quotes", locale)}
        prefetch={false}
        className="mt-2 inline-block text-xs text-primary hover:underline"
      >
        {translate(dict, "db.dialogue.searchAll", {
          fallback: "Search every character's quotes",
        })}{" "}
        →
      </Link>
    </section>
  );
}
