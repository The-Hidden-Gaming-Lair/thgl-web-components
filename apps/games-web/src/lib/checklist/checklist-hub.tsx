"use client";

import Link from "next/link";
import { localizePath, translate } from "@repo/lib";
import { ProgressBar } from "./checklist-view";
import { useChecklistProgress } from "./use-checklist-progress";

export type ChecklistHubSection = {
  section: string;
  label: string;
  icon: string;
  total: number;
  /** Entry ids, so ticks of entries a patch removed are not counted. */
  ids: string[];
};

/** `/checklist` hub cards with this viewer's progress per section. */
export function ChecklistHub({
  appName,
  sections,
  labels,
  locale,
}: {
  appName: string;
  sections: ChecklistHubSection[];
  labels: Record<string, string>;
  locale: string;
}) {
  const { progress } = useChecklistProgress(appName);
  const L = (key: string, fallback: string, vars?: Record<string, string>) =>
    translate(labels, `checklist.${key}`, { fallback, vars });

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {sections.map((s) => {
        const ids = new Set(s.ids);
        const done = (progress[s.section] ?? []).filter((id) =>
          ids.has(id),
        ).length;
        const percent = s.total ? Math.floor((done / s.total) * 1000) / 10 : 0;
        return (
          <li key={s.section}>
            <Link
              href={localizePath(`/checklist/${s.section}`, locale)}
              className="block rounded-md border border-slate-800 bg-slate-900/40 p-3 transition-colors hover:border-slate-600 hover:bg-slate-900"
            >
              <div className="mb-2 flex items-center gap-2">
                <span aria-hidden className="text-lg">
                  {s.icon}
                </span>
                <span className="font-medium">
                  {L("sectionTitle", "{{section}} Checklist", {
                    section: s.label,
                  })}
                </span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {done.toLocaleString(locale)} /{" "}
                  {s.total.toLocaleString(locale)}
                </span>
              </div>
              <ProgressBar
                done={done}
                total={s.total}
                percent={percent}
                label={L("progress", "{{done}} of {{total}} ({{percent}}%)", {
                  done: done.toLocaleString(locale),
                  total: s.total.toLocaleString(locale),
                  percent: percent.toLocaleString(locale),
                })}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
