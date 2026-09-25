import { expect, test } from '@playwright/test';

const expectWorkIndex = async (page) => {
  await expect(page).toHaveURL(/\/work\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: /Selected work\./i })).toBeVisible();
  await expect(page.locator('.case-card')).toHaveCount(8);
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (localStorage.getItem('__preserveOmarThemeForTest') === 'true') {
      localStorage.removeItem('__preserveOmarThemeForTest');
      return;
    }
    localStorage.removeItem('omar.theme');
  });
});

const expectDrawerOffCanvas = async (drawer) => {
  await expect.poll(() => drawer.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= window.innerWidth - 1;
  })).toBe(true);
};

const expectLatestAnalyticsEvent = async (page, eventName, expectedParams) => {
  await expect.poll(() => page.evaluate((name) => {
    const events = window.__omarAnalyticsEvents || [];
    return events.filter((event) => event.eventName === name).at(-1) || null;
  }, eventName)).toMatchObject({
    eventName,
    params: expect.objectContaining(expectedParams),
  });
};

test('homepage renders the primary portfolio experience', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/designedbyomar/i);
  await expect(page.getByRole('heading', { name: /Complex systems\.\s*Clear products\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /View case studies/i })).toBeVisible();
  await expect(page.getByText('CURRENTLY LOOKING FOR MY NEXT ROLE.')).toHaveCount(0);
});

test('/work loads directly as the full case-study index', async ({ page }) => {
  await page.goto('/work');

  await expectWorkIndex(page);
});

test('desktop Work navigation updates the URL to /work', async ({ page }) => {
  await page.goto('/');
  await page.locator('header nav a[href="/work"]').click();

  await expectWorkIndex(page);
});

test('case-study routes load directly and return to /work', async ({ page }) => {
  await page.goto('/work/posting-asst/');

  await expect(page).toHaveURL(/\/work\/posting-asst\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Posting Assistant' })).toBeVisible();
  await expect(page.getByRole('article').getByText(/AI-assisted insurance payment posting workflow/i)).toBeVisible();

  await page.getByRole('link', { name: /Back to work/i }).click();
  await expectWorkIndex(page);
});

test('/privacy loads the privacy policy route', async ({ page }) => {
  await page.goto('/privacy');

  await expect(page).toHaveURL(/\/privacy\/?$/);
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByText('No creepy tracking', { exact: true }).first()).toBeVisible();
});

test('the Ask section offers suggested questions instead of an accordion', async ({ page }) => {
  await page.goto('/');

  const faq = page.locator('#faq');
  await faq.scrollIntoViewIfNeeded();

  // The accordion was replaced, not hidden.
  await expect(faq.locator('.faq-item')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /View all questions/i })).toHaveCount(0);

  await expect(faq.getByRole('heading', { name: /Ask about the work/i })).toBeVisible();
  await expect(page.getByText('Ask something else')).toBeVisible();
  await expect(page.locator('#ask-panel button[type="button"]')).toHaveCount(6);

  // Nav points here under its new label, via the anchor that already existed.
  const navLink = page.getByRole('banner').getByRole('link', { name: 'Ask' });
  await expect(navLink).toHaveAttribute('href', '#faq');
});

test('the approved answers are in the served HTML for non-JS consumers', async ({ page }) => {
  // The panel is client-rendered, so none of its text reaches a crawler. The
  // answers are injected into /ask, which is the page that should rank for
  // them — putting them on the homepage as well would publish the same 4,600
  // words on two indexed URLs.
  const html = await (await page.request.get('/ask/')).text();
  expect(html).toContain('What kind of product designer is Omar?');
  expect(html).toContain("What's Omar's fintech and payments experience?");

  for (const route of ['/', '/work/', '/privacy/']) {
    const other = await (await page.request.get(route)).text();
    expect(other, `${route} must not duplicate the answers`)
      .not.toContain('What kind of product designer is Omar?');
  }
});

