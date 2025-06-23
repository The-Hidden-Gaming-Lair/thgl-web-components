import type { App } from "../../lib/apps";

export async function handleOPTIONS(_req: Request, _app: App) {
  return new Response("", {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      Allow: "OPTIONS, GET, POST, DELETE",
    },
  });
}
