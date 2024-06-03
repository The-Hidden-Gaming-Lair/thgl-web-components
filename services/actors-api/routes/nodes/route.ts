import { getSpawnNodes, insertNode, resetNodes } from "../../lib/gatherables";
import { toNode, validateActors } from "../../lib/nodes";

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
  if (req.headers.get("content-type") !== "application/json") {
    return new Response("Bad request", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  try {
    const app = new URL(req.url).pathname.split("/")[2];
    if (!app) {
      return new Response("Bad request", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
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
      const spawnNodes = getSpawnNodes(app);
      if (spawnNodes[node.type]) {
        const isKnown = spawnNodes[node.type]?.some((coords) => {
          return coords[0] === node.x && coords[1] === node.y;
        });
        if (isKnown) {
          return;
        }
      }
      insertNode(app, node);
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
  const app = new URL(req.url).pathname.split("/")[2];
  console.log(req.url, app);
  if (!app) {
    return new Response("Bad request", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  const result = getSpawnNodes(app);
  return new Response(JSON.stringify(result), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function handleDELETE(req: Request) {
  const app = new URL(req.url).pathname.split("/")[2];
  if (!app) {
    return new Response("Bad request", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
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
  resetNodes(app);
  return new Response("OK", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
