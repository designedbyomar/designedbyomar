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
      // Tags, client, role, year and subtitle. A visitor searches with the
      // words on the page, and "Fintech" is a badge on Connect API even though
      // the prose never uses it.
      ...tokenize(section.labels ?? ''),
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
 * Each named study contributes its best summary section first — Challenge,
 * Approach or Outcome — so the model always has that study's framing. Every
 * remaining slot goes to whatever matches the question best, so a question
 * about a specific published detail can still reach the section holding it.
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
      let weight = 0;
      let hits = 0;
      for (const token of queryTokens) {
        if (!doc.tokens.has(token)) continue;
        weight += index.idf(token);
        hits += 1;
      }
      /*
        Scaled by how much of the question a section covers, not just by how
        rare its matches are. A word occurring in one section of 153 carries a
        huge weight whether it is a precise term or an accident, and on its own
        that let "strongest" — which appears exactly once, in a Wisdom section —
        outscore a Connect API section matching both "fintech" and "study".

        Coordination is the signal that separates them: matching two of four
        query terms means more than matching one rare one.
      */
      const matched = queryTokens.length ? weight * (hits / queryTokens.length) : 0;
      return { section: doc.section, matched, order };
    });

  const isSummary = (section) => SUMMARY_HEADINGS.has(section.heading);
  const byRelevance = [...scored].sort((a, b) => (b.matched - a.matched) || (a.order - b.order));

  const taken = new Map();
  const picked = [];
  const take = (entry) => {
    const seen = taken.get(entry.section.caseStudy) ?? 0;
    if (seen >= cap || picked.length >= limit || picked.includes(entry)) return false;
    taken.set(entry.section.caseStudy, seen + 1);
    picked.push(entry);
    return true;
  };

  /*
    A study's Challenge, Approach and Outcome are its summary, and a question
    about the study as a whole needs them — relevance inside a single study is
    largely noise, which is how "what is the strongest fintech case study"
    matched a section on API key rotation, on the word "study", from "deserve
    its own study".

    But that was a floor, and it was written as an absolute. Ranking every
    summary above every detail meant a question about a published detail got
    four overviews and not the section containing its answer. So each named
    study contributes its best summary first, and everything after that is
    ranked purely on relevance.
  */
  if (wanted) {
    for (const study of wanted) {
      const summary = byRelevance.find(e => e.section.caseStudy === study && isSummary(e.section));
      if (summary) take(summary);
    }
  }

  for (const entry of byRelevance) {
    if (!wanted && entry.matched <= 0) continue;
    take(entry);
    if (picked.length >= limit) break;
  }

  // Grouped by study, most relevant study first, and in document order within
  // each — so the model reads one project's framing and then its details,
  // rather than alternating between projects in score order.
  const studyRank = new Map();
  for (const entry of picked) {
    if (!studyRank.has(entry.section.caseStudy)) studyRank.set(entry.section.caseStudy, studyRank.size);
  }
  picked.sort((a, b) =>
    (studyRank.get(a.section.caseStudy) - studyRank.get(b.section.caseStudy))
    || (a.order - b.order));
  return picked.map(entry => entry.section);
};
