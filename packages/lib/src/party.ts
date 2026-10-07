/** One member of the party a party game (Baldur's Gate EE) reports with the player. */
export type PartyMember = {
  name: string;
  /** Game portrait id: the map shows icons/portraits/<portrait>.webp, else a coloured circle. */
  portrait?: string;
  x: number;
  y: number;
  r: number;
  leader?: boolean;
  hp?: number;
  maxHp?: number;
};

/**
 * Where "the player" is for anything that means the character, not the view: the trace
 * line, distances to markers. Party games report the camera as the player, so this is the
 * party leader there (or the first member), else the player itself.
 *
 * Kept out of overwolf/plugin.ts: that module touches `window` on load, so importing it
 * from server-rendered components breaks SSR.
 */
export function playerAnchor<
  T extends { x: number; y: number; party?: PartyMember[] },
>(player: T): { x: number; y: number } {
  const party = player.party;
  if (party?.length) {
    const lead = party.find((m) => m.leader) ?? party[0];
    return { x: lead.x, y: lead.y };
  }
  return { x: player.x, y: player.y };
}
