/**
 * Extract the effect-text fragment containing `query` for display under a
 * search result, so the user sees WHY the entry matched (e.g. searching
 * "View Radius" shows "+3 View Radius" under Scouting). Fragments are the
 * `·`-separated segments `flattenPropsText` joined. Returns null if no match.
 * (Client-safe — keep free of server imports; used by the search dropdown and
 * the section list grid.)
 */
export function matchSnippet(
  text: string | undefined,
  query: string,
): string | null {
  if (!text) return null;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return null;
  const start = text.lastIndexOf("·", i) + 1;
  let end = text.indexOf("·", i + query.length);
  if (end === -1) end = text.length;
  return text.slice(start, end).trim();
}
