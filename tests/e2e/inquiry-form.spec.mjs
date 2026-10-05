import { expect, test } from '@playwright/test';
import { INQUIRY_FIELDS } from '../../src/content/inquiry.mjs';

const choose = async (form, label, option) => {
  await form.getByRole('combobox', { name: label, exact: true }).click();
  await form.getByRole('option', { name: option, exact: true }).click();
};

const installForm = async (page, submit) => {
  await page.addInitScript(() => {
    localStorage.setItem('omar.analyticsConsent', 'declined');
    window.inquiryEvents = [];
  });
  await page.route('**/api/contact', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { available: true } }) : submit(route));
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.turnstile = {
      render: (element, options) => { window.verificationOptions = options; element.textContent = 'Verification fixture'; options.callback('fixture-token'); return 'fixture'; },
      reset: () => window.verificationOptions.callback('fresh-token'),
      remove: () => {},
    };
  ` }));
};
const fill = async page => {
  const form = page.locator('.rate-card-page .inquiry-form');
  await form.getByLabel('Name (required)', { exact: true }).fill('Example Client');
  await form.getByLabel('Email (required)', { exact: true }).fill('client@example.com');
  await form.getByLabel('Goals (required)', { exact: true }).fill('Review our checkout flow.');
  await choose(form, 'Timing (required)', 'Not sure yet');
  await choose(form, 'Budget in USD (required)', 'Not sure yet');
  await choose(form, 'Budget basis (required)', 'Monthly');
  return form;
};

test('valid inquiries confirm provider acceptance and block duplicate clicks', async ({ page }) => {
  let release;
  let calls = 0;
  let sent;
  await installForm(page, async route => { calls++; sent = route.request().postDataJSON(); await new Promise(resolve => { release = resolve; }); await route.fulfill({ json: { sent: true } }); });
  await page.goto('/ratecard');
  const form = await fill(page);
  await page.evaluate(() => { window.trackAnalyticsEvent = (...args) => window.inquiryEvents.push(args); });
  await form.getByRole('button', { name: 'Send inquiry', exact: true }).click();
  await expect(form.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  for (const control of await form.getByRole('combobox').all()) await expect(control).toBeDisabled();
  await expect(form.getByRole('listbox')).toHaveCount(0);
  await expect(form.getByRole('status')).toContainText('Sending your inquiry');
  expect(calls).toBe(1);
  expect(sent.email).toBe('client@example.com');
  release();
  await expect(form.getByRole('status')).toContainText('Your inquiry has been sent. Thanks for sharing the details.');
  expect(await page.evaluate(() => window.inquiryEvents)).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /inquiry|goals|budget/i.test(key)))).toEqual([]);
});

test('validation focuses the summary and ties errors to labelled fields', async ({ page }) => {
  let sends = 0;
  await installForm(page, route => { sends++; return route.fulfill({ json: { sent: true } }); });
  await page.goto('/ratecard');
  const form = page.locator('.rate-card-page .inquiry-form');
  await form.getByRole('button', { name: 'Send inquiry', exact: true }).click();
  await expect(form.locator('.inquiry-form__summary')).toBeFocused();
  await expect(form.getByLabel('Email (required)', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByLabel('Email (required)', { exact: true })).toHaveAttribute('aria-describedby', /email-error/);
  const timing = form.getByRole('combobox', { name: 'Timing (required)', exact: true });
  await expect(timing).toHaveAttribute('aria-invalid', 'true');
  await expect(timing).toHaveAttribute('aria-describedby', /timing-error/);
  await form.locator('.inquiry-form__summary').getByRole('link', { name: 'Enter timing.', exact: true }).click();
  await expect(timing).toBeFocused();
  expect(sends).toBe(0);
});

test('provider failures and expired verification preserve values and retry identity', async ({ page }) => {
  const bodies = [];
  await installForm(page, route => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill(bodies.length === 1 ? { status: 400, json: { error: 'Verification expired. Please verify again.', verificationFailed: true } }
      : bodies.length === 2 ? { status: 502, json: { error: 'Email is temporarily unavailable.' } } : { json: { sent: true } });
  });
  await page.goto('/ratecard');
  const form = await fill(page);
  for (const message of ['Verification expired', 'Email is temporarily unavailable']) {
    await form.getByRole('button', { name: 'Send inquiry', exact: true }).click();
    await expect(form.locator('.inquiry-form__summary')).toContainText(message);
    await expect(form.getByLabel('Goals (required)', { exact: true })).toHaveValue('Review our checkout flow.');
    await expect(form.getByRole('status')).not.toContainText('Your inquiry has been sent');
  }
  await form.getByRole('button', { name: 'Send inquiry', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('Your inquiry has been sent');
  expect(new Set(bodies.map(body => body.submissionId)).size).toBe(1);
  expect(bodies[1].token).toBe('fresh-token');
});

test('network timeout retains content and never reports success', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => original(callback, delay === 20000 ? 30 : delay, ...args);
  });
  await installForm(page, async route => { await new Promise(resolve => setTimeout(resolve, 200)); await route.abort(); });
  await page.goto('/ratecard');
  const form = await fill(page);
  await form.getByRole('button', { name: 'Send inquiry', exact: true }).click();
  await expect(form.locator('.inquiry-form__summary')).toContainText('couldn’t confirm');
  await expect(form.getByLabel('Name (required)', { exact: true })).toHaveValue('Example Client');
  await expect(form.getByRole('status')).not.toContainText('Your inquiry has been sent');
});

test('missing server configuration leaves direct email and never loads verification', async ({ page }) => {
  const verification = [];
  page.on('request', request => { if (new URL(request.url()).hostname === 'challenges.cloudflare.com') verification.push(request.url()); });
  await page.route('**/api/contact', route => route.fulfill({ json: { available: false } }));
  await page.goto('/ratecard');
  await expect(page.locator('.rate-card-page .inquiry-form')).toHaveCount(0);
  await expect(page.locator('.rate-card-page__contact').getByRole('link', { name: 'Email omar@designedbyomar.com' })).toBeVisible();
  expect(verification).toEqual([]);
});

for (const theme of ['light', 'dark']) for (const width of [390, 820, 1440]) {
  test(`inquiry form ${theme} ${width} supports keyboard and layout`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(value => localStorage.setItem('omar.theme', value), theme);
    await installForm(page, route => route.fulfill({ json: { sent: true } }));
    await page.goto('/ratecard');
    const form = await fill(page);
    const name = form.getByLabel('Name (required)', { exact: true });
    await name.focus();
    await page.keyboard.press('Tab');
    await expect(form.getByLabel('Email (required)', { exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.rate-card-page__contact').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`inquiry-${theme}-${width}.png`) });
    await form.getByRole('button', { name: 'Send inquiry', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`inquiry-action-${theme}-${width}.png`) });
  });
}

test('inquiry specimens are isolated from sending, verification, consent, and production events', async ({ page }) => {
  const requests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/contact' || url.hostname === 'challenges.cloudflare.com') requests.push(request.url());
  });
  await page.addInitScript(() => { localStorage.setItem('omar.analyticsConsent', 'declined'); window.specimenEvents = []; window.trackAnalyticsEvent = (...args) => window.specimenEvents.push(args); });
  await page.goto('/design-system#inquiry-form');
  const specimen = page.locator('[data-production-specimen="inquiry"]');
  await specimen.getByLabel('Example state').selectOption('sent');
  await expect(specimen.getByRole('status')).toContainText('Your inquiry has been sent');
  await specimen.getByLabel('Example state').selectOption('error');
  await expect(specimen.getByRole('alert')).toContainText('Example failure. Nothing was sent.');
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => window.specimenEvents)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('omar.analyticsConsent'))).toBe('declined');
});


test('shared dropdown supports navigation, selection, cancellation, typeahead and dismissal', async ({ page }) => {
  await page.goto('/design-system#inquiry-form');
  const specimen = page.locator('[data-production-specimen="inquiry"]');
  const timing = specimen.getByRole('combobox', { name: 'Timing (required)', exact: true });
  await timing.focus();
  await page.keyboard.press('ArrowDown');
  await expect(timing).toHaveAttribute('aria-expanded', 'true');
  const activeOption = async () => specimen.locator(`[id="${await timing.getAttribute('aria-activedescendant')}"]`);
  await expect(await activeOption()).toHaveText('ASAP');
  await page.keyboard.press('End');
  await expect(await activeOption()).toHaveText('Not sure yet');
  await page.keyboard.press('Home');
  await expect(await activeOption()).toHaveText('Choose your timing');
  await page.keyboard.press('w');
  await expect(await activeOption()).toHaveText('Within a month');
  await page.keyboard.press('Enter');
  await expect(timing).toHaveText('Within a month');
  await expect(timing).toBeFocused();
  await expect(timing).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Space');
  await expect(specimen.getByRole('option', { name: 'Within a month', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(timing).toHaveText('Within a month');
  await expect(timing).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(timing).toHaveText('1–3 months');
  await expect(specimen.getByRole('combobox', { name: 'Budget in USD (required)', exact: true })).toBeFocused();
  await timing.click();
  await page.keyboard.press('End');
  await specimen.getByLabel('Name (required)', { exact: true }).click();
  await expect(timing).toHaveAttribute('aria-expanded', 'false');
  await expect(timing).toHaveText('1–3 months');
  await timing.focus();
  await page.keyboard.press('l');
  await page.keyboard.press('Enter');
  await expect(timing).toHaveText('Later');
  await timing.click();
  await page.keyboard.press('Home');
  await page.keyboard.press('Space');
  await expect(timing).toHaveText('Choose your timing');
  await specimen.getByLabel('Example state').selectOption('sending');
  await expect(timing).toBeDisabled();
  await expect(specimen.getByRole('listbox')).toHaveCount(0);
});

test('all inquiry fields have prompts without replacing labels or introducing values', async ({ page }) => {
  await page.goto('/design-system#inquiry-form');
  const specimen = page.locator('[data-production-specimen="inquiry"]');
  for (const field of INQUIRY_FIELDS) {
    const control = specimen.getByLabel(`${field.label} (${field.required ? 'required' : 'optional'})`, { exact: true });
    if (field.options) {
      await expect(control).toHaveText(field.placeholder);
      await expect(specimen.locator(`input[type="hidden"][name="${field.name}"]`)).toHaveValue('');
    } else {
      await expect(control).toHaveAttribute('placeholder', field.placeholder);
      await expect(control).toHaveValue('');
    }
  }
  await expect(specimen.locator('.inquiry-field__help')).toHaveText('Include https:// if you have a website.');
});

for (const theme of ['light', 'dark']) for (const width of [390, 820, 1440]) {
  test(`dropdown menu ${theme} ${width} fits, scrolls and insets its icon`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(value => localStorage.setItem('omar.theme', value), theme);
    await installForm(page, route => route.fulfill({ json: { sent: true } }));
    await page.goto('/ratecard');
    const form = page.locator('.rate-card-page .inquiry-form');
    const service = form.getByRole('combobox', { name: 'Service interest (optional)', exact: true });
    await service.scrollIntoViewIfNeeded();
    await service.click();
    await page.keyboard.press('End');
    const menu = form.getByRole('listbox');
    const active = form.locator(`[id="${await service.getAttribute('aria-activedescendant')}"]`);
    const menuBox = await menu.boundingBox();
    const optionBox = await active.boundingBox();
    expect(menuBox.y).toBeGreaterThanOrEqual(0);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(900);
    expect(optionBox.y).toBeGreaterThanOrEqual(menuBox.y);
    expect(optionBox.y + optionBox.height).toBeLessThanOrEqual(menuBox.y + menuBox.height + 1);
    const inset = await service.evaluate(node => node.getBoundingClientRect().right - node.querySelector('svg').getBoundingClientRect().right);
    expect(inset).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`dropdown-${theme}-${width}.png`) });
    await page.keyboard.press('Enter');
    await expect(service).toHaveText('Website + Design Support');
    await service.evaluate(node => node.scrollIntoView({ block: 'end', behavior: 'instant' }));
    await service.click();
    await expect(menu).toHaveClass(/select-field__menu--above/);
    const aboveBox = await menu.boundingBox();
    const triggerBox = await service.boundingBox();
    expect(aboveBox.y).toBeGreaterThanOrEqual(0);
    expect(aboveBox.y + aboveBox.height).toBeLessThan(triggerBox.y);
    await page.keyboard.press('Escape');
  });
}
