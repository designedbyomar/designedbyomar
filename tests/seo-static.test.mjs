import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { injectRootContent, escapeAttr, escapeText } = require('../postbuild.js');

const SITE_ORIGIN = 'https://www.designedbyomar.com';
const PRINCIPAL_TITLE = 'Principal Product Designer';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const readText = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');
const readDist = (...parts) => fs.readFileSync(path.join(DIST, ...parts), 'utf8');

const sitemapXml = () => readDist('sitemap.xml');
const sitemapUrls = () => [...sitemapXml().matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const caseStudySource = () => JSON.parse(readText('src', 'content', 'case-studies.json'));

const pagePathForUrl = (url) => {
  const { pathname } = new URL(url);
  if (pathname === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, pathname.replace(/^\/|\/$/g, ''), 'index.html');
};

const getTitle = (html) => html.match(/<title>(.*?)<\/title>/i)?.[1] ?? '';
const getCanonical = (html) => html.match(/<link rel="canonical" href="([^"]+)">/i)?.[1] ?? '';
const getMetaByName = (html, name) => html.match(new RegExp(`<meta name="${name}" content="([^"]+)">`, 'i'))?.[1] ?? '';
const getMetaByProperty = (html, property) => html.match(new RegExp(`<meta property="${property}" content="([^"]+)">`, 'i'))?.[1] ?? '';

const getStructuredData = (html) => {
  const match = html.match(/<script id="structured-data" type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i);
  assert.ok(match, 'structured data script is present');
  return JSON.parse(match[1]);
};

const hasGraphUrl = (structuredData, url) => {
  const graph = Array.isArray(structuredData['@graph']) ? structuredData['@graph'] : [];
  return graph.some((node) => node && node.url === url);
};

const getJsJobTitle = (source, label) => {
  const match = source.match(/\bjobTitle:\s*'([^']+)'/);
  assert.ok(match, `${label} defines a jobTitle`);
  return match[1];
};

test('homepage identity stays consistent across machine-readable surfaces', () => {
  const homepageHtml = readDist('index.html');
  const description = getMetaByName(homepageHtml, 'description');
  const structuredData = getStructuredData(homepageHtml);
  const graph = Array.isArray(structuredData['@graph']) ? structuredData['@graph'] : [];
  const person = graph.find((node) => node && node['@type'] === 'Person');

  assert.match(description, /principal product designer/i, 'homepage description states the principal title');
  assert.equal(getMetaByProperty(homepageHtml, 'og:description'), description, 'Open Graph description matches the homepage description');
  assert.equal(getMetaByName(homepageHtml, 'twitter:description'), description, 'Twitter description matches the homepage description');
  assert.equal(person?.jobTitle, PRINCIPAL_TITLE, 'homepage JSON-LD uses the principal title');
  assert.ok(homepageHtml.includes(`Omar Tavarez — ${PRINCIPAL_TITLE}</h1>`), 'static homepage H1 uses the principal title');
  assert.equal(getJsJobTitle(readText('postbuild.js'), 'postbuild.js'), PRINCIPAL_TITLE);
  assert.equal(getJsJobTitle(readText('src', 'main.jsx'), 'src/main.jsx'), PRINCIPAL_TITLE);
  assert.ok(
    readDist('llms.txt').toLowerCase().includes(PRINCIPAL_TITLE.toLowerCase()),
    'llms.txt uses the principal title',
  );
});

test('sitemap uses canonical www URLs and avoids redirect sources', () => {
  const redirects = JSON.parse(readText('vercel.json')).redirects ?? [];
  const redirectSources = new Set(redirects.map((redirect) => redirect.source));

  const urls = sitemapUrls();
  assert.ok(urls.length > 0, 'sitemap has URLs');

  urls.forEach((url) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, SITE_ORIGIN, `${url} uses the canonical www origin`);
    assert.equal(parsed.protocol, 'https:', `${url} uses HTTPS`);
    assert.equal(redirectSources.has(parsed.pathname), false, `${url} must not be a redirect source`);
  });
});

