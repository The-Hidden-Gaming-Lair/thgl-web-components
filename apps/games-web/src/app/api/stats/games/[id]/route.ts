import {
  BadRequestError,
  corsPreflight,
  ForbiddenError,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { requireStatusAdmin } from "@/lib/status-admin";
import {
  deleteGame,
  getGame,
  getGameDetail,
  updateGame,
  type GamePatch,
} from "@/lib/stats-db";
import {
  PLATFORM_CLIENTS,
  PUBLIC_STATUSES,
  STATS_STATUSES,
  type PlatformEntry,
} from "@/lib/stats-types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const detail = await getGameDetail(id);
    if (!detail || !PUBLIC_STATUSES.includes(detail.status)) {
      throw new NotFoundError("Game not found");
    }
    return jsonResponse(detail);
  });
}

const optionalString = (v: unknown, field: string, max = 300) => {
  if (v === null || v === "") return null;
  if (typeof v !== "string" || v.length > max) {
    throw new BadRequestError(`Invalid ${field}`);
  }
  return v.trim();
};

function parsePlatforms(v: unknown): PlatformEntry[] {
  if (!Array.isArray(v)) throw new BadRequestError("Invalid platforms");
  return v.map((p) => {
    const entry = p as Partial<PlatformEntry>;
    if (!PLATFORM_CLIENTS.includes(entry.client as never)) {
      throw new BadRequestError(
        `Invalid platform client ${String(entry.client)}`,
      );
    }
    if (entry.url !== undefined && !/^https:\/\//.test(entry.url)) {
      throw new BadRequestError("Platform urls must be https");
    }
    return {
      client: entry.client!,
      ...(entry.url ? { url: entry.url } : {}),
      ...(entry.status ? { status: entry.status } : {}),
    };
  });
}

/** Admin edit (PATREON_SPECIAL_USERS). */
export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireStatusAdmin(request))) throw new ForbiddenError();
    const { id } = await params;
    const existing = await getGame(id);
    if (!existing) throw new NotFoundError("Game not found");
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) throw new BadRequestError("Invalid JSON");

    const patch: GamePatch = {};
    if ("title" in body) {
      const title = optionalString(body.title, "title", 120);
      if (!title) throw new BadRequestError("Title required");
      patch.title = title;
    }
    if ("status" in body) {
      if (!STATS_STATUSES.includes(body.status as never)) {
        throw new BadRequestError("Invalid status");
      }
      patch.status = body.status as GamePatch["status"];
    }
    if ("steamAppId" in body) {
      const v = body.steamAppId;
      if (
        v !== null &&
        (typeof v !== "number" || !Number.isInteger(v) || v <= 0)
      ) {
        throw new BadRequestError("Invalid steamAppId");
      }
      patch.steamAppId = v as number | null;
    }
    if ("platforms" in body) patch.platforms = parsePlatforms(body.platforms);
    for (const key of [
      "thglId",
      "imageUrl",
      "releaseDate",
      "url",
      "twitchGameId",
      "note",
    ] as const) {
      if (key in body)
        patch[key] = optionalString(
          body[key],
          key,
          key === "note" ? 1000 : 300,
        );
    }
    if ("discordInvite" in body) {
      patch.discordInvite = optionalString(
        body.discordInvite,
        "discordInvite",
        100,
      );
      // A new invite must be re-pinned to its guild on the next resolve.
      if (patch.discordInvite !== existing.discordInvite)
        patch.discordGuildId = null;
    }
    await updateGame(id, patch);
    return jsonResponse(await getGame(id));
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireStatusAdmin())) throw new ForbiddenError();
    const { id } = await params;
    await deleteGame(id);
    return jsonResponse({ ok: true });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
