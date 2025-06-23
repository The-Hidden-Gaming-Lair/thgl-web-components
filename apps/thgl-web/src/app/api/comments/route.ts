/* eslint-disable @typescript-eslint/no-base-to-string -- necessary to allow conversion of form data to string */
import { sql } from "@vercel/postgres";
import { kv } from "@vercel/kv";
import { type NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { games, postToDiscord } from "@repo/lib";
import {
  getCurrentUser,
  isSupporter,
  type PatreonToken,
  type PatreonUser,
} from "@/lib/patreon";

const DEFAULT_HEADERS = {
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    ...DEFAULT_HEADERS,
    "Access-Control-Allow-Origin": origin,
  };

  const formData = await request.formData();
  const appId = formData.get("app_id");
  const nodeId = formData.get("node_id");
  const text = formData.get("text");
  const userIdValue = formData.get("userId");
  if (!appId || !nodeId || !text || !userIdValue) {
    return Response.json(
      { error: "No app_id, node_id or text provided" },
      { status: 400, headers },
    );
  }
  const game = games.find((a) => a.id === appId);
  if (!game) {
    return Response.json(
      { error: "App not found" },
      {
        status: 404,
        headers,
      },
    );
  }

  let userId: string;
  try {
    userId = verify(userIdValue.toString(), process.env.JWT_SECRET!) as string;
  } catch (error) {
    return Response.json(
      { error: "Invalid or expired userId token" },
      { status: 401, headers },
    );
  }

  const patreonToken = await kv.get<PatreonToken>(`token:${userId}`);
  if (!patreonToken) {
    return Response.json(
      { error: "Token not found" },
      {
        status: 404,
        headers,
      },
    );
  }

  const currentUserResponse = await getCurrentUser(patreonToken);
  const currentUserResult = (await currentUserResponse.json()) as PatreonUser;
  if (!currentUserResponse.ok) {
    return Response.json(
      { userId },
      {
        status: currentUserResponse.status,
        headers,
      },
    );
  }
  const currentUser = currentUserResult;
  if (!isSupporter(currentUser, game)) {
    return Response.json(
      { error: "User is not a patron", currentUser },
      {
        status: 403,
        headers,
      },
    );
  }

  const { rows } =
    await sql`INSERT INTO comments (app_id, node_id, text, user_id) VALUES (${appId.toString()}, ${nodeId.toString()}, ${text.toString()}, ${userId}) RETURNING *`;

  await postToDiscord(
    `New comment from ${userId} on ${appId.toString()}: ${text.toString()}`,
    process.env.DISCORD_WEBHOOK_COMMENTS!,
    "THGL",
  );

  return Response.json(rows, { headers });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    ...DEFAULT_HEADERS,
    "Access-Control-Allow-Origin": origin,
  };
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("app_id");
  const nodeId = searchParams.get("node_id");
  if (!appId || !nodeId) {
    return Response.json(
      { error: "No app_id or node_id provided" },
      { status: 400, headers },
    );
  }

  try {
    const { rows } =
      await sql`SELECT * FROM comments WHERE app_id = ${appId} AND node_id = ${nodeId}`;

    const comments = rows.map((row) => {
      const username = generateUsername(row.user_id as string);
      return {
        ...row,
        username,
      };
    });
    return Response.json(comments, { headers });
  } catch (error) {
    return Response.json([], { headers });
  }
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    ...DEFAULT_HEADERS,
    "Access-Control-Allow-Origin": origin,
  };
  return Response.json({}, { headers });
}

// Arrays of adjectives and nouns
const adjectives = [
  "Arcane",
  "Cunning",
  "Enigmatic",
  "Shadowy",
  "Stealthy",
  "Mystic",
  "Secretive",
  "Elusive",
  "Cryptic",
  "Veiled",
  "Obscure",
  "Mysterious",
  "Shrouded",
  "Hidden",
  "Covert",
  "Legendary",
  "Epic",
  "Daring",
  "Invincible",
  "Fierce",
  "Agile",
  "Bold",
  "Ruthless",
  "Witty",
  "Chilling",
  "Dark",
  "Eerie",
  "Fearless",
  "Powerful",
];

const nouns = [
  "Assassin",
  "Rogue",
  "Guardian",
  "Phantom",
  "Warden",
  "Knight",
  "Slayer",
  "Warrior",
  "Sorcerer",
  "Mage",
  "Raider",
  "Shadow",
  "Specter",
  "Beast",
  "Dragon",
  "Wolf",
  "Raven",
  "Lurker",
  "Lair",
  "Crypt",
  "Cavern",
  "Keep",
  "Stronghold",
  "Dungeon",
  "Outpost",
  "Nexus",
  "Portal",
  "Haven",
  "Sanctum",
  "Fortress",
];

// Simple hash function to generate a consistent seed from userId
function hashUserId(userId: string) {
  let hash = 0;
  const str = userId.toString();
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 10000; // Keep hash small
  }
  return hash;
}

// Function to generate consistent username
function generateUsername(userId: string) {
  const hash = hashUserId(userId); // Generate hash for the userId
  const adjective = adjectives[hash % adjectives.length];
  // eslint-disable-next-line no-bitwise -- necessary to shift bits for a different index
  const noun = nouns[(hash >> 4) % nouns.length]; // Shift bits for a different index
  return `${adjective}${noun}${userId.slice(userId.length - 2)}`; // Combine with userId for uniqueness
}
