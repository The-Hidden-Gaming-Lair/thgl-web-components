Peer Mesh Simulator (Browser)

This folder contains a simple browser-based simulator to validate the Team Mesh (N‑to‑N) over PeerJS. No build tools required.

Usage
- Open `tests/peer-mesh-sim/sim.html` in a modern browser.
- Configure: role (sender/receiver), domain, team code, client count, and interval (for senders).
- Click Start to spawn multiple simulated clients within the page. Logs show control and data traffic.

Notes
- Uses the PeerJS cloud signaling server by default. If your environment overrides PeerJS defaults, ensure the browser can reach that signaling server.
- Sends `{ player }` frames sufficient to exercise multi-peer flows (the same shape used by the app).
