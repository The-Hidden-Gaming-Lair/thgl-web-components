import { type App } from "./apps";

interface DiscordMessage {
  text: string;
  images: string[];
  timestamp: number;
}

export async function getInfoMessages(app: App) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/info/${app.id}`,
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
    );
    const data = await response.json();
    return data.reverse() as DiscordMessage[];
  } catch (e) {
    return [];
  }
}

export async function getUpdateMessages(app: App) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/updates/${app.id}`,
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
    );
    const data = await response.json();
    return data as DiscordMessage[];
  } catch (e) {
    return [];
  }
}
