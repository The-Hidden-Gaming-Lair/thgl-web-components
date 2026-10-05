"use client";

import { useEffect, useState } from "react";
import { type StatusDocument } from "@repo/lib";
import { StatusAdminPanel } from "./status-admin-panel";

/**
 * Shows the admin panel only to status admins. The page itself is edge-cached
 * and shared by every visitor (no per-user cache variants), so the admin check
 * runs here in the browser against a no-store endpoint.
 */
export function StatusAdminGate({ doc }: { doc: StatusDocument }) {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status/admin", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { admin?: boolean } | null) => {
        if (!cancelled && data?.admin) setAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return admin ? <StatusAdminPanel doc={doc} /> : null;
}
