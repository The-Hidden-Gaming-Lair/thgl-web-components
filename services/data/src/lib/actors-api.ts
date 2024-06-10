import { Actors } from "../types.js";

export async function fetchActors(app: string) {
  const response = await fetch(
    `https://actors-api.th.gl/nodes/wuthering-waves/${app}`,
  );
  const data = (await response.json()) as Actors;
  return data;
}
