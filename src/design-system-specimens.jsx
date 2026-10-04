import { InquiryForm } from './ui/inquiry-form.jsx';
import { emptyInquiry, validateInquiry } from './content/inquiry.mjs';
import { ServiceRateGroup } from './ui/service-list.jsx';
import React from 'react';
import { Button, IconButton, LinkButton, CopyButton } from './ui/controls.jsx';
import { SiteNavigation } from './ui/navigation.jsx';
import { ContactCard } from './ui/contact-card.jsx';
import { SiteFooter } from './ui/site-footer.jsx';
import { ConsentBanner } from './ui/consent-banner.jsx';
import { CaseStudyTag, CaseStudyMetadata } from './ui/case-study-meta.jsx';
import { CaseCard } from './ui/case-card.jsx';
import { CaseStudyBody } from './ui/case-study-body.jsx';
import { AboutStack, AboutLightbox } from './ui/about-media.jsx';
import { AskPanel } from './ui/ask-panel.jsx';
import { GitHubActivity } from './github-contributions.jsx';
import { useViewportWidth, usePrefersReducedMotion } from './ui/hooks.js';
import { ABOUT_PHOTOS } from './content/about-photos.js';
import { CASE_STUDIES } from './case-studies.js';
import { ArrowUpRight } from './ui-icons.jsx';

const ACTIVITY_FIXTURE = {
  totalContributions: 4,
  profileUrl: 'https://github.com/designedbyomar',
  range: { from: '2026-09-27', to: '2026-10-03' },
  months: [{ name: 'Sep', firstDay: '2026-09-27', totalWeeks: 1 }],
  weeks: [{ firstDay: '2026-09-27', days: Array.from({ length: 7 }, (_, weekday) => ({
    date: `2026-${weekday < 4 ? '09' : '10'}-${String(weekday < 4 ? 27 + weekday : weekday - 3).padStart(2, '0')}`,
    weekday, count: weekday === 2 ? 4 : 0, level: weekday === 2 ? 4 : 0,
  })) }],
};
const ANSWER_FIXTURE = {
  id: 'specimen', question: 'How is this component connected?',
  answer: 'This labelled example renders the same Ask panel used by the portfolio. Its local callbacks use fixture data and do not contact a model.',
  sources: ['athena-ds'],
};
const PROMPT_FIXTURES = ['Show a reviewed answer', 'Show a drafted reply', 'Show a loading state'].map((question, i) => ({ ...ANSWER_FIXTURE, id: `example-${i}`, question }));

const StatePicker = ({ value, onChange, states }) => (
  <label className="ds-specimen-state-picker">Example state
    <select value={value} onChange={event => onChange(event.target.value)}>
      {states.map(state => <option key={state}>{state}</option>)}
    </select>
  </label>
);

const NavigationSpecimen = () => {
  const width = useViewportWidth();
  const [theme, setTheme] = React.useState('dark');
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const goSection = () => event => { event.preventDefault(); close(); };
  return <div className="ds-specimen-navigation" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
    <SiteNavigation theme={theme} setTheme={setTheme} isMobile={width <= 900} isMobileMenuOpen={open}
      closeMobileMenu={close} onToggleMenu={() => setOpen(value => !value)}
      handleLogoClick={event => { event.preventDefault(); close(); }} goSection={goSection} />
  </div>;
};

const ConsentSpecimen = () => {
  const [action, setAction] = React.useState('No choice made');
  const reducedMotion = usePrefersReducedMotion();
  const width = useViewportWidth();
  return <>
    <ConsentBanner embedded isNarrow={width <= 640} prefersReducedMotion={reducedMotion}
      onAccept={() => setAction('Example: accepted')} onDecline={() => setAction('Example: declined')}
      onPrivacy={() => setAction('Example: privacy requested')} />
    <p role="status">{action}. Your analytics consent is unchanged.</p>
  </>;
};

const AboutSpecimen = () => {
  const [photo, setPhoto] = React.useState(null);
  const open = React.useCallback(value => setPhoto(value), []);
  const close = React.useCallback(() => setPhoto(null), []);
  return <div className="ds-specimen-about">
    <AboutStack images={['portrait', 'boxing', 'dj']} photos={ABOUT_PHOTOS} onOpen={open} />
    {photo && <AboutLightbox photo={photo} onClose={close} />}
  </div>;
};

