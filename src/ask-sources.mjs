/**
 * Retrieval over the case studies, for drafting.
 *
 * Matching a question to a written answer and finding material to draft from
 * are different jobs, and this is the second. `matchQuestion` has to be right
 * or refuse, because whatever it picks is served verbatim. Retrieval only has
 * to be *useful*: the model reads what comes back and decides what is relevant,
 * so a section that turns out not to help costs a few tokens rather than
 * producing a wrong answer.
 *
 * Same inverse-document-frequency weighting as the matcher, and the same
 * tokenizer, so "PCI" or "Figma" outweighs "the" here too.
 */
import { tokenize } from './ask.mjs';

const SUMMARY_HEADINGS = new Set(['Challenge', 'Approach', 'Outcome']);

export const buildSourceIndex = (sections) => {
  const docs = sections.map((section) => ({
    section,
    // The heading and the case-study title are indexed alongside the prose.
    // "Tell me about Plastiq Connect" shares little vocabulary with a section
    // about beneficial-owner fields, but it shares the title.
    tokens: new Set([
      ...tokenize(section.text),
      ...tokenize(section.heading ?? ''),
      ...tokenize(section.title ?? ''),
    ]),
  }));

  const documentFrequency = new Map();
  for (const doc of docs) {
    for (const token of doc.tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const total = docs.length || 1;
  const idf = (token) => Math.log(total / (1 + (documentFrequency.get(token) ?? 0))) + 1;

  return { docs, idf };
};

/**
 * The sections most worth putting in front of the model, best first.
 *
 * `caseStudies`, when given, restricts the search to those studies. That is the
 * important half: the corpus does not contain the words a visitor uses. The
 * word "fintech" appears in none of the 121 sections — the case studies say
 * "payments", "card and bank", "Plastiq" — so a lexical search for it scores
 * pure noise. The router does know that Plastiq Connect is the fintech one, so
 * it names the studies and this ranks within them.
 *
 * Sections that match nothing are still eligible, ordered as written: Challenge,
 * Approach and Outcome come first in a case study and are its summary, which is
 * a far better default than whichever paragraph happened to share a word.
 *
 * At most two per study, so one project cannot fill the whole context.
 */
export const retrieveSections = (query, index, { limit = 4, caseStudies = null, perCaseStudy = null } = {}) => {
  const wanted = caseStudies?.length ? new Set(caseStudies) : null;
  // Share the slots out among however many studies were named, so naming one
  // fills the context from that one rather than returning a two-section stub.
  const cap = perCaseStudy ?? (wanted ? Math.max(2, Math.ceil(limit / wanted.size)) : 2);
  const queryTokens = [...new Set(tokenize(query))];

  const scored = index.docs
    .filter(doc => !wanted || wanted.has(doc.section.caseStudy))
    .map((doc, order) => {
      let matched = 0;
      for (const token of queryTokens) if (doc.tokens.has(token)) matched += index.idf(token);
      return { section: doc.section, matched, order };
    });

  // A study's Challenge, Approach and Outcome are its summary, and they are
  // what a question about the study as a whole needs. They rank first when the
  // study was named, because lexical relevance inside one study is mostly noise
  // — "what is the strongest fintech case study" matched a section on API key
  // rotation, on the word "study", from "deserve its own study".
  const isSummary = (section) => SUMMARY_HEADINGS.has(section.heading);
  scored.sort((a, b) => {
    if (wanted) {
      const summary = Number(isSummary(b.section)) - Number(isSummary(a.section));
      if (summary) return summary;
    }
    return (b.matched - a.matched) || (a.order - b.order);
  });

  const taken = new Map();
  const picked = [];
  for (const entry of scored) {
    if (!wanted && entry.matched <= 0) continue;
    const seen = taken.get(entry.section.caseStudy) ?? 0;
    if (seen >= cap) continue;
    taken.set(entry.section.caseStudy, seen + 1);
    picked.push(entry.section);
    if (picked.length >= limit) break;
  }
  return picked;
};
