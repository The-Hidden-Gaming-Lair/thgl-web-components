const PLACEHOLDER = /{{.*?}}/;
// A description line ends at a line break or a closing paragraph; the delimiter is
// captured so the kept lines keep their markup.
const LINE_END = /(<br\s*\/?>|<\/p>|\n)/i;

/**
 * A marker description after `translate()`, without the `{{key}}` placeholders the
 * spawn could not fill. `translate()` fills a template only when the spawn carries
 * `data`; a spawn without it gets the raw template back (Wuthering Waves:
 * `<p>Quest …</p><p>{{area}}</p>{{ctx}}`). Every line holding an unfilled
 * placeholder is dropped (an empty "Respawn: {{interval}}" label says nothing), the
 * remaining lines are kept, and when no visible text is left the result is "" so the
 * caller shows no description. Text without a placeholder is returned unchanged.
 */
export function withoutUnfilledPlaceholders(text: string): string {
  if (!PLACEHOLDER.test(text)) return text;
  const parts = text.split(LINE_END);
  let kept = "";
  // split() with a capture group alternates line, delimiter, line, delimiter, ...
  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i] + (parts[i + 1] ?? "");
    if (!PLACEHOLDER.test(line)) kept += line;
  }
  const visible = kept.replace(/<[^>]*>/g, "");
  return /[\p{L}\p{N}]/u.test(visible) ? kept.trim() : "";
}
