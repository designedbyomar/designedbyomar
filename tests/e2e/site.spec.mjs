import { expect, test } from '@playwright/test';

const CONTRIBUTION_START = new Date(Date.UTC(2025, 8, 28));
const contributionWeeks = Array.from({ length: 53 }, (_, weekIndex) => {
  const firstDay = new Date(CONTRIBUTION_START);
  firstDay.setUTCDate(firstDay.getUTCDate() + weekIndex * 7);
  const isLastWeek = weekIndex === 52;
  const days = Array.from({ length: isLastWeek ? 2 : 7 }, (_, weekday) => {
    const date = new Date(firstDay);
    date.setUTCDate(date.getUTCDate() + weekday);
    const count = (weekIndex + weekday) % 6 === 0 ? (weekIndex % 4) + 1 : 0;
    return {
      date: date.toISOString().slice(0, 10),
      weekday,
      count,
      level: count,
    };
  });
  return { firstDay: firstDay.toISOString().slice(0, 10), days };
});

const CONTRIBUTION_FIXTURE = {
  login: 'designedbyomar',
  profileUrl: 'https://github.com/designedbyomar',
  totalContributions: 321,
  range: { from: '2025-09-28', to: '2026-09-28' },
  months: [
    { name: 'Sep', firstDay: '2025-09-28', totalWeeks: 1 },
    { name: 'Oct', firstDay: '2025-10-01', totalWeeks: 4 },
    { name: 'Nov', firstDay: '2025-11-01', totalWeeks: 4 },
    { name: 'Dec', firstDay: '2025-12-01', totalWeeks: 5 },
    { name: 'Jan', firstDay: '2026-01-01', totalWeeks: 4 },
    { name: 'Feb', firstDay: '2026-02-01', totalWeeks: 4 },
    { name: 'Mar', firstDay: '2026-03-01', totalWeeks: 5 },
    { name: 'Apr', firstDay: '2026-04-01', totalWeeks: 4 },
    { name: 'May', firstDay: '2026-05-01', totalWeeks: 4 },
    { name: 'Jun', firstDay: '2026-06-01', totalWeeks: 5 },
    { name: 'Jul', firstDay: '2026-07-01', totalWeeks: 4 },
    { name: 'Aug', firstDay: '2026-08-01', totalWeeks: 4 },
    { name: 'Sep', firstDay: '2026-09-01', totalWeeks: 5 },
  ],
  weeks: contributionWeeks,
  updatedAt: '2026-09-28T12:00:00.000Z',
};

const expectWorkIndex = async (page) => {
  await expect(page).toHaveURL(/\/work\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: /Selected work\./i })).toBeVisible();
  await expect(page.locator('.case-card')).toHaveCount(8);
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/github-contributions', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(CONTRIBUTION_FIXTURE),
  }));
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

test('At a glance shows the live rolling GitHub contribution calendar', async ({ page }) => {
  await page.goto('/');

  const section = page.locator('#at-a-glance');
  await section.scrollIntoViewIfNeeded();
  const widget = section.locator('[data-github-contributions]');

  await expect(widget.getByRole('heading', { name: '321 contributions in the last year' })).toBeVisible();
  await expect(widget.getByText('Sep 28, 2025 to Sep 28, 2026')).toBeVisible();
  await expect(widget.getByText('Less', { exact: true })).toBeVisible();
  await expect(widget.getByText('More', { exact: true })).toBeVisible();
  await expect(widget.getByRole('link', { name: /View GitHub profile/i })).toHaveAttribute('href', 'https://github.com/designedbyomar');
  await expect(widget.getByRole('cell')).toHaveCount(366);
  await expect(widget.locator('[role="cell"][tabindex]')).toHaveCount(0);
  await expect(widget.getByText('Oct', { exact: true })).toBeVisible();
  await expect(widget.getByText('Sep', { exact: true })).toHaveCount(1);
  await expect(widget.locator('[data-month-first-day="2025-09-28"]')).toHaveCount(0);
  const octoberColumn = await widget.locator('[data-month-first-day="2025-10-01"]').evaluate(node => node.style.gridColumn);
  expect(octoberColumn).toBe('2 / span 4');

  const followsFacts = await widget.evaluate(node => node.parentElement.previousElementSibling?.classList.contains('facts-grid'));
  expect(followsFacts).toBe(true);
});

