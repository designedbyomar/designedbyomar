import { expect, test } from '@playwright/test';
import { MAX_QUESTION_CHARS } from '../../src/ask-policy.mjs';

const input = page => page.getByRole('textbox', { name: "Ask a question about Omar's work" });
const submit = page => page.locator('#ask-panel button[type="submit"]');
const response = page => page.locator('[data-ask-response-region]');
const fallback = (route, reason) => route.fulfill({ status: 200, headers: { 'X-Ask-Source': 'fallback', 'X-Ask-Reason': reason }, body: '' });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'accepted');
    window.__omarAnalyticsConsent = 'accepted';
    window.__omarGaReady = true;
    window.__omarAnalyticsEvents = [];
    window.gtag = (command, eventName, params) => {
      if (command === 'event') window.__omarAnalyticsEvents.push({ eventName, params });
    };
  });
});

test('failed answer downloads offer keyboard recovery and restore focus to the input', async ({ page }) => {
  let attempts = 0;
  await page.route('**/ask-answers.json', route => ++attempts <= 2 ? route.abort() : route.continue());
  await page.goto('/ask');
  await expect(page.getByRole('status')).toContainText('couldn’t load');
  await expect(page.locator('#ask-panel a[href^="mailto:"]')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Try loading again' });
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(retry).toBeFocused();
  await page.keyboard.press('Space');
  await expect(input(page)).toBeFocused();
  await expect(page.getByText('Try one of these')).toBeVisible();
  expect(attempts).toBe(3);
});

test('an empty answer catalogue shows recovery instead of an empty panel', async ({ page }) => {
  await page.route('**/ask-answers.json', route => route.fulfill({ json: { answers: [] } }));
  await page.goto('/ask');
  await expect(page.getByRole('status')).toContainText('couldn’t load');
  await expect(page.getByRole('button', { name: 'Try loading again' })).toBeVisible();
});

test('a stalled initial download times out with a retry', async ({ page }) => {
  await page.clock.install();
  await page.route('**/ask-answers.json', () => {});
  await page.goto('/ask');
  await expect(page.getByRole('status')).toHaveText('Loading reviewed answers…');
  await page.clock.fastForward(12500);
  await expect(page.getByRole('button', { name: 'Try loading again' })).toBeVisible();
});

test('a temporary request failure can be retried without losing the question', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/ask', route => ++attempts === 1 ? route.abort() : route.fulfill({
    headers: { 'X-Ask-Source': 'reviewed', 'X-Ask-Answer-Id': 'work-history', 'X-Ask-Matched-By': 'router' }, body: '',
  }));
  await page.goto('/ask');
  const question = 'What is his recent professional background?';
  await input(page).fill(question);
  await submit(page).click();
  await expect(response(page)).toContainText('couldn’t connect or finish');
  await expect(input(page)).toHaveValue(question);
  await response(page).getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page).toHaveURL(/#work-history$/);
  await expect(response(page)).toContainText('Standard Metrics');
  await expect(response(page)).not.toContainText('**');
  await expect(input(page)).toHaveValue(question);
  expect(attempts).toBe(2);
});

test('a stalled reply releases the input and offers recovery', async ({ page }) => {
  await page.clock.install();
  await page.route('**/api/ask', () => {});
  await page.goto('/ask');
  await input(page).fill('What sort of work might suit our small team?');
  await submit(page).click();
  await expect(submit(page)).toBeDisabled();
  await page.clock.fastForward(25500);
  await expect(response(page).getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await expect(submit(page)).toBeEnabled();
});

for (const [reason, message] of [['rate-limited', 'reached the Ask limit'], ['no-material', 'couldn’t safely match']]) {
  test(`${reason} gives appropriate guidance without a futile retry`, async ({ page }) => {
    await page.route('**/api/ask', route => fallback(route, reason));
    await page.goto('/ask');
    await input(page).fill('Could you answer an unusual question for me?');
    await submit(page).click();
    await expect(response(page)).toContainText(new RegExp(message.replace('’', "['’]")));
    await expect(response(page).getByRole('button', { name: 'Try again', exact: true })).toHaveCount(0);
    await expect(response(page).getByRole('link', { name: 'Email Omar' })).toBeVisible();
    await page.locator('[data-ask-suggestion]').first().click();
    await expect(response(page)).not.toContainText(new RegExp(message.replace('’', "['’]")));
  });
}

test('overlong input stays intact and cannot be submitted until edited', async ({ page }) => {
  const requests = [];
  await page.route('**/api/ask', route => { requests.push(route.request().postDataJSON()); return fallback(route, 'no-material'); });
  await page.goto('/ask');
  const question = 'x'.repeat(MAX_QUESTION_CHARS + 23);
  await input(page).fill(question);
  await expect(input(page)).toHaveValue(question);
  await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ask-input-help')).toContainText('Please shorten');
  await expect(submit(page)).toBeDisabled();
  await input(page).press('Enter');
  expect(requests).toHaveLength(0);
  await input(page).fill(question.slice(0, MAX_QUESTION_CHARS));
  await submit(page).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].question).toHaveLength(MAX_QUESTION_CHARS);
});

