"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  defaultPerks,
  isOverwolf,
  Perks,
  TH_GL_URL,
  useAccountStore,
} from "@repo/lib";
import { Button } from "../(controls)";
import Cookies from "js-cookie";
import { ExternalAnchor } from "./external-anchor";
import { Input } from "../ui/input";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Separator } from "../ui/separator";
import { toast } from "sonner";

export function UserDialog() {
  const account = useAccountStore();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (loading) {
      return;
    }
    setLoading(true);
    e.preventDefault();
    const response = await fetch(`${TH_GL_URL}/api/patreon/overwolf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
      }),
    });
    try {
      const body = (await response.json()) as {
        expiresIn: number;
        decryptedUserId: string;
      } & Perks;
      if (!response.ok) {
        console.warn(body);
        if (response.status === 403) {
          account.setAccount(userId, null, defaultPerks);
          toast("User is not a subscriber");
        } else if (response.status === 404) {
          account.setAccount(null, null, defaultPerks);
          toast("Invalid secret");
        } else if ("error" in body && typeof body.error === "string") {
          toast(body.error);
        }
      } else {
        console.log(`Subscription enabled`, body);
        account.setAccount(userId, body.decryptedUserId, {
          adRemoval: body.adRemoval,
          previewReleaseAccess: body.previewReleaseAccess,
          comments: body.comments,
          premiumFeatures: body.premiumFeatures,
        });
        toast("Subscription enabled");
      }
    } catch (err) {
      console.error(err);
      toast("An error occurred. Please try again later.");
      // accountStore.setAccount(userId, false, false);
    }
    setLoading(false);
  };

  return (
    <Dialog
      open={account.showUserDialog}
      onOpenChange={account.setShowUserDialog}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Status</DialogTitle>
        </DialogHeader>
        <section className="space-y-4">
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
          {account.userId ? (
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
          ) : (
            <>
              <ExternalAnchor
                href="https://www.th.gl/support-me"
                className="flex gap-1 text-primary hover:underline"
              >
                <span>Sign Up</span>
                <ExternalLink className="w-3 h-3" />
              </ExternalAnchor>
              <Separator />
              <p className="text-muted-foreground">
                After sign up, you need to{" "}
                <ExternalAnchor
                  href="https://www.th.gl/support-me/account"
                  className="inline-flex gap-1 text-primary hover:underline"
                >
                  <span>authenticate</span>
                  <ExternalLink className="w-3 h-3" />
                </ExternalAnchor>{" "}
                to enable your account, ad removal, premium features and preview
                release access.
              </p>
              {isOverwolf && (
                <>
                  <p>
                    Click the <b>Link your account</b> on the page or copy the
                    secret and paste it below.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="flex space-x-2">
                      <Input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                      />
                      <Button type="submit" disabled={userId.length === 0}>
                        Unlock
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
