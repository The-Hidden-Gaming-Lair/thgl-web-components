import { buildPeerLinkUrl } from "./peer-link-url";
import type { TilesConfig } from "./config";

const tiles: TilesConfig = {
  kilima: { defaultTitle: "Kilima Village" },
  bahari: { defaultTitle: "Bahari Bay" },
  overworld: { defaultTitle: "Overworld" },
  tower_f1: {
    defaultTitle: "Tower F1",
    layer: { parent: "overworld", group: "tower", floor: 1 },
  },
  // defaultTitle equal to the key is a placeholder, not a title
  housing: { defaultTitle: "housing" },
};

describe("buildPeerLinkUrl", () => {
  it("returns the bare homepage without a peer code", () => {
    expect(buildPeerLinkUrl({ domain: "palia", peerCode: "" })).toBe(
      "https://palia.th.gl",
    );
  });

  it("falls back to the homepage when the map is unknown", () => {
    expect(
      buildPeerLinkUrl({ domain: "palia", peerCode: "abc123", tiles }),
    ).toBe("https://palia.th.gl?peer_code=abc123");
    expect(
      buildPeerLinkUrl({
        domain: "palia",
        peerCode: "abc123",
        mapName: "nowhere",
        tiles,
      }),
    ).toBe("https://palia.th.gl?peer_code=abc123");
  });

  it("opens the sender's current map page with the peer code", () => {
    expect(
      buildPeerLinkUrl({
        domain: "palia",
        peerCode: "abc123",
        mapName: "kilima",
        tiles,
      }),
    ).toBe("https://palia.th.gl/maps/Kilima%20Village?peer_code=abc123");
  });

  it("keeps the surface in the path and carries an interior floor as ?layer=", () => {
    expect(
      buildPeerLinkUrl({
        domain: "wuthering-waves",
        peerCode: "xyz",
        mapName: "tower_f1",
        tiles,
      }),
    ).toBe(
      "https://wuthering-waves.th.gl/maps/Overworld?layer=tower_f1&peer_code=xyz",
    );
  });

  it("uses the translated key when defaultTitle is only a placeholder", () => {
    expect(
      buildPeerLinkUrl({
        domain: "palia",
        peerCode: "p",
        mapName: "housing",
        tiles,
        t: (k) => (k === "housing" ? "Housing Plot" : k),
      }),
    ).toBe("https://palia.th.gl/maps/Housing%20Plot?peer_code=p");
    expect(
      buildPeerLinkUrl({
        domain: "palia",
        peerCode: "p",
        mapName: "housing",
        tiles,
      }),
    ).toBe("https://palia.th.gl/maps/housing?peer_code=p");
  });
});
