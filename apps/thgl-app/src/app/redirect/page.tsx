import { AuthRedirect } from "@repo/ui/thgl-app";
import { getAccount } from "@/lib/patreon";

export default async function Redirect() {
  const account = await getAccount();
  const isSuccess = Boolean(account.userId);

  return <AuthRedirect isSuccess={isSuccess} account={account} />;
}