test('About drawer opens from nav and section controls, then closes', async ({ page }) => {
  await page.goto('/');

  const aboutDrawer = page.locator('[role="dialog"][aria-label="About Omar"]');

  await page.getByRole('banner').getByRole('button', { name: 'About' }).click();
  const navDialog = page.getByRole('dialog', { name: 'About Omar' });
  await expect(navDialog).toBeVisible();
  await expect(aboutDrawer).toHaveAttribute('aria-hidden', 'false');
  await expect(navDialog.getByText('About / long-form')).toBeVisible();
  await navDialog.getByRole('button', { name: 'Close' }).click();
  await expect(aboutDrawer).toHaveAttribute('aria-hidden', 'true');
  await expectDrawerOffCanvas(aboutDrawer);

  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /Read more about me/i }).click();
  const sectionDialog = page.getByRole('dialog', { name: 'About Omar' });
  await expect(sectionDialog).toBeVisible();
  await expect(aboutDrawer).toHaveAttribute('aria-hidden', 'false');
  await sectionDialog.getByRole('button', { name: 'Close' }).click();
  await expect(aboutDrawer).toHaveAttribute('aria-hidden', 'true');
  await expectDrawerOffCanvas(aboutDrawer);
});

test('Work section links to the full case-study index', async ({ page }) => {
  await page.goto('/');

  await page.locator('#work').scrollIntoViewIfNeeded();
  const seeAll = page.getByRole('link', { name: /See all 8 case studies/i });
  // A real href, so it is keyboard reachable, middle-clickable, and crawlable.
  await expect(seeAll).toHaveAttribute('href', '/work');
  await seeAll.click();

  await expectWorkIndex(page);
});

test('theme selection persists after reload', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /Switch to light mode/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.evaluate(() => localStorage.setItem('__preserveOmarThemeForTest', 'true'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: /Switch to dark mode/i })).toBeVisible();
});

test('/404.html renders the static not-found experience', async ({ page }) => {
  await page.goto('/404.html');

  await expect(page).toHaveTitle(/Page Not Found/i);
  await expect(page.getByRole('heading', { name: "This page hasn't landed yet." })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'View work' })).toHaveAttribute('href', '/#work');
  await expect(page.getByRole('link', { name: 'Contact Omar' })).toHaveAttribute('href', 'mailto:omar@designedbyomar.com');
});

test('contact section exposes the primary conversion links', async ({ page }) => {
  await page.goto('/');

  const contact = page.locator('#contact');
  await contact.scrollIntoViewIfNeeded();
  await expect(contact.locator('.contact-card')).toHaveCount(7);
  await expect(contact.getByText('Book a call', { exact: true })).toBeVisible();
  await expect(contact.getByText('Email', { exact: true })).toBeVisible();
  await expect(contact.getByText('Resume / CV', { exact: true })).toBeVisible();
  await expect(contact.getByText('LinkedIn', { exact: true })).toBeVisible();
  await expect(contact.getByText('GitHub', { exact: true })).toBeVisible();
  await expect(contact.getByText('Substack', { exact: true })).toBeVisible();
  await expect(contact.getByText('Behance', { exact: true })).toBeVisible();
  await expect(contact.getByRole('link', { name: /Email\s+omar@designedbyomar\.com/i })).toHaveAttribute('href', 'mailto:omar@designedbyomar.com');
  await expect(contact.getByRole('link', { name: /Resume \/ CV\s+Open PDF/i })).toHaveAttribute('href', '/Omar%20Tavarez%20Resume.pdf');
  // Booking is the highest-intent action, so it leads the grid.
  const booking = contact.getByRole('link', { name: /Book a call\s+20 minutes/i });
  await expect(booking).toHaveAttribute('href', 'https://calendar.app.google/4NcXLDoniazZ5VT78');
  await expect(contact.locator('.contact-card').first()).toContainText('Book a call');
});

