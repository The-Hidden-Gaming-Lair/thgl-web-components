import { type NextRequest } from "next/server";
import {
  type TebexWebhook,
  handleTebexWebhook,
  verifyTebexSignature,
} from "@/lib/tebex";

// Tebex webhook endpoint (creator panel → Integrations → Webhooks). The
// signature is the authentication; Tebex retries any non-2xx, so DB failures
// return 500 on purpose.
export const maxDuration = 25;

export async function POST(request: NextRequest) {
  const secret = process.env.TEBEX_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[tebex/webhook] TEBEX_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (!verifyTebexSignature(raw, request.headers.get("x-signature"), secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: TebexWebhook;
  try {
    event = JSON.parse(raw) as TebexWebhook;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Endpoint validation handshake when the URL is added/edited in the panel.
  if (event.type === "validation.webhook") {
    return Response.json({ id: event.id });
  }

  try {
    const outcome = await handleTebexWebhook(event);
    console.log(`[tebex/webhook] ${event.id}: ${outcome}`);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tebex/webhook] ${event.id} ${event.type} failed: ${msg}`);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
