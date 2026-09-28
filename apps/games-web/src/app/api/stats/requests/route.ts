import {
  BadRequestError,
  corsPreflight,
  handle,
  jsonResponse,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { requestOtherGame, requestSteamGame } from "@/lib/stats-requests";

/** Request a game as a signed-in (Patreon) user. Logic: lib/stats-requests.ts. */
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await requireAccount();
    const body = (await request.json().catch(() => null)) as {
      steamAppId?: unknown;
      title?: unknown;
      url?: unknown;
    } | null;
    if (!body) throw new BadRequestError("Invalid JSON");
    const result =
      body.steamAppId !== undefined
        ? await requestSteamGame(userId, Number(body.steamAppId))
        : await requestOtherGame(userId, body.title, body.url);
    return jsonResponse(result);
  });
}

export function OPTIONS() {
  return corsPreflight();
}