test('tracks deeper portfolio interaction analytics after consent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'accepted');
    window.__omarAnalyticsConsent = 'accepted';
    window.__omarGaReady = true;
    window.__omarAnalyticsEvents = [];
    window.gtag = (command, eventName, params) => {
      if (command === 'event') window.__omarAnalyticsEvents.push({ eventName, params });
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__omarCopiedText = value;
        },
      },
    });
  });

  await page.goto('/');
  await page.evaluate(() => {
    window.__omarAnalyticsEvents = [];
  });

  await page.getByRole('banner').getByRole('button', { name: 'About' }).click();
  await expectLatestAnalyticsEvent(page, 'about_drawer_open', { source: 'nav' });
  await page.getByRole('dialog', { name: 'About Omar' }).getByRole('button', { name: 'Close' }).click();

  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(page.getByText('Ask something else')).toBeVisible();
  await page.locator('#ask-panel button[type="button"]').first().click();
  await expectLatestAnalyticsEvent(page, 'ask_suggested_click', { answer_id: 'kind-of-designer' });

  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.locator('#contact [data-copy-button="true"]').click();
  await expectLatestAnalyticsEvent(page, 'copy_email_click', {
    section: 'contact',
    copy_target: 'email',
  });
  await expect.poll(() => page.evaluate(() => window.__omarCopiedText)).toBe('omar@designedbyomar.com');
  await expect.poll(() => page.evaluate(() => {
    const events = window.__omarAnalyticsEvents || [];
    const event = events.find((entry) => entry.eventName === 'copy_email_click');
    return JSON.stringify(event?.params || {});
  })).not.toContain('omar@designedbyomar.com');

  // Booking is the highest-intent contact action. Its destination and grid position are
  // asserted in the contact-links test; only a real click proves the event name and its
  // metadata are wired, which is what would silently break if the props were mistyped.
  await page.context().route('https://calendar.app.google/**', (route) => route.abort());
  const bookingPopup = page.waitForEvent('popup');
  await page.locator('#contact').getByRole('link', { name: /Book a call\s+20 minutes/i }).click();
  await expectLatestAnalyticsEvent(page, 'contact_click_booking', {
    section: 'contact',
    link_url: 'https://calendar.app.google/4NcXLDoniazZ5VT78',
  });
  await (await bookingPopup).close();

  await page.goto('/work/posting-asst/');
  await page.evaluate(() => {
    window.__omarAnalyticsEvents = [];
  });
  await page.locator('.cs-prevnext').getByRole('link').first().click();
  await expectLatestAnalyticsEvent(page, 'case_study_next_previous_click', {
    direction: 'previous',
    case_study_id: 'posting-asst',
    target_case_study_id: 'mgmt-portal',
  });
});

