import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { isSpecialUser } from "@/games/thgl-web/lib/patreon";

/** Admin = signed userId cookie whose id is in PATREON_SPECIAL_USERS. */
export async function requireStatusAdmin(): Promise<string | null> {
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
