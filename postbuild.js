const fs = require('fs');
const CASE_STUDIES = require('./src/content/case-studies.json');

const SITE_ORIGIN = 'https://www.designedbyomar.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/Images/og-image.png`;
const WORK_TITLE = 'Selected Work — Omar Tavarez';
const WORK_DESCRIPTION = 'Selected product design case studies by Omar Tavarez across AI workflows, design systems, fintech, healthcare SaaS, and enterprise UX.';
const WORK_URL = `${SITE_ORIGIN}/work`;
const DESIGN_SYSTEM_URL = `${SITE_ORIGIN}/design-system`;

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
        about: c.tags,
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

const workStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: WORK_TITLE,
      url: WORK_URL,
      description: WORK_DESCRIPTION,
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
    },
    personSchema,
  ],
});

const designSystemStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'designedbyomar Design System',
      url: DESIGN_SYSTEM_URL,
      description: 'The design-system reference for the portfolio, case-study storytelling, interaction patterns, and motion language behind designedbyomar.com.',
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
    },
    {
      '@type': 'CreativeWork',
      name: 'designedbyomar Design System',
      url: DESIGN_SYSTEM_URL,
      description: "A public design-system artifact documenting the tokens, components, patterns, content rules, and accessibility standards behind Omar Tavarez's portfolio.",
      creator: personSchema,
      about: ['Design Systems', 'Portfolio Design', 'Product Design', 'Design Engineering'],
    },
    personSchema,
  ],
});

// Escape XML special characters to prevent sitemap corruption
function escapeXml(str) {
  return str.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return match;
    }
  });
}

function generateSitemap(distDir) {
  const staticPages = [
    { loc: `${SITE_ORIGIN}/`,              changefreq: 'weekly',  priority: '1.0' },
    { loc: `${SITE_ORIGIN}/work`,          changefreq: 'weekly',  priority: '0.9' },
    { loc: `${SITE_ORIGIN}/design-system`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${SITE_ORIGIN}/privacy`,       changefreq: 'yearly',  priority: '0.4' },
  ];
  const caseStudyPages = CASE_STUDIES.map((c) => ({
    loc: escapeXml(`${SITE_ORIGIN}/work/${encodeURIComponent(c.id)}/`),
    changefreq: 'monthly',
    priority: '0.8',
  }));
  const urls = [...staticPages, ...caseStudyPages];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(({ loc, changefreq, priority }) =>
      `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    ),
    '</urlset>',
  ].join('\n');
  fs.writeFileSync(`${distDir}/sitemap.xml`, xml);
}

const H1_STYLE = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';

function injectH1(html, text) {
  const replacement = `<div id="root"><h1 style="${H1_STYLE}">${escapeAttr(text)}</h1></div>`;
  // Replace either an existing visually-hidden H1 (from the index.html template) or an empty root div
  const withExisting = html.replace(/<div id="root"><h1 style="[^"]*">[^<]*<\/h1><\/div>/, replacement);
  if (withExisting !== html) return withExisting;
  return html.replace('<div id="root"></div>', replacement);
}

function generateRoutes() {
  const distDir = './dist';
  if (!fs.existsSync(distDir)) return;

  const indexHtml = fs.readFileSync(`${distDir}/index.html`, 'utf8');

  const workDir = `${distDir}/work`;
  fs.mkdirSync(workDir, { recursive: true });
  const workHtml = injectH1(setStructuredData(
    setMeta(indexHtml, {
      title: WORK_TITLE,
      description: WORK_DESCRIPTION,
      url: WORK_URL,
      image: DEFAULT_OG_IMAGE,
    }),
    workStructuredData(),
  ), WORK_TITLE);
  fs.writeFileSync(`${workDir}/index.html`, workHtml);

  CASE_STUDIES.forEach((c) => {
    const dir = `${distDir}/work/${c.id}`;
    fs.mkdirSync(dir, { recursive: true });

    let html = setMeta(indexHtml, {
      title: `${c.title} — Omar Tavarez`,
      description: c.metaDescription || c.subtitle,
      url: `${SITE_ORIGIN}/work/${c.id}/`,
      image: c.ogImage,
    });
    // Strip width/height only for case studies — WebP dimensions differ from the home PNG.
    const withoutWidth = html.replace(/<meta property="og:image:width" content="[^"]*"\s*\/?>\r?\n?/, '');
    if (withoutWidth === html) throw new Error('og:image:width tag not found in index.html template — check template and rerun build');
    html = withoutWidth;

    const withoutHeight = html.replace(/<meta property="og:image:height" content="[^"]*"\s*\/?>\r?\n?/, '');
    if (withoutHeight === html) throw new Error('og:image:height tag not found in index.html template — check template and rerun build');
    html = withoutHeight;
    html = setStructuredData(html, caseStudyStructuredData(c));
    html = injectH1(html, `${c.title} — Omar Tavarez`);

    fs.writeFileSync(`${dir}/index.html`, html);
  });

  const privacyDir = `${distDir}/privacy`;
  fs.mkdirSync(privacyDir, { recursive: true });
  const privacyHtml = injectH1(setStructuredData(
    setMeta(indexHtml, {
      title: 'Privacy Policy — Omar Tavarez',
      description: 'Privacy policy for designedbyomar.com — what data is collected, how analytics consent works, and how to contact Omar Tavarez with data requests.',
      url: `${SITE_ORIGIN}/privacy`,
      image: DEFAULT_OG_IMAGE,
    }),
    privacyStructuredData(),
  ), 'Privacy Policy — Omar Tavarez');
  fs.writeFileSync(`${privacyDir}/index.html`, privacyHtml);

  const designSystemSourcePath = `${distDir}/design-system.html`;
  if (fs.existsSync(designSystemSourcePath)) {
    const designSystemDir = `${distDir}/design-system`;
    fs.mkdirSync(designSystemDir, { recursive: true });
    const designSystemSource = fs.readFileSync(designSystemSourcePath, 'utf8');
    const designSystemHtml = injectH1(setStructuredData(
      setMeta(designSystemSource, {
        title: 'designedbyomar Design System',
        description: "The designedbyomar Design System documents the tokens, components, motion, content patterns, and accessibility rules powering Omar Tavarez's portfolio.",
        url: DESIGN_SYSTEM_URL,
        image: DEFAULT_OG_IMAGE,
      }),
      designSystemStructuredData(),
    ), 'designedbyomar Design System');
    fs.writeFileSync(`${designSystemDir}/index.html`, designSystemHtml);
  }

  generateSitemap(distDir);
  console.log('✅ Generated static routes with unique SEO metadata.');
}

generateRoutes();
