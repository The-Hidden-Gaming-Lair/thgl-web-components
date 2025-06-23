"use client";
import { defaultPerks, useAccountStore } from "@repo/lib";
import { Button } from "../(controls)";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import Link from "next/link";

export function AccountDialog() {
  const account = useAccountStore();

  if (!account.userId) {
    return (
      <Dialog
        open={account.showUserDialog}
        onOpenChange={account.setShowUserDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Status</DialogTitle>
            <DialogDescription>
              This app is free to use and supported by ads. To enjoy an ad-free
              experience, you can authenticate with Patreon as a{" "}
              <b>Pro Supporter</b>. If you upgrade to <b>Elite Supporter</b>,
              you’ll not only remove ads but also unlock access to exclusive
              preview features.
              <Link
                className="block"
                href="https://www.th.gl/support-me"
                target="_blank"
                rel="noreferrer"
                passHref
                prefetch={false}
              >
                <Button className="px-0" variant="link">
                  Become a supporter
                </Button>
              </Link>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Link href="https://www.patreon.com/home" target="_blank" passHref>
              <Button type="button" variant="outline">
                Open Patreon
              </Button>
            </Link>
            {account.userId && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  Cookies.remove("userId");
                  account.setAccount(null, null, defaultPerks);
                }}
              >
                Sign Out
              </Button>
            )}
            <Link
              href="/authenticate"
              passHref
              target="_blank"
              prefetch={false}
            >
              <Button>Authenticate with Patreon</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog
      open={account.showUserDialog}
      onOpenChange={account.setShowUserDialog}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Status</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <section className="space-y-4">
          <div>
            <p className="font-bold text-sm">Account ID</p>
            <p>{account.decryptedUserId}</p>
          </div>
          <div>
            <p className="font-bold text-sm">Ad Removal (Pro and Elite)</p>
            <p>{account.perks.adRemoval ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="font-bold text-sm">
              Premium Features (Pro and Elite)
            </p>
            <p>{account.perks.premiumFeatures ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="font-bold text-sm">Preview Release Access (Elite)</p>
            <p>{account.perks.previewReleaseAccess ? "Yes" : "No"}</p>
          </div>
        </section>
        <DialogFooter>
          <Link href="https://www.patreon.com/home" target="_blank" passHref>
            <Button type="button" variant="outline">
              Open Patreon
            </Button>
          </Link>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              Cookies.remove("userId");
              account.setAccount(null, null, defaultPerks);
            }}
          >
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
