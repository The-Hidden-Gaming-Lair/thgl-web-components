// bun test apps/games-web/scripts/db-location-labels.test.ts
/**
 * DB location rows carry an English `label` baked by data-forge; the page
 * re-resolves it in its own locale (data-forge inbox #955: Palia's
 * /ja/db/critters/critter_rabbit_t3 map markers all read "Hollow Jaakcat").
 */
import { describe, expect, test } from "bun:test";
import {
  localizeLocationLabels,
  localizeProps,
} from "../src/lib/db/resolve-dict";

const row = (node: string, type: string, label: string) => ({
  map: "AZ3_Root",
  node,
  type,
  x: 1,
  y: 2,
  label,
});

describe("localizeLocationLabels", () => {
  test("type key resolves in the page locale, following pointers", () => {
    const type = "Hunting.Creature.Rabbit_T3";
    const out = localizeLocationLabels(
      [row(`${type}@2:1`, type, "Hollow Jaakcat")],
      { [type]: "@1", "@1": "ホロウジャークキャット" },
    );
    expect(out[0].label).toBe("ホロウジャークキャット");
    expect(out[0].node).toBe(`${type}@2:1`);
    // Type chip in the page locale too, not the raw id (#957).
    expect(out[0].typeLabel).toBe("ホロウジャークキャット");
  });

  test("a spawn's own id wins over its type", () => {
    const out = localizeLocationLabels(
      [row("npc_hassian@2:1", "villager", "Hassian")],
      { npc_hassian: "Hassian (de)", villager: "Dorfbewohner" },
    );
    expect(out[0].label).toBe("Hassian (de)");
    expect(out[0].typeLabel).toBe("Dorfbewohner");
  });

  test("keys missing from the dict keep the baked label", () => {
    const list = [row("x@2:1", "x", "Baked")];
    expect(localizeLocationLabels(list, {})[0].label).toBe("Baked");
    expect(localizeLocationLabels(list, {})[0].typeLabel).toBeUndefined();
    expect(localizeLocationLabels(list, undefined)).toBe(list);
  });
});

describe("localizeProps", () => {
  const props = {
    Active: "Night",
    _sections: [{ title: "Quests", kind: "list", items: ["A"] }],
    areas: { label: "Found In", items: [{ name: "Elderwood" }] },
    upgradeTable: { label: "T", columns: ["a"], rows: [["1"]] },
  };

  test("swaps text and whole JSON props from <id>.<prop> (#967)", () => {
    const de = localizeProps(props, "x", {
      "x.Active": "Nacht",
      "x._sections": JSON.stringify([
        { title: "Quests (de)", kind: "list", items: ["A"] },
      ]),
      "x.areas": JSON.stringify({
        label: "Fundort",
        items: [{ name: "Elderwald" }],
      }),
    });
    expect(de.Active).toBe("Nacht");
    expect(de._sections[0].title).toBe("Quests (de)");
    expect(de.areas.label).toBe("Fundort");
    expect(de.upgradeTable).toBe(props.upgradeTable);
  });

  test("invalid or missing JSON keeps the English prop", () => {
    const out = localizeProps(props, "x", {
      "x._sections": "{not json",
      "x.areas": JSON.stringify({ label: "no items" }),
    });
    expect(out).toBe(props);
    expect(localizeProps(props, "x", undefined)).toBe(props);
  });
});
