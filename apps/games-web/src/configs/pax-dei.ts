import { resolveAppConfig } from "@repo/lib";

export const paxDei = resolveAppConfig({
  name: "pax-dei",
  supportedLocales: ["en"],
  // The publisher refused a PUBLIC companion app (see memory), so the website
  // stays as-is: no live mode, no "In-Game App" CTA. The THGLApp companion
  // exists but is INVITE ONLY (games.ts `companion.inviteOnly`) and must not
  // be advertised here — keep appUrl null.
  appUrl: null,
  withoutLiveMode: true,
  externalLinks: [
    { href: "https://paxdei.gaming.tools?ref=thgl", title: "Database" },
  ],
  keywords: ["Gateways", "Resources"],
});