test('GitHub calendar reserves space while loading and keeps the profile link on failure', async ({ page }) => {
  await page.unroute('**/api/github-contributions');
  let releaseResponse;
  const responseGate = new Promise(resolve => { releaseResponse = resolve; });
  await page.route('**/api/github-contributions', async (route) => {
    await responseGate;
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' });
  });

  await page.goto('/');
  const widget = page.locator('[data-github-contributions]');
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.getByRole('status', { name: 'Loading GitHub activity' })).toBeVisible();
  const loadingHeight = await widget.evaluate(node => node.getBoundingClientRect().height);
  expect(loadingHeight).toBeGreaterThan(200);

  releaseResponse();
  await expect(widget.getByRole('heading', { name: 'GitHub activity is temporarily unavailable.' })).toBeVisible();
  await expect(widget.getByText('The live calendar could not load. The public profile is still available.')).toBeVisible();
  await expect(widget.getByRole('link', { name: /View GitHub profile/i })).toHaveAttribute('href', 'https://github.com/designedbyomar');
});

test('GitHub calendar scrolls within its panel without widening a phone layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const widget = page.locator('[data-github-contributions]');
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.getByRole('heading', { name: '321 contributions in the last year' })).toBeVisible();
  const scrollArea = widget.locator('[data-github-calendar-scroll]');
  const dimensions = await scrollArea.evaluate(node => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    scrollLeft: node.scrollLeft,
  }));

  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  expect(dimensions.scrollLeft).toBeGreaterThanOrEqual(dimensions.scrollWidth - dimensions.clientWidth - 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect(scrollArea).toHaveAttribute('tabindex', '0');
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
  await expect(page.getByText('Try one of these')).toBeVisible();

  // Three to start, the rest behind one control — a wall of eight buttons was
  // most of what made the section feel wordy.
  const prompts = page.locator('#ask-panel [data-ask-suggestion="true"]');
  await expect(prompts).toHaveCount(3);
  const more = page.locator('[data-ask-expand="true"]');
  await expect(more).toHaveAttribute('aria-expanded', 'false');

  await more.click();
  await expect(prompts).toHaveCount(8);
  await expect(more).toHaveAttribute('aria-expanded', 'true');

  await more.click();
  await expect(prompts).toHaveCount(3);

  // Nav points here under its new label, via the anchor that already existed.
  const navLink = page.getByRole('banner').getByRole('link', { name: 'Ask' });
  await expect(navLink).toHaveAttribute('href', '#faq');
});

