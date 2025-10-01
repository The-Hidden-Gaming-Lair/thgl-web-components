import { promisifyOverwolf } from "./promisify";

export async function logVersion() {
  try {
    const manifest = await promisifyOverwolf(
      overwolf.extensions.current.getManifest,
    )();
    console.log(`Version: ${manifest.meta.version}`);
  } catch (err) {
    console.error(err);
  }
}
