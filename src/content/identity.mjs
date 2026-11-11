// Who Omar is and how to work with him, in one place. The app, the static route
// generator, and the SEO tests all read this, so search engines and AI agents
// see the same identity on every route. index.html repeats these values for the
// pre-JavaScript head; tests/seo-static.test.mjs keeps it in sync.

export const SITE_ORIGIN = 'https://www.designedbyomar.com';

export const LINKEDIN_URL = 'https://www.linkedin.com/in/omartavarez/';
export const GITHUB_URL = 'https://github.com/designedbyomar';
export const SUBSTACK_URL = 'https://substack.com/@designedbyomar';
export const BEHANCE_URL = 'https://www.behance.net/omartavarez';
export const BOOKING_URL = 'https://koalendar.com/e/lets-talk-or-omar-tavarez?duration=30&services=HJUDE';
export const CONTACT_EMAIL = 'omar@designedbyomar.com';

export const PRINCIPAL_TITLE = 'Principal Product Designer';

export const HOME_DESCRIPTION = 'Omar Tavarez is a principal product designer for AI workflows, design systems, fintech, and healthcare SaaS. Available for fractional and freelance work.';
export const SITE_DESCRIPTION = 'Portfolio site for Omar Tavarez, a principal product designer focused on AI workflows, design systems, fintech, healthcare SaaS, and enterprise UX.';

// Engagement types from the services page, without prices. Pricing is shared
// directly, so the services page stays noindex and is never linked from here.
const service = (name, description) => ({
  '@type': 'Offer',
  itemOffered: { '@type': 'Service', name, description },
});

export const PERSON_SCHEMA = {
  '@type': 'Person',
  name: 'Omar Tavarez',
  url: `${SITE_ORIGIN}/`,
  jobTitle: PRINCIPAL_TITLE,
  email: CONTACT_EMAIL,
  sameAs: [LINKEDIN_URL, GITHUB_URL, SUBSTACK_URL, BEHANCE_URL],
  knowsAbout: [
    'Product Design',
    'Design Systems',
    'AI Workflows',
    'Fintech',
    'Healthcare SaaS',
    'Enterprise UX',
    'B2B SaaS',
    'Design Engineering',
    'Fractional Product Design',
    'Product and UX Audits',
    'Design Sprints',
  ],
  makesOffer: [
    service('Product Audit', 'A focused expert review of a product flow or a product and marketing website, with prioritized fixes.'),
    service('Design Sprint', 'A defined product problem taken from direction to a testable design.'),
    service('Fractional Product Design', 'Ongoing senior product design capacity alongside an existing team.'),
    service('Website Build and Support', 'A marketing website designed and built through launch, with optional ongoing support.'),
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Freelance and fractional inquiries',
    email: CONTACT_EMAIL,
    url: BOOKING_URL,
  },
};
