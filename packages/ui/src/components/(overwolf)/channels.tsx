import { useAccountStore, useGameState } from "@repo/lib";
import { promisifyOverwolf } from "@repo/lib/overwolf";
import useSWR from "swr";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { ExternalAnchor } from "../(header)";
import { Button } from "../ui/button";

export function Channels() {
  const previewReleaseAccess = useAccountStore(
    (state) => state.previewReleaseAccess,
  );
  const isUpdatingApp = useGameState((state) => state.isUpdatingApp);
  const setIsUpdatingApp = useGameState((state) => state.setIsUpdatingApp);

  const { data: extensionSettings, mutate: refreshExtensionSettings } = useSWR(
    "extensionSettings",
    () => promisifyOverwolf(overwolf.settings.getExtensionSettings)(),
  );
  const { data: manifest } = useSWR("manifest", () =>
    promisifyOverwolf(overwolf.extensions.current.getManifest)(),
  );
  const { data: extensionUpdate, mutate: refreshCheckForExtensionUpdate } =
    useSWR("extensionUpdate", () =>
      promisifyOverwolf(overwolf.extensions.checkForExtensionUpdate)(),
    );

  const version = manifest?.meta.version;
  const channel = extensionSettings?.settings?.channel || "production";
  let state = extensionUpdate?.state || "UpToDate";
  if (version === extensionUpdate?.updateVersion) {
    state = "UpToDate";
  }
  return (
    <>
      <h4 className="text-md font-semibold">Status</h4>
      <div className="flex items-center justify-between">
        <Label htmlFor="preview-release">Preview Access</Label>
        <Switch
          id="preview-release"
          checked={channel === "preview-access"}
          onCheckedChange={(checked) => {
            promisifyOverwolf(overwolf.settings.setExtensionSettings)({
              channel: checked ? "preview-access" : "production",
            })
              .then(() => refreshExtensionSettings())
              .then(() => refreshCheckForExtensionUpdate())
              .then(() =>
                console.log(
                  `Changed channel to ${checked ? "preview-access" : "production"}`,
                ),
              )
              .catch(console.error);
          }}
          disabled={!previewReleaseAccess}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        By activating preview releases, you'll unlock early access to the latest
        features before they're released to the public. This exclusive perk is
        reserved for{" "}
        <ExternalAnchor
          href="https://www.th.gl/support-me"
          className="hover:text-white text-primary"
        >
          Elite Supporters
        </ExternalAnchor>
        .
      </p>
      <div className="flex items-center gap-2 justify-between text-sm">
        <span>Version</span>
        <span>{version}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {state === "UpToDate" && "You are up-to-date!"}
        {state === "UpdateAvailable" && !isUpdatingApp && (
          <>
            A new version is ready for you.{" "}
            <Button
              variant="link"
              className="hover:text-white text-primary"
              onClick={() => {
                setIsUpdatingApp(true);
                promisifyOverwolf(overwolf.extensions.updateExtension)()
                  .then(() => refreshCheckForExtensionUpdate())
                  .then(() => setIsUpdatingApp(false))
                  .catch((err) => {
                    console.error(err);
                  })
                  .finally(() => refreshCheckForExtensionUpdate());
              }}
            >
              Update Now!
            </Button>
          </>
        )}
        {state === "UpdateAvailable" &&
          isUpdatingApp &&
          "Updating... (takes a few minutes)"}
        {state === "PendingRestart" && (
          <>
            Update installed successfully. Please restart the app to apply the
            changes.{" "}
            <Button
              variant="link"
              className="hover:text-white text-primary"
              onClick={() => overwolf.extensions.relaunch()}
            >
              Restart Now!
            </Button>
          </>
        )}
      </p>
    </>
  );
}
