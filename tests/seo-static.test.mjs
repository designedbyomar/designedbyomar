import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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