test('design system route exposes the public header and intro content', async ({ page }) => {
  await page.goto('/design-system');

  await expect(page).toHaveURL(/\/design-system\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: /designedbyomar Design System/i })).toBeVisible();
  await expect(page.getByText(/powers Omar Tavarez's portfolio/i)).toBeVisible();
  await expect(page.getByText('Public design-system artifact')).toHaveCount(0);
  await expect(page.getByRole('banner').getByRole('link', { name: 'designedbyomar' })).toBeVisible();
  // The header mirrors the site header, so the design system reads as part of the site
  // rather than a separate microsite. "Back to site" is gone: every link returns home.
  const banner = page.getByRole('banner');
  await expect(banner.getByRole('link', { name: /Back to site/i })).toHaveCount(0);
  await expect(banner.getByRole('link', { name: /^Work$/ })).toHaveAttribute('href', '/work');
  await expect(banner.getByRole('link', { name: /^About$/ })).toHaveAttribute('href', '/#about');
  await expect(banner.getByRole('link', { name: /^FAQ$/ })).toHaveAttribute('href', '/#faq');
  await expect(banner.getByRole('link', { name: /^Contact$/ })).toHaveAttribute('href', '/#contact');
  await expect(banner.getByRole('link', { name: /^Get in touch$/ })).toHaveAttribute('href', '/#contact');
  // Marks the current section for assistive tech.
  await expect(banner.getByRole('link', { name: /^Design System$/ })).toHaveAttribute('aria-current', 'page');
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

    await expectWorkIndex(page);
  });

  test('design system mobile navigation reaches component docs', async ({ page }) => {
    await page.goto('/design-system');

    await expect(page.getByRole('heading', { level: 1, name: /designedbyomar Design System/i })).toBeVisible();
    await page.getByRole('button', { name: /Open design system navigation/i }).click();
    await page.locator('.ds-mobile-panel').getByRole('link', { name: 'Buttons', exact: true }).click();

    await expect(page).toHaveURL(/#buttons$/);
    await expect(page.locator('#buttons').getByRole('heading', { name: /^Buttons$/ })).toBeVisible();

    // The header nav is hidden below 1054px, so the panel is the only route back to the
    // site at this width. Without these the mobile page would offer less than every other.
    await page.getByRole('button', { name: /Open design system navigation/i }).click();
    const panelNav = page.locator('.ds-mobile-panel .ds-mobile-site-nav');
    await expect(panelNav.getByRole('link', { name: /^Work$/ })).toHaveAttribute('href', '/work');
    await expect(panelNav.getByRole('link', { name: /^Contact$/ })).toHaveAttribute('href', '/#contact');
    await expect(panelNav.getByRole('link', { name: /^Get in touch$/ })).toBeVisible();
  });
});

test('Design System is reachable from the header nav', async ({ page }) => {
  await page.goto('/');

  const navLink = page.locator('header nav a[href="/design-system"]');
  await expect(navLink).toHaveText('Design System');
  await navLink.click();

  await expect(page).toHaveURL(/\/design-system\/?$/);
  await expect(page).toHaveTitle(/Design System/i);
});

test('Athena case study points to the live design system', async ({ page }) => {
  await page.goto('/work/athena-ds/');

  // Scoped to the article so this cannot pass on the site-wide nav link.
  const related = page.locator('article a[href="/design-system"]');
  await expect(related).toHaveText(/See the design system this site runs on/i);

  // The link is specific to this case study, not every one.
  await page.goto('/work/connect-api/');
  await expect(page.locator('article a[href="/design-system"]')).toHaveCount(0);
});

// ============================================================
// Ask assistant
// ============================================================

/** Scroll the FAQ section into view and wait for the Ask panel to load. */
const openAsk = async (page) => {
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(page.getByText('Ask something else')).toBeVisible();
};

const askInput = (page) => page.locator('#faq input[type="text"]');
const askLive = (page) => page.locator('#faq [aria-live="polite"]');

test('Ask answers are not fetched until the FAQ section is reached', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (request.url().includes('ask-answers')) requests.push(request.url()); });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(requests, 'the answer set must stay off the critical path').toHaveLength(0);

  await openAsk(page);
  expect(requests, 'and must be fetched once when the section is reached').toHaveLength(1);
});

test('the suggestion row becomes related follow-ups once an answer is showing', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  const prompts = page.locator('#ask-panel button[type="button"]');
  const opening = await prompts.allInnerTexts();
  expect(opening).toHaveLength(6);

  await prompts.filter({ hasText: /fintech and payments/i }).first().click();

  // The row retitles and re-ranks against the question just answered, rather
  // than leaving the same six the visitor has already passed over.
  await expect(page.getByText('Related')).toBeVisible();
  await expect(page.getByText('Ask something else')).toHaveCount(0);

  const related = await prompts.allInnerTexts();
  expect(related.length).toBeGreaterThan(0);
  expect(related.length).toBeLessThanOrEqual(4);
  expect(related, 'a follow-up must not repeat the answer on screen')
    .not.toContain("What's Omar's fintech and payments experience?");
  expect(related).not.toEqual(opening);

  // Refusals answer honestly when asked but are never offered as a prompt.
  for (const text of related) {
    expect(text).not.toMatch(/for free|references|how much|salary/i);
  }

  // The typed route stays available alongside them.
  await expect(askInput(page)).toBeVisible();
});

