import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { DESIGN_SYSTEM_GROUPS, DESIGN_SYSTEM_SECTIONS } from '../../src/content/design-system.mjs';

const ids = DESIGN_SYSTEM_SECTIONS.map(section => section.id);
const legacyIds = ['overview', 'quick-links', 'what-it-powers', 'foundations', 'color', 'typography', 'spacing', 'radius-elevation', 'foundation-specimens', 'blur', 'motion-tokens', 'components', 'buttons', 'cards-accordions', 'copy-actions', 'navigation-drawers', 'cookie-banner', 'ask', 'github-activity', 'case-study-blocks', 'about-media', 'service-gradients', 'service-lists', 'inquiry-form', 'patterns', 'hero-system', 'case-study-covers', 'footer-system', 'privacy-consent', 'motion', 'alien-arrival', 'pixel-orbit', 'hover-reveal', 'reduced-motion', 'content', 'case-study-anatomy', 'metadata-labels', 'microcopy', 'accessibility', 'focus-keyboard', 'contrast-touch', 'resources', 'audit-notes'];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { localStorage.setItem('omar.theme', 'dark'); localStorage.setItem('omar.analyticsConsent', 'declined'); });
});

test('one registry orders page sections, navigation, shortcuts and coverage', async ({ page }) => {
  await page.goto('/design-system');
  await expect(page.locator('[data-production-specimen="inventory"]')).toBeVisible();
  const sectionIds = await page.locator('main > [data-doc-section]').evaluateAll(nodes => nodes.map(node => node.id));
  expect(sectionIds).toEqual(ids);
  const nav = page.getByTestId('design-system-sidebar');
  await expect(nav).toHaveCount(1);
  expect(await nav.locator('.ds-nav-group__items a').evaluateAll(nodes => nodes.map(node => node.hash.slice(1)))).toEqual(ids);
  for (const section of DESIGN_SYSTEM_SECTIONS.filter(section => section.id !== 'overview')) {
    await expect(page.locator(`#${section.id}-title`)).toHaveText(section.title);
  }
  expect(await page.locator('#quick-links a').evaluateAll(nodes => nodes.map(node => node.hash.slice(1))))
    .toEqual(DESIGN_SYSTEM_GROUPS.filter(group => group.shortcut).map(group => group.sections[0].id));
  const invalid = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('[id]')];
    const duplicates = elements.filter((el, i) => elements.findIndex(other => other.id === el.id) !== i).map(el => el.id);
    const dangling = [...document.querySelectorAll('[aria-controls], [aria-labelledby]')].flatMap(el => ['aria-controls', 'aria-labelledby'].flatMap(name => (el.getAttribute(name) || '').split(' ').filter(id => id && !document.getElementById(id))));
    const coverage = [...document.querySelectorAll('#audit-notes a[href^="#"]')].filter(el => !document.getElementById(el.hash.slice(1))).map(el => el.hash);
    return { duplicates, dangling, coverage };
  });
  expect(invalid).toEqual({ duplicates: [], dangling: [], coverage: [] });
  await expect(page.locator('[data-production-specimen="services"]')).toHaveCount(1);
});

test('every bookmarked anchor is retained and reachable', async ({ page }) => {
  await page.goto('/design-system');
  await expect(page.locator('[data-production-specimen="inventory"]')).toBeVisible();
  for (const id of legacyIds) {
    await page.evaluate(id => { window.location.hash = id; }, id);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect.poll(() => page.locator(`#${id}`).evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop))))
      .toBeLessThan(3);
    await expect(page.locator('.ds-nav-group__items a[aria-current="location"]')).toHaveAttribute('href', `#${id === 'quick-links' ? 'overview' : id}`);
  }
});

