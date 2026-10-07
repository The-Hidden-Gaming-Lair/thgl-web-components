import { translate } from "./i18n";
import { withoutUnfilledPlaceholders } from "./marker-description";

// Shapes taken from the live CDN dicts (Wuthering Waves, Night Crows, Crimson Desert).
const WUWA_QUEST =
  '<p style="color:#17a0a4">Quest Grand Warstorm</p><p style="color:#8ab4f8">{{area}}</p>{{ctx}}';
const WUWA_TYPE = '<p style="color:#8ab4f8">{{area}}</p>{{ctx}}';
const NIGHT_CROWS =
  "<b>Spawn Count</b>: {{count}}<br><b>Respawn</b>: {{interval}}";

describe("withoutUnfilledPlaceholders", () => {
  it("keeps a fully filled description exactly as translate() returns it", () => {
    const dict = { boss_desc: WUWA_QUEST };
    const filled = translate(dict, "boss", {
      isDesc: true,
      vars: { area: "Mournfell Canyon" },
    });
    expect(filled).toBe(
      '<p style="color:#17a0a4">Quest Grand Warstorm</p><p style="color:#8ab4f8">Mournfell Canyon</p>',
    );
    expect(withoutUnfilledPlaceholders(filled)).toBe(filled);
  });

  it("keeps a description without a template unchanged, whitespace included", () => {
    expect(withoutUnfilledPlaceholders("A chest.\n")).toBe("A chest.\n");
    expect(withoutUnfilledPlaceholders("")).toBe("");
  });

  it("drops a description whose every line is an unfilled placeholder", () => {
    expect(withoutUnfilledPlaceholders(WUWA_TYPE)).toBe("");
    expect(withoutUnfilledPlaceholders("{{area}}{{ctx}}")).toBe("");
  });

  it("drops label lines whose value is unfilled", () => {
    expect(withoutUnfilledPlaceholders(NIGHT_CROWS)).toBe("");
  });

  it("keeps the filled lines of a partly filled description", () => {
    expect(withoutUnfilledPlaceholders(WUWA_QUEST)).toBe(
      '<p style="color:#17a0a4">Quest Grand Warstorm</p>',
    );
    expect(
      withoutUnfilledPlaceholders(
        "Wraith's Shadow<br><b>Level</b>: 118<br/><b>Respawn</b>: {{interval}}",
      ),
    ).toBe("Wraith's Shadow<br><b>Level</b>: 118<br/>");
    expect(withoutUnfilledPlaceholders("Line one\n{{x}}\nLine three")).toBe(
      "Line one\nLine three",
    );
  });
});