test('Ask returns a written answer with a citation into the case study', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  await page.locator('#ask-panel button').filter({ hasText: /design systems at scale/i }).first().click();
  await expect(askLive(page).getByText(/treats them as infrastructure/i)).toBeVisible();

  const citation = askLive(page).locator('a[href^="/work/"]').first();
  await expect(citation).toHaveAttribute('href', '/work/athena-ds/');
  await citation.click();
  await expect(page).toHaveURL(/\/work\/athena-ds\/?$/);
});

test('Ask matches a typed question', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  await askInput(page).fill('what fintech work has he done');
  await page.locator('#faq button[type="submit"]').click();
  await expect(askLive(page).getByText(/Two years at Plastiq/i)).toBeVisible();
});

test('Ask refuses a question it has no written answer for', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  await askInput(page).fill('how do penguins pay for parking in antarctica');
  await page.locator('#faq button[type="submit"]').click();

  await expect(askLive(page).getByText(/could not be drafted either/i)).toBeVisible();
  await expect(askLive(page).locator('a[href^="mailto:"]')).toBeVisible();
});

test('Ask is keyboard reachable and announces its answer politely', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  await askInput(page).focus();
  await expect(askInput(page)).toBeFocused();
  await askInput(page).fill('where has he worked');
  await askInput(page).press('Enter');

  await expect(askLive(page)).toHaveAttribute('aria-live', 'polite');
  await expect(askLive(page).getByText(/Five roles, most recent first/i)).toBeVisible();
});

test('Ask still answers when analytics are declined, and sends nothing', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'declined');
    window.__omarAnalyticsEvents = [];
    window.gtag = (command, eventName, params) => {
      if (command === 'event') window.__omarAnalyticsEvents.push({ eventName, params });
    };
  });

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('how do penguins pay for parking in antarctica');
  await page.locator('#faq button[type="submit"]').click();
  await expect(askLive(page).getByText(/could not be drafted either/i)).toBeVisible();

  const events = await page.evaluate(() => window.__omarAnalyticsEvents ?? []);
  expect(events.filter(e => e.eventName.startsWith('ask_')), 'a declined visitor must send no ask_* events').toHaveLength(0);
});

test('Ask reports a missed question so the gap can be closed', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'accepted');
    window.__omarAnalyticsConsent = 'accepted';
    window.__omarGaReady = true;
    window.__omarAnalyticsEvents = [];
    window.gtag = (command, eventName, params) => {
      if (command === 'event') window.__omarAnalyticsEvents.push({ eventName, params });
    };
  });

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('how do penguins pay for parking in antarctica');
  await page.locator('#faq button[type="submit"]').click();
  await expect(askLive(page).getByText(/could not be drafted either/i)).toBeVisible();

  const miss = await page.evaluate(() => (window.__omarAnalyticsEvents ?? []).find(e => e.eventName === 'ask_no_match'));
  expect(miss, 'ask_no_match must fire on a miss').toBeTruthy();
  expect(miss.params.question).toBe('how do penguins pay for parking in antarctica');
});

test('the privacy policy discloses what the Ask box records and where it goes', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: /The Ask Box/i })).toBeVisible();
  // All three cases have to be stated, because they differ in what leaves the
  // browser: a verbatim question, a routed one, and one nothing covers.
  await expect(page.getByText(/answered in your browser: nothing is sent/i)).toBeVisible();
  await expect(page.getByText(/Anything else you type is sent to be matched/i)).toBeVisible();
  await expect(page.getByText(/excerpts of the closest published answers/i)).toBeVisible();
  await expect(page.getByText(/wording of the question is also recorded in an analytics event/i)).toBeVisible();
  // Claims that were true before the endpoint existed and must not come back.
  await expect(page.getByText(/Nothing you type is sent to a language model/i)).toHaveCount(0);
  await expect(page.getByText(/nothing you type leaves this site/i)).toHaveCount(0);
});

