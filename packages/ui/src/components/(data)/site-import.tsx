"use client";

import { useState, useCallback, useMemo } from "react";
import { DATA_FORGE_URL, useSettingsStore, openFileOrFiles } from "@repo/lib";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { toast } from "sonner";
import {
  Upload,
  Copy,
  Loader2,
  AlertCircle,
  FileCheck,
  ExternalLink,
  FileUp,
  ChevronDown,
} from "lucide-react";
import { importSourcesForGame, type ImportSource } from "./import-sources";

const DISCORD_URL = "https://th.gl/discord";

type ImportResult = {
  discoveredNodeIds: string[];
  groups: Record<string, string[]>;
  groupLabels: Record<string, string>;
  summary: {
    input: number;
    matched: number;
    unmatched: number;
    byGroup: Record<string, number>;
  };
  error?: string;
};

type State =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "result"; data: ImportResult }
  | { step: "error"; message: string };

const FAQ_URL = "https://www.th.gl/faq/import-progress-from-another-map-site";

/**
 * "Import from another site" — a paste-based importer that translates a user's
 * progress from a third-party map (e.g. appsample) into discovered nodes via the
 * data-forge /api/import endpoint. Renders nothing when no source covers the
 * current game. Launched from the settings "Discovered Nodes" section.
 */
