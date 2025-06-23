import { InitializeAccount, InitializeController } from "@repo/ui/thgl-app";
import { getAccount } from "@/lib/patreon";
import { getCurrentVersion } from "@/version";

export default async function ControllerPage() {
  const account = await getAccount();
  const currentVersion = await getCurrentVersion();

  return (
    <>
      <InitializeController currentVersion={currentVersion} />
      <InitializeAccount account={account} />
    </>
  );
}
