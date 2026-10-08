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
    if (width < 640) expect(second.y).toBeGreaterThan(first.y);
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
        const ends = ['--rate-start', '--rate-end'].map(token => rgb(css.getPropertyValue(token)));
        const badgeForeground = luminance([23, 23, 23].map(value => value / 255));
        const badgeRatio = Math.min(...Array.from({ length: 101 }, (_, step) => {
          const bg = luminance(ends[0].map((value, index) => 0.35 + 0.65 * (value * (1 - step / 100) + ends[1][index] * step / 100)));
          return (Math.max(badgeForeground, bg) + 0.05) / (Math.min(badgeForeground, bg) + 0.05);
        }));
        return { badgeRatio, background: header.backgroundImage, ratio: Math.min(...Array.from({ length: 101 }, (_, step) => {
          const background = luminance(ends[0].map((value, index) => (value * (1 - step / 100) + ends[1][index] * step / 100)));
          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        })) };
      });
    });
    for (const sample of contrast) {
      expect(sample.background).toContain('linear-gradient');
      expect(sample.ratio).toBeGreaterThanOrEqual(3);
      expect(sample.badgeRatio).toBeGreaterThanOrEqual(4.5);
    }
    const appearance = await cards.first().evaluate(card => {
      const badge = getComputedStyle(card.querySelector('.service-rate-card__category'));
      const price = getComputedStyle(card.querySelector('.service-rate-card__price'));
      const title = getComputedStyle(card.querySelector('h3, h4'));
      const check = getComputedStyle(card.querySelector('.service-rate-card__includes svg'));
      return { badgeRadius: badge.borderRadius, badgeBackground: badge.backgroundColor, badgeColor: badge.color, priceSize: parseFloat(price.fontSize), titleSize: parseFloat(title.fontSize), green: check.color, tokenGreen: getComputedStyle(card).getPropertyValue('--color-status-online').trim() };
    });
    expect(appearance.badgeRadius).toBe('9999px');
    expect(appearance.badgeBackground).toContain('0.35');
    expect(appearance.badgeColor).toBe('rgb(23, 23, 23)');
    await expect(page.locator('.service-rate-card__category svg')).toHaveCount(0);
    expect(appearance.priceSize).toBe(32);
    expect(appearance.priceSize).toBeGreaterThan(appearance.titleSize);
    expect(appearance.green).toBe('rgb(34, 197, 94)');
    const projects = page.locator('.service-rate-group').nth(1).locator('.service-rate-card');
    const projectBoxes = await projects.evaluateAll(elements => elements.map(element => ({ x: element.offsetLeft, y: element.offsetTop })));
    if (width >= 1054) expect(new Set(projectBoxes.map(box => box.y)).size).toBe(1);
    else if (width >= 640) expect(new Set(projectBoxes.map(box => box.y)).size).toBe(2);
    else expect(new Set(projectBoxes.map(box => box.y)).size).toBe(3);
    if (width >= 900) {
      const pageEdges = await page.locator('.rate-card-page').boundingBox();
      const logo = await page.locator('header').first().getByRole('link', { name: 'designedbyomar', exact: true }).boundingBox();
      expect(Math.abs(pageEdges.x - logo.x)).toBeLessThanOrEqual(1);
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
  await expect(specimen.locator('.service-rate-card')).toHaveCount(3);
  await expect(specimen).toContainText('fixture demonstration');
  for (const variant of ['audits', 'projects', 'ongoing']) {
    await specimen.getByLabel('Example state').selectOption(variant);
    await expect(specimen.locator(`.service-rate-card--${variant}`)).toHaveCount(variant === 'ongoing' ? 4 : variant === 'projects' ? 3 : 2);
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


test('ongoing support has stacked two-card subsections with aligned dividers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/ratecard');
  const group = page.locator('.service-rate-group').nth(2);
  await expect(group.locator('.service-rate-subgroup')).toHaveCount(2);
  for (const title of ['Fractional Design', 'Website Support']) {
    const section = group.getByRole('region', { name: title, exact: true });
    await expect(section.locator('.service-rate-card')).toHaveCount(2);
  }
  for (const grid of await page.locator('.service-rate-grid').all()) {
    const positions = await grid.locator('.service-rate-card__price-panel').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().bottom));
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1);
  }
  await expect(group.locator('.service-rate-group__browse')).toHaveCount(0);
});

test('engagement terms open by default and hide accessibly when collapsed', async ({ page }) => {
  await page.goto('/ratecard');
  const toggle = page.getByRole('button', { name: 'How engagements work', exact: true });
  const panel = page.locator('#rate-terms-title-panel');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(panel).toBeVisible();
});
