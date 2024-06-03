import { getSpawnNodes, insertNode, resetNodes } from "../../lib/gatherables";
import {
  BLACKLISTED_TYPES,
  calculateDistance,
  getMinDistance,
  toNode,
  validateActors,
} from "../../lib/nodes";
import { isValidVersion } from "../../lib/version";

export async function fetchNodes(req: Request) {
  if (req.method === "POST") {
    return handlePOST(req);
  }
  if (req.method === "GET") {
    return handleGET(req);
  }
  if (req.method === "DELETE") {
    return handleDELETE(req);
  }
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        Allow: "OPTIONS, GET, POST, DELETE",
      },
    });
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function handlePOST(req: Request) {
  if (
    !isValidVersion(req.headers.get("app-version")) ||
    req.headers.get("content-type") !== "application/json"
  ) {
    return new Response("Bad request", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  try {
    const body = await req.json();
    if (!body) {
      return new Response("Bad request", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
    if (!validateActors(body)) {
      const message = validateActors
        .errors!.map((error) => error.message)
        .join("\n");
      return new Response(`Invalid actor: ${message}`, {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const nodes = body.map(toNode);

    let count = 0;
    nodes.forEach((node) => {
      if (BLACKLISTED_TYPES.includes(node.type)) {
        return;
      }
      const spawnNodes = getSpawnNodes();
      if (spawnNodes[node.type]) {
        const isTooClose = spawnNodes[node.type]?.some((coords) => {
          if (coords[3] !== node.mapName) {
            return false;
          }
          const distance = calculateDistance(node, coords);
          const minDistance = getMinDistance();
          return distance < minDistance;
        });
        if (isTooClose) {
          return;
        }
      }
      insertNode(node);
      count++;
    });

    return new Response(`Inserted ${count} nodes`, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return new Response("Bad request", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
    throw e;
  }
}

async function handleGET(req: Request) {
  const query = new URL(req.url).searchParams;
  const type = query.get("type");
  let result;
  switch (type) {
    case "spawnNodes":
      result = getSpawnNodes();
      break;
    default:
      return new Response("Bad request", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
  }
  return new Response(JSON.stringify(result), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function handleDELETE(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== process.env.AUTH_TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  resetNodes();
  return new Response("OK", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
