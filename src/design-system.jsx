import React from 'react';
import ReactDOM from 'react-dom/client';
import './design-system-page.css';
import {
  AppIcon,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Box,
  ChevronDown,
  Menu,
  Moon,
  Palette,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sun,
  Type,
  X,
  Zap,
} from './ui-icons.jsx';
import { footerAlienStyles, FooterArrival } from './footer-alien.jsx';
import { Galaxy } from './galaxy.jsx';
import {
  Button,
  CopyButton,
  DocCard,
  ExampleFrame,
  IconButton,
  SectionHeader,
  TokenSwatch,
} from './design-system-primitives.jsx';

const NAV_GROUPS = [
  {
    title: 'Home',
    icon: BookOpen,
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'what-it-powers', label: 'What it powers' },
      { id: 'quick-links', label: 'Quick links' },
    ],
  },
  {
    title: 'Foundations',
    icon: Palette,
    items: [
      { id: 'foundations', label: 'Foundations overview' },
      { id: 'color', label: 'Color' },
      { id: 'typography', label: 'Typography' },
      { id: 'spacing', label: 'Spacing' },
      { id: 'radius-elevation', label: 'Radius and elevation' },
      { id: 'blur', label: 'Blur' },
      { id: 'motion-tokens', label: 'Motion tokens' },
    ],
  },
  {
    title: 'Components',
    icon: Box,
    items: [
      { id: 'components', label: 'Components overview' },
      { id: 'buttons', label: 'Buttons' },
      { id: 'cards-accordions', label: 'Cards and accordions' },
      { id: 'copy-actions', label: 'Copy actions' },
      { id: 'navigation-drawers', label: 'Navigation and drawers' },
      { id: 'cookie-banner', label: 'Cookie banner' },
    ],
  },
  {
    title: 'Patterns',
    icon: Search,
    items: [
      { id: 'patterns', label: 'Patterns overview' },
      { id: 'hero-system', label: 'Hero system' },
      { id: 'case-study-covers', label: 'Case-study covers' },
      { id: 'footer-system', label: 'Footer system' },
      { id: 'privacy-consent', label: 'Privacy and consent' },
    ],
  },
  {
    title: 'Motion',
    icon: Zap,
    items: [
      { id: 'motion', label: 'Motion overview' },
      { id: 'alien-arrival', label: 'Alien arrival' },
      { id: 'pixel-orbit', label: 'Pixel orbit' },
      { id: 'hover-reveal', label: 'Hover and reveal' },
      { id: 'reduced-motion', label: 'Reduced motion' },
    ],
  },
  {
    title: 'Content',
    icon: Type,
    items: [
      { id: 'content', label: 'Voice and tone' },
      { id: 'case-study-anatomy', label: 'Case-study anatomy' },
      { id: 'metadata-labels', label: 'Labels and metadata' },
      { id: 'microcopy', label: 'Microcopy' },
    ],
  },
  {
    title: 'Accessibility',
    icon: ShieldCheck,
    items: [
      { id: 'accessibility', label: 'Accessibility overview' },
      { id: 'focus-keyboard', label: 'Focus and keyboard' },
      { id: 'contrast-touch', label: 'Contrast and touch' },
    ],
  },
  {
    title: 'Resources',
    icon: BookOpen,
    items: [
      { id: 'resources', label: 'Source files' },
      { id: 'audit-notes', label: 'Audit notes' },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

const COLOR_GROUPS = [
  {
    title: 'Core and workflow',
    tokens: [
      ['Omar Black', '--color-omar-black', 'Core black'],
      ['White', '--color-white', 'Core white'],
      ['Develop Blue', '--color-develop-blue', 'Develop workflow accent'],
      ['Preview Pink', '--color-preview-pink', 'Preview workflow accent'],
      ['Ship Red', '--color-ship-red', 'Ship workflow accent'],
      ['Link', '--color-link', 'Inline and navigational links'],
      ['Focus', '--color-focus', 'Keyboard focus outline'],
      ['Status Online', '--color-status-online', 'Availability status dot'],
    ],
  },
  {
    title: 'Gray scale',
    tokens: [
      ['Gray 900', '--color-gray-900', 'Theme-aware strongest neutral'],
      ['Gray 600', '--color-gray-600', 'Theme-aware secondary neutral'],
      ['Gray 500', '--color-gray-500', 'Theme-aware tertiary neutral'],
      ['Gray 400', '--color-gray-400', 'Disabled neutral'],
      ['Gray 100', '--color-gray-100', 'Rules and low-contrast surfaces'],
      ['Gray 50', '--color-gray-50', 'Quiet page and card surface'],
    ],
  },
  {
    title: 'Semantic surfaces',
    tokens: [
      ['Page Background', '--bg-page', 'Theme page surface'],
      ['Subtle Surface', '--bg-subtle', 'Quiet panels and hover fills'],
      ['Primary Text', '--fg-primary', 'Headings and primary controls'],
      ['Secondary Text', '--fg-secondary', 'Body copy and secondary labels'],
      ['Tertiary Text', '--fg-tertiary', 'Metadata and mono labels'],
      ['Disabled Text', '--fg-disabled', 'Disabled and unavailable states'],
      ['On Dark', '--fg-on-dark', 'Text on inverted dark/light fills'],
    ],
  },
];

const TYPOGRAPHY_ROWS = [
  ['Display hero', 'Geist Sans', 'clamp(44px, 7vw, 88px)', '600', '-0.04em', '0.96', 'Complex systems. Clear products.'],
  ['Section heading', 'Geist Sans', 'clamp(32px, 4.2vw, 56px)', '600', '-0.04em', '1.05', 'Questions founders and hiring teams usually ask.'],
  ['Sub-heading', 'Geist Sans', '32px', '600', '-0.04em', '1.25', 'A longer version, for the curious.'],
  ['Card title', 'Geist Sans', '24px', '600', '-0.04em', '1.33', 'Management Portal'],
  ['Body large', 'Geist Sans', '18px', '400', '0', '1.8', 'Lead with the product problem, the decision, and the impact.'],
  ['Body', 'Geist Sans', '16px', '400', '0', '1.55', 'Use body copy for explanations, details, and section support.'],
  ['Body small', 'Geist Sans', '14px', '400', '0', '1.5', 'Use small copy for compact supporting text.'],
  ['Body semibold', 'Geist Sans', '16px', '600', '-0.02em', '1.5', 'Use semibold for emphasis inside compact panels.'],
  ['Button / link', 'Geist Sans', '14px', '500', '0', '1.43', 'Get in touch'],
  ['Caption', 'Geist Sans', '11px', '500', '0.04em', '1.33', 'Built across startups, scaleups, and enterprise teams.'],
  ['Micro', 'Geist Sans', '10px', '500', '0.08em', '1.33', 'INDEXABLE ROUTE'],
  ['Mono body', 'Geist Mono', '14px', '400', '0', '1.5', 'src/design-tokens.css'],
  ['Mono label', 'Geist Mono', '12px', '500', '0.08em', '1', 'FOUNDATIONS'],
];

const SPACE_TOKENS = [
  ['--space-1', '4px'],
  ['--space-2', '8px'],
  ['--space-3', '12px'],
  ['--space-4', '16px'],
  ['--space-5', '20px'],
  ['--space-6', '24px'],
  ['--space-7', '32px'],
  ['--space-8', '40px'],
];

const LAYOUT_TOKENS = [
  ['--layout-1', '48px'],
  ['--layout-2', '64px'],
  ['--layout-3', '96px'],
  ['--layout-4', '120px'],
];

const BLUR_TOKENS = [
  ['--blur-subtle', 'blur(4px)'],
  ['--blur-base', 'blur(6px)'],
  ['--blur-medium', 'blur(10px)'],
  ['--blur-strong', 'blur(12px)'],
  ['--blur-heavy', 'blur(16px)'],
];

const POWER_ITEMS = [
  ['Homepage', 'Hero hierarchy, proof points, selected work, and contact rhythm.'],
  ['Case studies', 'Cover cards, browser shells, metrics, page sections, and metadata.'],
  ['Navigation', 'Sticky header, mobile menu, logo mark, and footer utility links.'],
  ['Motion', 'Alien arrival, pixel orbit, loader mark, reveal, and hover behaviors.'],
  ['Consent', 'Cookie banner, privacy route, and analytics disclosure patterns.'],
  ['Workflow', 'Public repo documentation for AI-assisted design-engineering work.'],
  ['Content', 'Portfolio voice, labels, CTA language, and case-study structure.'],
  ['Accessibility', 'Focus, keyboard behavior, contrast, touch targets, and reduced motion.'],
];

const COMPONENT_GUIDANCE = [
  ['Action hierarchy', 'Use primary once per local decision area. Secondary supports alternate actions. Quiet actions stay text-first for low-emphasis commands.'],
  ['Icon-only controls', 'Use only when the icon is familiar or the control has a clear label/title. Keep the 44px hit area.'],
  ['Cards', 'Use cards for repeatable items or framed examples, not for every page section. Avoid nested card structures.'],
  ['Accordions', 'Use accordions when the user is scanning a known set of questions or sections. Keep ARIA state and focus order explicit.'],
  ['Cookie banner', 'Keep privacy copy short, clear, and non-alarming. Consent controls must remain visible and keyboard reachable.'],
];

const MOTION_ROWS = [
  ['Alien arrival', 'Narrative signature. UFO arrives, beam pulses, alien lands, then the UFO exits.'],
  ['Pixel orbit', 'Ambient canvas motif. It supports the hero mood without blocking reading.'],
  ['Loader mark', 'Geometric logo bounce. Used sparingly for initial orientation.'],
  ['Reveal on scroll', 'Soft opacity and translate settle. Disabled under reduced motion.'],
  ['Hover treatments', 'Small lift, color shift, or line travel. Never rely on hover for meaning.'],
];

const QUICK_LINK_CARDS = [
  ['Foundations', '#foundations', 'Tokens, type, color, spacing, and surface rules.', Palette],
  ['Components', '#components', 'Buttons, cards, accordions, copy controls, and navigation.', Box],
  ['Patterns', '#patterns', 'Production compositions for heroes, covers, footer, and consent.', Search],
  ['Motion', '#motion', 'Alien arrival, canvas motifs, reveal, hover, and reduced motion.', Zap],
  ['Accessibility', '#accessibility', 'Focus, keyboard, contrast, touch targets, and motion safety.', ShieldCheck],
];

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduced;
};

const useActiveSection = () => {
  const [activeId, setActiveId] = React.useState('overview');

  React.useEffect(() => {
    const sections = ALL_NAV_ITEMS
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveId(visible.target.id);
    }, { rootMargin: '-22% 0px -64% 0px', threshold: [0.1, 0.2, 0.4] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return activeId;
};

const NavLogo = ({ href = '/' }) => {
  const [key, setKey] = React.useState(0);
  const shapeStyle = (delay) => ({
    transformBox: 'fill-box',
    transformOrigin: 'bottom center',
    animation: key > 0 ? `navShapeBounce var(--duration-nav) var(--easing-ease-out-bouncy) ${delay}ms both` : 'none',
    fill: 'var(--fg-primary)',
  });

  return (
    <a
      href={href}
      className="ds-nav-logo"
      onMouseEnter={() => setKey((value) => value + 1)}
      aria-label="designedbyomar"
    >
      <svg key={key} width="86" height="18" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z" style={shapeStyle(0)} />
        <path d="M39.9286 0H21.5V18H39.9286V0Z" style={shapeStyle(55)} />
        <path d="M53.75 0L64.5 18H43L53.75 0Z" style={shapeStyle(110)} />
        <path d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z" style={shapeStyle(165)} />
      </svg>
    </a>
  );
};

const SignalGradientDefs = () => (
  <svg width="0" height="0" className="ds-signal-gradient-defs" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="ds-signal-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--color-ship-red)" />
        <stop offset="50%" stopColor="var(--color-preview-pink)" />
        <stop offset="100%" stopColor="var(--color-develop-blue)" />
      </linearGradient>
    </defs>
  </svg>
);

const SignalGradientIcon = ({ icon, size = 24, className = '' }) => (
  <AppIcon
    icon={icon}
    size={size}
    stroke="url(#ds-signal-icon-gradient)"
    className={`ds-signal-gradient-icon ${className}`.trim()}
  />
);

const ContactSurfaceCard = ({ href, label, body, icon }) => (
  <a href={href} className="ds-contact-surface-card">
    <span className="ds-contact-surface-card__icon">
      <SignalGradientIcon icon={icon} size={24} />
    </span>
    <span className="mono-label ds-contact-surface-card__label">{label}</span>
    <span className="ds-contact-surface-card__body">{body}</span>
  </a>
);

const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <IconButton
      icon={isDark ? Moon : Sun}
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    />
  );
};

const SideNavigation = ({ activeId, onNavigate, testId }) => {
  const [openGroups, setOpenGroups] = React.useState(() => (
    NAV_GROUPS.reduce((groups, group) => ({ ...groups, [group.title]: true }), {})
  ));

  const toggleGroup = (title) => {
    setOpenGroups((groups) => ({ ...groups, [title]: !groups[title] }));
  };

  return (
    <nav aria-label="Design system sections" data-sidebar-mode="collapsible" data-testid={testId}>
      {NAV_GROUPS.map((group) => {
        const isOpen = Boolean(openGroups[group.title]);
        const groupId = `ds-nav-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        return (
          <div className="ds-nav-group" key={group.title}>
            <button
              type="button"
              className="ds-nav-category"
              aria-expanded={isOpen}
              aria-controls={groupId}
              onClick={() => toggleGroup(group.title)}
            >
              <span className="ds-nav-category__label">
                <AppIcon icon={group.icon} size={16} />
                <span>{group.title}</span>
              </span>
              <AppIcon icon={ChevronDown} size={16} className="ds-nav-category__chevron" />
            </button>
            <div id={groupId} className="ds-nav-group__items" hidden={!isOpen}>
              {group.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={item.id === activeId ? 'is-active' : undefined}
                  onClick={onNavigate}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

const AlienReplayDemo = ({
  className = '',
  signature = false,
  ufoSize = '1.9em',
  alienSize = '1.35em',
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [played, setPlayed] = React.useState(false);
  const [runId, setRunId] = React.useState(0);

  React.useEffect(() => {
    setPlayed(false);
    const timer = window.setTimeout(() => setPlayed(true), reducedMotion ? 0 : 520);
    return () => window.clearTimeout(timer);
  }, [runId, reducedMotion]);

  const replay = () => setRunId((value) => value + 1);

  return (
    <div
      className={`ds-hero-alien ${className}`.trim()}
      {...(signature ? {
        'data-design-system-alien': 'signature',
        'data-reduced-motion': reducedMotion ? 'true' : 'false',
        'data-framed': 'false',
      } : {})}
    >
      <div className="ds-hero-alien__stage">
        <FooterArrival key={runId} played={played} ufoSize={ufoSize} alienSize={alienSize} />
      </div>
      <button
        type="button"
        className="ds-icon-button ds-replay-button"
        aria-label="Replay animation"
        title="Replay animation"
        onClick={replay}
      >
        <AppIcon icon={RefreshCcw} size={18} />
      </button>
    </div>
  );
};

const AlienSignature = () => (
  <AlienReplayDemo
    signature
    className="ds-hero-alien--signature"
    ufoSize="1.35em"
    alienSize="1.05em"
  />
);

const BackToTopButton = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('overview');
      const threshold = hero ? Math.max(360, hero.offsetTop + hero.offsetHeight * 0.65) : 480;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      className={`ds-icon-button ds-back-to-top${visible ? ' is-visible' : ''}`}
      aria-label="Back to top"
      title="Back to top"
      onPointerDown={scrollToTop}
    >
      <AppIcon icon={ArrowUp} size={18} />
    </button>
  );
};

const TopBar = ({ theme, setTheme, mobileOpen, setMobileOpen }) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`ds-site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="ds-site-header__inner">
        <div className="ds-site-header__brand">
          <NavLogo />
          <a href="/" className="ds-back-link">
            <AppIcon icon={ArrowLeft} size={13} />
            Back to site
          </a>
        </div>
        <div className="ds-site-header__actions">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button
            type="button"
            className="ds-icon-button ds-mobile-nav-trigger"
            aria-label={mobileOpen ? 'Close design system navigation' : 'Open design system navigation'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <AppIcon icon={mobileOpen ? X : Menu} size={17} />
          </button>
          <a href="/#contact" className="ds-header-cta">Get in touch</a>
        </div>
      </div>
    </header>
  );
};

const TypographyRow = ({ role, family, size, weight, tracking, lineHeight, sample }) => (
  <div className="ds-typo-row">
    <div className="ds-typo-row__meta">
      <h3>{role}</h3>
      <p>{family} / {size} / {weight} / {tracking} / {lineHeight}</p>
    </div>
    <div
      className="ds-typo-row__sample"
      style={{
        fontFamily: family === 'Geist Mono' ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: size,
        fontWeight: weight,
        letterSpacing: tracking,
        lineHeight,
        textTransform: role === 'Micro' || role === 'Mono label' ? 'uppercase' : 'none',
      }}
    >
      {sample}
    </div>
  </div>
);

const TokenBar = ({ token, value, scale = 1 }) => (
  <div className="ds-token-bar">
    <div className="ds-token-bar__label">
      <span>{token}</span>
      <span>{value}</span>
    </div>
    <div className="ds-token-bar__track">
      <span style={{ width: `${Number.parseInt(value, 10) * scale}px` }} />
    </div>
  </div>
);

const BlurTokenCard = ({ token, value }) => (
  <DocCard title={token} meta={value}>
    <div className="ds-blur-demo">
      <div className="ds-blur-demo__backdrop" />
      <div className="ds-blur-demo__pane" style={{ backdropFilter: `var(${token})`, WebkitBackdropFilter: `var(${token})` }}>
        <span>{token}</span>
      </div>
    </div>
  </DocCard>
);

const FAQAccordionDemo = () => {
  const [openIndex, setOpenIndex] = React.useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const items = [
    ['When should this accordion pattern be used?', 'Use it for short, scan-friendly groups where each label clearly predicts the hidden content.'],
    ['How does it match production?', 'It mirrors the FAQ rhythm: rounded item shell, full-width button, chevron rotation, and grid-row reveal.'],
  ];

  return (
    <div className="ds-faq-demo" style={{ width: '100%' }}>
      {items.map(([question, answer], index) => {
        const isOpen = openIndex === index;
        const answerId = `ds-accordion-answer-${index}`;
        const buttonId = `ds-accordion-question-${index}`;
        return (
          <div key={question} className={`faq-item${isOpen ? ' is-open' : ''}`} data-open={isOpen ? 'true' : 'false'}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span>{question}</span>
              <AppIcon icon={ChevronDown} size={18} />
            </button>
            <div className="ds-faq-demo__panel" style={{
              gridTemplateRows: isOpen ? '1fr' : '0fr',
              transition: reducedMotion ? 'none' : undefined,
            }}>
              <div id={answerId} role="region" aria-labelledby={buttonId} className="faq-answer" style={{ opacity: isOpen ? 1 : 0, transition: reducedMotion ? 'none' : undefined }}>
                <p>{answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HomeSection = () => (
  <>
    <section id="overview" className="ds-section ds-hero" aria-labelledby="overview-title">
      <h1 id="overview-title">designedbyomar Design System</h1>
      <div className="ds-hero-intro">
        <p>
          The system powers Omar Tavarez's portfolio, case-study storytelling, interaction patterns,
          motion language, and public design-engineering workflow.
        </p>
        <AlienSignature />
      </div>
      <div id="quick-links" className="ds-quick-links" aria-label="Quick links">
        {QUICK_LINK_CARDS.map(([label, href, body, icon]) => (
          <ContactSurfaceCard key={label} href={href} label={label} body={body} icon={icon} />
        ))}
      </div>
    </section>

    <section id="what-it-powers" className="ds-section" aria-labelledby="what-it-powers-title">
      <SectionHeader eyebrow="Home" title="What it powers">
        A practical map of where the system shows up in production, from the homepage to route metadata and privacy surfaces.
      </SectionHeader>
      <div className="ds-power-strip">
        {POWER_ITEMS.map(([title, body]) => (
          <DocCard key={title} title={title}>
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>
  </>
);

const FoundationsSection = () => (
  <>
    <section id="foundations" className="ds-section" aria-labelledby="foundations-title">
      <SectionHeader eyebrow="Foundations" title="Shared foundations">
        The portfolio and this documentation surface now share the same token source for theme, color, type, spacing, depth, opacity, motion, and responsive rhythm.
      </SectionHeader>
      <div className="ds-card-grid">
        {[
          ['Token source', 'src/design-tokens.css is the shared implementation source for the main site and this page.'],
          ['Theme model', 'Light and dark themes remap semantic foreground, surface, accent, shadow, and ring values.'],
          ['Audit rule', 'Documentation should describe values already used in production, not invent a parallel system.'],
        ].map(([title, body]) => (
          <DocCard key={title} title={title} meta="Foundation rule">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    <section id="color" className="ds-section" aria-labelledby="color-title">
      <SectionHeader eyebrow="Foundations" title="Color">
        Semantic neutrals carry most of the interface. Develop blue, preview pink, and ship red mark workflow states and signature motion.
      </SectionHeader>
      <div className="ds-token-stack">
        {COLOR_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mono-label ds-token-group-label">{group.title}</div>
            <div className="ds-token-grid">
              {group.tokens.map(([name, token, value]) => (
                <TokenSwatch key={token} name={name} token={token} value={value} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    <section id="typography" className="ds-section" aria-labelledby="typography-title">
      <SectionHeader eyebrow="Foundations" title="Typography">
        Geist Sans handles editorial hierarchy. Geist Mono handles labels, metadata, source references, and implementation-adjacent copy.
      </SectionHeader>
      <div className="ds-typography-map">
        {TYPOGRAPHY_ROWS.map(([role, family, size, weight, tracking, lineHeight, sample]) => (
          <TypographyRow key={role} role={role} family={family} size={size} weight={weight} tracking={tracking} lineHeight={lineHeight} sample={sample} />
        ))}
      </div>
    </section>

    <section id="spacing" className="ds-section" aria-labelledby="spacing-title">
      <SectionHeader eyebrow="Foundations" title="Spacing">
        UI spacing uses compact steps. Layout spacing uses larger bands for page rhythm and section separation.
      </SectionHeader>
      <div className="ds-two-column">
        <DocCard title="UI band" meta="Component spacing">
          <div className="ds-token-bars">
            {SPACE_TOKENS.map(([token, value]) => (
              <TokenBar key={token} token={token} value={value} scale={5} />
            ))}
          </div>
        </DocCard>
        <DocCard title="Layout band" meta="Section rhythm">
          <div className="ds-token-bars">
            {LAYOUT_TOKENS.map(([token, value]) => (
              <TokenBar key={token} token={token} value={value} scale={2} />
            ))}
          </div>
        </DocCard>
      </div>
    </section>

    <section id="radius-elevation" className="ds-section" aria-labelledby="radius-elevation-title">
      <SectionHeader eyebrow="Foundations" title="Radius and elevation">
        Radius stays restrained. Shadow-as-border creates definition without heavy outlines or decorative framing.
      </SectionHeader>
      <div className="ds-card-grid">
        {[
          ['Standard controls', '--radius-standard / 6px', 'Buttons, links, and compact controls.'],
          ['Comfort panels', '--radius-comfort / 8px', 'Cards, accordions, and panels.'],
          ['Image shells', '--radius-image / 12px', 'Case covers, media, and framed previews.'],
        ].map(([title, meta, body]) => (
          <DocCard key={title} title={title} meta={meta}>
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    <section id="blur" className="ds-section" aria-labelledby="blur-title">
      <SectionHeader eyebrow="Foundations" title="Blur">
        Blur tokens are used for sticky headers, overlays, drawers, and polished glassy surfaces where the content underneath should remain implied.
      </SectionHeader>
      <div className="ds-card-grid">
        {BLUR_TOKENS.map(([token, value]) => (
          <BlurTokenCard key={token} token={token} value={value} />
        ))}
      </div>
    </section>

    <section id="motion-tokens" className="ds-section" aria-labelledby="motion-tokens-title">
      <SectionHeader eyebrow="Foundations" title="Motion tokens">
        Durations and easing keep interactions crisp. Motion should orient the reader, not compete with the work.
      </SectionHeader>
      <div className="ds-two-column">
        <DocCard title="Durations" meta="Timing scale">
          <pre className="ds-code">{`--duration-fastest: 120ms
--duration-fast-mid: 160ms
--duration-base: 220ms
--duration-slow: 300ms
--duration-slowest-xxl: 600ms`}</pre>
        </DocCard>
        <DocCard title="Easing" meta="Motion curve">
          <pre className="ds-code">{`--easing-ease-out:
cubic-bezier(0.16, 1, 0.3, 1)

--easing-ease-in-out:
cubic-bezier(0.4, 0, 0.2, 1)`}</pre>
        </DocCard>
      </div>
    </section>
  </>
);

const ComponentsSection = () => (
  <>
    <section id="components" className="ds-section" aria-labelledby="components-title">
      <SectionHeader eyebrow="Components" title="Core primitives">
        V1 extracts documentation-ready primitives first. Larger production patterns remain documented here and can be pulled into a shared library later.
      </SectionHeader>
      <div className="ds-card-grid">
        {COMPONENT_GUIDANCE.map(([title, body]) => (
          <DocCard key={title} title={title} meta="Usage guidance">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    <section id="buttons" className="ds-section" aria-labelledby="buttons-title">
      <SectionHeader eyebrow="Components" title="Buttons">
        Buttons keep a stable 44px hit area, concise labels, visible focus, and clear hierarchy.
      </SectionHeader>
      <ExampleFrame label="Variants and states">
        <Button>Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="quiet">Quiet Action</Button>
        <Button disabled>Disabled</Button>
        <IconButton icon={ArrowUpRight} label="Open external link" />
      </ExampleFrame>
    </section>

    <section id="cards-accordions" className="ds-section" aria-labelledby="cards-accordions-title">
      <SectionHeader eyebrow="Components" title="Cards and accordions">
        Cards frame repeated items. Accordions reduce scanning load when content has clear labels and predictable expansion behavior.
      </SectionHeader>
      <div className="ds-two-column">
        <DocCard title="Card anatomy" meta="Structure">
          <ul>
            <li>Mono metadata when it adds useful context.</li>
            <li>Concise title with strong hierarchy.</li>
            <li>Body copy that explains the decision or usage.</li>
          </ul>
        </DocCard>
        <ExampleFrame label="Accordion behavior">
          <FAQAccordionDemo />
        </ExampleFrame>
      </div>
      <div className="ds-two-column ds-component-pattern-docs">
        <DocCard title="Contact Surface Card" meta="Production card">
          <p>
            Contact Surface Cards use a quiet surface, subtle shadow, 2px lift, and animated gradient hover ring
            that matches the production contact section. Focus-visible receives the same
            ring and lift, while reduced motion keeps the ring static and removes the lift.
          </p>
          <ExampleFrame label="Contact-style link">
            <ContactSurfaceCard href="#cards-accordions" label="Resources" body="A framed link surface with spatial hover." icon={BookOpen} />
          </ExampleFrame>
        </DocCard>
        <DocCard title="Signal Gradient Icon" meta="Icon style">
          <p>
            Signal Gradient Icons use the At a Glance gradient stroke across Lucide icons.
            Use them when an icon acts as a signature signal, not as generic decoration.
          </p>
          <ExampleFrame label="Gradient stroke">
            <SignalGradientIcon icon={Palette} />
            <SignalGradientIcon icon={Box} />
            <SignalGradientIcon icon={Zap} />
          </ExampleFrame>
        </DocCard>
      </div>
    </section>

    <section id="copy-actions" className="ds-section" aria-labelledby="copy-actions-title">
      <SectionHeader eyebrow="Components" title="Copy actions">
        Copy controls are used for tokens, source paths, and contact details. The copied state is temporary and does not resize the control.
      </SectionHeader>
      <ExampleFrame label="Copy controls">
        <CopyButton value="--color-develop-blue" label="Copy develop blue token" />
        <CopyButton value="omar@designedbyomar.com" label="Copy email address" />
      </ExampleFrame>
    </section>

    <section id="navigation-drawers" className="ds-section" aria-labelledby="navigation-drawers-title">
      <SectionHeader eyebrow="Components" title="Navigation and drawers">
        Production navigation stays sparse. Drawers are reserved for dense work lists and long-form about content.
      </SectionHeader>
      <div className="ds-two-column">
        <ExampleFrame label="Header mark">
          <NavLogo />
        </ExampleFrame>
        <DocCard title="Interaction notes" meta="Navigation">
          <ul>
            <li>Desktop keeps Work, About, Contact, and a direct CTA.</li>
            <li>Mobile collapses into theme toggle plus menu trigger.</li>
            <li>Drawers need focus trap, escape close, and focus restore.</li>
          </ul>
        </DocCard>
      </div>
    </section>

    <section id="cookie-banner" className="ds-section" aria-labelledby="cookie-banner-title">
      <SectionHeader eyebrow="Components" title="Cookie banner">
        Consent copy should be direct and calm. The banner must never block the core portfolio experience.
      </SectionHeader>
      <ExampleFrame label="Consent shell">
        <div style={{ maxWidth: 520, padding: 20, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card-full)', background: 'var(--bg-page)' }}>
          <p style={{ margin: '0 0 16px', color: 'var(--fg-secondary)', lineHeight: 1.6 }}>
            This site uses simple analytics cookies to improve the experience. No ads, no creepy tracking, no selling your data.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="secondary">Decline</Button>
            <Button>Accept</Button>
          </div>
        </div>
      </ExampleFrame>
    </section>
  </>
);

const PatternsSection = () => (
  <>
    <section id="patterns" className="ds-section" aria-labelledby="patterns-title">
      <SectionHeader eyebrow="Patterns" title="Production patterns">
        Patterns document how primitives become recognizable portfolio surfaces.
      </SectionHeader>
      <div className="ds-card-grid">
        {[
          ['Hero system', 'Editorial type, portrait media, pixel orbit, and focused proof copy.'],
          ['Case-study covers', 'Gradient shell, browser-window preview, metadata chip, and controlled hover motion.'],
          ['Footer system', 'Brand block, link columns, signoff motion, and design-system link.'],
        ].map(([title, body]) => (
          <DocCard key={title} title={title} meta="Pattern">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    {[
      ['hero-system', 'Hero system', 'The hero is the primary portfolio signal. It should explain Omar clearly before the motion or media gets attention.'],
      ['case-study-covers', 'Case-study covers', 'Covers sell the work quickly, then step aside. Metadata and tags must stay readable at small widths.'],
      ['footer-system', 'Footer system', 'The footer is a structured utility system with a small signature animation, not a loose collection of links.'],
      ['privacy-consent', 'Privacy and consent', 'Privacy surfaces use plain language and preserve the current analytics behavior.'],
    ].map(([id, title, body]) => (
      <section key={id} id={id} className="ds-section" aria-labelledby={`${id}-title`}>
        <SectionHeader eyebrow="Patterns" title={title}>{body}</SectionHeader>
      </section>
    ))}
  </>
);

const MotionSection = ({ theme }) => (
  <>
    <section id="motion" className="ds-section" aria-labelledby="motion-title">
      <SectionHeader eyebrow="Motion" title="Motion">
        Motion is a signature layer for orientation, feedback, and personality. It must respect reduced-motion preferences across canvas, animation, and scroll behavior.
      </SectionHeader>
      <div className="ds-card-grid">
        {MOTION_ROWS.map(([title, body]) => (
          <DocCard key={title} title={title} meta="Motion behavior">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    <section id="alien-arrival" className="ds-section" aria-labelledby="alien-arrival-title">
      <SectionHeader eyebrow="Motion" title="Alien arrival">
        The alien animation is the restrained signature moment: noticeable enough to be memorable, small enough to preserve the portfolio's seriousness.
      </SectionHeader>
      <ExampleFrame label="Signature animation">
        <AlienReplayDemo className="ds-alien-arrival-demo" ufoSize="1.8em" alienSize="1.35em" />
      </ExampleFrame>
    </section>

    <section id="pixel-orbit" className="ds-section" aria-labelledby="pixel-orbit-title">
      <SectionHeader eyebrow="Motion" title="Pixel orbit">
        The square-particle field supports the visual identity while remaining pointer-safe and reduced-motion aware.
      </SectionHeader>
      <ExampleFrame label="Canvas motif">
        <div
          data-design-system-galaxy-theme={theme}
          style={{ position: 'relative', width: '100%', minHeight: 220, overflow: 'hidden', borderRadius: 'var(--radius-image)' }}
        >
          <Galaxy density={1.45} speed={0.55} style="pixel" accent="workflow" theme={theme} />
        </div>
      </ExampleFrame>
    </section>

    {[
      ['hover-reveal', 'Hover and reveal', 'Hover should clarify that something is interactive. Reveal should establish reading rhythm, not delay comprehension.'],
      ['reduced-motion', 'Reduced motion', 'Every moving treatment needs a stable equivalent. Canvas pauses, translate effects are skipped, and the final state remains readable.'],
    ].map(([id, title, body]) => (
      <section key={id} id={id} className="ds-section" aria-labelledby={`${id}-title`}>
        <SectionHeader eyebrow="Motion" title={title}>{body}</SectionHeader>
      </section>
    ))}
  </>
);

const ContentAccessibilityResources = () => (
  <>
    <section id="content" className="ds-section" aria-labelledby="content-title">
      <SectionHeader eyebrow="Content" title="Voice and tone">
        Copy should sound specific, senior, and human. Avoid inflated claims, generic AI phrasing, and unverifiable outcomes.
      </SectionHeader>
      <div className="ds-card-grid">
        {[
          ['Case-study anatomy', 'Challenge, approach, outcome, metrics, role, tags, and adjacent work links.'],
          ['Labels and metadata', 'Short mono labels improve scanning when they identify useful context.'],
          ['Microcopy', 'Use plain verbs. Keep privacy, consent, and contact copy direct.'],
        ].map(([title, body]) => (
          <DocCard key={title} title={title} meta="Content rule">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    {[
      ['case-study-anatomy', 'Case-study anatomy', 'Each case study should make the product problem, Omar’s role, decisions, and result easy to evaluate.'],
      ['metadata-labels', 'Labels and metadata', 'Metadata should add orientation: year, client, role, workflow, route, or source. Do not decorate with empty labels.'],
      ['microcopy', 'Microcopy', 'Small copy should reduce doubt. Use exact labels for buttons, links, privacy actions, and copy controls.'],
    ].map(([id, title, body]) => (
      <section key={id} id={id} className="ds-section" aria-labelledby={`${id}-title`}>
        <SectionHeader eyebrow="Content" title={title}>{body}</SectionHeader>
      </section>
    ))}

    <section id="accessibility" className="ds-section" aria-labelledby="accessibility-title">
      <SectionHeader eyebrow="Accessibility" title="Accessibility">
        WCAG AA is the floor. Focus states, keyboard flows, contrast, touch targets, and reduced motion are design-system requirements, not QA cleanup.
      </SectionHeader>
      <div className="ds-card-grid">
        {[
          ['Focus and keyboard', 'Every interactive element needs visible focus. Drawers and accordions require explicit state.'],
          ['Contrast and touch', 'Body text must meet AA contrast. Controls keep a 44px minimum target.'],
          ['Reduced motion', 'All animation, canvas, and scroll-driven behaviors need non-motion equivalents.'],
        ].map(([title, body]) => (
          <DocCard key={title} title={title} meta="Accessibility rule">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    {[
      ['focus-keyboard', 'Focus and keyboard', 'The side nav uses real links, while production drawers should trap focus, close on Escape, and restore focus to the trigger.'],
      ['contrast-touch', 'Contrast and touch', 'Tokenized foreground colors preserve contrast across themes, while buttons and icon buttons keep minimum touch size.'],
    ].map(([id, title, body]) => (
      <section key={id} id={id} className="ds-section" aria-labelledby={`${id}-title`}>
        <SectionHeader eyebrow="Accessibility" title={title}>{body}</SectionHeader>
      </section>
    ))}

    <section id="resources" className="ds-section" aria-labelledby="resources-title">
      <SectionHeader eyebrow="Resources" title="Source files">
        These files are the implementation source of truth for the system.
      </SectionHeader>
      <div className="ds-card-grid">
        {[
          ['src/design-tokens.css', 'Shared token definitions for both app entries.'],
          ['src/design-system-primitives.jsx', 'Core documentation primitives extracted for v1.'],
          ['src/design-system.jsx', 'The public design-system documentation surface.'],
          ['src/main.jsx', 'Production portfolio usage and route behavior.'],
          ['DESIGN.md', 'Agent-readable design rules and review expectations.'],
          ['docs/ai-workflow.md', 'How AI-assisted work is bounded and reviewed.'],
        ].map(([title, body]) => (
          <DocCard key={title} title={title} meta="Source">
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
    </section>

    <section id="audit-notes" className="ds-section" aria-labelledby="audit-notes-title">
      <SectionHeader eyebrow="Resources" title="Audit notes">
        This audit cross-checks the documentation against src/design-tokens.css, src/main.jsx, src/footer-alien.jsx, and src/galaxy.jsx.
      </SectionHeader>
      <div className="ds-two-column">
        <DocCard title="Documented now" meta="Audit result">
          <ul>
            <li>Color, typography, spacing, radius, elevation, blur, motion, and theme foundations.</li>
            <li>Buttons, icon buttons, cards, FAQ-style accordions, copy controls, navigation, drawers, and cookie consent.</li>
            <li>Alien arrival, pixel orbit, loader mark, reveal behavior, hover treatments, and reduced-motion expectations.</li>
          </ul>
        </DocCard>
        <DocCard title="Future work" meta="Remaining gaps">
          <ul>
            <li>Extract production nav, footer, contact cards, drawers, cookie banner, and case-card components into a shared library.</li>
            <li>Add prop tables and usage constraints once production primitives are shared instead of documented only.</li>
            <li>Add visual regression snapshots for the design-system route across desktop, tablet, and mobile.</li>
          </ul>
        </DocCard>
      </div>
    </section>
  </>
);

const DesignSystem = () => {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('omar.theme') || 'dark');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeId = useActiveSection();

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('omar.theme', theme);
  }, [theme]);

  const handleNavigate = () => setMobileOpen(false);

  return (
    <div className="ds-shell">
      <style>{footerAlienStyles}</style>
      <SignalGradientDefs />
      <TopBar theme={theme} setTheme={setTheme} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="ds-mobile-panel" hidden={!mobileOpen}>
        <SideNavigation
          activeId={activeId}
          onNavigate={handleNavigate}
        />
      </div>
      <div className="ds-layout">
        <aside className="ds-sidebar">
          <SideNavigation
            activeId={activeId}
            onNavigate={handleNavigate}
            testId="design-system-sidebar"
          />
        </aside>
        <main className="ds-content">
          <HomeSection />
          <FoundationsSection />
          <ComponentsSection />
          <PatternsSection />
          <MotionSection theme={theme} />
          <ContentAccessibilityResources />
        </main>
      </div>
      <BackToTopButton />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DesignSystem />);
