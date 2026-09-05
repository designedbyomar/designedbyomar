import caseStudyContent from './content/case-studies.json';

export const CASE_ACCENTS = {
  develop: 'var(--color-develop-blue)',
  preview: 'var(--color-preview-pink)',
  ship: 'var(--color-ship-red)',
};

// Everything in this list is published: the JSON is bundled into the client JS, so any
// field reaching this module is downloadable by anyone. It is an allowlist rather than a
// denylist on purpose — forgetting to add a new content field shows up immediately as
// missing content, whereas forgetting to exclude an internal one leaks silently.
const PUBLIC_FIELDS = [
  'id', 'num', 'year', 'client', 'title', 'subtitle', 'metaDescription',
  'coverImage', 'coverVideo', 'ogImage', 'role', 'tags', 'metrics',
  'challenge', 'approach', 'outcome', 'body', 'relatedLink',
];

const toPublicRecord = (caseStudy) => {
  const record = {};
  for (const field of PUBLIC_FIELDS) {
    if (caseStudy[field] !== undefined) record[field] = caseStudy[field];
  }
  return record;
};

export const CASE_STUDIES = caseStudyContent.map((caseStudy) => ({
  ...toPublicRecord(caseStudy),
  accent: CASE_ACCENTS[caseStudy.accent] ?? CASE_ACCENTS.develop,
}));
