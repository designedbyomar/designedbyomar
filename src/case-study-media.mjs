export const CASE_CARD_IMAGE_WIDTHS = [640, 960, 1440];

export const getCaseStudyCoverImage = (caseStudy) => {
  if (caseStudy.coverImage) return caseStudy.coverImage;
  if (!caseStudy.ogImage) return null;

  const lastSlash = caseStudy.ogImage.lastIndexOf('/');
  if (lastSlash === -1) return null;
  return `${caseStudy.ogImage.slice(0, lastSlash)}/cover.webp`;
};

export const getResponsiveCaseStudyImage = (source, width) => {
  if (!source) return null;
  const extensionIndex = source.lastIndexOf('.');
  if (extensionIndex === -1) return null;
  return `${source.slice(0, extensionIndex)}-${width}.webp`;
};

export const getCaseStudyCoverSrcSet = (caseStudy) => {
  const source = getCaseStudyCoverImage(caseStudy);
  if (!source) return undefined;

  return CASE_CARD_IMAGE_WIDTHS
    .map((width) => `${getResponsiveCaseStudyImage(source, width)} ${width}w`)
    .join(', ');
};
