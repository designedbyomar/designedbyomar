import React from 'react';
import tokenSource from './design-tokens.css?raw';
import { readTokenDefinitions, TOKEN_FAMILIES } from './design-system-token-roles.mjs';
import { CopyButton, DocCard } from './design-system-primitives.jsx';
import { Disclosure } from './ui/disclosure.jsx';

export const TokenTheme = React.createContext('dark');
const TOKEN_MAPS = { light: readTokenDefinitions(tokenSource), dark: readTokenDefinitions(tokenSource, 'dark') };
export const TokenValue = ({ name }) => {
  const theme = React.useContext(TokenTheme);
  return <code data-token-value={name}>{TOKEN_MAPS[theme][name]}</code>;
};

export const TokenReference = () => {
  const theme = React.useContext(TokenTheme);
  const entries = Object.entries(TOKEN_MAPS[theme]);
  const families = [...TOKEN_FAMILIES, ['Other roles', /./]];
  const assigned = new Set();
  return <div className="ds-detail-stack">{families.map(([title, pattern]) => {
    const tokens = entries.filter(([name]) => !assigned.has(name) && pattern.test(name));
    tokens.forEach(([name]) => assigned.add(name));
    if (!tokens.length) return null;
    return <Disclosure key={title} heading={`${title} (${tokens.length})`} headingLevel={3}>
      <dl className="ds-token-reference">{tokens.map(([name, value]) => <div key={name}>
        <dt><code>{name}</code><CopyButton value={name} label={`Copy ${name}`} /></dt>
        <dd><code>{value}</code></dd>
      </div>)}</dl>
    </Disclosure>;
  })}</div>;
};

const TYPE_ROLES = [
  ['Display hero', '--font-size-hero-title', '--font-sans', '--font-weight-semibold', '--tracking-display', '--line-height-tight', 'Complex systems. Clear products.'],
  ['Page title', '--font-size-page-title', '--font-sans', '--font-weight-semibold', '--tracking-display', '--line-height-compact', 'Selected work.'],
  ['Case-study heading', '--font-size-case-heading', '--font-sans', '--font-weight-semibold', '--tracking-heading', '--line-height-compact', 'Make the decision clear.'],
  ['Card title', '--font-size-heading-lg', '--font-sans', '--font-weight-semibold', '--tracking-display', '--line-height-normal', 'Management Portal'],
  ['Body large', '--font-size-body-xl', '--font-sans', '--font-weight-regular', null, '--line-height-looser', 'Lead with the problem, the decision, and the impact.'],
  ['Body', '--font-size-body-lg', '--font-sans', '--font-weight-regular', null, '--line-height-relaxed-plus', 'Use body copy for explanations and supporting detail.'],
  ['Body small', '--font-size-body-md', '--font-sans', '--font-weight-regular', null, '--line-height-relaxed', 'Compact supporting text.'],
  ['Button / link', '--font-size-body-md', '--font-sans', '--font-weight-medium', null, '--line-height-button', 'Get in touch'],
  ['Mono body', '--font-size-mono-lg', '--font-mono', '--font-weight-regular', null, '--line-height-relaxed', 'src/design-tokens.css'],
  ['Mono label', '--font-size-label-md', '--font-mono', '--font-weight-medium', '--tracking-label', '--line-height-solid', 'FOUNDATIONS'],
];
export const TypographyExamples = () => <div className="ds-typography-map">{TYPE_ROLES.map(([role, size, family, weight, tracking, lineHeight, sample]) =>
  <div className="ds-typo-row" key={role}><div className="ds-typo-row__meta"><h3>{role}</h3><p><code>{size}</code><br /><TokenValue name={size} /></p></div>
    <div className="ds-typo-row__sample" style={{ fontSize: `var(${size})`, fontFamily: `var(${family})`, fontWeight: `var(${weight})`, letterSpacing: tracking ? `var(${tracking})` : 'normal', lineHeight: `var(${lineHeight})` }}>{sample}</div>
  </div>)}</div>;

export const SpacingExamples = () => <div className="ds-two-column">{[['UI band', 'space', 8], ['Layout band', 'layout', 4]].map(([title, prefix, count]) =>
  <DocCard key={prefix} title={title}><div className="ds-token-bars">{Array.from({ length: count }, (_, i) => `--${prefix}-${i + 1}`).map(token =>
    <div className="ds-token-bar" key={token}><div className="ds-token-bar__label"><code>{token}</code><TokenValue name={token} /></div><div className="ds-token-bar__track"><span style={{ width: `var(${token})` }} /></div></div>
  )}</div></DocCard>)}</div>;

export const RadiusExamples = () => <div className="ds-radius-grid">{[
  ['Controls', '--radius-standard', '--shadow-ring'], ['Panels', '--radius-comfort', '--shadow-card-subtle'], ['Media', '--radius-image', '--shadow-card-subtle'], ['Inquiry form', '--radius-xl', '--shadow-card-full'],
].map(([label, radius, shadow]) => <DocCard key={radius} title={label}>
  <div className="ds-surface-example">
    <div className="ds-radius-sample" style={{ borderRadius: `var(${radius})`, boxShadow: `var(${shadow})` }}><TokenValue name={radius} /></div>
    <code>{radius}</code><code>{shadow}</code>
  </div>
</DocCard>)}</div>;

export const OpacityExamples = () => <div className="ds-two-column" data-audit-example="foundation-specimens">
  <DocCard title="Opacity" meta="Emphasis and overlays"><div className="ds-opacity-stack">{['--opacity-8', '--opacity-18', '--opacity-35', '--opacity-60'].map(token => <span key={token} style={{ '--specimen-opacity': `var(${token})` }}>{token}</span>)}</div><p>Keep text opaque; apply opacity to the background or decoration.</p></DocCard>
  <DocCard title="Layering" meta="Positioned surfaces"><dl className="ds-definition-list">{['--z-dropdown', '--z-sticky', '--z-fixed', '--z-modal', '--z-tooltip', '--z-consent'].map(token => <div key={token}><dt><code>{token}</code></dt><dd><TokenValue name={token} /></dd></div>)}</dl><p>Layer values operate inside stacking contexts. The consent banner has a separate production role.</p></DocCard>
</div>;

export const MotionTokens = () => <div className="ds-two-column">{[['Durations', ['--duration-fastest', '--duration-fast', '--duration-base', '--duration-slow', '--duration-slowest-xxl']], ['Easing', ['--easing-ease-out', '--easing-ease-in-out', '--easing-ease-linear']]].map(([title, tokens]) => <DocCard key={title} title={title}><dl className="ds-definition-list">{tokens.map(token => <div key={token}><dt><code>{token}</code></dt><dd><TokenValue name={token} /></dd></div>)}</dl></DocCard>)}</div>;
