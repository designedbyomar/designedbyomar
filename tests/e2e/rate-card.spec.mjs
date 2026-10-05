import { expect, test } from '@playwright/test';
import { RATE_CARD } from '../../src/content/rate-card.mjs';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('omar.analyticsConsent', 'declined'));
});

for (const route of ['/ratecard', '/ratecard/']) {
  test(`rate card loads and refreshes at ${route} with canonical noindex metadata`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: 'Services & rates', exact: true })).toBeVisible();
    await page.reload();
    await expect(page).toHaveTitle(RATE_CARD.metaTitle);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.designedbyomar.com/ratecard');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://www.designedbyomar.com/ratecard');
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0);
    await expect(page.locator('.service-rate-card')).toHaveCount(9);
    for (const service of RATE_CARD.groups.flatMap(group => group.services)) {
      const row = page.locator('.service-rate-card').filter({ has: page.getByRole('heading', { name: service.name, exact: true }) });
      for (const text of [service.price, service.description, service.bestFor, ...service.includes, service.limits, service.timing]) {
        await expect(row).toContainText(text);
      }
    }
    for (const term of RATE_CARD.terms) await expect(page.locator('.rate-card-page__terms')).toContainText(term.text);
    await page.locator('nav').getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow,max-image-preview:large');
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Services & rates', exact: true })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  });
}

test('rate card copy confirms completion, isolates events, and handles clipboard failure', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: value => new Promise(resolve => { window.copiedRateEmail = value; window.finishRateCopy = resolve; }),
    } });
  });
  await page.goto('/ratecard');
  await expect(page.getByRole('heading', { name: 'Services & rates', exact: true })).toBeVisible();
  await page.evaluate(() => { window.rateEvents = []; window.trackAnalyticsEvent = (...args) => window.rateEvents.push(args); });
  const contact = page.locator('.rate-card-page__contact');
  const link = contact.getByRole('link', { name: 'Email omar@designedbyomar.com' });
  const copy = contact.locator('[data-copy-button]');
  await link.focus();
  await page.keyboard.press('Tab');
  await expect(copy).toBeFocused();
  expect(await copy.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(copy).toHaveAccessibleName('Copy Email');
  expect(await page.evaluate(() => window.rateEvents)).toEqual([]);
  await page.evaluate(() => window.finishRateCopy());
  await expect(copy).toHaveAccessibleName('Copied Email');
  expect(await page.evaluate(() => window.copiedRateEmail)).toBe(RATE_CARD.email);
  expect(await page.evaluate(() => window.rateEvents)).toEqual([['copy_email_click', { section: 'ratecard', copy_target: 'email' }]]);
  await expect(copy).toHaveAccessibleName('Copy Email');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await copy.click();
  await expect(copy).toHaveAccessibleName('Copy Email');
  expect(await page.evaluate(() => window.rateEvents.length)).toBe(1);
  await link.evaluate(node => node.addEventListener('click', event => event.preventDefault()));
  await link.click();
  expect(await page.evaluate(() => window.rateEvents.at(-1))).toEqual(['contact_click_email', { link_url: 'mailto:omar@designedbyomar.com', section: 'ratecard' }]);
});

