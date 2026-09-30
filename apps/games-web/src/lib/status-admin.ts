import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { isSpecialUser } from "@/games/thgl-web/lib/patreon";

/**
 * Admin = signed userId cookie whose id is in PATREON_SPECIAL_USERS. With `request`, the bot
 * secret (`Authorization: Bearer <STATS_BOT_SECRET>`) also counts - the inbox agent sets a
 * request's status (in_progress / declined) after Leon approves or declines the game.
 */
export async function requireStatusAdmin(
  request?: Request,
): Promise<string | null> {
  const bearer = request?.headers.get("Authorization");
  const botSecret = process.env.STATS_BOT_SECRET;
  if (botSecret && bearer === `Bearer ${botSecret}`) return "bot";
  const cookieStore = await cookies();
  const raw = cookieStore.get("userId")?.value;
  if (!raw || !process.env.JWT_SECRET) return null;
  try {
    const decoded = verify(raw, process.env.JWT_SECRET);
    const id =
      typeof decoded === "string"
        ? decoded
        : ((decoded as { u?: string }).u ?? null);
    return id && isSpecialUser(id) ? id : null;
  } catch {
    return null;
  }
}
