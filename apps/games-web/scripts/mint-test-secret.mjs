// Mint a dev test-supporter secret (see src/lib/test-supporter.ts).
// Usage: bun scripts/mint-test-secret.mjs   (from apps/games-web)
// The output verifies with full perks on dev servers only (NODE_ENV gate) —
// paste it into localStorage account-storage.state.userId or POST it as
// {userId} to /api/patreon/verify on a *-dev.localhost:3100 tenant.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import jwt from "jsonwebtoken";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = readFileSync(join(root, ".env.local"), "utf8");
const jwtSecret = envFile.match(/^JWT_SECRET="?([^"\r\n]+)"?/m)?.[1];
if (!jwtSecret) {
  console.error("JWT_SECRET not found in apps/games-web/.env.local");
  process.exit(1);
}

console.log(jwt.sign("test-supporter", jwtSecret));