for (const theme of ['light', 'dark']) for (const width of [320, 390, 820, 1440]) {
  test(`rate card layout ${theme} ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem('omar.theme', value), theme);
    const serviceRequests = [];
    page.on('request', request => { if (/\/api\/(ask|github-contributions)/.test(request.url())) serviceRequests.push(request.url()); });
    await page.goto('/ratecard');
    await expect(page.getByRole('heading', { name: 'Services & rates', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.service-rate-card').evaluateAll(cards => cards.every(card => card.scrollWidth <= card.clientWidth))).toBe(true);
    const cards = page.locator('.service-rate-group').first().locator('.service-rate-card');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    if (width < 900) expect(second.y).toBeGreaterThan(first.y);
    else expect(second.x).toBeGreaterThan(first.x);
    await expect(page.locator('a[href="/ratecard"], a[href="/ratecard/"], a[href$="rate-card.pdf"]')).toHaveCount(0);
    const contrast = await page.locator('.service-rate-card').evaluateAll(cards => {
      const rgb = hex => hex.trim().slice(1).match(/../g).map(part => parseInt(part, 16) / 255);
      const luminance = channels => channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
        .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      return cards.map(card => {
        const css = getComputedStyle(card);
        const header = getComputedStyle(card.querySelector('.service-rate-card__header'));
        const foreground = luminance(header.color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255));
        const overlayValue = css.getPropertyValue('--rate-header-overlay').trim();
        const overlay = overlayValue.startsWith('#')
          ? overlayValue.slice(1).match(/../g).map(part => parseInt(part, 16))
          : overlayValue.match(/[\d.]+/g).map(Number);
        if (overlayValue.startsWith('#')) overlay[3] /= 255;
        else if (overlayValue.includes('%')) overlay[3] /= 100;
        const ends = ['--rate-start', '--rate-end'].map(token => rgb(css.getPropertyValue(token)));
        return { background: header.backgroundImage, ratio: Math.min(...Array.from({ length: 101 }, (_, step) => {
          const background = luminance(ends[0].map((value, index) => (value * (1 - step / 100) + ends[1][index] * step / 100) * (1 - overlay[3]) + overlay[index] / 255 * overlay[3]));
          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        })) };
      });
    });
    for (const sample of contrast) {
      expect(sample.background).toContain('linear-gradient');
      expect(sample.ratio).toBeGreaterThanOrEqual(4.5);
    }
    await expect(cards.first().locator('.service-rate-card__includes li')).toHaveCount(RATE_CARD.groups[0].services[0].includes.length);
    await expect(cards.first().getByRole('button', { name: 'Discuss Product Audit', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`ratecard-${theme}-${width}.png`), fullPage: true });
    const contact = page.locator('.rate-card-page__contact');
    await contact.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`contact-${theme}-${width}.png`) });
    expect(serviceRequests).toEqual([]);
  });
}

test('service specimens use shared rows without production side effects', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (/\/api\/(ask|github-contributions)/.test(request.url())) requests.push(request.url()); });
  await page.addInitScript(() => { window.rateEvents = []; window.trackAnalyticsEvent = (...args) => window.rateEvents.push(args); });
  await page.goto('/design-system#service-lists');
  const specimen = page.locator('#service-lists [data-production-specimen="services"]');
  await expect(specimen.locator('.service-rate-card')).toHaveCount(2);
  await expect(specimen).toContainText('fixture demonstration');
  for (const variant of ['audits', 'projects', 'ongoing']) {
    await specimen.getByLabel('Example state').selectOption(variant);
    await expect(specimen.locator(`.service-rate-card--${variant}`)).toHaveCount(2);
    await specimen.getByRole('button', { name: 'Discuss Example review', exact: true }).click();
    await expect(specimen.getByRole('status')).toContainText('Selected Example review');
  }
  expect(await page.evaluate(() => localStorage.getItem('omar.analyticsConsent'))).toBe('declined');
  expect(await page.evaluate(() => window.rateEvents)).toEqual([]);
  expect(requests).toEqual([]);
});


test('service inquiry fallback focuses contact and prepares an email subject', async ({ page }) => {
  await page.route('**/api/contact', route => route.fulfill({ json: { available: false } }));
  await page.goto('/ratecard');
  await page.getByRole('button', { name: 'Discuss Product Audit', exact: true }).click();
  await expect(page.locator('#rate-contact')).toBeFocused();
  await expect(page.getByRole('link', { name: 'Email omar@designedbyomar.com' })).toHaveAttribute('href', 'mailto:omar@designedbyomar.com?subject=Inquiry%3A%20Product%20Audit');
});

test('service cards remain readable in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/ratecard');
  const header = page.locator('.service-rate-card__header').first();
  expect(await header.evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none');
  await expect(header.getByRole('heading', { name: 'Product Audit', exact: true })).toBeVisible();
});


test('service gradient gallery documents and copies all category tokens', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedGradient = value; } } }));
  await page.goto('/design-system#service-gradients');
  const gallery = page.locator('#service-gradients');
  await expect(gallery.locator('.ds-rate-gradient-swatch')).toHaveCount(3);
  for (const [category, label] of [['audits', 'Audits'], ['projects', 'Projects'], ['ongoing', 'Ongoing support']]) {
    await gallery.getByRole('button', { name: `Copy ${label} gradient token`, exact: true }).click();
    expect(await page.evaluate(() => window.copiedGradient)).toBe(`var(--gradient-rate-${category})`);
  }
});