test('on a phone the contact CTA does not sit on top of the Ask panel', async ({ page }) => {
  // This shipped. `top: 96` was set unconditionally while `position` flipped to
  // relative when stacked, and `top` on a relative element shifts it without
  // reflowing — so the left column slid 96px down over the panel and the CTA
  // landed on its first row. Asserted geometrically, not by eye.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await openAsk(page);

  // Pinned on the declaration, not the symptom. `top: 96` was applied whatever
  // the position, and on a relative element that shifts it without reflowing —
  // which slid this column over the panel. The shorter copy now absorbs 96px,
  // so geometry alone would pass against the bug; the offset itself is the
  // thing that must not come back.
  const column = page.locator('#faq h2').locator('xpath=ancestor::div[contains(@style,"position")][1]');
  const offset = await column.evaluate(el => {
    const s = getComputedStyle(el);
    return { position: s.position, top: s.top };
  });
  expect(offset.position, 'stacked, the column must not be sticky').toBe('relative');
  // `top: auto` on a relative element resolves to a used value of 0px, so the
  // assertion is "no offset" rather than a particular keyword.
  expect(parseFloat(offset.top) || 0, 'no offset, or the column slides over the panel').toBe(0);

  const heading = page.locator('#faq h2');
  const panel = page.locator('#ask-panel');
  const [headBox, panelBox] = [await heading.boundingBox(), await panel.boundingBox()];
  expect(headBox.y + headBox.height, 'the heading column overlaps the panel')
    .toBeLessThanOrEqual(panelBox.y + 1);

  const cta = page.getByRole('link', { name: /Start a conversation/i });
  await expect(cta).toBeVisible();
  const ctaBox = await cta.boundingBox();

  // It must sit clear of everything it used to land on, and below the input —
  // the point of moving it is that the input is met first.
  for (const [name, locator] of [
    ['the input', page.locator('#faq form')],
    ['the prompts', page.locator('#ask-panel [data-ask-suggestion="true"]').first()],
  ]) {
    const box = await locator.boundingBox();
    expect(ctaBox.y, `the CTA overlaps ${name}`).toBeGreaterThanOrEqual(box.y + box.height - 1);
  }

  // Nothing is painted over it either. elementFromPoint takes viewport
  // coordinates, so the control has to be on screen before asking.
  await cta.scrollIntoViewIfNeeded();
  const inView = await cta.boundingBox();
  const owns = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return Boolean(el && el.closest('a')?.textContent?.includes('Start a conversation'));
  }, { x: inView.x + inView.width / 2, y: inView.y + inView.height / 2 });
  expect(owns, 'something is covering the CTA').toBe(true);

  // Scoped to this section: it asserts elements are within the viewport, which
  // the whole-document horizontal-overflow test below covers at the page level.
  const bleed = await page.locator('#faq').evaluate((section) => {
    const vw = document.documentElement.clientWidth;
    return [...section.querySelectorAll('*')]
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && (r.right > vw + 1 || r.left < -1)).length;
  });
  expect(bleed, 'nothing in the Ask section may bleed past 375').toBe(0);
});

test('the homepage does not scroll horizontally at 375 in either theme', async ({ page }) => {
  // This shipped: the hero galaxy wrapper sits at left/right -12%, so on a 375px
  // phone it bled ~15px past the viewport and the page scrolled to 390px wide,
  // in both themes. Fixed with `overflow-x: clip` on the root, which contains the
  // decorative bleed without breaking vertical scroll or `position: sticky`.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `homepage scrolls horizontally at 375 in ${theme} mode`).toBeLessThanOrEqual(clientWidth);
  }
});

test('the nav and hero align to the same container as the sections', async ({ page }) => {
  // This shipped: the nav and hero put their 24px padding inside the max-width
  // box while every section padded a full-width outer around a centred box, so
  // past 1200px the nav/hero content sat 24px further in and 48px narrower than
  // the sections. Now they share one container, so the left edges line up.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const left = (sel) => page.locator(sel).first().evaluate((el) => Math.round(el.getBoundingClientRect().left));
  const navLogoLeft = await page.locator('header > div > div').first().evaluate((el) => Math.round(el.getBoundingClientRect().left));
  const heroLeft = await left('#top h1');
  const aboutLeft = await page.locator('#about .about-grid > *').first().evaluate((el) => Math.round(el.getBoundingClientRect().left));
  expect(heroLeft, 'hero content aligns with the About section').toBe(aboutLeft);
  expect(navLogoLeft, 'nav content aligns with the About section').toBe(aboutLeft);
});

test('on a wide viewport the CTA stays in the sticky column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await openAsk(page);

  const cta = page.getByRole('link', { name: /Start a conversation/i });
  const panel = page.locator('#ask-panel');
  const [ctaBox, panelBox] = [await cta.boundingBox(), await panel.boundingBox()];

  // Left of the panel, not beneath it — the two-column layout is unchanged.
  expect(ctaBox.x + ctaBox.width).toBeLessThanOrEqual(panelBox.x + 1);
});

