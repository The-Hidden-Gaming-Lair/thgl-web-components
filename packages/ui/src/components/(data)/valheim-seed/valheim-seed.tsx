"use client";
import { cn, useSettingsStore } from "@repo/lib";
import {
  Dice5,
  FoldVertical,
  Link2,
  RotateCcw,
  UnfoldVertical,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { useValheimSeedStatus, useValheimSeedStore } from "./store";
import { loadWorldgenConfig, type WorldgenConfig } from "./worldgen-client";

// Terrain generation version stored in the save: worlds keep the one they were created with.
const VERSIONS: { value: number; label: string }[] = [
  { value: 2, label: "Current" },
  { value: 1, label: "Legacy (v1)" },
  { value: 0, label: "Legacy (v0)" },
];

// The game's own random seeds: 10 characters of [A-Za-z0-9].
const SEED_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const randomSeed = () =>
  Array.from(
    { length: 10 },
    () => SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)],
  ).join("");

export function ValheimSeed() {
  const [open, setOpen] = useState(true);
  const lockedWindow = useSettingsStore((s) => s.lockedWindow);
  const seed = useValheimSeedStore((s) => s.seed);
  const worldGenVersion = useValheimSeedStore((s) => s.worldGenVersion);
  const setSeed = useValheimSeedStore((s) => s.setSeed);
  const setWorldGenVersion = useValheimSeedStore((s) => s.setWorldGenVersion);
  const status = useValheimSeedStatus();
  const [cfg, setCfg] = useState<WorldgenConfig | null>(null);
  const [seedText, setSeedText] = useState(seed);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWorldgenConfig()
      .then(setCfg)
      .catch(() => {});
  }, []);

  // the persisted seed hydrates after the first render
  useEffect(() => setSeedText(seed), [seed]);

  // The URL is the shareable source of truth: apply ?seed= / ?wgv= on mount.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get("seed");
    if (s) {
      setSeed(s);
      setSeedText(s);
      const v = Number(p.get("wgv"));
      if (VERSIONS.some((x) => x.value === v)) setWorldGenVersion(v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (raw: string) => {
    const s = raw.trim();
    setSeed(s);
    setSeedText(s);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed);
    url.searchParams.set("wgv", String(worldGenVersion));
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
    setSeed("");
    setSeedText("");
    setWorldGenVersion(2);
    const url = new URL(window.location.href);
    url.searchParams.delete("seed");
    url.searchParams.delete("wgv");
    window.history.replaceState(null, "", url.toString());
  };

  if (lockedWindow) return <></>;

  const active = !!seed;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center transition-colors w-full px-1.5">
        <CollapsibleTrigger asChild>
          <button
            className="text-left transition-colors hover:text-primary p-1 pr-2 truncate grow flex items-center justify-between"
            title="Show the map of your own Valheim world seed"
            type="button"
          >
            <span className="font-semibold flex items-center gap-1.5">
              World Seed
              {active && (
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
          Every Valheim world is generated from its seed. Enter yours to see its
          terrain, bosses, traders, dungeons and every other location.{" "}
          {cfg && !active && (
            <>
              Showing the example seed{" "}
              <span className="font-mono not-italic">{cfg.defaultSeed}</span>.
            </>
          )}
        </p>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Seed (case-sensitive)
        </label>
        <div className="flex items-center gap-1.5">
          <Input
            value={seedText}
            spellCheck={false}
            maxLength={32}
            className="font-mono h-8"
            placeholder={cfg?.defaultSeed ?? "e.g. HiddenLair"}
            onChange={(e) => setSeedText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                commit((e.target as HTMLInputElement).value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Random seed"
            onClick={() => commit(randomSeed())}
            className="size-8 shrink-0 hover:text-primary hover:border-primary/50"
          >
            <Dice5 className="size-6" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            World generation
          </label>
          <Select
            value={String(worldGenVersion)}
            onValueChange={(v) => setWorldGenVersion(Number(v))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERSIONS.map((v) => (
                <SelectItem key={v.value} value={String(v.value)}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {active && (
          <div className="text-xs tabular-nums text-muted-foreground">
            {status.phase === "locations" && (
              <>Placing locations… {status.locations.toLocaleString()}</>
            )}
            {status.phase === "resources" && (
              <>
                {status.locations.toLocaleString()} locations · placing
                resources… {Math.round(status.progress * 100)}%
              </>
            )}
            {status.phase === "ready" && (
              <>
                {status.locations.toLocaleString()} locations ·{" "}
                {status.resources.toLocaleString()} resources generated
              </>
            )}
            {status.phase === "error" && (
              <span className="text-destructive">{status.error}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={copyShareLink}
            disabled={!active}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors",
              active ? "hover:text-primary" : "opacity-50 cursor-not-allowed",
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy link"}
          </button>
          {active && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Example seed
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          World generation by{" "}
          <a
            href="https://valheim.gaming.tools"
            target="_blank"
            rel="noopener"
            className="underline hover:text-primary"
          >
            Gaming Tools
          </a>
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
