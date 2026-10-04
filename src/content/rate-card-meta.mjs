// Approved sales copy shared by the client page and static route generator.
export const RATE_CARD_META = {
  title: 'Services & rates',
  metaTitle: 'Services & rates — Omar Tavarez',
  description: 'Senior product design services for US startups and established businesses: scoped audits, projects, and ongoing support with clear USD pricing.',
};

export const rateCardStructuredData = (url) => ({
  '@context': 'https://schema.org', '@type': 'WebPage',
  name: RATE_CARD_META.metaTitle, description: RATE_CARD_META.description, url,
});