test('expanding the prompts moves focus to what it revealed', async ({ page }) => {
  // The control sits after the list, so expanding inserts five buttons *before*
  // the focused element. Without moving focus the next Tab goes past all of
  // them, and reaching them means shift-Tabbing back through controls already
  // passed.
  await page.goto('/');
  await openAsk(page);

  const more = page.locator('[data-ask-expand="true"]');
  await expect(more).toHaveAttribute('aria-controls', 'ask-suggestions');
  await more.focus();
  await page.keyboard.press('Enter');

  const prompts = page.locator('#ask-panel [data-ask-suggestion="true"]');
  await expect(prompts).toHaveCount(8);

  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    const all = [...document.querySelectorAll('#ask-suggestions [data-ask-suggestion="true"]')];
    return { index: all.indexOf(el), text: el?.textContent?.trim() ?? null };
  });
  expect(focused.index, 'focus is on the first newly revealed prompt').toBe(3);
  expect(focused.text).toBeTruthy();

  // And Tab from there continues through the new prompts rather than leaving.
  await page.keyboard.press('Tab');
  const next = await page.evaluate(() => {
    const all = [...document.querySelectorAll('#ask-suggestions [data-ask-suggestion="true"]')];
    return all.indexOf(document.activeElement);
  });
  expect(next, 'Tab stays within the revealed prompts').toBe(4);
});

test('collapsing the prompts does not steal focus', async ({ page }) => {
  await page.goto('/');
  await openAsk(page);

  const more = page.locator('[data-ask-expand="true"]');
  await more.click();
  await more.click();

  const onControl = await page.evaluate(() => document.activeElement?.dataset?.askExpand === 'true');
  expect(onControl, 'focus stays on the control the visitor pressed').toBe(true);
});

test('the panel reads input first, then the disclaimer, then the answer', async ({ page }) => {
  // The section used to open with a label and eight buttons, putting its own
  // input fourth. Asserted on rendered order so a reshuffle is caught rather
  // than merely looking different.
  await page.goto('/');
  await openAsk(page);

  const order = await page.locator('#ask-panel').evaluate((panel) => {
    const seen = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (child.tagName === 'FORM') seen.push('input');
        else if (child.matches('[aria-live]')) seen.push('answer');
        else if (child.matches('[data-ask-suggestion="true"]')) seen.push('suggestions');
        else if (child.tagName === 'P' && /Written and reviewed in advance/.test(child.textContent)) seen.push('disclaimer');
        walk(child);
      }
    };
    walk(panel);
    return seen;
  });

  expect(order.indexOf('input')).toBeLessThan(order.indexOf('disclaimer'));
  expect(order.indexOf('disclaimer')).toBeLessThan(order.indexOf('answer'));
  expect(order.indexOf('answer')).toBeLessThan(order.indexOf('suggestions'));
});

