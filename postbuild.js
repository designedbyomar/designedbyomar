const fs = require('fs');

const SITE_ORIGIN = 'https://designedbyomar.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/Images/og-image.png`;

const CASE_STUDIES = [
  { id: 'mgmt-portal', title: 'Management Portal', subtitle: 'Ops command center replacing 200+ spreadsheets with real-time intelligence.', client: 'Wisdom', ogImage: '/Images/case-studies/management-portal/team-lead-dashboard.webp' },
  { id: 'posting-asst', title: 'Posting Assistant', subtitle: 'AI-assisted insurance payment posting workflow that kept specialists in control.', client: 'Wisdom', ogImage: '/Images/case-studies/posting-asst/cover.webp' },
  { id: 'page-builder', title: 'Page Builder 2.0', subtitle: 'CRM page builder rebuilt from scratch in 2 months to stop churn from competitors.', client: 'Simplero', ogImage: '/Images/case-studies/page-builder/cover.webp' },
  { id: 'connect-api', title: 'Connect API Payments', subtitle: 'PCI Level 1 embedded payments widget shipped with $20M+ monthly volume in month one.', client: 'Plastiq', ogImage: '/Images/case-studies/connect-api/cover.webp' },
  { id: 'athena-ds', title: 'Athena Design System 2.0', subtitle: "Enterprise design system that became the foundation for Plastiq's IPO-era brand.", client: 'Plastiq', ogImage: '/Images/case-studies/athena-ds/cover.webp' },
  { id: 'plastiq-mktg', title: 'Plastiq Marketing Site', subtitle: 'Pre-IPO brand relaunch delivered WCAG-compliant in 3–4 weeks.', client: 'Plastiq', ogImage: '/Images/case-studies/plastiq-mktg/cover.webp' },
  { id: 'disney-cct', title: 'Critical Communication Tool', subtitle: 'Enterprise subscription manager used to coordinate 250 critical incidents.', client: 'The Walt Disney Company', ogImage: '/Images/case-studies/disney-cct/cover.webp' },
  { id: 'disney-uap', title: 'Unified Ad Platform', subtitle: 'Four brand ad-sales platforms consolidated into one cross-brand system.', client: 'Disney (DTC&I)', ogImage: '/Images/case-studies/disney-uap/cover.webp' },
];

const personSchema = {
  '@type': 'Person',
  name: 'Omar Tavarez',
  url: `${SITE_ORIGIN}/`,
  jobTitle: 'Product Designer',
  email: 'omar@designedbyomar.com',
  sameAs: [
    'https://www.linkedin.com/in/omartavarez/',
    'https://github.com/designedbyomar',
    'https://substack.com/@designedbyomar',
  ],
  knowsAbout: [
    'Product Design',
    'Design Systems',
    'AI Workflows',
    'Fintech',
    'Healthcare SaaS',
    'Enterprise UX',
  ],
};

const toAbsoluteUrl = (pathOrUrl) => {
  if (!pathOrUrl) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
};

const imageType = (imageUrl) => {
  if (imageUrl.endsWith('.webp')) return 'image/webp';
  if (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
};

const escapeAttr = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const replaceTag = (html, pattern, replacement) => html.replace(pattern, replacement);

const setMeta = (html, { title, description, url, image }) => {
  const ogImage = toAbsoluteUrl(image);
  const escapedTitle = escapeAttr(title);
  const escapedDescription = escapeAttr(description);
  const escapedUrl = escapeAttr(url);
  const escapedImage = escapeAttr(ogImage);

  let next = html;
  next = replaceTag(next, /<title>.*?<\/title>/, `<title>${escapedTitle}</title>`);
  next = replaceTag(next, /<meta name="description" content=".*?">/, `<meta name="description" content="${escapedDescription}">`);
  next = replaceTag(next, /<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${escapedTitle}">`);
  next = replaceTag(next, /<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${escapedDescription}">`);
  next = replaceTag(next, /<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${escapedUrl}">`);
  next = replaceTag(next, /<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${escapedImage}">`);
  next = replaceTag(next, /<meta property="og:image:type" content=".*?">/, `<meta property="og:image:type" content="${imageType(ogImage)}">`);
  next = replaceTag(next, /<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${escapedTitle}">`);
  next = replaceTag(next, /<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${escapedDescription}">`);
  next = replaceTag(next, /<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${escapedImage}">`);
  next = replaceTag(next, /<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${escapedUrl}">`);
  return next;
};

const setStructuredData = (html, data) => {
  const json = JSON.stringify(data, null, 2);
  return html.replace(
    /<script(?: id="structured-data")? type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="structured-data" type="application/ld+json">\n${json}\n</script>`,
  );
};

const caseStudyStructuredData = (c) => {
  const url = `${SITE_ORIGIN}/work/${c.id}/`;
  const image = toAbsoluteUrl(c.ogImage);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${c.title} — Omar Tavarez`,
        url,
        description: c.subtitle,
        image,
        isPartOf: {
          '@type': 'WebSite',
          name: 'designedbyomar',
          url: `${SITE_ORIGIN}/`,
        },
      },
      {
        '@type': 'CreativeWork',
        name: c.title,
        url,
        description: c.subtitle,
        creator: personSchema,
        about: [c.client],
      },
      personSchema,
    ],
  };
};

const privacyStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Privacy Policy — Omar Tavarez',
      url: `${SITE_ORIGIN}/privacy`,
      description: 'Privacy policy and data collection details for designedbyomar.com.',
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
    },
    personSchema,
  ],
});

function generateRoutes() {
  const distDir = './dist';
  if (!fs.existsSync(distDir)) return;

  const indexHtml = fs.readFileSync(`${distDir}/index.html`, 'utf8');

  CASE_STUDIES.forEach((c) => {
    const dir = `${distDir}/work/${c.id}`;
    fs.mkdirSync(dir, { recursive: true });

    const html = setStructuredData(
      setMeta(indexHtml, {
        title: `${c.title} — Omar Tavarez`,
        description: c.subtitle,
        url: `${SITE_ORIGIN}/work/${c.id}/`,
        image: c.ogImage,
      }),
      caseStudyStructuredData(c),
    );

    fs.writeFileSync(`${dir}/index.html`, html);
  });

  const privacyDir = `${distDir}/privacy`;
  fs.mkdirSync(privacyDir, { recursive: true });
  const privacyHtml = setStructuredData(
    setMeta(indexHtml, {
      title: 'Privacy Policy — Omar Tavarez',
      description: 'Privacy policy and data collection details for designedbyomar.com.',
      url: `${SITE_ORIGIN}/privacy`,
      image: DEFAULT_OG_IMAGE,
    }),
    privacyStructuredData(),
  );
  fs.writeFileSync(`${privacyDir}/index.html`, privacyHtml);

  console.log('✅ Generated static routes with unique SEO metadata.');
}

generateRoutes();
