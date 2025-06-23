export function postToDiscord(
  content: string,
  webhook: string,
  username: string,
) {
  const payload = {
    content,
    username,
  };
  return fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export type DiscordMessageData = {
  text: string;
  images: string[];
  timestamp: number;
};

export async function getInfoMessages(appId: string) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/info/${appId}`,
      {
        // @ts-ignore
        next: { revalidate: 60 },
      },
    );
    const data = (await response.json()) as DiscordMessageData[];

    return data.reverse();
  } catch (e) {
    return [];
  }
}

export async function getUpdateMessages(appId: string) {
  try {
    const response = await fetch(
      `https://discord-bot.th.gl/api/updates/${appId}`,
      {
        // @ts-ignore
        next: { revalidate: 60 },
      },
    );

    let data = (await response.json()) as DiscordMessageData[];

    data = data.map((message) => {
      const match = [...message.text.matchAll(/(?<!_)\*\*(?!_)/g)];
      const firstValid = match?.[0]?.index;

      if (typeof firstValid !== "number") {
        return message;
      }

      return {
        ...message,
        text: message.text.slice(firstValid),
      };
    });

    return data;
  } catch (e) {
    return [];
  }
}
