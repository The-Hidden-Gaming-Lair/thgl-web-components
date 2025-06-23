export const ACCESS_CONTROL_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
} as const;

export function response(body?: BodyInit | null, status = 200) {
  return new Response(body, {
    status,
    headers: ACCESS_CONTROL_HEADERS,
  });
}

export function badRequest() {
  return response("Bad request", 400);
}

export function unauthorized() {
  return response("Unauthorized", 401);
}

export function ok() {
  return response("OK");
}