test('a drafted answer is labelled as unreviewed', async ({ page }) => {
  await page.route('**/api/ask', route => route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Ask-Source': 'generated',
      'X-Ask-Sources': 'connect-api',
      'X-Ask-Answer-Id': '',
    },
    body: 'Omar has not published an answer covering that.',
  }));

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('how do penguins pay for parking in antarctica');
  await page.locator('#faq button[type="submit"]').click();

  await expect(askLive(page).getByText(/Drafted, not reviewed/i)).toBeVisible();
  await expect(askLive(page).getByText(/has not been reviewed/i)).toBeVisible();
  await expect(askLive(page).locator('a[href="/work/connect-api/"]')).toBeVisible();
});

test('the Ask box degrades to its written fallback when the endpoint fails', async ({ page }) => {
  // The path that must never break: no key, rate limited, provider down, or
  // offline all land here.
  await page.route('**/api/ask', route => route.abort('failed'));

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('how do penguins pay for parking in antarctica');
  await page.locator('#faq button[type="submit"]').click();

  await expect(askLive(page).getByText(/could not be drafted either/i)).toBeVisible();
  await expect(askLive(page).locator('a[href^="mailto:"]')).toBeVisible();
  await expect(askLive(page).getByText(/Drafted, not reviewed/i)).toHaveCount(0);
});

test('with the endpoint down, a local match still answers', async ({ page }) => {
  // Routing must never make the site worse than it was before routing existed.
  // "has he worked with react" is a non-exact match, so it would previously have
  // been answered locally — with the endpoint unreachable it still must be.
  await page.route('**/api/ask', route => route.abort('failed'));

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('has he worked with react');
  await page.locator('#faq button[type="submit"]').click();

  await expect(askLive(page).getByText(/could not be drafted either/i)).toHaveCount(0);
  await expect(askLive(page).getByText(/Drafted, not reviewed/i)).toHaveCount(0);
  await expect(askLive(page).locator('p').first()).toBeVisible();
});

test('a verbatim question is answered without touching the network', async ({ page }) => {
  // The carve-out the privacy policy relies on. An exact alias must never be
  // routed, and neither must a suggested prompt.
  const requests = [];
  page.on('request', r => { if (r.url().includes('/api/ask')) requests.push(r.url()); });

  await page.goto('/');
  await openAsk(page);

  await page.locator('#ask-panel button[type="button"]').first().click();
  await expect(askLive(page).locator('p').first()).toBeVisible();
  expect(requests, 'a suggested prompt must not be routed').toHaveLength(0);

  await askInput(page).fill('fintech experience');
  await page.locator('#faq button[type="submit"]').click();
  await expect(askLive(page).getByText(/embedded payments product/i).first()).toBeVisible();
  expect(requests, 'a verbatim alias must not be routed').toHaveLength(0);
});

test('a routed question says it is looking, not that it is drafting', async ({ page }) => {
  // The two waits mean different things, and the drafting copy asserts that
  // nothing written covers the question — which is not yet known.
  await page.route('**/api/ask', async route => {
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Ask-Source': 'reviewed',
        'X-Ask-Sources': 'athena-ds',
        'X-Ask-Answer-Id': 'design-systems',
        'X-Ask-Matched-By': 'router',
      },
      body: 'routed',
    });
  });

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('is he a manager');
  await page.locator('#faq button[type="submit"]').click();

  await expect(askLive(page).getByText(/Looking for a written answer/i)).toBeVisible();
  await expect(askLive(page).getByText(/drafting from the published answers/i)).toHaveCount(0);

  // The router's pick is rendered from the local copy, reviewed, not as a draft.
  await expect(askLive(page).getByText(/Has Omar built design systems at scale/i)).toBeVisible();
  await expect(askLive(page).getByText(/Drafted, not reviewed/i)).toHaveCount(0);
});

