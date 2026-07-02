"use client";
import { cn, useSettingsStore } from "@repo/lib";
import {
  Dice5,
  FoldVertical,
  Link2,
  RotateCcw,
  UnfoldVertical,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useSatisfactorySeedStore } from "./store";
import { seedPuritySummary } from "./transform";
import type { PuritySettings, RandomizationMode } from "./types";
import { useSatisfactorySeedTransform } from "./use-seed-transform";

const MODES: { value: RandomizationMode; label: string }[] = [
  { value: "strict", label: "Random" },
  { value: "basic_rich", label: "More basic nodes" },
  { value: "advanced_rich", label: "More advanced nodes" },
  { value: "fossil_fuel_rich", label: "More fossil fuels" },
  { value: "none", label: "None (purity only)" },
];

const PURITIES: { value: PuritySettings; label: string }[] = [
  { value: "no_change", label: "Unchanged" },
  { value: "all_random", label: "Random" },
  { value: "increase", label: "Increase" },
  { value: "decrease", label: "Decrease" },
  { value: "all_pure", label: "All pure" },
  { value: "all_normal", label: "All normal" },
  { value: "all_impure", label: "All impure" },
];

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const randomSeed = () => (Math.random() * 0x100000000) | 0; // random int32

export function SatisfactorySeed() {
  const [open, setOpen] = useState(false);
  const lockedWindow = useSettingsStore((s) => s.lockedWindow);

  const enabled = useSatisfactorySeedStore((s) => s.enabled);
  const seed = useSatisfactorySeedStore((s) => s.seed);
  const mode = useSatisfactorySeedStore((s) => s.mode);
  const purity = useSatisfactorySeedStore((s) => s.purity);
  const setEnabled = useSatisfactorySeedStore((s) => s.setEnabled);
  const setSeed = useSatisfactorySeedStore((s) => s.setSeed);
  const setMode = useSatisfactorySeedStore((s) => s.setMode);
  const setPurity = useSatisfactorySeedStore((s) => s.setPurity);
  const apply = useSatisfactorySeedStore((s) => s.apply);

  // Installs the static-nodes transform while enabled; also gives us base data.
  const { base } = useSatisfactorySeedTransform();

  const [seedText, setSeedText] = useState(String(seed));
  const [copied, setCopied] = useState(false);

  // The URL is the shareable source of truth: apply ?seed / ?smode / ?spurity on mount.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get("seed");
    if (s !== null && s !== "" && !Number.isNaN(Number(s))) {
      const parsed = Math.max(
        INT32_MIN,
        Math.min(INT32_MAX, Math.trunc(Number(s))),
      );
      const m = p.get("smode") as RandomizationMode | null;
      const pu = p.get("spurity") as PuritySettings | null;
      apply({
        enabled: true,
        seed: parsed,
        mode: m && MODES.some((x) => x.value === m) ? m : undefined,
        purity: pu && PURITIES.some((x) => x.value === pu) ? pu : undefined,
      });
      setSeedText(String(parsed));
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(
    () =>
      enabled && base ? seedPuritySummary(base, { seed, mode, purity }) : null,
    [enabled, base, seed, mode, purity],
  );

  const commitSeed = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) return;
    const clamped = Math.max(INT32_MIN, Math.min(INT32_MAX, Math.trunc(n)));
    setSeed(clamped);
    setSeedText(String(clamped));
    if (!enabled) setEnabled(true);
  };

  const rollSeed = () => {
    const n = randomSeed();
    setSeed(n);
    setSeedText(String(n));
    if (!enabled) setEnabled(true);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", String(seed));
    url.searchParams.set("smode", mode);
    url.searchParams.set("spurity", purity);
    window.history.replaceState(null, "", url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked; the URL is updated regardless
    }
  };

  const reset = () => {
    setEnabled(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("seed");
    url.searchParams.delete("smode");
    url.searchParams.delete("spurity");
    window.history.replaceState(null, "", url.toString());
  };

  if (lockedWindow) {
    return <></>;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center transition-colors w-full px-1.5">
        <CollapsibleTrigger asChild>
          <button
            className="text-left transition-colors hover:text-primary p-1 pr-2 truncate grow flex items-center justify-between"
            title="Show your custom world seed's randomized minerals"
            type="button"
          >
            <span className="font-semibold flex items-center gap-1.5">
              World Seed
              {enabled && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-amber-500">
                  active
                </span>
              )}
            </span>
            {open ? (
              <FoldVertical className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-col gap-2 px-2.5 py-1.5">
        <p className="text-xs text-muted-foreground italic">
          Enter your save&apos;s world seed to show its randomized mineral
          placement. Only affects worlds created with resource randomization
          enabled.
        </p>

        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Seed
        </label>
        <div className="flex items-center gap-1.5">
          <Input
            value={seedText}
            inputMode="numeric"
            spellCheck={false}
            className="font-mono h-8"
            placeholder="e.g. 123456789"
            onChange={(e) => setSeedText(e.target.value)}
            onBlur={(e) => commitSeed(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                commitSeed((e.target as HTMLInputElement).value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Randomize seed"
            onClick={rollSeed}
            className="size-8 shrink-0 hover:text-primary hover:border-primary/50"
          >
            <Dice5 className="size-6" />
          </Button>
        </div>

        <div className="flex gap-1.5">
          <div className="flex flex-col gap-1 grow">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Mode
            </label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as RandomizationMode)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 grow">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Purity
            </label>
            <Select
              value={purity}
              onValueChange={(v) => setPurity(v as PuritySettings)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {summary && (
          <div className="text-xs tabular-nums text-muted-foreground">
            <span className="text-emerald-400">Pure {summary.pure}</span>
            {" · "}
            <span>Normal {summary.normal}</span>
            {" · "}
            <span className="text-amber-600">Impure {summary.impure}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={copyShareLink}
            disabled={!enabled}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors",
              enabled ? "hover:text-primary" : "opacity-50 cursor-not-allowed",
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy link"}
          </button>
          {enabled && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Default world
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
