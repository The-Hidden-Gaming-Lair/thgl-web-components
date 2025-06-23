import { getApp } from "../../lib/apps";
import { ACCESS_CONTROL_HEADERS, badRequest } from "../../lib/http";
import { handleDELETE } from "./delete";
import { handleGET } from "./get";
import { handleOPTIONS } from "./options";
import { handlePOST } from "./post";

export function handleActors(req: Request) {
  const appName = new URL(req.url).pathname.split("/")[2];
  if (!appName) {
    return badRequest();
  }
  const app = getApp(appName);
  if (!app) {
    return badRequest();
  }

  if (req.method === "POST") {
    return handlePOST(req, app);
  }
  if (req.method === "GET") {
    return handleGET(req, app);
  }
  if (req.method === "DELETE") {
    return handleDELETE(req, app);
  }
  if (req.method === "OPTIONS") {
    return handleOPTIONS(req, app);
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: ACCESS_CONTROL_HEADERS,
  });
}
