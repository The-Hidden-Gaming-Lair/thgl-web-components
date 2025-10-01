import { fetchVersion } from "@repo/lib";
import { redirect } from "next/navigation";
import { APP_CONFIG } from "@/config";

export default async function MapsPage() {
  const version = await fetchVersion(APP_CONFIG.name);
  const firstMap = Object.keys(version.data.tiles)[0];
  const firstMapName = version.data.enDict[firstMap];
  redirect(`/maps/${firstMapName}`);
}
