import type { Database } from "bun:sqlite";
import { openDB } from "./db";

export type App = {
  name: string;
  db: Database;
  minDistance: number;
};

export const PAX_DEI: App = {
  name: "pax-dei",
  db: openDB("pax-dei.sqlite"),
  minDistance: 1,
};

export const ONCE_HUMAN: App = {
  name: "once-human",
  db: openDB("once-human.sqlite"),
  minDistance: 1,
};

export const PALWORLD: App = {
  name: "palworld",
  db: openDB("palworld.sqlite"),
  minDistance: 1,
};

const apps: App[] = [PAX_DEI, ONCE_HUMAN, PALWORLD];

export function getApp(name: string) {
  return apps.find((app) => app.name === name);
}
