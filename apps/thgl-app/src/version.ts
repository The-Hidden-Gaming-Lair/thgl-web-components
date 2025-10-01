"use server";
import { type CurrentVersion } from "@repo/lib/thgl-app";

export async function getCurrentVersion(): Promise<CurrentVersion> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:48301";

  const [changelogRes, versionRes] = await Promise.all([
    fetch(`${baseUrl}/changelog.md`),
    fetch(`${baseUrl}/version.txt`),
  ]);

  const [changelog, version] = await Promise.all([
    changelogRes.text(),
    versionRes.text(),
  ]);

  return {
    version,
    changelog,
  };
}