const AskSpecimen = () => {
  const [state, setState] = React.useState('idle');
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const sentinelRef = React.useRef(null);
  const suggestionListRef = React.useRef(null);
  const focusRevealedRef = React.useRef(false);
  const reduced = usePrefersReducedMotion();
  const phase = state === 'loading' ? 'looking' : state === 'drafting' ? 'drafting' : null;
  return <>
    <StatePicker value={state} onChange={setState} states={['idle', 'reviewed', 'drafted', 'loading', 'drafting', 'unavailable']} />
    <AskPanel query={query} setQuery={setQuery} canSubmit={Boolean(query.trim())}
      submit={event => { event.preventDefault(); setState('reviewed'); }} prefersReducedMotion={reduced}
      result={state === 'reviewed' ? ANSWER_FIXTURE : null} linkable={false} copyState="idle"
      phase={phase} drafted={state === 'drafted' ? { text: 'This is a labelled drafted-state fixture, not a live model response.', sources: [] } : null}
      missed={state === 'unavailable'} suggestions={PROMPT_FIXTURES} showingFollowUps={false}
      collapsible={false} suggestionsExpanded={expanded} setSuggestionsExpanded={setExpanded}
      focusRevealedRef={focusRevealedRef} fullSet={PROMPT_FIXTURES} show={answer => setState(['reviewed', 'drafted', 'loading'][PROMPT_FIXTURES.indexOf(answer)])}
      sentinelRef={sentinelRef} suggestionListRef={suggestionListRef} studies={CASE_STUDIES} idPrefix="ds-" />
  </>;
};

const GitHubSpecimen = () => {
  const [status, setStatus] = React.useState('ready');
  return <>
    <StatePicker value={status} onChange={setStatus} states={['ready', 'loading', 'error']} />
    <GitHubActivity state={{ status, data: status === 'ready' ? ACTIVITY_FIXTURE : null }} profileUrl="https://github.com/designedbyomar" />
  </>;
};

const InquirySpecimen = () => {
  const id = React.useId();
  const [values, setValues] = React.useState(emptyInquiry);
  const [status, setStatus] = React.useState('idle');
  const [errors, setErrors] = React.useState({});
  const summaryRef = React.useRef(null);
  return <>
    <StatePicker value={status} onChange={setStatus} states={['idle', 'sending', 'sent', 'error']} />
    <InquiryForm idPrefix={`ds-inquiry-${id}`} values={values} errors={errors} status={status}
      message={status === 'error' ? 'Example failure. Nothing was sent.' : ''} ready summaryRef={summaryRef}
      onChange={(name, value) => { setValues(previous => ({ ...previous, [name]: value })); setErrors({}); setStatus('idle'); }}
      onSubmit={event => { event.preventDefault(); const checked = validateInquiry(values); setErrors(checked.errors); setStatus(checked.valid ? 'sent' : 'error'); if (!checked.valid) requestAnimationFrame(() => summaryRef.current?.focus()); }}
      verification={<p className="mono-label">Verification fixture · no Cloudflare request</p>} />
  </>;
};

const COVERAGE = [
  ['Buttons, icon buttons, links and copy controls', '#buttons', 'Variant, label, disabled state and interaction callbacks'],
  ['Logo and theme toggle', '#navigation-drawers', 'Destination, current theme and theme callback'],
  ['Site navigation and mobile menu', '#navigation-drawers', 'Menu state, destinations and navigation callbacks'],
  ['Contact cards', '#cards-accordions', 'Label, value, destination, optional copy value and event callback'],
  ['Consent banner', '#cookie-banner', 'Accept, decline and privacy callbacks; persistence stays in the app'],
  ['Case cards', '#case-study-covers', 'Study record, featured/wide variants and optional video'],
  ['Case-study body blocks', '#case-study-blocks', 'Normalized blocks, accent and optional heading ID prefix'],
  ['Ask panel', '#ask', 'Controlled query, response state, refs and interaction callbacks'],
  ['GitHub activity', '#github-activity', 'Loading/ready/error state, data and profile callback'],
  ['About photo tiles, stacks and lightbox', '#about-media', 'Photo records, open/close callbacks and focus restoration'],
  ['Service cards and groups', '#cards-accordions', 'Content, semantic heading level and unique heading ID prefix; no side effects'],
  ['Select-only dropdown', '#inquiry-form', 'Controlled value, options, placeholder, label ID, required/disabled/error state and change callback; keyboard navigation and themed popup'],
  ['Inquiry form and labelled fields', '#inquiry-form', 'Controlled values, errors, status, verification slot and change/submit callbacks; no requests'],
  ['Site footer', '#footer-system', 'Navigation and analytics callbacks'],
];

