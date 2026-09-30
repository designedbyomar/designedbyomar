const fs = require('fs');
let normalizeBlocks = (body) => (Array.isArray(body) ? body : []); // replaced below by the shared module
const CASE_STUDIES = require('./src/content/case-studies.json');

const SITE_ORIGIN = 'https://www.designedbyomar.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/Images/og-image.png`;
const WORK_TITLE = 'Selected Work — Omar Tavarez';
const WORK_DESCRIPTION = 'Selected product design case studies by Omar Tavarez across AI workflows, design systems, fintech, healthcare SaaS, and enterprise UX.';
const WORK_URL = `${SITE_ORIGIN}/work`;
const DESIGN_SYSTEM_URL = `${SITE_ORIGIN}/design-system`;
const ASK_TITLE = 'Ask about the work — Omar Tavarez';
const ASK_DESCRIPTION = 'Answers about Omar Tavarez\u2019s product design work \u2014 design systems, fintech and embedded payments, AI workflows, healthcare SaaS and enterprise UX \u2014 written from the published case studies.';
const ASK_URL = `${SITE_ORIGIN}/ask`;
const ABOUT_TITLE = 'About — Omar Tavarez';
const ABOUT_DESCRIPTION = 'Omar Tavarez is a principal product designer who turns undefined product problems into shipped software across AI, fintech, healthcare, and enterprise SaaS. Former DJ, lifelong artist, amateur boxer.';
const ABOUT_URL = `${SITE_ORIGIN}/about`;

const personSchema = {
  '@type': 'Person',
  name: 'Omar Tavarez',
  url: `${SITE_ORIGIN}/`,
  jobTitle: 'Principal Product Designer',
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

/**
 * For a double-quoted attribute value. `'` is escaped too, though nothing here
 * writes a single-quoted attribute — it costs a replace and removes the trap
 * for whoever writes the first one.
 */
const escapeAttr = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/**
 * For text between tags. Quotes need no escaping there, so this is the minimal
 * correct set and reads as what it is: `escapeAttr` was doing this job in a
 * dozen places, and a function named for attributes doing it invites the
 * reasonable suspicion that the text was unescaped.
 */
const escapeText = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const replaceTag = (html, pattern, replacement) => html.replace(pattern, replacement);

const setMeta = (html, {
  title,
  description,
  url,
  image,
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt = title,
}) => {
  const ogImage = toAbsoluteUrl(image);
  const escapedTitle = escapeAttr(title);
  const escapedDescription = escapeAttr(description);
  const escapedUrl = escapeAttr(url);
  const escapedImage = escapeAttr(ogImage);
  const escapedImageAlt = escapeAttr(imageAlt);

  let next = html;
  next = replaceTag(next, /<title>.*?<\/title>/, `<title>${escapedTitle}</title>`);
  next = replaceTag(next, /<meta name="description" content=".*?">/, `<meta name="description" content="${escapedDescription}">`);
  next = replaceTag(next, /<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${escapedTitle}">`);
  next = replaceTag(next, /<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${escapedDescription}">`);
  next = replaceTag(next, /<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${escapedUrl}">`);
  next = replaceTag(next, /<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${escapedImage}">`);
  next = replaceTag(next, /<meta property="og:image:type" content=".*?">/, `<meta property="og:image:type" content="${imageType(ogImage)}">`);
  next = replaceTag(next, /<meta property="og:image:width" content=".*?">/, `<meta property="og:image:width" content="${imageWidth}">`);
  next = replaceTag(next, /<meta property="og:image:height" content=".*?">/, `<meta property="og:image:height" content="${imageHeight}">`);
  next = replaceTag(next, /<meta property="og:image:alt" content=".*?">/, `<meta property="og:image:alt" content="${escapedImageAlt}">`);
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

const askStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: ASK_TITLE,
      url: ASK_URL,
      description: ASK_DESCRIPTION,
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
    },
    personSchema,
  ],
});

const aboutStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      name: ABOUT_TITLE,
      url: ABOUT_URL,
      description: ABOUT_DESCRIPTION,
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
      mainEntity: personSchema,
    },
    personSchema,
  ],
});