test('follow-ups after an answer are never hidden behind the expand control', async ({ page }) => {
  // At most four, and they are the next step from something already on screen.
  await page.goto('/');
  await openAsk(page);

  await page.locator('#ask-panel [data-ask-suggestion="true"]')
    .filter({ hasText: /fintech and payments/i }).first().click();

  await expect(page.getByText('Related')).toBeVisible();
  await expect(page.locator('[data-ask-expand="true"]')).toHaveCount(0);
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
  await expect(page.getByText('Try one of these')).toBeVisible();
  await page.locator('#ask-panel [data-ask-suggestion="true"]').first().click();
  await expectLatestAnalyticsEvent(page, 'ask_suggested_click', { answer_id: 'kind-of-designer' });

  await page.context().route('https://github.com/**', route => route.abort());
  const githubPopup = page.waitForEvent('popup');
  await page.locator('[data-github-contributions]').getByRole('link', { name: /View GitHub profile/i }).click();
  await expectLatestAnalyticsEvent(page, 'contact_click_github', {
    section: 'at_a_glance_contributions',
    link_url: 'https://github.com/designedbyomar',
  });
  await (await githubPopup).close();

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
  await expect(page.getByText('Try one of these')).toBeVisible();
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

  const prompts = page.locator('#ask-panel [data-ask-suggestion="true"]');
  const opening = await prompts.allInnerTexts();
  expect(opening, 'collapsed to three until asked to show more').toHaveLength(3);

  await prompts.filter({ hasText: /fintech and payments/i }).first().click();

  // The row retitles and re-ranks against the question just answered, rather
  // than leaving the same prompts the visitor has already passed over.
  await expect(page.getByText('Related')).toBeVisible();
  await expect(page.getByText('Try one of these')).toHaveCount(0);

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

test('a typed question is routed, and the routed answer is shown', async ({ page }) => {
  // Typed questions are not answered by word overlap any more, so this needs
  // the endpoint — which `vite preview` does not run. Stubbed to the reply
  // production would give.
  await page.route('**/api/ask', route => route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Ask-Source': 'reviewed',
      'X-Ask-Sources': 'connect-api',
      'X-Ask-Answer-Id': 'fintech-depth',
      'X-Ask-Matched-By': 'router',
    },
    body: 'routed',
  }));

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
  await expect(page.getByText(/Anything else you type is sent to this site to be matched/i)).toBeVisible();
  // Drafting now reads the case studies, not only the written answers, so the
  // policy has to say that is what gets sent.
  // Stated twice on purpose — in the narrative and in the collected-data list.
  await expect(page.getByText(/excerpts of the published case studies/i).first()).toBeVisible();
  await expect(page.getByText(/excerpts of the published case studies/i)).toHaveCount(2);
  await expect(page.getByText(/Only published material is ever sent/i)).toBeVisible();
  // Groq is not always called, and an answered question's wording is not
  // recorded — both were overstated, and both are load-bearing claims.
  await expect(page.getByText(/If Groq cannot be reached, or the free daily allowance is spent/i)).toBeVisible();
  await expect(page.getByText(/wording of a question nothing covers is also recorded/i)).toBeVisible();
  await expect(page.getByText(/does get a written answer is not recorded that way/i)).toBeVisible();
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

test('with the endpoint down, a loose word match is not served in its place', async ({ page }) => {
  // This reverses an earlier decision. Falling back to the local overlap match
  // whenever the endpoint could not answer was meant to keep the feature no
  // worse than before routing existed — but that is the state this exists to
  // fix, and the fallback is where it kept resurfacing.
  //
  // "has he worked with react" scores 0.56 against `technical-depth`. It might
  // be right; nothing here can tell. So it is not presented as the answer.
  await page.route('**/api/ask', route => route.abort('failed'));

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('has he worked with react');
  await page.locator('#faq button[type="submit"]').click();

  await expect(askLive(page).getByText(/no written answer/i)).toBeVisible();
  await expect(askLive(page).locator('a[href^="mailto:"]')).toBeVisible();
  await expect(askLive(page).getByText(/Drafted, not reviewed/i)).toHaveCount(0);
});

test('a verbatim question is answered without touching the network', async ({ page }) => {
  // The carve-out the privacy policy relies on. An exact alias must never be
  // routed, and neither must a suggested prompt.
  const requests = [];
  page.on('request', r => { if (r.url().includes('/api/ask')) requests.push(r.url()); });

  await page.goto('/');
  await openAsk(page);

  await page.locator('#ask-panel [data-ask-suggestion="true"]').first().click();
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

  // It has to be a ring, not a fill. The cover punches the centre out, and if it
  // is transparent — as it was when it referenced an undefined token — the
  // gradient floods the whole field behind the text.
  const cover = await field.evaluate(n => getComputedStyle(n, '::after').backgroundColor);
  expect(cover, 'the cover must be opaque, or the gradient is a fill').not.toBe('rgba(0, 0, 0, 0)');
  expect(cover).not.toBe('transparent');

  // And the gradient must not be painting the input itself.
  const inputBg = await page.locator('#ask-panel input[type="text"]')
    .evaluate(n => getComputedStyle(n).backgroundImage);
  expect(inputBg, 'the input carries no gradient of its own').toBe('none');

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

test('the site works on a browser with only the legacy matchMedia listener API', async ({ page }) => {
  // MediaQueryList.addEventListener arrived in Safari 14. Four listeners here
  // guarded it with `?.` and would silently stop tracking the preference; a
  // fifth called it outright and threw, taking a render path with it.
  await page.addInitScript(() => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const mq = real(query);
      const legacy = {
        media: mq.media,
        get matches() { return mq.matches; },
        addListener: (fn) => mq.addEventListener('change', fn),
        removeListener: (fn) => mq.removeEventListener('change', fn),
      };
      return legacy;
    };
  });

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await openAsk(page);
  await page.locator('#ask-panel [data-ask-suggestion="true"]').first().click();
  await expect(askLive(page).locator('p').first()).toBeVisible();

  expect(errors, 'no listener call may throw').toEqual([]);
});

test('a clipboard write that lands late does not mark the wrong answer copied', async ({ page }) => {
  // The write is async. Choosing another answer while it is in flight used to
  // put "Copied" on the new answer's button while the clipboard still held the
  // previous link — so the visitor sends the wrong one, with nothing on screen
  // to suggest it.
  await page.goto('/ask');
  await page.evaluate(() => {
    window.__written = [];
    window.__release = null;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text) => new Promise(resolve => {
          window.__written.push(text);
          window.__release = () => resolve();
        }),
      },
    });
  });

  const prompts = page.locator('#ask-panel [data-ask-suggestion="true"]');
  await prompts.filter({ hasText: /fintech and payments/i }).first().click();
  await expect(page).toHaveURL(/#fintech-depth$/);
  await page.locator('[data-ask-share="true"]').click();

  // Switch answers while that write is still pending, then let it land.
  await prompts.filter({ hasText: /design systems at scale/i }).first().click();
  await expect(page).toHaveURL(/#design-systems$/);
  await page.evaluate(() => window.__release());
  await page.waitForTimeout(300);

  const written = await page.evaluate(() => window.__written);
  expect(written, 'the clipboard holds the first answer').toEqual([
    expect.stringContaining('/ask#fintech-depth'),
  ]);

  // Read the rendered label and the aria-label rather than matching text: the
  // control is uppercased in CSS, so getByText('Copied') never matches and an
  // assertion written that way passes whether or not the bug is present.
  const share = page.locator('[data-ask-share="true"]');
  expect((await share.innerText()).toLowerCase(), 'the second answer must not claim the copy')
    .toBe('copy link');
  await expect(share).toHaveAttribute('aria-label', /Copy a link to this answer/i);
});

