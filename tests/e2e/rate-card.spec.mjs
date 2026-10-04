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
    const cards = page.locator('.service-rate-group').first().locator('.service-rate-card');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    if (width < 900) expect(second.y).toBeGreaterThan(first.y);
    else expect(second.x).toBeGreaterThan(first.x);
    await expect(page.locator('a[href="/ratecard"], a[href="/ratecard/"], a[href$="rate-card.pdf"]')).toHaveCount(0);
    const style = await cards.first().evaluate(card => {
      const heading = getComputedStyle(card.querySelector('h3'));
      const panel = getComputedStyle(card.querySelector('.service-rate-card__price-panel'));
      const divider = getComputedStyle(card.querySelector('.service-rate-card__divider'));
      return { titleSize: heading.fontSize, titleGradient: heading.backgroundImage, panelBorder: panel.borderTopWidth, panelGradient: panel.backgroundImage, dividerGradient: divider.backgroundImage };
    });
    expect(style.titleSize).toBe('24px');
    expect(style.titleGradient).toContain('linear-gradient');
    expect(style.panelBorder).toBe('0px');
    expect(style.panelGradient).toContain('linear-gradient');
    expect(style.dividerGradient).toContain('linear-gradient');
    // Sample every category gradient: 24px titles qualify as large text (3:1).
    const contrast = await page.locator('.service-rate-card').evaluateAll(cards => {
      const rgb = hex => {
        const digits = hex.trim().slice(1);
        const expanded = digits.length === 3 ? [...digits].map(char => char + char).join('') : digits;
        return expanded.match(/../g).map(part => parseInt(part, 16) / 255);
      };
      const luminance = channels => channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
        .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      return cards.map(card => {
        const css = getComputedStyle(card);
        const background = luminance(rgb(css.getPropertyValue('--bg-page')));
        const foreground = rgb(css.getPropertyValue('--fg-primary'));
        const share = parseFloat(css.getPropertyValue('--rate-title-color-share')) / 100;
        const ends = ['--rate-start', '--rate-end'].map(token => rgb(css.getPropertyValue(token)).map((value, index) => value * share + foreground[index] * (1 - share)));
        return { tokens: ['--bg-page', '--fg-primary', '--rate-title-color-share', '--rate-start', '--rate-end'].map(token => [token, css.getPropertyValue(token)]), ratio: Math.min(...Array.from({ length: 101 }, (_, step) => {
          const text = luminance(ends[0].map((value, index) => value * (1 - step / 100) + ends[1][index] * step / 100));
          return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
        })) };
      });
    });
    for (const sample of contrast) expect(sample.ratio, JSON.stringify(sample.tokens)).toBeGreaterThanOrEqual(3);
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
  }
  expect(await page.evaluate(() => localStorage.getItem('omar.analyticsConsent'))).toBe('declined');
  expect(await page.evaluate(() => window.rateEvents)).toEqual([]);
  expect(requests).toEqual([]);
});
