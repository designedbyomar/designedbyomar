import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'declined');
    window.specimenEvents = [];
    window.trackAnalyticsEvent = (...args) => window.specimenEvents.push(args);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => { window.specimenCopied = value; },
    } });
  });
});

test('real component fixtures stay isolated from production services and consent', async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on('request', request => { if (/\/api\/(ask|github-contributions)|ask-answers\.json/.test(request.url())) requests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/design-system');
  const ask = page.locator('[data-production-specimen="ask"]');
  await ask.getByLabel('Example state').selectOption('reviewed');
  await expect(ask.getByText('How is this component connected?')).toBeVisible();
  await ask.getByLabel('Example state').selectOption('drafted');
  await expect(ask.getByText('Drafted, not reviewed')).toBeVisible();
  await ask.getByLabel('Example state').selectOption('unavailable');
  await expect(ask.getByText(/couldn.t safely match/)).toBeVisible();
  const github = page.locator('[data-production-specimen="github"]');
  await github.getByLabel('Example state').selectOption('loading');
  await expect(github.getByRole('status', { name: 'Loading GitHub activity' })).toBeVisible();
  await github.getByLabel('Example state').selectOption('error');
  await expect(github.getByRole('heading', { name: 'GitHub activity is temporarily unavailable.' })).toBeVisible();
  const consent = page.locator('[data-production-specimen="consent"]');
  await consent.getByRole('button', { name: 'Accept' }).click();
  await expect(consent.getByRole('status')).toContainText('accepted');
  await consent.getByRole('button', { name: 'Decline' }).click();
  expect(await page.evaluate(() => localStorage.getItem('omar.analyticsConsent'))).toBe('declined');
  expect(await page.evaluate(() => window.specimenEvents)).toEqual([]);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('shared contact and photo controls support keyboard and restored focus', async ({ page }) => {
  await page.goto('/design-system');
  const contact = page.locator('[data-production-specimen="contact"]');
  const link = contact.getByRole('link', { name: /Email omar/ });
  await link.focus();
  await page.keyboard.press('Tab');
  const copy = contact.getByRole('button', { name: 'Copy Email' });
  await expect(copy).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(contact.getByRole('button', { name: 'Copied Email' })).toBeVisible();
  expect(await page.evaluate(() => window.specimenCopied)).toBe('omar@designedbyomar.com');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('blocked'); }; });
  await page.waitForTimeout(1250);
  await copy.click();
  await expect(copy).toHaveAttribute('aria-label', 'Copy Email');
  const tile = page.locator('[data-production-specimen="about"]').getByRole('button', { name: /View larger/ }).first();
  await tile.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tile).toBeFocused();
});

test('shared mobile navigation retains the standalone About destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/design-system');
  const navigation = page.locator('[data-production-specimen="navigation"]');
  const menu = navigation.getByRole('button', { name: /menu/i });
  await menu.click();
  await expect(navigation.getByRole('link', { name: 'About', exact: true })).toHaveAttribute('href', '/about');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('portrait preload and rendered image agree at DPR 1, 2 and 3 in both themes', async ({ browser }) => {
  for (const theme of ['dark', 'light']) for (const dpr of [1, 2, 3]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
    await context.addInitScript(value => { localStorage.setItem('omar.theme', value); localStorage.setItem('omar.analyticsConsent', 'declined'); }, theme);
    const page = await context.newPage();
    await page.goto('/');
    const image = page.locator('[data-hero-portrait]');
    await image.evaluate(element => element.decode());
    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveAttribute('imagesrcset', await image.getAttribute('srcset'));
    await expect(preload).toHaveAttribute('imagesizes', await image.getAttribute('sizes'));
    const expectedWidth = theme === 'dark' ? [432, 640, 960][dpr - 1] : [320, 557, 557][dpr - 1];
    expect(await image.evaluate(element => element.currentSrc)).toContain(`portrait-${theme}-${expectedWidth}.webp`);
    await page.goto('/about');
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0);
    await context.close();
  }
});
