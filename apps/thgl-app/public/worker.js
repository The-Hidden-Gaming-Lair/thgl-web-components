let connections = [];
let nextClientId = 1; // clientId 0 is the host (main controller)

function sendClientListToHost() {
  const host = connections.find((c) => c.clientId === 0);
  if (host) {
    const clientInfo = connections.map((c) => ({
      id: c.clientId,
      href: c.href,
      role: c.role,
    }));

    host.port.postMessage({
      type: "clientList",
      data: clientInfo,
    });
  }
}

self.onconnect = function (event) {
  const port = event.ports[0];
  const clientId = connections.length === 0 ? 0 : nextClientId++;

  // Temporary connection object until we get href
  const conn = { port, clientId, href: null, role: null };
  connections.push(conn);

  port.onmessage = function (e) {
    const message = e.data;

    switch (message.type) {
      case "identify": {
        conn.href = message.href;
        conn.role = message.role;
        port.postMessage({ type: "init", data: clientId });
        sendClientListToHost();
        break;
      }

      case "toClient": {
        const target = connections.find(
          (c) => c.clientId === message.targetClientId,
        );
        if (target) {
          target.port.postMessage({
            type: clientId === 0 ? "fromMain" : "fromClient",
            from: clientId,
            data: message.data,
          });
        }
        break;
      }

      case "sendBroadcast": {
        if (clientId === 0) {
          connections.forEach((c) => {
            if (c.clientId !== clientId) {
              c.port.postMessage({
                type: "broadcast",
                from: clientId,
                data: message.data,
              });
            }
          });
        }
        break;
      }

      case "disconnect": {
        connections = connections.filter((c) => c.clientId !== clientId);
        sendClientListToHost();
        break;
      }
    }
  };

  port.start();
};
