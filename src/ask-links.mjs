/**
 * Linkifying case-study mentions inside an answer.
 *
 * An answer already lists the studies it drew on as citation chips beneath it.
 * This turns the *mention itself* — "Plastiq Connect" in the prose — into a link
 * to that study, so the reference and its destination are in the same place.
 *
 * Two rules keep it from linking the wrong thing:
 *
 *   - Only studies the answer actually cites are candidates. Three case studies
 *     are Plastiq, so the bare word "Plastiq" is deliberately not a mention of
 *     any of them; the alias has to name a specific study ("Plastiq Connect",
 *     "Athena Design System"). Keying off the cited ids means a study is only
 *     ever linked when the answer was grounded in it.
 *   - Each study links at most once, at its first mention, and the longest
 *     alias wins where several overlap ("Connect API Payments" over "Connect
 *     API"). A reader needs the pointer once, not on every occurrence.
 *
 * Pure string tokenization — it never emits HTML. The caller builds React nodes
 * from the tokens, so drafted (model-authored) text cannot inject markup.
 */

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The route every study page lives at — see vercel.json and postbuild.js. */
export const hrefForStudy = (id) => `/work/${id}/`;

/**
 * The aliases a study is recognised by in prose, longest first. Falls back to
 * the title when a study has no explicit `mentions`, so a new study links by its
 * title with no extra authoring.
 */
const aliasesFor = (study) => {
  const list = (study.mentions?.length ? study.mentions : [study.title]).filter(Boolean);
  return [...list].sort((a, b) => b.length - a.length);
};

/**
 * Splits `text` into an array of tokens:
 *   { type: 'text', value }
 *   { type: 'link', value, id, href }
 *
 * `value` concatenated across all tokens is exactly the input text, so nothing
 * is dropped or duplicated.
 */
export const tokenizeAnswer = (text, studies = [], citedIds = []) => {
  if (!text) return [];
  const cited = new Set(citedIds);
  const candidates = (studies ?? []).filter((study) => cited.has(study.id));
  if (!candidates.length) return [{ type: 'text', value: text }];

  // The earliest match of each alias, tagged with its study. `\b` on both sides
  // so "Athena" never fires inside another word, and case-insensitive so a
  // sentence-start mention still matches.
  const matches = [];
  for (const study of candidates) {
    for (const alias of aliasesFor(study)) {
      const found = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i').exec(text);
      if (found) matches.push({ start: found.index, end: found.index + found[0].length, id: study.id, value: found[0] });
    }
  }
  if (!matches.length) return [{ type: 'text', value: text }];

  // Earliest first; at the same position the longer match wins, so an alias that
  // is a prefix of another does not pre-empt it.
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const accepted = [];
  const linkedStudies = new Set();
  let consumed = 0; // no accepted match may overlap an earlier one
  for (const match of matches) {
    if (linkedStudies.has(match.id) || match.start < consumed) continue;
    accepted.push(match);
    linkedStudies.add(match.id);
    consumed = match.end;
  }

  const tokens = [];
  let cursor = 0;
  for (const match of accepted) {
    if (match.start > cursor) tokens.push({ type: 'text', value: text.slice(cursor, match.start) });
    tokens.push({ type: 'link', value: match.value, id: match.id, href: hrefForStudy(match.id) });
    cursor = match.end;
  }
  if (cursor < text.length) tokens.push({ type: 'text', value: text.slice(cursor) });
  return tokens;
};
