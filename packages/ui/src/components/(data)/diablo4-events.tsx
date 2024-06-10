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

export type RECENT_EVENTS = {
  boss: {
    name: string;
    expectedName: string;
    nextExpectedName: string;
    timestamp: number;
    expected: number;
    nextExpected: number;
    territory: string;
    zone: string;
  };
  helltide: {
    timestamp: number;
    zone: string;
    refresh: number;
  };
  legion: {
    timestamp: number;
    territory: string;
    zone: string;
    expected: number;
    nextExpected: number;
  };
};

async function getRecentEvents() {
  const response = await fetch(
    location.origin.startsWith("overwolf")
      ? `https://d4armory.io/api/events/recent?v=${Date.now()}`
      : `/api/events?v=${Date.now()}`,
  );
  const data = (await response.json()) as RECENT_EVENTS;
  return data;
}

export function Diablo4Events({ portal }: { portal?: boolean }) {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setTime(Date.now());
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [time]);

  useEffect(() => {
    if (!data?.helltide) {
      return;
    }

    const chestT3s = nodes.find((n) => n.type === "chestT3");
    if (!chestT3s) {
      return;
    }
    const spawnIds = chestT3s.spawns
      .filter((s) => s.id?.includes(data.helltide.zone))
      .map((s) => `${s.id}@${s.p[0]}:${s.p[1]}`);
    addHighlightSpawnIDs(spawnIds);
    return () => {
      removeHighlightSpawnIDs(spawnIds);
    };
  }, [data?.helltide.timestamp]);

  if (portal) {
    return (
      <div className="fixed top-2 left-12 flex gap-3">
        <Timers data={data} time={time} buttonClassName="w-auto" />
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
          <Timers data={data} time={time} />
        </PopoverContent>
      </Popover>
      <div className="hidden md:block">
        <Timers data={data} time={time} buttonClassName="py-2 px-4" />
      </div>
    </>
  );
}

function Timers({
  data,
  time,
  buttonClassName,
}: {
  data?: RECENT_EVENTS;
  time: number | null;
  buttonClassName?: string;
}) {
  const t = useT();

  const legionTimeLeft =
    data && time
      ? Math.max(0, data.legion.timestamp * 1000 - time) ||
        Math.max(0, data.legion.expected * 1000 - time)
      : 0;
  const bossTimeLeft =
    data && time
      ? Math.max(0, data.boss.timestamp * 1000 - time) ||
        Math.max(0, data.boss.expected * 1000 - time)
      : 0;

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
          {data?.helltide.zone && data.helltide.zone !== "unkn"
            ? t(data.helltide.zone) ?? data.helltide.zone
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
        <span className="grow text-muted-foreground truncate">
          {data?.legion.territory}
        </span>
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
          {data?.boss.expectedName}
        </span>
        <span>{formatTimeLeft(bossTimeLeft)}</span>
      </button>
    </>
  );
}
