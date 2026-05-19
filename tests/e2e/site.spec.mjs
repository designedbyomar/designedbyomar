import { expect, test } from '@playwright/test';

const expectWorkSection = async (page) => {
  const workSection = page.locator('#work');
  await expect(workSection.getByRole('heading', { name: /Selected work\./i })).toBeVisible();
  await expect(page).toHaveURL(/\/work$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.removeItem('omar.theme');
  });
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

test('design system route exposes the public header and intro content', async ({ page }) => {
  await page.goto('/design-system');

  await expect(page).toHaveURL(/\/design-system$/);
  await expect(page.getByRole('heading', { level: 1, name: /designedbyomar Design System/i })).toBeVisible();
  await expect(page.getByText(/powers Omar Tavarez's portfolio/i)).toBeVisible();
  await expect(page.getByText('Public design-system artifact')).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: 'designedbyomar' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: /Back to site/i })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: /^Work$/ })).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: /^About$/ })).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: /^FAQ$/ })).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: /^Contact$/ })).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('button', { name: /design system navigation/i })).toBeVisible();
});

test('design system quick-links grid exposes the section shortcuts', async ({ page }) => {
  await page.goto('/design-system');

  const quickLinks = page.locator('#quick-links');
  const cards = quickLinks.locator('a.ds-contact-surface-card');
  await expect(cards).toHaveCount(5);
  await expect(quickLinks.locator('.ds-signal-gradient-icon')).toHaveCount(5);
  await expect(cards.nth(0)).toHaveAttribute('href', '#foundations');
  await expect(cards.nth(1)).toHaveAttribute('href', '#components');
  await expect(cards.nth(2)).toHaveAttribute('href', '#patterns');
  await expect(cards.nth(3)).toHaveAttribute('href', '#motion');
  await expect(cards.nth(4)).toHaveAttribute('href', '#accessibility');
  await expect.poll(() => page.locator('#quick-links').evaluate((grid) => {
    const styles = getComputedStyle(grid);
    return {
      maxWidth: styles.maxWidth,
      width: Math.round(grid.getBoundingClientRect().width),
    };
  })).toEqual({
    maxWidth: 'none',
    width: expect.any(Number),
  });
  await expect.poll(() => page.locator('#quick-links').evaluate((grid) => Math.round(grid.getBoundingClientRect().width))).toBeGreaterThan(900);
  await expect(page.locator('.ds-pixel-orbit')).toBeVisible();
  await expect.poll(() => page.locator('.ds-pixel-orbit').evaluate((orbit) => {
    const rect = orbit.getBoundingClientRect();
    return Math.round(Math.max(rect.width, rect.height));
  })).toBeLessThanOrEqual(220);
  await expect.poll(() => page.evaluate(() => {
    const orbit = document.querySelector('.ds-pixel-orbit');
    const h1 = document.querySelector('#overview-title');
    if (!orbit || !h1) return false;
    const orbitCenterY = (orbit.getBoundingClientRect().top + orbit.getBoundingClientRect().bottom) / 2;
    const h1Rect = h1.getBoundingClientRect();
    return orbitCenterY >= h1Rect.top && orbitCenterY <= h1Rect.bottom;
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const width = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    return width <= window.innerWidth;
  })).toBe(true);
  await expect.poll(() => page.locator('.ds-doc-card').first().evaluate((card) => (
    getComputedStyle(card).boxShadow.includes('inset')
  ))).toBe(true);
});

test('design system sidebar categories collapse and expand', async ({ page }) => {
  await page.goto('/design-system');

  const sidebar = page.getByTestId('design-system-sidebar');
  await expect(sidebar).toHaveAttribute('data-sidebar-mode', 'collapsible');
  await expect(sidebar.getByRole('button', { name: /Components/i })).toHaveAttribute('aria-expanded', 'true');
  await sidebar.getByRole('button', { name: /Components/i }).click();
  await expect(sidebar.getByRole('button', { name: /Components/i })).toHaveAttribute('aria-expanded', 'false');
  await sidebar.getByRole('button', { name: /Components/i }).click();
  await expect(sidebar.getByRole('link', { name: 'designedbyomar' })).toHaveCount(0);
});

