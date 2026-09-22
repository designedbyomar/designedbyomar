/**
 * Matching for the Ask assistant.
 *
 * The answers are static and human-reviewed, so this file does no generation —
 * it decides which pre-written answer a typed question is asking for. Matching
 * runs on the question and its aliases, never on the answer body: answer text
 * is long and shares vocabulary across entries, so scoring against it buries
 * the signal.
 *
 * Weighting is inverse document frequency, so a rare term like "PCI" or
 * "Figma" outweighs "what" or "does". No dependency, no network, no model.
 */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can', 'did', 'do',
  'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'his', 'how', 'i', 'if', 'in',
  'is', 'it', 'its', 'me', 'much', 'of', 'omar', 'on', 'or', 'she', 'should', 'so', 'some',
  'tell', 'that', 'the', 'their', 'them', 'there', 'they', 'this', 'to', 'us', 'was', 'we',
  'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);

/** Lowercase, strip punctuation, drop stopwords and single characters. */
export const tokenize = (text) => String(text)
  .toLowerCase()
  // Drop the possessive first, so "Omar’s" reduces to the stopword "omar"
  // rather than surviving as "omars".
  .replace(/[‘’']s(?![a-z])/g, '')
  .replace(/[‘’']/g, '')
  .replace(/[^a-z0-9+#]+/g, ' ')
  .split(' ')
  .filter(token => token.length > 1 && !STOPWORDS.has(token));

/**
 * Precompute per-answer token sets and IDF weights. Cheap enough to run on
 * load; kept separate so the matcher itself stays pure.
 */
export const buildIndex = (answers) => {
  const docs = answers.map((answer) => {
    const tokens = new Set([
      ...tokenize(answer.question),
      ...(answer.aliases ?? []).flatMap(tokenize),
      ...tokenize(answer.topic ?? ''),
    ]);
    return { answer, tokens, aliases: new Set((answer.aliases ?? []).map(a => a.toLowerCase().trim())) };
  });

  const documentFrequency = new Map();
  for (const doc of docs) {
    for (const token of doc.tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const total = docs.length || 1;
  const idf = (token) => Math.log(total / (1 + (documentFrequency.get(token) ?? 0))) + 1;
  const isKnown = (token) => documentFrequency.has(token);

  return { docs, idf, isKnown };
};

/** Accept a match only when it covers this share of the query's known weight. */
export const MATCH_THRESHOLD = 0.42;

/**
 * A query has to be at least this much in-vocabulary to be worth answering.
 * "how do penguins pay for parking in antarctica" shares one word with the
 * corpus; answering it from that one word is how a matcher embarrasses itself.
 */
export const MIN_KNOWN_RATIO = 0.4;

/**
 * Best answer for a typed question, or null when nothing clears the threshold.
 * Refusing to answer is the correct failure mode here — the caller routes a
 * miss to the nearest case study and the contact link.
 */
export const matchQuestion = (query, index) => {
  const normalized = String(query).toLowerCase().trim();
  if (!normalized) return null;

  const exact = index.docs.find(doc => doc.aliases.has(normalized) || doc.answer.question.toLowerCase() === normalized);
  if (exact) return { answer: exact.answer, score: 1, exact: true };

  const queryTokens = [...new Set(tokenize(normalized))];
  if (!queryTokens.length) return null;

  // Words the corpus has never seen carry maximum IDF while saying nothing
  // about which answer is right, so they are excluded from the denominator —
  // otherwise one unknown word sinks an otherwise clear question.
  const knownTokens = queryTokens.filter(index.isKnown);
  if (!knownTokens.length) return null;
  if (knownTokens.length / queryTokens.length < MIN_KNOWN_RATIO) return null;

  const totalWeight = knownTokens.reduce((sum, token) => sum + index.idf(token), 0);
  if (totalWeight <= 0) return null;

  let best = null;
  for (const doc of index.docs) {
    let matched = 0;
    for (const token of knownTokens) {
      if (doc.tokens.has(token)) matched += index.idf(token);
    }
    if (matched <= 0) continue;
    const score = matched / totalWeight;
    if (!best || score > best.score) best = { answer: doc.answer, score, exact: false };
  }

  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best;
};

/** Nearest answer regardless of threshold — used to make a miss useful. */
export const nearestTopic = (query, index) => {
  const queryTokens = [...new Set(tokenize(query))];
  if (!queryTokens.length) return null;
  let best = null;
  for (const doc of index.docs) {
    if (!doc.answer.sources?.length) continue;
    let matched = 0;
    for (const token of queryTokens) if (doc.tokens.has(token)) matched += index.idf(token);
    if (matched > 0 && (!best || matched > best.matched)) best = { answer: doc.answer, matched };
  }
  return best?.answer ?? null;
};
