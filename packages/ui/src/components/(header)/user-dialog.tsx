"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useAccountStore } from "@repo/lib";
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

  const isOverwolf =
    typeof window !== "undefined" && "___overwolf___" in window;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (loading) {
      return;
    }
    setLoading(true);
    e.preventDefault();
    const response = await fetch("https://www.th.gl/api/patreon/overwolf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
      }),
    });
    try {
      const body = (await response.json()) as { previewAccess: boolean };
      if (!response.ok) {
        console.warn(body);
        if (response.status === 403) {
          account.setAccount(userId, false, false);
          toast("User is not a subscriber");
        } else if (response.status === 404) {
          account.setAccount(null, false, false);
          toast("Invalid secret");
        } else if ("error" in body && typeof body.error === "string") {
          toast(body.error);
        }
      } else {
        console.log(`Subscription enabled`);
        account.setAccount(userId, true, body.previewAccess);
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
          <DialogTitle>Subscriber Status</DialogTitle>
        </DialogHeader>
        <section className="space-y-4">
          <div>
            <p className="font-bold text-sm">Ad Removal (Pro and Elite)</p>
            <p>{account.adRemoval ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="font-bold text-sm">Preview Release Access (Elite)</p>
            <p>{account.previewReleaseAccess ? "Yes" : "No"}</p>
          </div>
          {account.userId ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                Cookies.remove("userId");
                account.setAccount(null, false, false);
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
                <span>Become a Subscriber</span>
                <ExternalLink className="w-3 h-3" />
              </ExternalAnchor>
              <Separator />
              <p className="text-muted-foreground">
                After becoming a subscriber, you need to{" "}
                <ExternalAnchor
                  href="https://www.th.gl/support-me/account"
                  className="inline-flex gap-1 text-primary hover:underline"
                >
                  <span>unlock your perks</span>
                  <ExternalLink className="w-3 h-3" />
                </ExternalAnchor>{" "}
                to enable ad removal and preview release access.
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