test('a refused clipboard write says so, and points at the address bar', async ({ page, context }) => {
  await page.goto('/ask');
  await page.locator('#ask-panel [data-ask-suggestion="true"]').filter({ hasText: /fintech and payments/i }).first().click();
  await expect(page).toHaveURL(/#fintech-depth$/);

  // Clipboard writes are refused routinely — insecure origin, denied
  // permission, no user gesture. Silence made a press look like a no-op.
  await context.grantPermissions([]);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });

  await page.locator('[data-ask-share="true"]').click();
  await expect(page.getByText('Use the address bar')).toBeVisible();

  // Which is only useful advice because the URL really is the link.
  expect(new URL(page.url()).hash).toBe('#fintech-depth');

  // And it reverts, so the control is usable again.
  await expect(page.getByText('Copy link')).toBeVisible({ timeout: 4000 });
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
  await expect(page.locator('#ask-panel [data-ask-suggestion="true"]').first()).toBeVisible();
  await expect(page.locator('#ask-panel input[type="text"]')).toBeVisible();
});

test('changing the hash on /ask selects the matching answer', async ({ page }) => {
  await page.goto('/ask');
  await expect(page.locator('#ask-panel [data-ask-suggestion="true"]').first()).toBeVisible();

  await page.evaluate(() => { window.location.hash = 'fintech-depth'; });
  await expect(page.getByText(/Two years at Plastiq/i).first()).toBeVisible();
});

test('an answer on /ask has a link of its own that reopens it', async ({ page, context }) => {
  await page.goto('/ask');

  await page.locator('#ask-panel [data-ask-suggestion="true"]').filter({ hasText: /fintech and payments/i }).first().click();
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

  await page.locator('#ask-panel [data-ask-suggestion="true"]').first().click();
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
  await page.locator('#ask-panel [data-ask-suggestion="true"]').first().click();
  await expect(askLive(page).locator('p').first()).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
});