test('design system sidebar links navigate to anchored sections', async ({ page }) => {
  await page.goto('/design-system');

  const sidebar = page.getByTestId('design-system-sidebar');

  await sidebar.getByRole('link', { name: /Buttons/i }).click();
  await expect(page).toHaveURL(/#buttons$/);
  await expect(page.locator('#buttons').getByRole('heading', { name: /^Buttons$/ })).toBeVisible();

  await sidebar.getByRole('link', { name: /Motion overview/i }).click();
  await expect(page).toHaveURL(/#motion$/);
  await expect(page.locator('#motion').getByRole('heading', { name: /^Motion$/ })).toBeVisible();
});

test('design system theme toggle updates the pixel orbit theme', async ({ page }) => {
  await page.goto('/design-system');

  const galaxyTheme = page.locator('#pixel-orbit [data-design-system-galaxy-theme]');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(galaxyTheme).toHaveAttribute('data-design-system-galaxy-theme', 'dark');
  await page.getByRole('button', { name: /Switch to light mode/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(galaxyTheme).toHaveAttribute('data-design-system-galaxy-theme', 'light');
});

test('design system documents restored foundations and component flow', async ({ page }) => {
  await page.goto('/design-system');

  await expect(page.locator('#typography').getByRole('heading', { name: /^Typography$/ })).toBeVisible();
  await expect(page.locator('#typography').getByRole('heading', { name: 'Display hero' })).toBeVisible();
  await expect(page.locator('#typography').getByRole('heading', { name: 'Mono label' })).toBeVisible();
  await expect(page.locator('#color').getByText('--color-omar-black')).toBeVisible();
  await expect(page.locator('#color').getByText('--fg-on-dark')).toBeVisible();
  await expect(page.locator('#spacing').getByText('--space-1')).toBeVisible();
  await expect(page.locator('#spacing').getByText('--layout-4')).toBeVisible();
  await expect(page.locator('#blur').getByRole('heading', { name: /^Blur$/ })).toBeVisible();
  await expect(page.locator('#blur').getByRole('heading', { name: '--blur-heavy' })).toBeVisible();
  await expect(page.locator('#cards-accordions').getByRole('heading', { name: 'Contact Surface Card' })).toBeVisible();
  await expect(page.locator('#cards-accordions').getByText(/quiet surface, subtle shadow, 2px lift, and animated gradient hover ring/i)).toBeVisible();
  await expect(page.locator('#cards-accordions').getByText(/reduced motion keeps the ring static/i)).toBeVisible();
  await expect(page.locator('#cards-accordions').getByRole('heading', { name: 'Signal Gradient Icon' })).toBeVisible();
  await expect(page.locator('main').getByRole('heading', { name: /^Copy actions$/ })).toHaveCount(1);
});

test('design system displays visual audit specimens for foundations, patterns, and accessibility', async ({ page }) => {
  await page.goto('/design-system');

  await expect(page.locator('[data-audit-example="foundation-specimens"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="hero-pattern"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="case-pattern"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="footer-pattern"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="privacy-pattern"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="reduced-motion-pattern"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="focus-accessibility"]')).toBeVisible();
  await expect(page.locator('[data-audit-example="contrast-accessibility"]')).toBeVisible();
});

test('design system quick-link cards match production contact-card hover motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/design-system');

  const firstCard = page.locator('#quick-links a.ds-contact-surface-card').first();
  await expect(firstCard).toBeVisible();
  await expect.poll(() => firstCard.evaluate((card) => getComputedStyle(card).transform)).toBe('none');
  await expect.poll(() => firstCard.evaluate((card) => {
    const before = getComputedStyle(card, '::before');
    return {
      content: before.content,
      backgroundImage: before.backgroundImage,
      opacity: before.opacity,
      animationName: before.animationName,
    };
  })).toEqual({
    content: '""',
    backgroundImage: expect.stringContaining('conic-gradient'),
    opacity: '0',
    animationName: 'ds-contact-border-spin',
  });
  await expect.poll(() => firstCard.evaluate((card) => {
    const after = getComputedStyle(card, '::after');
    return after.boxShadow.includes('inset');
  })).toBe(true);

  await firstCard.hover();
  await expect.poll(() => firstCard.evaluate((card) => Number(getComputedStyle(card, '::before').opacity))).toBeGreaterThan(0.8);
  await expect.poll(() => firstCard.evaluate((card) => {
    const grid = card.closest('#quick-links');
    if (!grid) return false;
    const cardRect = card.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const ringBleed = 1.5;
    return cardRect.left - ringBleed >= gridRect.left
      && cardRect.right + ringBleed <= gridRect.right;
  })).toBe(true);
  await expect.poll(() => firstCard.evaluate((card) => {
    const transform = getComputedStyle(card).transform;
    if (transform === 'none') return 0;
    return new DOMMatrixReadOnly(transform).m42;
  })).toBeLessThan(-1);
});

test('design system quick-link cards remove hover lift under reduced motion', async ({ page }) => {
  await page.goto('/design-system');

  const firstCard = page.locator('#quick-links a.ds-contact-surface-card').first();
  await expect(firstCard).toBeVisible();
  await firstCard.hover();
  await expect.poll(() => firstCard.evaluate((card) => getComputedStyle(card).transform)).toBe('none');
  await expect.poll(() => firstCard.evaluate((card) => getComputedStyle(card, '::before').animationName)).toBe('none');
  await expect.poll(() => firstCard.evaluate((card) => Number(getComputedStyle(card, '::before').opacity))).toBeGreaterThan(0.8);
});

test('design system hero shows pixel orbit and motion section shows alien replay', async ({ page }) => {
  await page.goto('/design-system');

  const pixelOrbit = page.locator('.ds-pixel-orbit');
  await expect(pixelOrbit).toBeVisible();
  await expect(pixelOrbit.locator('canvas')).toHaveCount(2);
  await expect(pixelOrbit.locator('.ds-pixel-orbit__icon')).toHaveCount(5);
  await expect(pixelOrbit.locator('.ds-signal-gradient-icon')).toHaveCount(5);
  await expect(pixelOrbit.locator('.ds-pixel-orbit__center')).toBeVisible();

  await page.locator('#alien-arrival').scrollIntoViewIfNeeded();
  const motionReplayButton = page.locator('#alien-arrival').getByRole('button', { name: /Replay animation/i });
  await expect(motionReplayButton).toBeVisible();
  await expect(motionReplayButton).toHaveClass(/ds-replay-button/);
  await expect(motionReplayButton.locator('.ds-signal-gradient-icon')).toHaveCount(0);
  await expect.poll(() => motionReplayButton.evaluate((button) => button.textContent.trim())).toBe('');
});

test('design system back-to-top control returns to the overview', async ({ page }) => {
  await page.goto('/design-system');

  const backToTop = page.getByRole('button', { name: /Back to top/i });
  await expect(backToTop).not.toHaveClass(/is-visible/);
  await page.locator('#content').scrollIntoViewIfNeeded();
  await expect(backToTop).toHaveClass(/is-visible/);
  await backToTop.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(120);
  await expect(page.locator('#overview').getByRole('heading', { level: 1, name: /designedbyomar Design System/i })).toBeVisible();
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

  test('design system mobile navigation reaches component docs', async ({ page }) => {
    await page.goto('/design-system');

    await expect(page.getByRole('heading', { level: 1, name: /designedbyomar Design System/i })).toBeVisible();
    await page.getByRole('button', { name: /Open design system navigation/i }).click();
    await page.locator('.ds-mobile-panel').getByRole('link', { name: 'Buttons', exact: true }).click();

    await expect(page).toHaveURL(/#buttons$/);
    await expect(page.locator('#buttons').getByRole('heading', { name: /^Buttons$/ })).toBeVisible();
  });
});
