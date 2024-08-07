"use client";
import { cn, useGameState } from "@repo/lib";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../(controls)";
import { useCoordinates, useT } from "../(providers)";

const EVENT_INTERVAL_MINUTES = 60;
const EVENT_DURATION_MINUTES = 60;
const CALIBRATION_START_TIME = Date.UTC(1970, 1, 1, 9, 54, 0);

function calculateHelltideTimeLeft(time: number | null) {
  if (time === null) {
    return "00:00";
  }
  const timeLeft = time - CALIBRATION_START_TIME;
  const elapsedTimeMinutes = Math.floor(timeLeft / (1000 * 60));

  const nextEventTimeMinutes =
    Math.ceil(elapsedTimeMinutes / EVENT_INTERVAL_MINUTES) *
    EVENT_INTERVAL_MINUTES;
  let timeLeftMinutes = nextEventTimeMinutes - elapsedTimeMinutes;
  const eventTimeLeftMinutes =
    EVENT_DURATION_MINUTES - (EVENT_INTERVAL_MINUTES - timeLeftMinutes);
  timeLeftMinutes = eventTimeLeftMinutes;
  const hoursLeft = Math.floor(timeLeftMinutes / 60);
  const minutesLeft = Math.floor(timeLeftMinutes % 60);
  const secondsLeft = Math.floor(60 - ((time / 1000) % 60));
  const timeLeftMiliseconds =
    hoursLeft * 60 * 60 * 1000 + minutesLeft * 60 * 1000 + secondsLeft * 1000;
  return formatTimeLeft(timeLeftMiliseconds);
}

function formatTimeLeft(timeLeft: number) {
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft / (1000 * 60)) % 60);
  const secondsLeft = Math.floor((timeLeft / 1000) % 60);

  let result = "";
  if (hoursLeft > 0) {
    result += `${hoursLeft.toFixed(0)}:`;
  }
  result += `${minutesLeft.toFixed(0).padStart(2, "0")}:`;
  result += `${secondsLeft.toFixed(0).padStart(2, "0")}`;

  return result;
}

type Helltide = {
  e: "Helltide";
  z: string;
};
type WorldBoss = {
  e: "World Boss";
  n: string;
  ts: number;
};
type Legion = {
  e: "Legion";
  t: string | null;
  z: string | null;
  ts: number;
};

export type RECENT_EVENTS = Array<Helltide | WorldBoss | Legion>;

async function getRecentEvents() {
  const response = await fetch(
    location.origin.startsWith("overwolf")
      ? `https://d4armory.io/api/events.json?v=${Date.now()}`
      : `/api/events?v=${Date.now()}`,
  );
  const data = (await response.json()) as RECENT_EVENTS;
  return data;
}

export function Diablo4Events({ portal }: { portal?: boolean }) {
  const t = useT();
  const [time, setTime] = useState<null | number>(null);
  const { data } = useSWR("/api/events", getRecentEvents, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const { nodes } = useCoordinates();
  const addHighlightSpawnIDs = useGameState(
    (state) => state.addHighlightSpawnIDs,
  );
  const removeHighlightSpawnIDs = useGameState(
    (state) => state.removeHighlightSpawnIDs,
  );

  const helltide = data?.find((e) => e.e === "Helltide");
  const legion = data?.find((e) => e.e === "Legion");
  const worldBoss = data?.find((e) => e.e === "World Boss");

  useEffect(() => {
    const timer = setTimeout(() => {
      setTime(Date.now());
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [time]);

  useEffect(() => {
    if (!helltide) {
      return;
    }

    const chestT3s = nodes.find((n) => n.type === "chestT3");
    if (!chestT3s) {
      return;
    }
    const spawnIds = chestT3s.spawns
      .filter(
        (s) =>
          s.id &&
          (t(s.id) === helltide.z || helltide.z.toLowerCase().startsWith(s.id)),
      )
      .map((s) => `${s.id}@${s.p[0]}:${s.p[1]}`);
    addHighlightSpawnIDs(spawnIds);
    return () => {
      removeHighlightSpawnIDs(spawnIds);
    };
  }, [helltide?.z]);

  if (portal) {
    return (
      <div className="fixed top-2 left-12 flex gap-3">
        <Timers
          helltide={helltide}
          worldBoss={worldBoss}
          legion={legion}
          time={time}
          buttonClassName="w-auto"
        />
      </div>
    );
  }
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <div className={cn("md:hidden p-1")}>
            <Button
              variant="ghost"
              size="sm"
              title="Events"
              type="button"
              className="w-full"
            >
              Helltide and Bosses
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Timers
            helltide={helltide}
            worldBoss={worldBoss}
            legion={legion}
            time={time}
          />
        </PopoverContent>
      </Popover>
      <div className="hidden md:block">
        <Timers
          helltide={helltide}
          worldBoss={worldBoss}
          legion={legion}
          time={time}
          buttonClassName="py-2 px-4"
        />
      </div>
    </>
  );
}

function Timers({
  helltide,
  worldBoss,
  legion,
  time,
  buttonClassName,
}: {
  helltide?: Helltide;
  worldBoss?: WorldBoss;
  legion?: Legion;
  time: number | null;
  buttonClassName?: string;
}) {
  const t = useT();
  const legionTimeLeft =
    legion && time ? Math.max(0, legion.ts * 1000 - time) : 0;
  const bossTimeLeft =
    worldBoss && time ? Math.max(0, worldBoss.ts * 1000 - time) : 0;

  return (
    <>
      <button
        className={cn(
          "w-full text-left transition-colors flex gap-2",
          buttonClassName,
        )}
        onClick={() => {
          //
        }}
        title="Helltide"
        type="button"
        disabled
      >
        <span>Helltide</span>
        <span className="grow text-muted-foreground truncate">
          {helltide?.z && helltide.z !== "unkn"
            ? t(helltide.z) || helltide.z
            : ""}
        </span>
        <span>{calculateHelltideTimeLeft(time)}</span>
      </button>
      <button
        className={cn(
          "w-full text-left transition-colors flex gap-2",
          buttonClassName,
        )}
        onClick={() => {
          //
        }}
        title="Legion"
        type="button"
        disabled
      >
        <span>{legionTimeLeft > 0 ? "Next " : ""}Legion</span>
        <span className="grow text-muted-foreground truncate">{legion?.t}</span>
        <span>{formatTimeLeft(legionTimeLeft)}</span>
      </button>
      <button
        className={cn(
          "w-full text-left transition-colors flex gap-2",
          buttonClassName,
        )}
        onClick={() => {
          //
        }}
        title="World Boss"
        type="button"
        disabled
      >
        <span>{bossTimeLeft > 0 ? "Next " : ""}World Boss</span>
        <span className="grow text-muted-foreground truncate">
          {worldBoss?.n}
        </span>
        <span>{formatTimeLeft(bossTimeLeft)}</span>
      </button>
    </>
  );
}