test('the design system documents the Ask component', async ({ page }) => {
  await page.goto('/design-system');
  await page.locator('#ask').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Ask', exact: true })).toBeVisible();
  await expect(page.getByText(/Refuse rather than guess/i)).toBeVisible();
  await expect(page.getByText(/Only approved/i)).toBeVisible();

  // The governing-rule card and the section intro have to agree about what
  // decides a match. They did not: the intro said a model, the card still
  // described below-threshold overlap as the thing that declines.
  const ask = page.locator('#ask');
  await expect(ask.getByText(/Deciding which written answer a question wants is the model/i)).toBeVisible();
  await expect(ask.getByText(/only to catch a verbatim question/i)).toBeVisible();
});

test('a routed answer is not reported as a missing one', async ({ page }) => {
  // The wording of a covered question must not reach analytics, and a covered
  // question must not land in the missing-answer count — it is the only signal
  // that decides which answers get written next.
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'accepted');
    window.__omarAnalyticsConsent = 'accepted';
    window.__omarGaReady = true;
    window.__omarAnalyticsEvents = [];
    window.gtag = (command, eventName, params) => {
      if (command === 'event') window.__omarAnalyticsEvents.push({ eventName, params });
    };
  });
  await page.route('**/api/ask', route => route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Ask-Source': 'reviewed',
      'X-Ask-Sources': 'athena-ds',
      'X-Ask-Answer-Id': 'design-systems',
      'X-Ask-Matched-By': 'router',
    },
    body: 'routed',
  }));

  await page.goto('/');
  await openAsk(page);
  await askInput(page).fill('is he a manager');
  await page.locator('#faq button[type="submit"]').click();
  await expect(askLive(page).getByText(/Has Omar built design systems at scale/i)).toBeVisible();

  const events = await page.evaluate(() => window.__omarAnalyticsEvents ?? []);
  const routed = events.find(e => e.eventName === 'ask_routed');
  expect(routed, 'ask_routed reports the outcome').toBeTruthy();
  expect(routed.params).toMatchObject({ answer_id: 'design-systems', matched_by: 'router' });
  expect(routed.params.question, 'and carries no wording').toBeUndefined();

  expect(events.find(e => e.eventName === 'ask_no_match'), 'an answered question is not a miss').toBeFalsy();
  const leaked = events.filter(e => JSON.stringify(e.params ?? {}).includes('is he a manager'));
  expect(leaked, 'no event carries the wording of an answered question').toHaveLength(0);
});

test('following a hash mid-request cancels it, so the URL and the answer agree', async ({ page }) => {
  // The page has to show the answer its URL names. A request still in flight
  // when the hash changes would otherwise resolve over the top of it.
  let released;
  const gate = new Promise(resolve => { released = resolve; });
  await page.route('**/api/ask', async route => {
    await gate;
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Ask-Source': 'generated',
        'X-Ask-Sources': 'connect-api',
        'X-Ask-Answer-Id': '',
      },
      body: 'A draft that belongs to the abandoned question.',
    });
  });

  await page.goto('/ask');
  await expect(page.locator('#ask-panel input[type="text"]')).toBeVisible();

  await page.locator('#ask-panel input[type="text"]').fill('is he a manager');
  await page.locator('#ask-panel button[type="submit"]').click();
  await expect(page.getByText(/Looking for a written answer/i)).toBeVisible();

  // Follow a link to a specific answer while that request is outstanding.
  await page.evaluate(() => { window.location.hash = 'fintech-depth'; });
  await expect(page.getByText(/Two years at Plastiq/i).first()).toBeVisible();

  released();
  await page.waitForTimeout(600);

  // The linked answer still stands, and nothing from the abandoned request
  // appears beside it or in place of it.
  await expect(page.getByText(/Two years at Plastiq/i).first()).toBeVisible();
  await expect(page.getByText(/belongs to the abandoned question/i)).toHaveCount(0);
  await expect(page.getByText(/Drafted, not reviewed/i)).toHaveCount(0);
  await expect(page.getByText(/Looking for a written answer/i)).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe('#fintech-depth');
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