test('the input ring is visible at rest, still until hovered, and leaves focus alone', async ({ page }) => {
  // This file runs reducedMotion: 'reduce' for every test, so the spin has to be
  // asserted with that opted out — and suppressed under it, below.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await openAsk(page);

  const field = page.locator('.ask-field');
  const ring = () => field.evaluate(n => {
    const s = getComputedStyle(n, '::before');
    return { opacity: s.opacity, animation: s.animationName, image: s.backgroundImage };
  });

  const rest = await ring();
  expect(rest.opacity, 'visible at rest — the input is what a visitor has to find').toBe('1');
  expect(rest.image).toContain('conic-gradient');
  expect(rest.animation, 'but still, so it does not compete with the answer text').toBe('none');

  await field.hover();
  expect((await ring()).animation, 'it spins on hover').toBe('contact-border-spin');

  // The explicit requirement: the ring must not disturb the focus state. It is a
  // pseudo-element, so the outline still comes from the input itself.
  const input = page.locator('#ask-panel input[type="text"]');
  await input.focus();
  const outline = await input.evaluate(n => {
    const s = getComputedStyle(n);
    return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
  });
  expect(outline).toEqual({ style: 'solid', width: '2px', offset: '3px' });
  expect((await ring()).animation, 'and on focus-within').toBe('contact-border-spin');
});

test('the input ring never spins for a visitor who asked for less motion', async ({ page }) => {
  // beforeEach already sets reducedMotion: 'reduce'. The ring must stay — it is
  // the affordance — while the rotation goes.
  await page.goto('/');
  await openAsk(page);

  const field = page.locator('.ask-field');
  await field.hover();
  await page.locator('#ask-panel input[type="text"]').focus();

  const ring = await field.evaluate(n => {
    const s = getComputedStyle(n, '::before');
    return { opacity: s.opacity, animation: s.animationName };
  });
  expect(ring.opacity, 'the ring is still visible').toBe('1');
  expect(ring.animation, 'but nothing rotates').toBe('none');
});

test('the submit button is disabled until something is typed', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  const submit = page.locator('#faq button[type="submit"]');
  await expect(submit).toBeDisabled();
  const off = await submit.evaluate(n => getComputedStyle(n).cursor);
  expect(off).toBe('not-allowed');

  await askInput(page).fill('is he a manager');
  await expect(submit).toBeEnabled();

  // Primary: filled with the foreground colour, not the disabled surface.
  const on = await submit.evaluate(n => {
    const s = getComputedStyle(n);
    return { cursor: s.cursor, background: s.backgroundColor, opacity: s.opacity };
  });
  expect(on.cursor).toBe('pointer');
  expect(on.opacity).toBe('1');
  expect(on.background).not.toBe(off.background);
});

test('the /ask route stands on its own', async ({ page }) => {
  // `vite preview` does not resolve extensionless clean URLs, so it serves the
  // SPA shell here and the route resolves on the client — the same as /privacy
  // and /work behave under preview today. The served document's own title and
  // canonical are asserted against the build artifact in the SEO tests.
  await page.goto('/ask');

  await expect(page.getByRole('heading', { level: 1, name: /Ask about the work/i })).toBeVisible();
  await expect(page).toHaveTitle('Ask about the work — Omar Tavarez');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.designedbyomar.com/ask');
  const askPageSchema = await page.locator('#structured-data').evaluate(node => JSON.parse(node.textContent));
  expect(askPageSchema['@graph'][0]).toMatchObject({
    '@type': 'WebPage',
    name: 'Ask about the work — Omar Tavarez',
    url: 'https://www.designedbyomar.com/ask',
  });

  // It is the page, so it must not wait to be scrolled to.
  await expect(page.locator('#ask-panel button[type="button"]').first()).toBeVisible();
  await expect(page.locator('#ask-panel input[type="text"]')).toBeVisible();
});

test('changing the hash on /ask selects the matching answer', async ({ page }) => {
  await page.goto('/ask');
  await expect(page.locator('#ask-panel button[type="button"]').first()).toBeVisible();

  await page.evaluate(() => { window.location.hash = 'fintech-depth'; });
  await expect(page.getByText(/Two years at Plastiq/i).first()).toBeVisible();
});

