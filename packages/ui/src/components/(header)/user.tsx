"use client";

import { Heart } from "lucide-react";
import { Button } from "../(controls)";
import { useT } from "../(providers)";
import { cn, useAccountStore } from "@repo/lib";
import { UserDialog } from "./user-dialog";

export function User({ isExpanded }: { isExpanded: boolean }) {
  const user = useAccountStore();

  const t = useT();

  return (
    <>
      <Button
        size={isExpanded ? "default" : "icon"}
        title={t("Subscription Status")}
        variant="secondary"
        onClick={() => user.setShowUserDialog(true)}
      >
        <Heart className={cn(user.userId && "fill-primary stroke-primary")} />
        <span
          className={cn("ml-2", {
            hidden: !isExpanded,
          })}
        >
          {t("subscriber")}
        </span>
      </Button>
      <UserDialog />
    </>
  );
}