export function SiteImport({ activeApp }: { activeApp: string }) {
  const sources = useMemo(() => importSourcesForGame(activeApp), [activeApp]);
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? "");
  const [pasted, setPasted] = useState("");
  const [state, setState] = useState<State>({ step: "idle" });
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const discoveredNodes = useSettingsStore((s) => s.discoveredNodes);
  const setDiscoveredNodes = useSettingsStore((s) => s.setDiscoveredNodes);
  const setDiscoveredNodesBulk = useSettingsStore(
    (s) => s.setDiscoveredNodesBulk,
  );

  const source: ImportSource | undefined =
    sources.find((s) => s.id === sourceId) ?? sources[0];

  const selectedCount = useMemo(() => {
    if (state.step !== "result") return 0;
    let n = 0;
    for (const cat of selectedGroups) n += state.data.groups[cat]?.length ?? 0;
    return n;
  }, [state, selectedGroups]);

  if (sources.length === 0 || !source) return null;

  const reset = () => {
    setState({ step: "idle" });
    setPasted("");
    setSelectedGroups(new Set());
  };

  const handleImport = useCallback(async () => {
    if (!pasted.trim()) {
      toast.error("Paste your exported data first");
      return;
    }
    setState({ step: "loading" });
    try {
      const res = await fetch(
        `${DATA_FORGE_URL}/api/import?source=${encodeURIComponent(
          source.id,
        )}&game=${encodeURIComponent(activeApp)}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: pasted,
        },
      );
      const data: ImportResult = await res.json();
      if (!res.ok || data.error) {
        setState({ step: "error", message: data.error || "Import failed" });
        return;
      }
      // Default: select every group that matched something.
      setSelectedGroups(
        new Set(Object.keys(data.groups).filter((c) => data.groups[c].length)),
      );
      setState({ step: "result", data });
    } catch {
      setState({
        step: "error",
        message: "Could not reach the import service",
      });
    }
  }, [pasted, source, activeApp]);

  const apply = useCallback(
    (merge: boolean) => {
      if (state.step !== "result") return;
      const ids = [...selectedGroups].flatMap(
        (cat) => state.data.groups[cat] ?? [],
      );
      if (ids.length === 0) {
        toast.error("Nothing selected");
        return;
      }
      if (merge) {
        const before = discoveredNodes.length;
        setDiscoveredNodesBulk(ids, true);
        const added =
          useSettingsStore.getState().discoveredNodes.length - before;
        toast.success(`Added ${added} new discoveries`);
      } else {
        setDiscoveredNodes([...new Set(ids)]);
        toast.success(`Set ${ids.length} discovered locations`);
      }
      setOpen(false);
      reset();
    },
    [
      state,
      selectedGroups,
      discoveredNodes,
      setDiscoveredNodes,
      setDiscoveredNodesBulk,
    ],
  );

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Upload className="h-3.5 w-3.5" />
        Import from another site
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import progress from another site
            </DialogTitle>
            <DialogDescription>
              Bring your found markers over from another interactive map. This
              is a one-time copy — it marks matching locations as discovered
              here.
            </DialogDescription>
          </DialogHeader>

          {/* Only the body scrolls; the header + close button stay fixed.
              This is the 1fr grid row — min-h-0 lets it shrink so it scrolls
              natively instead of overflowing the dialog. Scrollbar is themed
              globally (see globals.css). */}
          <div className="min-h-0 overflow-y-auto -mr-3 pr-3">
            <div className="space-y-4">
              {/* Source selector (only when more than one covers this game) */}
              {sources.length > 1 && (
                <Select value={source.id} onValueChange={setSourceId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Export instructions — collapsed by default; grows as we add
                  more sites, each with its own snippet. */}
              <Collapsible className="border rounded-md">
                <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/40">
                  <span>How to export from {source.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 space-y-2 text-sm">
                  <a
                    href={source.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Open {source.name} <ExternalLink className="h-3 w-3" />
                  </a>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                    {source.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <div className="relative">
                    <pre
                      style={{ maxHeight: "7rem" }}
                      className="text-[10px] leading-relaxed bg-muted/40 border rounded-md p-2 pr-9 overflow-auto whitespace-pre-wrap break-all"
                    >
                      {source.snippet}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      style={{ top: "0.25rem", right: "0.6rem" }}
                      className="absolute h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(source.snippet);
                        toast.success("Snippet copied");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Request-a-site note */}
              <p className="text-xs text-muted-foreground">
                Use a different map site?{" "}
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-2 hover:no-underline"
                >
                  Request it on our Discord
                </a>
                .
              </p>

              {/* Upload the downloaded file, or paste the data */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Upload the file, or paste your data
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={async () => {
                      const file = await openFileOrFiles();
                      if (!file) return;
                      const text = await file.text();
                      setPasted(text);
                      if (state.step !== "idle") setState({ step: "idle" });
                    }}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Choose file
                  </Button>
                </div>
                <Textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder='Upload thgl-map-progress.json above, or paste e.g. ["8685","8686", ...]'
                  className="font-mono text-xs h-24"
                  spellCheck={false}
                />
              </div>

              {state.step === "idle" && (
                <Button
                  className="w-full gap-2"
                  onClick={handleImport}
                  disabled={!pasted.trim()}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              )}

              {state.step === "loading" && (
                <Button className="w-full gap-2" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Matching locations...
                </Button>
              )}

              {state.step === "error" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 rounded-md p-3 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {state.message}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setState({ step: "idle" })}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {state.step === "result" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileCheck className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-medium">
                      {state.data.summary.matched.toLocaleString()} of{" "}
                      {state.data.summary.input.toLocaleString()} markers
                      matched
                    </span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      Select what to mark
                    </span>
                  </div>

                  <div className="border rounded-md overflow-hidden divide-y">
                    {Object.keys(state.data.groups)
                      .filter((cat) => state.data.groups[cat].length)
                      .map((cat) => {
                        const checked = selectedGroups.has(cat);
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/40 ${
                              checked ? "bg-muted/20" : "opacity-60"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                setSelectedGroups((prev) => {
                                  const next = new Set(prev);
                                  next.has(cat)
                                    ? next.delete(cat)
                                    : next.add(cat);
                                  return next;
                                })
                              }
                            />
                            <span className="flex-1 text-sm">
                              {state.data.groupLabels[cat] ?? cat}
                            </span>
                            <span className="text-xs font-medium tabular-nums">
                              {state.data.groups[cat].length.toLocaleString()}
                            </span>
                          </label>
                        );
                      })}
                  </div>

                  {state.data.summary.unmatched > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {state.data.summary.unmatched.toLocaleString()} marker
                      {state.data.summary.unmatched === 1 ? "" : "s"}{" "}
                      couldn&apos;t be matched (types not on this map, or areas
                      not yet supported) and will be skipped.
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1"
                      onClick={() => apply(true)}
                      disabled={selectedCount === 0}
                    >
                      Merge ({selectedCount.toLocaleString()})
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => apply(false)}
                      disabled={selectedCount === 0}
                    >
                      Replace all
                    </Button>
                  </div>
                </div>
              )}

              <a
                href={FAQ_URL}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                How does this work?
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
