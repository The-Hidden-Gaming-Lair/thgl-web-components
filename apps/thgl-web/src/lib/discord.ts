import { Game } from "@repo/lib";

interface DiscordMessage {
  text: string;
  images: string[];
  timestamp: number;
}

export async function getInfoMessages(game: Game) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/info/${game.id}`,
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

export async function getUpdateMessages(game: Game) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/updates/${game.id}`,
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
    );
    const data = (await response.json()) as DiscordMessage[];
    return data;
  } catch (e) {
    return [];
  }
}
