import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { injectRootContent } = require('../postbuild.js');

const SITE_ORIGIN = 'https://www.designedbyomar.com';
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

// Mirrors escapeAttr in postbuild.js — injected prose is escaped on the way in.
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

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
      assert.ok(html.includes(escapeHtml(img.alt)), `${caseStudy.id}: alt text for ${img.src} missing from static HTML`);
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
