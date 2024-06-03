import Discord from "next-auth/providers/discord";
import type { NextAuthConfig } from "next-auth";

export default { providers: [Discord] } satisfies NextAuthConfig;
