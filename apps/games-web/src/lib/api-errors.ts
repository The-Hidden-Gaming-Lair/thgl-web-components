import { UnauthenticatedError } from "@/lib/auth";

/**
 * Lightweight error → HTTP response mapping for route handlers.
 *
 * Routes throw typed errors (BadRequest, NotFound, Forbidden,
 * UnauthenticatedError) and call handle(fn) to wrap the body. The
 * wrapper guarantees CORS headers + a JSON error shape on every
 * response, including unexpected crashes.
 */

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};

export class BadRequestError extends Error {
  constructor(message = "Bad request") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class PayloadTooLargeError extends Error {
  constructor(message = "Payload too large") {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export function errorJson(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof UnauthenticatedError) return errorJson(err.message, 401);
    if (err instanceof ForbiddenError) return errorJson(err.message, 403);
    if (err instanceof NotFoundError) return errorJson(err.message, 404);
    if (err instanceof BadRequestError) return errorJson(err.message, 400);
    if (err instanceof PayloadTooLargeError) return errorJson(err.message, 413);
    const msg = err instanceof Error ? err.message : String(err);
    // Aborted request: usually the client closed the connection mid-request,
    // but server-side timeouts surface identically (libsql aborts hung Bunny-DB
    // queries after 5s via AbortController). Not error-level noise, but keep a
    // warn line so a degrading upstream stays visible in the logs.
    if (
      (err instanceof Error && err.name === "AbortError") ||
      msg === "This operation was aborted"
    ) {
      console.warn(`[api] aborted: ${msg}`);
      return errorJson("Client closed request", 499);
    }
    console.error(`[api] unhandled: ${msg}`);
    return errorJson("Internal Server Error", 500);
  }
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