// Deliberately not FAQPage. Google limits that rich result to "well-known,
// authoritative government and health websites", so it would buy nothing and
// invite a structured-data warning for a mismatch with the visible page.

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
    { loc: ABOUT_URL,                      changefreq: 'monthly', priority: '0.7' },
    { loc: ASK_URL,                        changefreq: 'weekly',  priority: '0.8' },
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

const HIDDEN_STYLE = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0';

const ROOT_DIV_OPEN = /<div\b[^>]*\bid\s*=\s*(["'])root\1[^>]*>/i;

function rootContentRange(html, label) {
  const rootOpen = ROOT_DIV_OPEN.exec(html);
  if (!rootOpen) {
    throw new Error(`injectRootContent: no #root div found in template — "${label}" was not injected`);
  }

  const contentStart = rootOpen.index + rootOpen[0].length;
  const divTag = /<\/?div\b[^>]*>/gi;
  divTag.lastIndex = contentStart;
  let depth = 1;
  let match;

  while ((match = divTag.exec(html))) {
    depth += /^<\/div\b/i.test(match[0]) ? -1 : 1;
    if (depth === 0) return { start: contentStart, end: match.index };
  }

  throw new Error(`injectRootContent: #root div is not closed in template — "${label}" was not injected`);
}

// Writes pre-escaped markup into #root. main.jsx mounts with createRoot().render()
// rather than hydrateRoot(), so React replaces these children outright and users never
// see them. They exist for consumers that never execute the bundle: AI assistants, ATS
// scrapers, link-preview bots, reader mode, and non-rendering crawlers.
function injectRootContent(html, innerHtml, label) {
  const { start, end } = rootContentRange(html, label);
  return `${html.slice(0, start)}${innerHtml}${html.slice(end)}`;
}

function injectH1(html, text) {
  return injectRootContent(html, `<h1 style="${HIDDEN_STYLE}">${escapeText(text)}</h1>`, text);
}

// The full case-study record as static HTML. The rendered React view labels these
// sections with styled divs (src/main.jsx); real headings here give the static version
// the cleaner document outline, which is what non-rendering consumers actually read.
// Serializes the migrated long-form body. Consumers that never execute the bundle —
// crawlers, AI assistants, ATS scrapers, link-preview bots — read this and nothing else,
// so images belong here as real <img> tags, not just in the client-rendered DOM.
function caseStudyBodyHtml(rawBody) {
  const body = normalizeBlocks(rawBody);
  if (!body.length) return '';
  // Text between tags and values inside attributes are escaped differently.
  // This used to alias one helper for both, which is what made the helper look
  // wrong at every text-node call site.
  const txt = escapeText;
  const attr = escapeAttr;
  const li = (items) => items.map((i) => `<li>${txt(i)}</li>`).join('');
  const figure = (src, alt, caption) =>
    `<figure><img src="${attr(src)}" alt="${attr(alt || '')}">${caption ? `<figcaption>${txt(caption)}</figcaption>` : ''}</figure>`;

  return body.map((b) => {
    switch (b.type) {
      case 'heading':
        return `<h${b.level}>${txt(b.text)}</h${b.level}>`;
      case 'paragraph':
        return `<p>${txt(b.text)}</p>`;
      case 'list':
        return `<ul>${li(b.items)}</ul>`;
      case 'quote':
        return `<blockquote><p>${txt(b.text)}</p>${b.attribution ? `<cite>${txt(b.attribution)}</cite>` : ''}</blockquote>`;
      case 'callout':
        return `<aside><h3>${txt(b.title)}</h3><ul>${li(b.items)}</ul></aside>`;
      case 'gallery':
        return `<div class="cs-gallery">${(b.images || []).map((img) => figure(img.src, img.alt, img.caption)).join('')}</div>`;
      case 'image':
        return figure(b.src, b.alt, b.caption);
      default:
        return '';
    }
  }).join('');
}
function caseStudyContentHtml(c) {
  const meta = [c.client, c.year, c.role].filter(Boolean).map(escapeAttr).join(' · ');
  const list = (items) => (items && items.length ? `<ul>${items.join('')}</ul>` : '');
  const tags = list((c.tags || []).map((t) => `<li>${escapeText(t)}</li>`));
  const metrics = list((c.metrics || []).map((m) => `<li>${escapeText(m.value)} — ${escapeText(m.label)}${m.qualifier ? ` (${escapeText(m.qualifier)})` : ''}</li>`));
  const section = (label, body) => (body ? `<h2>${label}</h2><p>${escapeText(body)}</p>` : '');

  return [
    `<article style="${HIDDEN_STYLE}">`,
    `<h1>${escapeText(c.title)}</h1>`,
    c.subtitle ? `<p>${escapeText(c.subtitle)}</p>` : '',
    meta ? `<p>${meta}</p>` : '',
    tags,
    metrics,
    section('Challenge', c.challenge),
    section('Approach', c.approach),
    section('Outcome', c.outcome),
    caseStudyBodyHtml(c.body),
    '</article>',
  ].join('');
}

/**
 * Ship only the approved Ask answers, as a separate file the page fetches on
 * first interaction.
 *
 * Two reasons it is not imported into the bundle. Drafts would travel with it —
 * filtering at runtime still ships the text — and the answer set has no
 * business in the critical path when most visitors never open it.
 */
/**
 * The case studies, chunked into retrievable sections.
 *
 * The drafting model previously saw only the two or three nearest pre-written
 * answers — roughly 270 words of summary — and never the case studies those
 * answers summarise. So it could only ever restate an answer that already
 * existed, which is exactly what a visitor asking something new does not want.
 *
 * The whole corpus is about 14,000 words, far past what belongs in one request,
 * so it ships as sections and the endpoint retrieves the few that match. A
 * section is a heading plus the prose under it; the standing challenge,
 * approach and outcome fields become sections of their own.
 *
 * Published rather than imported for the same reasons as the answers: the
 * function bundler rejects JSON import attributes, and a published file is the
 * one the allowlist has already filtered.
 */
function generateAskSources(distDir) {
  const WORTH_RETRIEVING = 24;
  const MAX_SECTION_WORDS = 180;
  const sections = [];

  for (const c of CASE_STUDIES) {
    const push = (heading, parts) => {
      const cleaned = parts.filter(Boolean).map(t => String(t).replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (!cleaned.length) return;

      // Split at paragraph boundaries rather than truncating. One section ran to
      // 663 words, which on its own would be most of a request's budget — and
      // truncating would cut the outcome off the end of the argument.
      const chunks = [];
      let current = [];
      let words = 0;
      for (const part of cleaned) {
        const length = part.split(' ').length;
        if (words && words + length > MAX_SECTION_WORDS) {
          chunks.push(current.join(' '));
          current = [];
          words = 0;
        }
        current.push(part);
        words += length;
      }
      if (current.length) chunks.push(current.join(' '));

      for (const text of chunks) {
        // Below this a section is a stub — a lone subheading or a one-line
        // caption — and is noise in retrieval rather than material to draft from.
        if (text.split(' ').length < WORTH_RETRIEVING) continue;
        sections.push({
          id: `${c.id}#${sections.filter(s => s.caseStudy === c.id).length}`,
          caseStudy: c.id,
          title: c.title,
          heading,
          text,
          // How the study is labelled, carried on every one of its sections.
          //
          // These were left out of the first version, and their absence was
          // mistaken for a fact about the writing: "fintech" appears in no
          // section body, because the prose says "payments" and "card and
          // bank" — but it is right there as a tag on Connect API, and on the
          // page as a badge. Indexing only the prose made a searchable label
          // unsearchable. They belong on every section because they identify
          // the study, not a passage within it.
          labels: [
            ...(c.tags || []),
            c.client,
            c.role,
            String(c.year ?? ''),
            c.subtitle,
          ].filter(Boolean).join(' '),
        });
      }
    };

    push('Challenge', [c.challenge]);
    push('Approach', [c.approach]);
    push('Outcome', [c.outcome]);

    // Body blocks group under the heading that precedes them.
    let heading = 'Overview';
    let buffer = [];
    for (const b of normalizeBlocks(c.body || [])) {
      if (b.type === 'heading') {
        push(heading, buffer);
        heading = b.text;
        buffer = [];
      } else if (b.type === 'paragraph') {
        buffer.push(b.text);
      } else if (b.type === 'list') {
        buffer.push((b.items || []).join('. '));
      } else if (b.type === 'quote') {
        buffer.push(b.attribution ? `"${b.text}" — ${b.attribution}` : b.text);
      } else if (b.type === 'callout') {
        buffer.push([b.title, ...(b.items || [])].filter(Boolean).join('. '));
      }
    }
    push(heading, buffer);
  }

  fs.writeFileSync(`${distDir}/ask-sources.json`, JSON.stringify({ sections }));
  const words = sections.reduce((n, s) => n + s.text.split(' ').length, 0);
  console.log(`\u2705 Ask: ${sections.length} case-study section(s) available to draft from, ${words} words.`);
}

function generateAskAnswers(distDir, indexHtml) {
  const doc = require('./src/content/ask-answers.json');
  const approved = doc.answers
    .filter(answer => answer.status === 'approved')
    .map(({ id, question, aliases, answer, sources, topic }) => ({ id, question, aliases, answer, sources, topic }));

  // The case-study list travels with the answers rather than with the sections.
  // The router needs it to name sources, and it runs before anything decides a
  // draft is needed — so the big sections file stays lazy, fetched only when a
  // draft actually happens.
  const studies = CASE_STUDIES.map(c => ({
    id: c.id,
    title: c.title,
    // The tags are how the site itself labels a study — they render as badges
    // on the page — and they carry the vocabulary the prose does not. Connect
    // API is tagged Fintech; the word appears nowhere in its writing. Without
    // them the router had to infer the category from a title and one line.
    tags: c.tags || [],
    summary: c.subtitle || c.metaDescription || '',
  }));

  fs.writeFileSync(`${distDir}/ask-answers.json`, JSON.stringify({ answers: approved, studies }));

  // The Ask panel is client-rendered, so none of its text reaches a crawler, an
  // ATS scraper or an assistant reading the page without JavaScript. The answers
  // are injected into /ask so those consumers get all of them.
  //
  // They live here rather than on the homepage, where they were first put: the
  // same 4,600 words on two indexed URLs is a duplicate-content problem, and
  // /ask is the page that should rank for them. It also keeps roughly 10KB
  // gzipped off the homepage, which is the one page in the critical path.
  const askDir = `${distDir}/ask`;
  fs.mkdirSync(askDir, { recursive: true });
  const answersHtml = approved.length ? [
    `<article style="${HIDDEN_STYLE}">`,
    ...approved.map((a) => `<h2>${escapeText(a.question)}</h2><p>${escapeText(a.answer)}</p>`),
    '</article>',
  ].join('') : '';
  const askHtml = injectRootContent(
    setStructuredData(
      setMeta(indexHtml, {
        title: ASK_TITLE,
        description: ASK_DESCRIPTION,
        url: ASK_URL,
        image: DEFAULT_OG_IMAGE,
      }),
      askStructuredData(),
    ),
    `<h1 style="${HIDDEN_STYLE}">${escapeText(ASK_TITLE)}</h1>${answersHtml}`,
    ASK_TITLE,
  );
  fs.writeFileSync(`${askDir}/index.html`, askHtml);

  const held = doc.answers.length - approved.length;
  console.log(`\u2705 Ask: ${approved.length} approved answer(s) shipped${held ? `, ${held} draft(s) withheld` : ''}.`);
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
      imageWidth: 1200,
      imageHeight: 627,
      imageAlt: c.title,
    });
    html = setStructuredData(html, caseStudyStructuredData(c));
    html = injectRootContent(html, caseStudyContentHtml(c), c.title);

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

  // /about — the copy is client-rendered, so a hidden snapshot is emitted for crawlers.
  const aboutDir = `${distDir}/about`;
  fs.mkdirSync(aboutDir, { recursive: true });
  const aboutSections = [
    ['Background', [
      "I grew up in Brooklyn as an artist, and I've been drawing and painting my whole life. I found design through music. I was a professional DJ, and I started designing flyers for my own parties. That led to Photoshop, music covers, and the early internet, and then graphic, web and visual design. Product came through the practical side: HTML, CSS, small agency work, and learning how to turn ideas into interfaces people could actually use. Over time, that path moved through e-commerce, SaaS, fintech, healthcare, ad sales, media, and enterprise tools.",
      "The through-line has always been the same: I like hard product problems. The kind with messy data, edge cases, operational constraints, business pressure, and users who need the product to work because their job depends on it.",
      "Where it started: flyers from the DJ years, and a lifetime of drawing. A few UX sketches snuck in.",
    ]],
    ['How I work', [
      "I'm a generalist with a systems mindset. I usually start in plain text: writing, mapping the problem, naming the tradeoffs, and cutting through ambiguity. Then I move quickly into flows, prototypes, and working artifacts.",
      "I'd rather put a rough prototype in a teammate's hands than spend another week polishing a deck. I care about craft, but I care more about momentum, clarity, and whether the work helps the team make a better decision.",
      "I've led workshops, shaped product direction, built design systems, and partnered closely with engineers to ship. Not for process theater — for speed, consistency, and better product quality.",
    ]],
    ['Currently', [
      "I run an independent product design practice. I work with Welcome Lend and a few other companies I keep private, and the engagements are equal parts consulting and building — I'm as likely to be rebuilding a design system as shipping a feature to production.",
      "At Welcome Lend I rebuilt the design system and shipped work their brokers use daily. One project was a lender comparison tool: brokers weigh quotes to find the right fit for a borrower, and the existing matrix had turned into something you decoded rather than read. Another was sponsor expiration — designing how records lapse on a schedule instead of quietly going stale.",
      "Before this I spent two years as the founding designer at Wisdom, an early-stage healthcare SaaS platform, leading design across Management Portal, Reporting, Insurance Verification, and Posting Assistant — including an AI-assisted payment posting workflow that cut manual posting time by about 40%.",
      "Previously: Plastiq, Disney, Simplero, GoNation.",
    ]],
    ['Tools & craft', [
      "Figma, React, HTML/CSS/JS, Claude Code, ChatGPT, Codex, Notion, Linear, and Obsidian.",
      "I use AI tools as part of my design workflow — to explore faster, prototype smarter, write better documentation, pressure-test ideas, and move from concept to implementation with less friction. I still believe taste, judgment, and product thinking are the real tools. The software just helps me move faster.",
    ]],
    ['Off the clock', [
      "Amateur boxer, music producer, former DJ, and dedicated father. When I'm not training, I'm usually outdoors — hiking, traveling, and meeting new people. I'm usually thinking about systems, behavior, design, music, training, or why Brooklyn still has the best energy of any place on earth.",
    ]],
  ];
  const aboutStats = [
    ['12+ years', 'in product design (15+ designing overall)'],
    ['500+', 'interviews with customers, operators and teams'],
    ['4', 'design systems'],
    ['30+', 'launches'],
  ];
  const aboutBody = [
    `<article style="${HIDDEN_STYLE}">`,
    `<h1>${escapeText('I started out designing flyers for my own parties.')}</h1>`,
    `<p>${escapeText('Now I turn undefined product problems into shipped software across AI, fintech, healthcare, and enterprise SaaS. 12+ years leading 0→1 products, building design systems, and partnering with product, engineering, and leadership to move strategy into real product outcomes.')}</p>`,
    `<ul>${aboutStats.map(([v, l]) => `<li>${escapeText(`${v} — ${l}`)}</li>`).join('')}</ul>`,
    ...aboutSections.map(([heading, paras]) => `<h2>${escapeText(heading)}</h2>${paras.map((p) => `<p>${escapeText(p)}</p>`).join('')}`),
    '</article>',
  ].join('');
  const aboutHtml = injectRootContent(
    setStructuredData(
      setMeta(indexHtml, {
        title: ABOUT_TITLE,
        description: ABOUT_DESCRIPTION,
        url: ABOUT_URL,
        image: DEFAULT_OG_IMAGE,
      }),
      aboutStructuredData(),
    ),
    aboutBody,
    ABOUT_TITLE,
  );
  fs.writeFileSync(`${aboutDir}/index.html`, aboutHtml);

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

  generateAskAnswers(distDir, indexHtml);
  generateAskSources(distDir);
  generateSitemap(distDir);
  console.log('✅ Generated static routes with unique SEO metadata.');
}

if (require.main === module) (async () => {
  ({ normalizeBlocks } = await import('./src/content/case-study-blocks.mjs'));
  generateRoutes();
})();

module.exports = { injectRootContent, escapeAttr, escapeText };
