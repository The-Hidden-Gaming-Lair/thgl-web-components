import { handleActors } from "./routes/actors";

console.log("Starting server");
const server = Bun.serve({
  static: {
    "/db/once-human.sqlite": new Response(
      await Bun.file("./db/once-human.sqlite").bytes(),
    ),
  },
  idleTimeout: 0,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/actors")) return handleActors(req);
    if (url.pathname.startsWith("/db/")) {
      const dbName = url.pathname.replace("/db/", ""); // Extract the dynamic param
      const filePath = `./db/${dbName}.sqlite`; // Construct the file path

      try {
        // Check if the file exists using Bun's file API
        const file = Bun.file(filePath);
        if (!file) {
          return new Response("Database file not found", { status: 404 });
        }

        // Return the file as a response
        return new Response(file, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${dbName}.sqlite"`,
          },
        });
      } catch (err) {
        console.error("Error serving file:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});
console.log("Server started", server.id, server.port);
