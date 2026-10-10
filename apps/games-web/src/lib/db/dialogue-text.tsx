// The game's own placeholders in dialogue (Infinity Engine tokens), shown as a
// muted label instead of the raw <TOKEN>: the engine fills them in per player.
const TOKENS: Record<string, string> = {
  GABBER: "speaker",
  SIRMAAM: "sir/madam",
  LADYLORD: "lord/lady",
  MANWOMAN: "man/woman",
  BROTHERSISTER: "brother/sister",
  BOYGIRL: "boy/girl",
  HESHE: "he/she",
  HISHER: "his/her",
  HIMHER: "him/her",
  RACE: "race",
  CLASS: "class",
  DAYANDMONTH: "date",
  DAY: "day",
  MONTH: "month",
  YEAR: "year",
  GAMEDAYS: "days",
};

/** A dialogue line with its <TOKEN> placeholders rendered as muted labels. */
export function DialogueText({ text }: { text: string }) {
  const parts = text.split(/(<[A-Z_]+>)/);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^<([A-Z_]+)>$/.exec(p);
        if (!m) return p;
        const key = m[1]!.replace(/^PRO_/, "");
        return (
          <span key={i} className="text-muted-foreground italic">
            [{TOKENS[key] ?? key.toLowerCase()}]
          </span>
        );
      })}
    </>
  );
}