test('an answer on /ask has a link of its own that reopens it', async ({ page, context }) => {
  await page.goto('/ask');

  await page.locator('#ask-panel button[type="button"]').filter({ hasText: /fintech and payments/i }).first().click();
  await expect(page).toHaveURL(/#fintech-depth$/);

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('[data-ask-share="true"]').click();
  await expect(page.getByText('Copied')).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/\/ask#fintech-depth$/);

  // The point of the link is that someone else can open it cold.
  const fresh = await context.newPage();
  await fresh.goto(copied.replace(/^https?:\/\/[^/]+/, ''));
  await expect(fresh.getByText(/embedded payments product/i).first()).toBeVisible();
  await fresh.close();
});

test('a miss on /ask stops the URL pointing at the previous answer', async ({ page }) => {
  await page.goto('/ask');

  await page.locator('#ask-panel button[type="button"]').first().click();
  await expect(page).toHaveURL(/#.+$/);

  await page.locator('#ask-panel input[type="text"]').fill('how do penguins pay for parking in antarctica');
  await page.locator('#ask-panel button[type="submit"]').click();
  await expect(page.getByText(/could not be drafted either/i)).toBeVisible();
  await expect(page).toHaveURL(/\/ask$/);
});

test('a case study offers the way back to asking', async ({ page }) => {
  // A citation in the panel leads out here. Without this the assistant simply
  // disappears at the moment the reader acted on it.
  await page.goto('/work/connect-api/');
  const back = page.getByRole('link', { name: /Ask about this work/i });
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute('href', '/ask');

  await back.click();
  await expect(page.getByRole('heading', { level: 1, name: /Ask about the work/i })).toBeVisible();
});

test('the homepage section links out to the full set', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);
  const link = page.getByRole('link', { name: /See every answer/i });
  await expect(link).toHaveAttribute('href', '/ask');
});

test('the homepage panel leaves the URL alone', async ({ page }) => {
  // Writing a hash here would fight the #faq anchor the nav still uses.
  await page.goto('/');
  await openAsk(page);
  await page.locator('#ask-panel button[type="button"]').first().click();
  await expect(askLive(page).locator('p').first()).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
});

test('the design system documents the Ask component', async ({ page }) => {
  await page.goto('/design-system');
  await page.locator('#ask').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Ask', exact: true })).toBeVisible();
  await expect(page.getByText(/Refuse rather than guess/i)).toBeVisible();
  await expect(page.getByText(/Only approved/i)).toBeVisible();
});

test('picking a suggestion mid-stream does not resurrect the draft', async ({ page }) => {
  // Regression. show() cleared the draft but did not cancel its reader, so
  // later chunks rebuilt it — and the superseded request then ran its own
  // fallback, replacing the answer the visitor had just chosen.
  await page.route('**/api/ask', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Ask-Source': 'generated',
        'X-Ask-Sources': 'connect-api',
        'X-Ask-Answer-Id': '',
      },
      body: 'This draft belongs to the previous question.',
    });
  });

  await page.goto('/');
  await openAsk(page);

  await askInput(page).fill('how did the design system governance model change after launch');
  await page.locator('#faq button[type="submit"]').click();

  // Take over with a reviewed answer while the draft is still in flight.
  await page.locator('#faq button').filter({ hasText: /design systems at scale/i }).first().click();
  await expect(askLive(page).getByText(/treats them as infrastructure/i)).toBeVisible();

  // Give the superseded response time to land and try to render.
  await page.waitForTimeout(2000);

  await expect(askLive(page).getByText(/Drafted, not reviewed/i)).toHaveCount(0);
  await expect(askLive(page).getByText(/This draft belongs to the previous question/i)).toHaveCount(0);
  await expect(askLive(page).getByText(/could not be drafted either/i)).toHaveCount(0);
});