test('sitemap and generated case-study routes stay in sync', () => {
  const sitemapCasePaths = sitemapUrls()
    .map((url) => new URL(url).pathname)
    .filter((pathname) => /^\/work\/.+\/$/.test(pathname))
    .sort();

  const generatedCasePaths = fs.readdirSync(path.join(DIST, 'work'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(DIST, 'work', entry.name, 'index.html')))
    .map((entry) => `/work/${entry.name}/`)
    .sort();

  assert.deepEqual(sitemapCasePaths, generatedCasePaths);
});

test('case-study routes come from the shared content source', () => {
  const sourceCasePaths = caseStudySource()
    .map((caseStudy) => `/work/${caseStudy.id}/`)
    .sort();

  const generatedCasePaths = fs.readdirSync(path.join(DIST, 'work'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(DIST, 'work', entry.name, 'index.html')))
    .map((entry) => `/work/${entry.name}/`)
    .sort();

  assert.deepEqual(generatedCasePaths, sourceCasePaths);
});

test('design system route is public and discoverable', () => {
  const designSystemUrl = `${SITE_ORIGIN}/design-system`;
  const urls = sitemapUrls();

  assert.ok(urls.includes(designSystemUrl), '/design-system is included in the sitemap');

  const html = readDist('design-system', 'index.html');
  assert.match(getTitle(html), /designedbyomar Design System/i);
  assert.match(getMetaByName(html, 'description'), /design system/i);
  assert.equal(getMetaByName(html, 'robots'), 'index,follow,max-image-preview:large');
  assert.equal(getCanonical(html), designSystemUrl);
  assert.equal(getMetaByProperty(html, 'og:url'), designSystemUrl);
  assert.match(getMetaByProperty(html, 'og:title'), /designedbyomar Design System/i);
  assert.match(getMetaByProperty(html, 'og:description'), /design system/i);
  assert.ok(getMetaByProperty(html, 'og:image').startsWith(`${SITE_ORIGIN}/`));
  assert.equal(getMetaByName(html, 'twitter:card'), 'summary_large_image');
  assert.match(getMetaByName(html, 'twitter:title'), /designedbyomar Design System/i);
  assert.match(getMetaByName(html, 'twitter:description'), /design system/i);
  assert.ok(getMetaByName(html, 'twitter:image').startsWith(`${SITE_ORIGIN}/`));
  assert.ok(hasGraphUrl(getStructuredData(html), designSystemUrl), '/design-system JSON-LD contains the canonical URL');
});

test('all sitemap pages have indexable metadata and matching structured data', () => {
  sitemapUrls().forEach((url) => {
    const htmlPath = pagePathForUrl(url);
    assert.ok(fs.existsSync(htmlPath), `${url} has generated HTML at ${path.relative(ROOT, htmlPath)}`);

    const html = fs.readFileSync(htmlPath, 'utf8');
    const pathname = new URL(url).pathname;

    assert.ok(getTitle(html), `${url} has a title`);
    assert.ok(getMetaByName(html, 'description'), `${url} has a meta description`);
    assert.equal(getMetaByName(html, 'robots'), 'index,follow,max-image-preview:large', `${url} is indexable`);
    assert.equal(getCanonical(html), url, `${url} canonical matches sitemap URL`);
    assert.equal(getMetaByProperty(html, 'og:url'), url, `${url} Open Graph URL matches canonical`);
    assert.ok(getMetaByProperty(html, 'og:title'), `${url} has an Open Graph title`);
    assert.ok(getMetaByProperty(html, 'og:description'), `${url} has an Open Graph description`);
    assert.ok(getMetaByProperty(html, 'og:image').startsWith(`${SITE_ORIGIN}/`), `${url} has an absolute Open Graph image`);
    assert.equal(getMetaByName(html, 'twitter:card'), 'summary_large_image', `${url} has a Twitter card`);
    assert.ok(getMetaByName(html, 'twitter:title'), `${url} has a Twitter title`);
    assert.ok(getMetaByName(html, 'twitter:description'), `${url} has a Twitter description`);
    assert.ok(getMetaByName(html, 'twitter:image').startsWith(`${SITE_ORIGIN}/`), `${url} has an absolute Twitter image`);
    assert.ok(hasGraphUrl(getStructuredData(html), url), `${url} JSON-LD contains the canonical URL`);

    if (pathname === '/work') {
      assert.equal(url.endsWith('/'), false, '/work canonical does not use a trailing slash');
    }

    if (/^\/work\/.+\/$/.test(pathname)) {
      assert.equal(url.endsWith('/'), true, `${url} case-study canonical keeps trailing slash`);
    }
  });
});