test('direct anchors survive lazy examples, reloads and history navigation', async ({ page }) => {
  await page.route('**/*design-system-specimens*.js', async route => { await new Promise(resolve => setTimeout(resolve, 500)); await route.continue(); });
  await page.goto('/design-system#service-lists');
  await expect(page.locator('[data-production-specimen="services"]')).toBeVisible();
  await expect.poll(() => page.locator('#service-lists').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(60);
  await expect.poll(() => page.locator('#service-lists').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(110);
  await page.reload();
  await expect(page.locator('#service-lists-title')).toBeFocused();
  const nav = page.getByTestId('design-system-sidebar');
  await nav.getByRole('button', { name: 'Components', exact: true }).click();
  await nav.getByRole('link', { name: 'Buttons and links', exact: true }).click();
  await expect(page.locator('#buttons-title')).toBeFocused();
  await page.goBack();
  await expect(page.locator('#service-lists-title')).toBeFocused();
  await page.goForward();
  await expect(page.locator('#buttons-title')).toBeFocused();
});

for (const width of [390, 820, 1054]) test(`documentation menu supports keyboard and dismissal at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/design-system');
  const trigger = page.getByRole('banner').getByRole('button', { name: /design system navigation/ });
  const nav = page.getByTestId('design-system-sidebar');
  await trigger.focus(); await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('button', { name: 'Overview', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(nav).toBeHidden();
  await trigger.click();
  await nav.getByRole('button', { name: 'Components', exact: true }).click();
  await nav.getByRole('link', { name: 'Select dropdowns', exact: true }).click();
  await expect(nav).toBeHidden();
  await expect(page.locator('#select-dropdowns-title')).toBeFocused();
  await trigger.click();
  await page.locator('#select-dropdowns-title').focus();
  await expect(nav).toBeHidden();
  await trigger.click();
  await page.getByRole('banner').getByRole('link', { name: 'designedbyomar' }).click({ trial: true });
  // Outside pointer dismissal is independent of selecting a destination.
  await page.locator('#select-dropdowns-title').dispatchEvent('pointerdown');
  await expect(nav).toBeHidden();
});

test('scroll tracking follows long sections and the page end without stealing focus', async ({ page }) => {
  await page.goto('/design-system#buttons');
  await page.locator('#buttons .ds-button').first().focus();
  await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel'));
    const section = document.getElementById('service-lists');
    window.scrollTo(0, section.offsetTop + 250);
  });
  await expect(page.locator('.ds-nav-group__items a[aria-current="location"]')).toHaveAttribute('href', '#service-lists');
  await expect(page.locator('#buttons .ds-button').first()).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.ds-nav-group__items a[aria-current="location"]')).toHaveAttribute('href', '#audit-notes');
});

test('field and verification examples are local, labelled and recoverable', async ({ page }) => {
  const requests = [];
  page.on('request', request => {
    const { hostname, pathname } = new URL(request.url());
    if (pathname.startsWith('/api/') || hostname === 'challenges.cloudflare.com'
      || hostname === 'google-analytics.com' || hostname.endsWith('.google-analytics.com')) {
      requests.push(request.url());
    }
  });
  await page.goto('/design-system#form-fields');
  const fields = page.locator('[data-production-specimen="fields"]');
  await fields.getByLabel('Example state').selectOption('invalid');
  await expect(fields.getByLabel('Example email (required)', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(fields.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
  await fields.getByLabel('Example state').selectOption('disabled');
  await expect(fields.getByLabel('Example email (required)', { exact: true })).toBeDisabled();
  const select = page.locator('[data-production-specimen="select"]');
  await select.getByRole('combobox', { name: 'Example service (required)', exact: true }).focus();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(select.getByRole('combobox', { name: 'Example service (required)', exact: true })).toContainText('Product Audit');
  const inquiry = page.locator('[data-production-specimen="inquiry"]');
  await inquiry.getByLabel('Name (required)', { exact: true }).fill('Local example');
  await inquiry.getByLabel('Example state').selectOption('verification-unavailable');
  await expect(inquiry.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  await expect(inquiry.getByLabel('Name (required)', { exact: true })).toHaveValue('Local example');
  await expect(inquiry.getByRole('link', { name: /Email Omar instead/ })).toBeVisible();
  await inquiry.getByLabel('Name (required)', { exact: true }).fill('Still local');
  await expect(inquiry.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();
  await expect(inquiry.getByRole('link', { name: /Email Omar instead/ })).toBeVisible();
  expect(requests).toEqual([]);
});

test('token reference follows the stylesheet and theme with accessible copy controls', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/design-system#token-reference');
  const reference = page.locator('#token-reference');
  const tokens = [...new Set([...readFileSync(new URL('../../src/design-tokens.css', import.meta.url), 'utf8').matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]))].sort();
  expect((await reference.locator('dt code').allTextContents()).sort()).toEqual(tokens);
  await expect(reference.locator('.disclosure__panel:visible')).toHaveCount(0);
  await reference.getByRole('button', { name: /^Color and surfaces/ }).click();
  const role = reference.locator('dl > div').filter({ has: page.locator('dt code', { hasText: /^--fg-primary$/ }) });
  await expect(role.locator('dd')).toHaveText('#ededed');
  await page.getByRole('banner').getByRole('button', { name: /Switch to light/ }).click();
  await expect(role.locator('dd')).toHaveText('var(--color-omar-black)');
  await role.getByRole('button').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('--fg-primary');
  const undersized = await page.locator('.ds-nav-category, .ds-nav-group__items a, .ds-section-header__copy, .ds-copy-button, .ds-specimen-state-picker select').evaluateAll(nodes => nodes.filter(node => {
    const box = node.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
  }).map(node => node.textContent || node.getAttribute('aria-label')));
  expect(undersized).toEqual([]);
});

for (const theme of ['light', 'dark']) for (const width of [390, 820, 1054, 1440]) test(`reference layout ${theme} ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript(theme => localStorage.setItem('omar.theme', theme), theme);
  await page.goto('/design-system#badges-tags');
  await expect(page.locator('[data-production-specimen="badges"]')).toBeVisible();
  const overflow = await page.evaluate(() => [...document.querySelectorAll('main > section')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.id));
  expect(overflow).toEqual([]);
  const contrast = await page.evaluate(() => {
    const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = values => values.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const background = luminance(rgb(getComputedStyle(document.body).backgroundColor));
    return ['#badges-tags .ds-section-header > p', '#badges-tags .mono-label', '#badges-tags .ds-badge-examples > p'].map(selector => {
      const foreground = luminance(rgb(getComputedStyle(document.querySelector(selector)).color));
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
  });
  contrast.forEach(ratio => expect(ratio).toBeGreaterThanOrEqual(4.5));
  await page.screenshot({ path: testInfo.outputPath(`badges-${theme}-${width}.png`) });
  await page.evaluate(() => { window.location.hash = 'form-fields'; });
  await page.screenshot({ path: testInfo.outputPath(`fields-${theme}-${width}.png`) });
  const usage = page.locator('#form-fields .ds-usage-notes > .disclosure');
  await usage.getByRole('button', { name: 'Usage and behavior' }).focus();
  await page.keyboard.press('Enter');
  await expect(usage.getByRole('region')).toBeVisible();
  const frames = await page.locator('.ds-doc-card, .ds-example-frame, .ds-token-swatch, .ds-usage-notes > .disclosure, .ds-detail-stack > .disclosure').evaluateAll(nodes => nodes.map(node => {
    const css = getComputedStyle(node);
    return { radius: css.borderRadius, border: css.borderStyle, sides: [css.borderTopWidth, css.borderRightWidth, css.borderBottomWidth, css.borderLeftWidth], shadow: css.boxShadow };
  }));
  for (const frame of frames) {
    expect(frame.radius).toBe('12px');
    expect(frame.border).toBe('solid');
    expect(frame.sides.every(side => parseFloat(side) > 0)).toBe(true);
    expect(frame.shadow).toBe('none');
  }
  await usage.screenshot({ path: testInfo.outputPath(`usage-expanded-${theme}-${width}.png`) });
  await page.keyboard.press('Enter');
  await expect(usage.getByRole('region')).toBeHidden();
  await usage.screenshot({ path: testInfo.outputPath(`usage-collapsed-${theme}-${width}.png`) });
  await page.evaluate(() => { window.location.hash = 'radius-elevation'; });
  const cards = await page.locator('.ds-radius-grid > .ds-doc-card').evaluateAll(nodes => nodes.map(node => {
    const { width, height, top } = node.getBoundingClientRect(); return { width, height, top };
  }));
  expect(cards).toHaveLength(4);
  expect(Math.max(...cards.map(card => card.width)) - Math.min(...cards.map(card => card.width))).toBeLessThan(1);
  expect(Math.max(...cards.map(card => card.height)) - Math.min(...cards.map(card => card.height))).toBeLessThan(1);
  expect(new Set(cards.map(card => card.top)).size).toBe(width <= 640 ? 4 : 2);
  await page.screenshot({ path: testInfo.outputPath(`radius-${theme}-${width}.png`) });
  await page.evaluate(() => { window.location.hash = 'overview'; });
  await page.screenshot({ path: testInfo.outputPath(`overview-${theme}-${width}.png`) });
});

test('skip link, reduced motion, forced colors and zoom retain navigation', async ({ page }, testInfo) => {
  await page.goto('/design-system');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/design-system#service-gradients');
  await expect(page.locator('.ds-site-header')).toHaveCSS('backdrop-filter', 'none');
  const canvasColor = await page.evaluate(() => {
    const sample = document.createElement('span'); sample.style.color = 'Canvas'; document.body.append(sample);
    const color = getComputedStyle(sample).color; sample.remove(); return color;
  });
  await expect(page.locator('.ds-site-header')).toHaveCSS('background-color', canvasColor);
  await page.screenshot({ path: testInfo.outputPath('forced-colors.png') });
  await expect(page.locator('#service-gradients-title')).toBeVisible();
  // CSS zoom checks text and control reflow; a halved viewport checks the layout
  // breakpoint behavior used by browser zoom, separately from device pixel ratio.
  await page.setViewportSize({ width: 720, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; window.location.hash = 'overview'; });
  await page.screenshot({ path: testInfo.outputPath('zoom-200.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(await page.locator('#overview-title').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});
