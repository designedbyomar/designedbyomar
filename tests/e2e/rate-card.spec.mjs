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
    await expect(page.locator('.service-rate-row')).toHaveCount(9);
    for (const service of RATE_CARD.groups.flatMap(group => group.services)) {
      const row = page.locator('.service-rate-row').filter({ has: page.getByRole('heading', { name: service.name, exact: true }) });
      for (const text of [service.price, service.description, service.bestFor, service.includes, service.limits, service.timing]) {
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

for (const theme of ['light', 'dark']) for (const width of [390, 820, 1440]) {
  test(`rate card layout ${theme} ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem('omar.theme', value), theme);
    const serviceRequests = [];
    page.on('request', request => { if (/\/api\/(ask|github-contributions)/.test(request.url())) serviceRequests.push(request.url()); });
    await page.goto('/ratecard');
    await expect(page.getByRole('heading', { name: 'Services & rates', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const row = page.locator('.service-rate-row').first();
    const identity = await row.locator('.service-rate-row__identity').boundingBox();
    const detail = await row.locator('.service-rate-row__details').boundingBox();
    if (width < 640) expect(detail.y).toBeGreaterThan(identity.y + identity.height);
    else expect(detail.x).toBeGreaterThan(identity.x + identity.width);
    await expect(page.locator('a[href="/ratecard"], a[href="/ratecard/"], a[href$="rate-card.pdf"]')).toHaveCount(0);
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
  const specimen = page.locator('[data-production-specimen="services"]');
  await expect(specimen.locator('.service-rate-row')).toHaveCount(2);
  await expect(specimen).toContainText('fixture demonstration');
  expect(await page.evaluate(() => localStorage.getItem('omar.analyticsConsent'))).toBe('declined');
  expect(await page.evaluate(() => window.rateEvents)).toEqual([]);
  expect(requests).toEqual([]);
});
