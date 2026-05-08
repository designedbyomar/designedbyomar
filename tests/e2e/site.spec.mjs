import { expect, test } from '@playwright/test';

const expectWorkSection = async (page) => {
  const workSection = page.locator('#work');
  await expect(workSection.getByRole('heading', { name: /Selected work\./i })).toBeVisible();
  await expect(page).toHaveURL(/\/work$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('homepage renders the primary portfolio experience', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/designedbyomar/i);
  await expect(page.getByRole('heading', { name: /Complex systems\.\s*Clear products\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /View case studies/i })).toBeVisible();
});

test('/work loads directly and scrolls to the Work section', async ({ page }) => {
  await page.goto('/work');

  await expectWorkSection(page);
});

test('desktop Work navigation updates the URL to /work', async ({ page }) => {
  await page.goto('/');
  await page.locator('header nav a[href="/work"]').click();

  await expectWorkSection(page);
});

test('case-study routes load directly and return to /work', async ({ page }) => {
  await page.goto('/work/posting-asst/');

  await expect(page).toHaveURL(/\/work\/posting-asst\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Posting Assistant' })).toBeVisible();
  await expect(page.getByRole('article').getByText(/AI-assisted insurance payment posting workflow/i)).toBeVisible();

  await page.getByRole('link', { name: /Back to work/i }).click();
  await expectWorkSection(page);
});

test('/privacy loads the privacy policy route', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByText('No creepy tracking', { exact: true }).first()).toBeVisible();
});

test('cookie banner accept and decline choices hide the banner', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/This site uses simple analytics cookies/i)).toBeVisible();
  await page.getByRole('button', { name: 'Decline' }).click();
  await expect(page.getByText(/This site uses simple analytics cookies/i)).toBeHidden();
  await expect(page.getByRole('heading', { name: /Complex systems\.\s*Clear products\./i })).toBeVisible();

  await page.evaluate(() => {
    localStorage.removeItem('omar.analyticsConsent');
    delete window.__omarAnalyticsConsent;
  });
  await page.reload();

  await expect(page.getByText(/This site uses simple analytics cookies/i)).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByText(/This site uses simple analytics cookies/i)).toBeHidden();
  await expect(page.getByRole('heading', { name: /Complex systems\.\s*Clear products\./i })).toBeVisible();
});

test.describe('mobile navigation', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  test('opens the mobile menu and routes to Work', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeVisible();
    await page.locator('header a[href="/work"]').click();

    await expectWorkSection(page);
  });
});