export default function ProductionSpecimen({ kind }) {
  const specimenId = React.useId();
  const [serviceVariant, setServiceVariant] = React.useState('projects');
  let content;
  switch (kind) {
    case 'services': content = <><StatePicker value={serviceVariant} onChange={setServiceVariant} states={['audits', 'projects', 'ongoing']} /><ServiceRateGroup idPrefix={`ds-service-${specimenId}-`} headingLevel={3} group={{
      id: serviceVariant, title: 'Example service cards', description: 'Deterministic fixtures demonstrating fixed and starting prices.',
      services: [
        { id: 'fixed', name: 'Example review', price: '$2,500', timing: 'Approximately 3 business days.', description: 'A fixture showing a focused review.', bestFor: 'An example team with one defined flow.', includes: 'Review, findings, and a walkthrough.', limits: 'One agreed flow; implementation excluded.' },
        { id: 'starting', name: 'Example project', price: 'From $12,000', timing: 'Approximately 2 weeks.', description: 'A fixture showing a scoped project.', bestFor: 'An example team with a defined problem.', includes: 'Agreed design work and handoff.', limits: 'Deliverables and revisions agreed in a proposal.' },
      ],
    }} /></>; break;
    case 'inquiry': content = <InquirySpecimen />; break;
    case 'navigation': content = <NavigationSpecimen />; break;
    case 'consent': content = <ConsentSpecimen />; break;
    case 'about': content = <AboutSpecimen />; break;
    case 'ask': content = <AskSpecimen />; break;
    case 'github': content = <GitHubSpecimen />; break;
    case 'contact': content = <ContactCard label="Email" value="omar@designedbyomar.com" href="mailto:omar@designedbyomar.com" copyValue="omar@designedbyomar.com" />; break;
    case 'case': content = <CaseCard c={CASE_STUDIES.find(study => study.id === 'athena-ds')} allowVideo={false} />; break;
    case 'footer': content = <SiteFooter onHome={() => {}} scrollToSection={() => {}} rootPrefix="/" />; break;
    case 'body': content = <><CaseStudyMetadata>Example role metadata</CaseStudyMetadata><CaseStudyTag>Example tag</CaseStudyTag><CaseStudyBody accent="var(--color-develop-blue)" idPrefix="ds-block-" blocks={[
      { type: 'heading', level: 2, text: 'Example body blocks' },
      { type: 'paragraph', text: 'This labelled specimen uses the production renderer. Page-specific storytelling remains authored content.' },
      { type: 'list', items: ['A shared list', 'Preserved semantic markup'] },
      { type: 'quote', text: 'A quote specimen.', attribution: 'Example attribution' },
      { type: 'callout', title: 'Example callout', items: ['Shared presentation, authored content'] },
      { type: 'image', ...ABOUT_PHOTOS.designsystem, caption: 'Athena design-system image specimen' },
      { type: 'gallery', images: [ABOUT_PHOTOS.drawings, ABOUT_PHOTOS.flyers] },
    ]} /></>; break;
    case 'controls': content = <><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="quiet">Quiet</Button><Button disabled>Disabled</Button><LinkButton href="#buttons">Link action</LinkButton><IconButton icon={ArrowUpRight} label="Example external action" /><CopyButton value="--space-4" label="Copy spacing token" /></>; break;
    case 'inventory': content = <>
      <ul>{COVERAGE.map(([name, href, contract]) => <li key={name}><a href={href}>{name}</a>: {contract}.</li>)}</ul>
      <p>The homepage hero, About page arrangement, services page composition and individual case-study page layouts stay page-specific compositions of shared building blocks. Their storytelling and placement are unique, not additional component variants.</p>
      <p>DocCard, SectionHeader, token swatches, shortcut cards and the legacy accordion are documentation utilities. They are not presented as production components.</p>
    </>; break;
    default: return null;
  }
  return <div className={`ds-production-specimen ds-production-specimen--${kind}`} data-production-specimen={kind}>
    {kind !== 'inventory' && <p className="mono-label">Production component · fixture demonstration</p>}
    {content}
  </div>;
}