test('malformed fragments are harmless both on arrival and after a reviewed answer', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ask#%');
  await expect(input(page)).toBeVisible();
  await input(page).fill('fintech experience');
  await submit(page).click();
  await expect(page).toHaveURL(/#fintech-depth$/);
  await page.evaluate(() => { window.location.hash = '%E0%A4%A'; });
  await expect(response(page)).toBeEmpty();
  await input(page).fill('fintech experience');
  await submit(page).click();
  await expect(page).toHaveURL(/#fintech-depth$/);
  expect(errors).toEqual([]);
});

for (const kind of ['fallback', 'generated']) {
  test(`${kind} analytics and email clicks never include visitor wording`, async ({ page }) => {
    await page.route('**/api/ask', route => kind === 'fallback' ? fallback(route, 'no-material') : route.fulfill({
      headers: { 'X-Ask-Source': 'generated', 'X-Ask-Reason': 'router-sourced', 'X-Ask-Sources': 'connect-api' },
      body: 'Plastiq Connect includes an embedded payments widget.',
    }));
    await page.goto('/ask');
    const question = 'Please reply to audit-person@example.invalid about a project.';
    await input(page).fill(question);
    await submit(page).click();
    const email = response(page).getByRole('link', { name: 'Email Omar' });
    await expect(email).toBeVisible();
    // Exercise the handler without launching an external mail application.
    await page.evaluate(() => document.addEventListener('click', e => {
      if (e.target.closest('a[href^="mailto:"]')) e.preventDefault();
    }));
    await email.click();
    const events = await page.evaluate(() => window.__omarAnalyticsEvents.filter(e => e.eventName.startsWith('ask_')));
    expect(events.find(e => e.eventName === 'ask_no_match').params).toMatchObject({ answered_by: kind, nearest_id: expect.any(String) });
    expect(events.find(e => e.eventName === 'ask_contact_click').params.answer_id).toBe(kind === 'generated' ? 'drafted' : 'unanswered');
    expect(JSON.stringify(events)).not.toContain('audit-person');
    expect(events.every(e => !('question' in e.params))).toBe(true);
  });
}

for (const theme of ['light', 'dark']) {
  for (const width of [375, 820, 1440]) {
    test(`Ask recovery and contact hierarchy fit ${theme} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(theme => localStorage.setItem('omar.theme', theme), theme);
      await page.route('**/api/ask', route => fallback(route, 'unavailable'));
      await page.goto('/ask');
      await input(page).fill('How would he help a small product team?');
      await submit(page).click();
      await expect(response(page).getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`ask-${theme}-${width}.png`), fullPage: true });
      await page.goto('/#contact');
      const primary = page.getByRole('group', { name: 'Start a conversation' });
      const secondary = page.getByRole('group', { name: 'Explore my work and profiles' });
      await primary.scrollIntoViewIfNeeded();
      await expect(primary.getByRole('link')).toHaveCount(2);
      await expect(secondary.getByRole('link')).toHaveCount(5);
      expect((await secondary.boundingBox()).y).toBeGreaterThan((await primary.boundingBox()).y + (await primary.boundingBox()).height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('#contact').screenshot({ path: testInfo.outputPath(`contact-${theme}-${width}.png`) });
    });
  }
}

test('recovery controls retain keyboard focus in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.route('**/api/ask', route => fallback(route, 'unavailable'));
  await page.goto('/ask');
  await input(page).fill('How would he help a small product team?');
  await input(page).press('Enter');
  const retry = response(page).getByRole('button', { name: 'Try again', exact: true });
  await retry.focus();
  await expect(retry).toBeFocused();
  expect(await retry.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
});
