import caseStudyContent from './content/case-studies.json';

export const CASE_ACCENTS = {
  develop: 'var(--color-develop-blue)',
  preview: 'var(--color-preview-pink)',
  ship: 'var(--color-ship-red)',
};

export const CASE_STUDIES = caseStudyContent.map((caseStudy) => ({
  ...caseStudy,
  accent: CASE_ACCENTS[caseStudy.accent] ?? CASE_ACCENTS.develop,
}));
