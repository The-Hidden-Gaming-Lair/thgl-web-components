import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  createRootLayout,
  createRootLayoutMetadata,
  rootLayoutViewport,
} from "@repo/ui/apps";
import { createDbRootLayout } from "@/lib/db/root-layout";
import { getAppConfig } from "@/lib/get-app-config";

export const viewport = rootLayoutViewport;

/** True on the deployed production build; false on the local dev server. */
const isProd = process.env.NODE_ENV === "production";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig();
  if (config.name === "thgl-app") return {};
  // In-development tenants are placeholder-only in prod — don't index them.
  if (config.inDevelopment && isProd) {
    return {
      title: `${config.title} — Coming Soon`,
      robots: { index: false, follow: false },
    };
  }
  return createRootLayoutMetadata(config);
}

export default async function Layout(
  props: Parameters<ReturnType<typeof createRootLayout>>[0],
) {
  const config = await getAppConfig();
  // thgl-app has its own root layout under (app)/ — refuse to render the
  // games-web public chrome (which would try to fetch a CDN version.json
  // that doesn't exist for the app tenant). Hitting /, /maps, /guides
  // etc. on app.th.gl returns 404, matching production behaviour where
  // those URLs were never served.
  if (config.name === "thgl-app") notFound();
  // In-development gate: on the deployed prod build, a tenant marked
  // `inDevelopment` renders a placeholder for its ENTIRE site. The local dev
  // server (isProd === false) still renders the real map/codex for continued
  // work. Replaces the root layout entirely (its own <html>), so no game chrome.
  if (config.inDevelopment && isProd) {
    return (
      <html lang="en" className="dark">
        <body className="bg-slate-950 text-slate-100 antialiased">
          <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Coming Soon
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">{config.title}</h1>
            <p className="max-w-md text-slate-400">
              This companion site is still in development and isn&apos;t
              available yet. Check back soon!
            </p>
            <a
              href="https://www.th.gl"
              className="mt-2 text-sm text-amber-400 hover:underline"
            >
              ← The Hidden Gaming Lair
            </a>
          </main>
        </body>
      </html>
    );
  }
  const RootLayout = config.db
    ? createDbRootLayout(config)
    : createRootLayout(config);
  return RootLayout(props);
}