test('robots discovery points to the canonical sitemap', () => {
  const robots = readDist('robots.txt');
  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
});

test('llms.txt follows agent discovery recommendations', () => {
  const llms = readDist('llms.txt');
  const links = [...llms.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);

  assert.match(llms, /^# designedbyomar$/m, 'llms.txt has an H1 title');
  assert.ok(links.length > 0, 'llms.txt contains Markdown links');
  assert.ok(links.includes(`${SITE_ORIGIN}/`), 'llms.txt links the canonical homepage');
  assert.ok(links.includes(`${SITE_ORIGIN}/work`), 'llms.txt links the work index');
  assert.ok(links.includes(`${SITE_ORIGIN}/design-system`), 'llms.txt links the design system page');
  assert.ok(links.includes(`${SITE_ORIGIN}/privacy`), 'llms.txt links the privacy page');

  caseStudySource().forEach((caseStudy) => {
    assert.ok(
      links.includes(`${SITE_ORIGIN}/work/${caseStudy.id}/`),
      `llms.txt links the ${caseStudy.id} case-study route`,
    );
  });
});

// Injected prose is escaped on the way in. The real function is imported rather
// than mirrored here: a copy of it drifted the moment postbuild's changed.
const escapeHtml = escapeText;

test('case-study routes ship their prose in the static HTML', () => {
  caseStudySource().forEach((caseStudy) => {
    const html = readDist('work', caseStudy.id, 'index.html');

    ['challenge', 'approach', 'outcome'].forEach((field) => {
      const prose = caseStudy[field];
      assert.ok(prose, `${caseStudy.id} has ${field} copy in case-studies.json`);
      assert.ok(
        html.includes(escapeHtml(prose)),
        `${caseStudy.id}: ${field} prose is missing from dist/work/${caseStudy.id}/index.html`,
      );
    });

    assert.ok(html.includes(`<h1>${escapeHtml(caseStudy.title)}</h1>`), `${caseStudy.id} has a static H1`);
    assert.ok(caseStudy.subtitle, `${caseStudy.id} has subtitle copy in case-studies.json`);
    assert.ok(
      html.includes(`<p>${escapeHtml(caseStudy.subtitle)}</p>`),
      `${caseStudy.id} has its static subtitle`,
    );

    ['client', 'year', 'role'].forEach((field) => {
      assert.ok(caseStudy[field], `${caseStudy.id} has ${field} metadata in case-studies.json`);
    });
    const metadata = [caseStudy.client, caseStudy.year, caseStudy.role].map(escapeHtml).join(' · ');
    assert.ok(html.includes(`<p>${metadata}</p>`), `${caseStudy.id} has its static client/year/role metadata`);

    assert.ok(caseStudy.tags.length > 0, `${caseStudy.id} has tags in case-studies.json`);
    caseStudy.tags.forEach((tag) => {
      assert.ok(html.includes(`<li>${escapeHtml(tag)}</li>`), `${caseStudy.id} has static tag "${tag}"`);
    });

    assert.ok(caseStudy.metrics.length > 0, `${caseStudy.id} has metrics in case-studies.json`);
    caseStudy.metrics.forEach((metric) => {
      // A qualified metric (e.g. Projected) carries that label through to the static HTML.
      const qualifier = metric.qualifier ? ` (${escapeHtml(metric.qualifier)})` : '';
      const serializedMetric = `${escapeHtml(metric.value)} — ${escapeHtml(metric.label)}${qualifier}`;
      assert.ok(html.includes(`<li>${serializedMetric}</li>`), `${caseStudy.id} has static metric "${serializedMetric}"`);
    });

    ['Challenge', 'Approach', 'Outcome'].forEach((label) => {
      assert.ok(html.includes(`<h2>${label}</h2>`), `${caseStudy.id} has a static ${label} heading`);
    });
  });
});

test('root injection replaces all nested root children without leaving stale markup', () => {
  const template = '<body><div id="root" data-app="portfolio"><div><div>stale nested content</div></div><p>stale sibling</p></div><div id="after-root">keep me</div></body>';
  const replacement = '<article><h1>Fresh content</h1></article>';

  assert.equal(
    injectRootContent(template, replacement, 'nested root fixture'),
    `<body><div id="root" data-app="portfolio">${replacement}</div><div id="after-root">keep me</div></body>`,
  );
});

test('static prose is scoped to case-study routes only', () => {
  ['privacy/index.html', 'work/index.html', 'index.html'].forEach((page) => {
    assert.ok(
      !readDist(...page.split('/')).includes('<h2>Challenge</h2>'),
      `${page} does not carry case-study prose`,
    );
  });
});

test('the Ask route ships every approved answer to non-JS consumers', () => {
  const html = readDist('ask', 'index.html');
  const approved = JSON.parse(readText('src', 'content', 'ask-answers.json'))
    .answers.filter((a) => a.status === 'approved');
  assert.ok(approved.length > 0, 'there is at least one approved answer');

  // The panel is client-rendered, so a crawler, an ATS scraper or an assistant
  // reading without JavaScript sees only what is injected here.
  for (const answer of approved) {
    assert.ok(
      html.includes(`<h2>${escapeText(answer.question)}</h2>`),
      `/ask is missing the question for "${answer.id}"`,
    );
  }

  const h1s = [...html.matchAll(/<h1\b/gi)];
  assert.equal(h1s.length, 1, '/ask has exactly one h1');
  assert.ok(html.includes('Ask about the work'), '/ask names itself in its h1');

  // FAQPage is limited by Google to government and health sites, so claiming it
  // buys nothing and risks a mismatch warning against the visible page.
  const structuredData = getStructuredData(html);
  const types = (structuredData['@graph'] ?? []).map((node) => node?.['@type']);
  assert.ok(types.includes('WebPage'), '/ask declares a WebPage');
  assert.ok(!types.includes('FAQPage'), '/ask does not claim FAQPage');
});

test('the answers live on one URL only', () => {
  // They were on the homepage first. The same 4,600 words on two indexed URLs
  // is a duplicate-content problem, and it put ~10KB gzipped in the critical
  // path of the one page that cannot afford it.
  const probe = JSON.parse(readText('src', 'content', 'ask-answers.json'))
    .answers.find((a) => a.status === 'approved').question;

  assert.ok(readDist('ask', 'index.html').includes(probe), '/ask carries the answers');
  for (const page of [['index.html'], ['work', 'index.html'], ['privacy', 'index.html']]) {
    assert.ok(!readDist(...page).includes(probe), `${page.join('/')} does not duplicate them`);
  }

  // And the homepage keeps the static h1 it had before any of this.
  assert.equal([...readDist('index.html').matchAll(/<h1\b/gi)].length, 1, 'homepage has exactly one h1');
});

test('migrated case-study bodies ship images and prose in the static HTML', () => {
  const migrated = caseStudySource().filter((c) => Array.isArray(c.body) && c.body.length);
  assert.ok(migrated.length > 0, 'at least one case study has migrated body content');

  migrated.forEach((caseStudy) => {
    const html = readDist('work', caseStudy.id, 'index.html');
    const blocks = caseStudy.body;

    // Images must be real <img> tags in the server response, not client-rendered only.
    const images = blocks.filter((b) => b.type === 'image');
    images.forEach((img) => {
      assert.ok(html.includes(`src="${img.src}"`), `${caseStudy.id}: ${img.src} missing from static HTML`);
      assert.ok(img.alt && img.alt.trim().length > 20, `${caseStudy.id}: ${img.src} needs descriptive alt text`);
      // alt is an attribute, so it is escaped as one — not as text.
      assert.ok(html.includes(escapeAttr(img.alt)), `${caseStudy.id}: alt text for ${img.src} missing from static HTML`);
    });

    // Pull quotes keep their attribution.
    blocks.filter((b) => b.type === 'quote').forEach((q) => {
      assert.ok(html.includes(escapeHtml(q.text)), `${caseStudy.id}: quote missing from static HTML`);
      if (q.attribution) {
        assert.ok(html.includes(escapeHtml(q.attribution)), `${caseStudy.id}: quote attribution missing`);
      }
    });

    // Prose survives the round trip.
    blocks.filter((b) => b.type === 'paragraph').slice(0, 5).forEach((p) => {
      assert.ok(html.includes(escapeHtml(p.text)), `${caseStudy.id}: body paragraph missing from static HTML`);
    });

    // Exactly one h1, and no heading level is skipped.
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${caseStudy.id}: expected exactly one h1`);
    const levels = [...html.matchAll(/<h([1-6])[ >]/g)].map((m) => Number(m[1]));
    const present = [...new Set(levels)].sort();
    present.forEach((lvl, i) => {
      if (i > 0) assert.ok(lvl - present[i - 1] <= 1, `${caseStudy.id}: heading level jumps from h${present[i - 1]} to h${lvl}`);
    });
  });
});

test('projected metrics are labelled as projections', () => {
  caseStudySource().forEach((caseStudy) => {
    (caseStudy.metrics || []).filter((m) => m.qualifier).forEach((m) => {
      const html = readDist('work', caseStudy.id, 'index.html');
      assert.ok(
        html.includes(escapeHtml(m.qualifier)),
        `${caseStudy.id}: metric "${m.value}" is qualified as ${m.qualifier} but that never reaches the static HTML`,
      );
    });
  });
});

test('case-study content ships no internal editorial metadata', () => {
  // src/content/case-studies.json is bundled into the client JS, and this repository is
  // public, so anything added to that file is published twice over. Editorial notes
  // belong in the gitignored roadmap instead.
  const INTERNAL_KEYS = ['todos', 'todo', 'notes', 'note', 'internal', 'draft', 'review'];
  caseStudySource().forEach((caseStudy) => {
    INTERNAL_KEYS.forEach((key) => {
      assert.equal(
        caseStudy[key], undefined,
        `${caseStudy.id}: "${key}" is internal metadata and would ship in the public JS bundle`,
      );
    });
  });

  // And nothing note-shaped reached the built bundle by another route.
  const assetsDir = path.join(DIST, 'assets');
  const bundles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  assert.ok(bundles.length > 0, 'built JS bundles exist to scan');
  const MARKERS = ['TODO(omar)', 'Principal-level moment', 'Lorem ipsum dolor'];
  bundles.forEach((file) => {
    const code = fs.readFileSync(path.join(assetsDir, file), 'utf8');
    MARKERS.forEach((marker) => {
      assert.ok(!code.includes(marker), `${file} contains internal marker "${marker}"`);
    });
  });
});

test('the client case-study module publishes only allowlisted fields', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'case-studies.js'), 'utf8');
  assert.match(source, /PUBLIC_FIELDS/, 'client module filters fields through an allowlist');
  assert.ok(
    !/\.\.\.caseStudy\b/.test(source),
    'client module must not spread the raw record — that republishes every future field',
  );
});

test('the block model is normalized identically for both renderers', async () => {
  const { normalizeBlocks, HEADING_LEVELS } = await import('../src/content/case-study-blocks.mjs');

  // Shapes that used to render as an empty list in the static HTML while crashing the
  // client on `b.items.map(...)` — the static build and its tests stayed green.
  const malformed = [
    { type: 'list' },
    { type: 'list', items: null },
    { type: 'callout', title: 'Kept for its title' },
    { type: 'heading', level: 9, text: 'Out of range' },
    { type: 'heading', text: 'No level at all' },
    { type: 'image' },
    { type: 'unknown-type', text: 'dropped' },
    { type: 'paragraph', text: '   ' },
    null,
  ];

  normalizeBlocks(malformed).forEach((block) => {
    if (block.type === 'list' || block.type === 'callout') {
      assert.ok(Array.isArray(block.items), `${block.type}: items must always be an array`);
    }
    if (block.type === 'heading') {
      assert.ok(HEADING_LEVELS.includes(block.level), `heading level ${block.level} is not renderable`);
    }
    if (block.type === 'image') {
      assert.ok(block.src, 'an image block without a src must not survive');
    }
  });

  assert.equal(normalizeBlocks(null).length, 0, 'a missing body normalizes to an empty list');
  assert.equal(normalizeBlocks(undefined).length, 0, 'an undefined body normalizes to an empty list');

  // Real content must survive the same pass untouched in count.
  caseStudySource().filter((c) => Array.isArray(c.body)).forEach((c) => {
    assert.equal(
      normalizeBlocks(c.body).length, c.body.length,
      `${c.id}: authored content should not be dropped by normalization`,
    );
  });
});

test('both renderers share the block normalizer rather than guarding separately', () => {
  const react = fs.readFileSync(path.join(ROOT, 'src', 'main.jsx'), 'utf8');
  const staticRenderer = fs.readFileSync(path.join(ROOT, 'postbuild.js'), 'utf8');

  assert.match(react, /normalizeBlocks/, 'React renderer normalizes blocks');
  assert.match(staticRenderer, /normalizeBlocks/, 'static renderer normalizes blocks');
  assert.ok(
    !/\[2, 3, 4\]\.includes/.test(staticRenderer),
    'static renderer should defer heading validation to the shared module, not re-implement it',
  );
});

test('case-study bodies contain no empty heading sections', () => {
  // A heading followed directly by a heading at the same or shallower level leaves a
  // section with no content in it, which reads as a dead entry to anyone navigating by
  // headings. A heading followed by a deeper one is ordinary section/subsection nesting.
  caseStudySource().filter((c) => Array.isArray(c.body)).forEach((caseStudy) => {
    caseStudy.body.forEach((block, i) => {
      const next = caseStudy.body[i + 1];
      if (block.type !== 'heading' || !next || next.type !== 'heading') return;
      assert.ok(
        next.level > block.level,
        `${caseStudy.id}: "${block.text}" (h${block.level}) is followed straight by "${next.text}" (h${next.level}) with no content between them`,
      );
    });
  });
});

test('gallery blocks ship every image in the static HTML', () => {
  caseStudySource().filter((c) => Array.isArray(c.body)).forEach((caseStudy) => {
    const galleries = caseStudy.body.filter((b) => b.type === 'gallery');
    if (!galleries.length) return;
    const html = readDist('work', caseStudy.id, 'index.html');

    galleries.forEach((gallery) => {
      assert.ok(Array.isArray(gallery.images) && gallery.images.length, `${caseStudy.id}: gallery has images`);
      gallery.images.forEach((img) => {
        // A grouped image is still a real <img> for consumers that never run the bundle.
        assert.ok(html.includes(`src="${img.src}"`), `${caseStudy.id}: ${img.src} missing from static HTML`);
        assert.ok(img.alt && img.alt.trim().length > 20, `${caseStudy.id}: ${img.src} needs descriptive alt text`);
      });
    });
  });
});

test('injected text cannot create markup, in text nodes or attributes', () => {
  // Pins the property, not the escape sequence, so it survives a change of
  // helper. The answers are authored JSON rather than user input, so this is
  // defence in depth — but the injection is the one place a stray angle
  // bracket in content would become an element in the served page.
  const hostile = `</p><script>alert(1)</script><p x="y" z='w'> & < > "quoted" 'single'`;

  const asText = escapeText(hostile);
  assert.ok(!/[<>]/.test(asText), 'escaped text contains no angle brackets');
  assert.ok(!asText.includes('<script'), 'no element can be opened from text');
  assert.equal(
    asText.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
    hostile,
    'and it round-trips, so nothing is silently dropped',
  );

  // An attribute value additionally cannot close its own quoting.
  const asAttr = escapeAttr(hostile);
  assert.ok(!/["'<>]/.test(asAttr), 'escaped attribute cannot break out of either quote style');
  assert.equal(
    asAttr
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
    hostile,
    'and round-trips too',
  );

  // The ampersand must be escaped first, or the entities escape each other.
  assert.equal(escapeText('&lt;'), '&amp;lt;');
  assert.equal(escapeAttr('&quot;'), '&amp;quot;');
});
