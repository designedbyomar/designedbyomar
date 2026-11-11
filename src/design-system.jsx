import { Disclosure } from './ui/disclosure.jsx';
import { DESIGN_SYSTEM_GROUPS, DESIGN_SYSTEM_SECTIONS, DESIGN_SYSTEM_BY_ID } from './content/design-system.mjs';
import { useDocumentationNavigation } from './design-system-navigation.jsx';
import { TokenTheme, TokenValue, TokenReference, TypographyExamples, SpacingExamples, RadiusExamples, OpacityExamples, MotionTokens } from './design-system-foundations.jsx';
import React from 'react';
import { NavLogo as SharedNavLogo, ThemeToggle } from './ui/brand.jsx';
import './ui/components.css';
const NavLogo = (props) => <SharedNavLogo href="/" className="ds-nav-logo" {...props} />;
const ProductionSpecimen = React.lazy(() => import('./design-system-specimens.jsx'));
const Specimen = ({ kind }) => <React.Suspense fallback={<p>Loading component example…</p>}><ProductionSpecimen kind={kind} /></React.Suspense>;
import ReactDOM from 'react-dom/client';
import './design-system-page.css';
import './github-contributions.css';
import {
  AppIcon,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Box,
  ChevronDown,
  Check,
  Clock,
  Copy,
  Menu,
  Palette,
  RefreshCcw,
  Search,
  ShieldCheck,
  Type,
  X,
  Zap,
} from './ui-icons.jsx';
import { AlienPixel, footerAlienStyles, FooterArrival } from './footer-alien.jsx';
import { Galaxy } from './galaxy.jsx';
import { onMediaChange } from './media-query.js';
import { LinkButton } from './ui/controls.jsx';
import {
  Button,
  CopyButton,
  DocCard,
  ExampleFrame,
  IconButton,
  SectionHeader,
  TokenSwatch,
} from './design-system-primitives.jsx';

const GROUP_ICONS = { book: BookOpen, palette: Palette, box: Box, search: Search, zap: Zap, type: Type, shield: ShieldCheck };
const NAV_GROUPS = DESIGN_SYSTEM_GROUPS.map(group => ({ ...group, icon: GROUP_ICONS[group.icon], items: group.sections }));

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
      ['Status Online', '--color-status-online', 'Positive status: inclusion checks and contribution levels'],
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

const POWER_ITEMS = [
  ['Homepage', 'Hero hierarchy, proof points, selected work, and contact rhythm.'],
  ['Services', 'Category gradients, service cards, engagement terms, and inquiry states.'],
  ['Case studies', 'Cover cards, browser shells, metrics, page sections, and metadata.'],
  ['Navigation', 'Sticky header, mobile menu, logo mark, and footer utility links.'],
  ['Motion', 'Alien arrival, pixel orbit, loader mark, reveal, and hover behaviors.'],
  ['Consent', 'Cookie banner, privacy route, and analytics disclosure patterns.'],
  ['Workflow', 'Public repo documentation for AI-assisted design-engineering work.'],
  ['Content', 'Portfolio voice, labels, CTA language, and case-study structure.'],
  ['Accessibility', 'Focus, keyboard behavior, contrast, touch targets, and reduced motion.'],
];

const QUICK_LINK_CARDS = NAV_GROUPS.filter(group => group.shortcut).map(group => [group.title, `#${group.sections[0].id}`, group.shortcut, group.icon]);

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync();
    return onMediaChange(query, sync);
  }, []);

  return reduced;
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

const DocShortcutCard = ({ href, label, body, icon }) => (
  <a href={href} className="ds-contact-surface-card">
    <span className="ds-contact-surface-card__icon">
      <SignalGradientIcon icon={icon} size={24} />
    </span>
    <span className="mono-label ds-contact-surface-card__label">{label}</span>
    <span className="ds-contact-surface-card__body">{body}</span>
  </a>
);

const SideNavigation = ({ activeId, request, onNavigate }) => {
  const [openGroups, setOpenGroups] = React.useState(() => ({ [DESIGN_SYSTEM_BY_ID[request.id]?.group || 'overview']: true }));
  React.useEffect(() => {
    const group = DESIGN_SYSTEM_BY_ID[request.id]?.group;
    if (group) setOpenGroups(previous => ({ ...previous, [group]: true }));
  }, [request]);
  return <nav aria-label="Design system sections" data-sidebar-mode="collapsible" data-testid="design-system-sidebar">
    {NAV_GROUPS.map(group => {
      const open = Boolean(openGroups[group.id]);
      const groupId = `ds-nav-${group.id}`;
      return <div className="ds-nav-group" key={group.id}>
        <button type="button" className="ds-nav-category" aria-expanded={open} aria-controls={groupId}
          data-current-group={DESIGN_SYSTEM_BY_ID[activeId]?.group === group.id}
          onClick={() => setOpenGroups(previous => ({ ...previous, [group.id]: !previous[group.id] }))}>
          <span className="ds-nav-category__label"><SignalGradientIcon icon={group.icon} size={16} /><span>{group.title}</span></span>
          <AppIcon icon={ChevronDown} size={16} className="ds-nav-category__chevron" />
        </button>
        <div id={groupId} className="ds-nav-group__items" hidden={!open}>{group.items.map(item =>
          <a key={item.id} href={`#${item.id}`} className={item.id === activeId ? 'is-active' : undefined}
            aria-current={item.id === activeId ? 'location' : undefined}
            onClick={event => { event.preventDefault(); onNavigate(item.id); }}>{item.title}</a>
        )}</div>
      </div>;
    })}
  </nav>;
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

const ORBIT_ICON_LIST = [Palette, Box, Search, Zap, ShieldCheck];
const ORBIT_ICON_HALF = 9; // half of 18px icon size

const PixelOrbitIcons = ({ theme = 'dark', showAlien = false }) => {
  const canvasBackRef = React.useRef(null);
  const canvasFrontRef = React.useRef(null);
  const iconRefs = React.useRef([]);
  const rafRef = React.useRef(0);
  const activeRef = React.useRef(false);

  React.useEffect(() => {
    activeRef.current = false;
    const canvasBack = canvasBackRef.current;
    const canvasFront = canvasFrontRef.current;
    if (!canvasBack || !canvasFront) return;
    const ctxBack = canvasBack.getContext('2d');
    const ctxFront = canvasFront.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const styles = getComputedStyle(document.documentElement);
    const token = (name, fb) => styles.getPropertyValue(name).trim() || fb;
    const fgPrimary  = token('--fg-primary',  theme === 'dark' ? '#ededed' : '#171717');
    const fgTertiary = token('--fg-tertiary', theme === 'dark' ? '#8f8f8f' : '#666666');
    const blue  = token('--color-develop-blue',  theme === 'dark' ? '#3291ff' : '#0a72ef');
    const pink  = token('--color-preview-pink',  theme === 'dark' ? '#ff3da0' : '#de1d8d');
    const red   = token('--color-ship-red',      theme === 'dark' ? '#ff6b60' : '#ff5b4f');
    const palette = [blue, pink, red, fgPrimary, fgTertiary];

    // Orbit tilted 135° counter-clockwise so "behind" particles land near "ar"
    const ROT = -135 * Math.PI / 180;
    const cosR = Math.cos(ROT); const sinR = Math.sin(ROT);

    let w = 0, h = 0, cx = 0, cy = 0, rMin = 0, rMax = 0;
    let inView = true;
    let pageVisible = document.visibilityState === 'visible';
    const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionMQ.matches;
    let last = performance.now();
    let tick = () => {};
    let particles = [];
    let iconParticles = [];

    // Rotate orbit point around canvas center
    const rot = (x, y) => [
      cx + cosR * (x - cx) - sinR * (y - cy),
      cy + sinR * (x - cx) + cosR * (y - cy),
    ];

    const mk = () => {
      const rp = Math.random(), ring = rp < 0.45 ? 0 : rp < 0.8 ? 1 : 2;
      const ringR = rMin + (rMax - rMin) * (ring === 0 ? 0.05 : ring === 1 ? 0.45 : 0.9);
      const r = ringR + (Math.random() - 0.5) * (rMax - rMin) * 0.22;
      const dir = Math.random() < 0.85 ? 1 : -1;
      const rs = ring === 0 ? 0.00055 : ring === 1 ? 0.00038 : 0.00024;
      return {
        a: Math.random() * Math.PI * 2, r,
        av: dir * rs * (0.7 + Math.random() * 0.8),
        tilt: 0.32 + Math.random() * 0.08,
        size: Math.random() < 0.55 ? 2 : Math.random() < 0.85 ? 3 : 4,
        color: palette[Math.floor(Math.random() * palette.length)],
        twinkle: Math.random() * Math.PI * 2,
        tv: 0.01 + Math.random() * 0.03,
      };
    };

    // Each icon is pinned to a distinct ring so their speeds never converge
    const ICON_RINGS = [
      { rFrac: 0.08, av: 0.00052, tilt: 0.30 },
      { rFrac: 0.88, av: 0.00024, tilt: 0.37 },
      { rFrac: 0.45, av: 0.00038, tilt: 0.33 },
      { rFrac: 0.20, av: 0.00047, tilt: 0.31 },
      { rFrac: 0.68, av: 0.00029, tilt: 0.35 },
    ];
    const rebuild = () => {
      particles = new Array(140).fill(0).map(() => mk());
      iconParticles = ORBIT_ICON_LIST.map((_, i) => {
        const cfg = ICON_RINGS[i];
        return {
          a: (i / ORBIT_ICON_LIST.length) * Math.PI * 2,
          r: rMin + (rMax - rMin) * cfg.rFrac,
          av: cfg.av,
          tilt: cfg.tilt,
        };
      });
    };

    const resize = () => {
      const rect = canvasBack.getBoundingClientRect();
      w = rect.width; h = rect.height;
      for (const [cv, ct] of [[canvasBack, ctxBack], [canvasFront, ctxFront]]) {
        cv.width = Math.floor(w * DPR); cv.height = Math.floor(h * DPR);
        ct.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
      cx = w / 2; cy = h * 0.50;
      rMin = Math.min(w, h) * 0.36; rMax = Math.min(w, h) * 0.57;
      rebuild();
    };

    const positionIcons = (dt) => {
      const speed = 0.55;
      for (let i = 0; i < iconParticles.length; i++) {
        const p = iconParticles[i];
        if (dt > 0) p.a += p.av * dt * speed;
        const [rx, ry] = rot(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r * p.tilt);
        const back = Math.sin(p.a) < 0;
        const el = iconRefs.current[i];
        if (el) {
          el.style.transform = `translate(${rx - ORBIT_ICON_HALF}px, ${ry - ORBIT_ICON_HALF}px)`;
          el.style.opacity = back ? '0.25' : '0.92';
          el.style.zIndex = back ? '0' : '2';
        }
      }
    };

    const updateRunning = () => {
      const shouldRun = inView && pageVisible && !reducedMotion;
      if (shouldRun === activeRef.current) return;
      activeRef.current = shouldRun;
      if (shouldRun) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        if (reducedMotion) {
          ctxBack.clearRect(0, 0, w, h); ctxFront.clearRect(0, 0, w, h);
          for (const p of particles) {
            const [rx, ry] = rot(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r * p.tilt);
            const back = Math.sin(p.a) < 0;
            const ctx = back ? ctxBack : ctxFront;
            ctx.globalAlpha = back ? 0.15 : 0.5;
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(rx - p.size / 2), Math.round(ry - p.size / 2), p.size, p.size);
          }
          ctxBack.globalAlpha = 1; ctxFront.globalAlpha = 1;
          positionIcons(0);
        }
      }
    };

    tick = (now) => {
      if (!activeRef.current) return;
      const dt = Math.min(40, now - last); last = now;
      const speed = 0.55;
      ctxBack.clearRect(0, 0, w, h); ctxFront.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.a += p.av * dt * speed; p.twinkle += p.tv;
        const [rx, ry] = rot(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r * p.tilt);
        const back = Math.sin(p.a) < 0;
        const ctx = back ? ctxBack : ctxFront;
        ctx.globalAlpha = Math.max(0, Math.min(1, (back ? 0.22 : 1) * (0.55 + Math.sin(p.twinkle) * 0.45)));
        ctx.fillStyle = p.color;
        const s = p.size * (back ? 0.85 : 1);
        ctx.fillRect(Math.round(rx - s / 2), Math.round(ry - s / 2), s, s);
      }
      ctxBack.globalAlpha = 1; ctxFront.globalAlpha = 1;
      positionIcons(dt);
      rafRef.current = requestAnimationFrame(tick);
    };

    const onMotionChange = (e) => { reducedMotion = e.matches; updateRunning(); };
    const stopWatchingMotion = onMediaChange(motionMQ, onMotionChange);
    resize();
    window.addEventListener('resize', resize);
    const observer = typeof IntersectionObserver === 'undefined' ? null
      : new IntersectionObserver((entries) => { inView = entries[0]?.isIntersecting ?? true; updateRunning(); }, { threshold: 0.05 });
    observer?.observe(canvasBack);
    const onVis = () => { pageVisible = document.visibilityState === 'visible'; updateRunning(); };
    document.addEventListener('visibilitychange', onVis);
    updateRunning();
    return () => {
      cancelAnimationFrame(rafRef.current);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      stopWatchingMotion();
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  const CV = { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'block' };
  return (
    <div className="ds-pixel-orbit" aria-hidden="true">
      <canvas ref={canvasBackRef} style={{ ...CV, zIndex: 0 }} />
      <canvas ref={canvasFrontRef} style={{ ...CV, zIndex: 2 }} />
      {ORBIT_ICON_LIST.map((icon, i) => (
        <span key={i} ref={(el) => { iconRefs.current[i] = el; }} className="ds-pixel-orbit__icon">
          <SignalGradientIcon icon={icon} size={18} />
        </span>
      ))}
      <span className={`ds-pixel-orbit__center${showAlien ? ' ds-pixel-orbit__center--alien' : ''}`}>
        {showAlien && <AlienPixel size="clamp(56px, 7vw, 84px)" title="" />}
      </span>
    </div>
  );
};

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
      onClick={scrollToTop}
    >
      <AppIcon icon={ArrowUp} size={18} />
    </button>
  );
};

const TopBar = ({ theme, setTheme, navOpen, onToggleNav, triggerRef }) => {
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
          <button
            type="button"
            className="ds-icon-button ds-mobile-nav-trigger"
            ref={triggerRef}
            aria-controls="ds-section-navigation"
            aria-label={navOpen ? 'Close design system navigation' : 'Open design system navigation'}
            aria-expanded={navOpen}
            onClick={onToggleNav}
          >
            <AppIcon icon={navOpen ? X : Menu} size={17} />
          </button>
          <NavLogo />
        </div>
        {/* Mirrors the site header. Plain hrefs rather than in-app scrolling: this page is a
            separate entry, and src/main.jsx already scrolls to a hash on arrival. */}
        <nav className="ds-site-header__nav" aria-label="Site">
          <a href="/work">Work</a>
          <a href="/design-system" aria-current="page">Design System</a>
          <a href="/about">About</a>
          <a href="/#faq">Ask</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div className="ds-site-header__actions">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <a className="ds-header-cta" href="/#contact">Get in touch</a>
        </div>
      </div>
    </header>
  );
};

const BlurTokenCard = ({ token }) => (
  <DocCard title={token} meta={<TokenValue name={token} />}>
    <div className="ds-blur-demo">
      <div className="ds-blur-demo__backdrop" />
      <div className="ds-blur-demo__pane" style={{ backdropFilter: `var(${token})`, WebkitBackdropFilter: `var(${token})` }}>
        <span>{token}</span>
      </div>
    </div>
  </DocCard>
);

const PatternPreview = ({ kind }) => (
  <div className={`ds-pattern-preview ds-pattern-preview--${kind}`} data-audit-example={`${kind}-pattern`}>
    <p className="mono-label">Documentation-only composition sketch</p>
    {kind === 'hero' && (
      <>
        <div className="mono-label">Hero system</div>
        <h3>Complex systems. Clear products.</h3>
        <p>Editorial type, proof copy, and signature motion stay in balance.</p>
      </>
    )}
    {kind === 'privacy' && (
      <>
        <p>This site uses simple analytics cookies to improve the experience.</p>
        <a href="/privacy">Read the production privacy policy</a>
      </>
    )}
  </div>
);

const AccessibilityPreview = ({ kind }) => (
  <div className={`ds-accessibility-preview ds-accessibility-preview--${kind}`} data-audit-example={`${kind}-accessibility`}>
    {kind === 'focus' ? (
      <>
        <button type="button">Focusable action</button>
        <span>Visible focus, 44px target, real button semantics.</span>
      </>
    ) : (
      <>
        <div>
          <strong>Primary text</strong>
          <span>Secondary copy remains readable across themes.</span>
        </div>
        <small>AA contrast floor</small>
      </>
    )}
  </div>
);

const FAQAccordionDemo = () => <div className="ds-faq-demo">
  <Disclosure heading="When should this accordion pattern be used?" headingLevel={3} defaultExpanded><p>Use it for scan-friendly sections where each heading clearly predicts the hidden content.</p></Disclosure>
  <Disclosure heading="Is this used on the portfolio?" headingLevel={3}><p>The services page uses this shared disclosure for engagement terms. Production Ask uses the shared AskPanel specimen below.</p></Disclosure>
</div>;

const Details = ({ heading = 'Usage and behavior', children }) => <Disclosure heading={heading} headingLevel={3}>{children}</Disclosure>;
const SourceLink = ({ path }) => <a href={`https://github.com/designedbyomar/designedbyomar/${path.endsWith('/') ? 'tree' : 'blob'}/main/${path}`}><code>{path}</code></a>;

const SECTION_RENDERERS = {
  'overview': ({ theme }) => <>
<div className="ds-hero-top">
        <div className="ds-hero-lede">
          <h1 id="overview-title" tabIndex={-1} className="ds-hero-title">
            <span className="ds-hero-title__line1">
              <span className="ds-hero-title__text">designedbyomar</span>
            </span>
            <span className="ds-hero-title__line2">Design System</span>
          </h1>
          <div className="ds-hero-intro">
            <p>
              {DESIGN_SYSTEM_BY_ID.overview.summary}
            </p>
          </div>
        </div>
        <div className="ds-hero-orbit-stage" aria-hidden="true">
          <PixelOrbitIcons theme={theme} showAlien />
        </div>
      </div>
      <div id="quick-links" tabIndex={-1} className="ds-quick-links" aria-label="Quick links">
        {QUICK_LINK_CARDS.map(([label, href, body, icon]) => (
          <DocShortcutCard key={label} href={href} label={label} body={body} icon={icon} />
        ))}
      </div>
  </>,
  'what-it-powers': () => <>
<div className="ds-power-strip">
        {POWER_ITEMS.map(([title, body]) => (
          <DocCard key={title} title={title}>
            <p>{body}</p>
          </DocCard>
        ))}
      </div>
  </>,
  'foundations': () => <>
<p className="ds-reading-copy">Use semantic roles such as <code>--fg-primary</code> and <code>--bg-page</code> together. Use palette colors for identity and decoration. <a href="#token-reference">Browse exact token values</a> when you need implementation detail.</p>
  </>,
  'color': () => <>
<div className="ds-token-stack">
        {COLOR_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mono-label ds-token-group-label">{group.title}</div>
            <div className="ds-token-grid">
              {group.tokens.map(([name, token, purpose]) => (
                <TokenSwatch key={token} name={name} token={token} value={<>{purpose}<br /><TokenValue name={token} /></>} />
              ))}
            </div>
          </div>
        ))}
      </div><p className="ds-reading-copy">Switch the page theme to compare mappings. The swatches show individual roles, not a guarantee that every foreground works on every background. Disabled text has a separate purpose from secondary text.</p>
  </>,
  'service-gradients': () => <>
<div className="ds-token-grid">
        {[
          ['audits', 'Audits', 'Red → pink'],
          ['projects', 'Projects', 'Pink → blue'],
          ['ongoing', 'Ongoing support', 'Blue → red'],
        ].map(([category, label, colors]) => <DocCard key={category} title={label} meta={colors}>
          <div className="ds-rate-gradient-swatch" style={{ background: `var(--gradient-rate-${category})` }} aria-hidden="true" />
          <div className="ds-rate-header-example" style={{ background: `var(--gradient-rate-${category})`, color: category === 'projects' ? 'var(--rate-header-project-foreground)' : 'var(--rate-header-foreground)' }}>{label}</div>
          <p><code>{`--gradient-rate-${category}`}</code></p>
          <CopyButton value={`var(--gradient-rate-${category})`} label={`Copy ${label} gradient token`} />
        </DocCard>)}
      </div><div className="ds-inquiry-gradient-example"><h3>Inquiry form edge</h3><div className="ds-rate-gradient-swatch" style={{ background: 'var(--gradient-inquiry-form)' }} /><code>--gradient-inquiry-form</code><CopyButton value="--gradient-inquiry-form" label="Copy inquiry form gradient token" /></div><Details><p>Audits and ongoing support use <code>--rate-header-foreground</code>; projects use <code>--rate-header-project-foreground</code>. Badges combine a fixed dark foreground with a 35% white background. Measure the combined foreground and gradient in both themes.</p></Details>
  </>,
  'typography': () => <>
<TypographyExamples />
  </>,
  'spacing': () => <>
<SpacingExamples />
  </>,
  'radius-elevation': () => <>
<RadiusExamples />
  </>,
  'foundation-specimens': () => <>
<OpacityExamples />
  </>,
  'blur': () => <>
<div className="ds-card-grid">{['--blur-subtle', '--blur-base', '--blur-medium', '--blur-strong', '--blur-heavy'].map(token => <BlurTokenCard key={token} token={token} />)}</div>
  </>,
  'components': () => <>
<p className="ds-reading-copy">Choose an existing component before inventing a new one. Each example identifies its production role; state controls and callbacks stay local to this page. <a href="#audit-notes">See the coverage inventory</a>.</p>
  </>,
  'buttons': () => <>
<ExampleFrame label="Variants and states">
        <Button>Primary Action</Button><LinkButton href="#contact-cards">Link action</LinkButton>
        <Button variant="secondary">Secondary Action</Button>
        <Button variant="quiet">Quiet Action</Button>
        <Button disabled>Disabled</Button>
        <IconButton icon={ArrowUpRight} label="Open external link" />
      </ExampleFrame>
  </>,
  'copy-actions': () => <>
<ExampleFrame label="Copy controls">
        <CopyButton value="--color-develop-blue" label="Copy develop blue token" />
        <CopyButton value="omar@designedbyomar.com" label="Copy email address" />
      </ExampleFrame>
  </>,
  'badges-tags': () => <>
<Specimen kind="badges" />
  </>,
  'form-fields': () => <>
<Specimen kind="fields" /><Details><p>FormField accepts field metadata, a value, error text, an ID prefix, a disabled state, and a change callback. Required labels stay visible; hints and errors use <code>aria-describedby</code>. Placeholders supplement labels.</p></Details>
  </>,
  'select-dropdowns': () => <>
<Specimen kind="select" /><Details><p>Arrow keys, Home/End, and typeahead move the active option. Enter or Space selects; Escape cancels; Tab commits and moves on. Outside dismissal preserves the previous selection. The menu opens above or below the field and keeps its active option visible. The component owns popup state; its caller owns the selected value.</p></Details>
  </>,
  'cards-accordions': () => <>
<ExampleFrame label="Shared disclosure · engagement terms"><FAQAccordionDemo /></ExampleFrame><Details><p>Disclosure accepts a heading, content, heading level, optional ID, and defaultExpanded. Its button controls a labelled region; hidden content is removed from keyboard and accessibility navigation. Toggling introduces no motion.</p></Details>
  </>,
  'contact-cards': () => <>
<Specimen kind="contact" /><Details><p>ContactCard accepts label, value, destination, optional copy value, and interaction callbacks. The shared ContactCard renders the production surface; reduced motion stops animated decoration. Booking and email have priority in the homepage contact layout, followed by profile and resume links.</p></Details>
  </>,
  'case-study-covers': () => <>
<ExampleFrame label="Production case-study card"><Specimen kind="case" /></ExampleFrame><Details><p>CaseCard accepts a study record, featured or wide presentation, optional video, and interaction callbacks. Metadata and tags remain readable on narrow screens. Video is disabled in this deterministic example.</p></Details>
  </>,
  'navigation-drawers': () => <>
<div className="ds-two-column">
        <ExampleFrame label="Production navigation · local callbacks">
          <Specimen kind="navigation" />
        </ExampleFrame>
        <Details heading="Navigation behavior">
          <ul>
            <li>Desktop keeps Work, Design System, About, Ask, Contact, and a direct CTA.</li>
            <li>Mobile collapses into theme toggle plus menu trigger.</li>
            <li>The mobile menu closes with Escape and when a destination is selected; the About lightbox traps focus and restores it on close.</li>
          </ul>
        </Details>
      </div>
  </>,
  'footer-system': () => <>
<ExampleFrame label="Production footer · local callbacks"><Specimen kind="footer" /></ExampleFrame>
  </>,
  'patterns': () => <>
<p className="ds-reading-copy">Read each pattern as a composition: what appears first, what changes with state, and what the reader can do next. The examples reuse production presentation; page controllers retain routing, analytics, storage, and network requests.</p>
  </>,
  'hero-system': () => <>
<ExampleFrame label="Page-specific composition sketch"><PatternPreview kind="hero" /></ExampleFrame><Details><p>The homepage pairs a clear statement of work with supporting copy, portrait media, and ambient motion. Its editorial placement stays in the homepage. This sketch illustrates hierarchy; it is not a shared hero component.</p></Details>
  </>,
  'case-study-blocks': () => <>
<Specimen kind="body" /><Details><p>CaseStudyBody accepts normalized authored blocks, an accent, and an optional heading-ID prefix. Keep heading levels meaningful inside the surrounding page. Images require descriptive alternative text; captions add context rather than repeating it.</p></Details>
  </>,
  'about-media': () => <>
<Specimen kind="about" /><Details><p>Photo tiles and stacks accept photo records and an open callback. The lightbox closes with Escape, traps focus, and returns it to the opening tile. Reduced motion disables photo float. Portrait art direction and About page arrangement remain page-specific.</p></Details>
  </>,
  'service-lists': () => <>
<Specimen kind="services" /><Details><p>ServiceRateCard and ServiceRateGroup accept content, category labels, semantic heading levels, unique ID prefixes, subgroup metadata, and an optional inquiry callback. Three desktop columns become two below 1054px and one below 640px. Ongoing pairs occupy the first two tracks. Production actions select a service and focus contact; this fixture reports a local selection.</p></Details>
  </>,
  'inquiry-form': () => <>
<Specimen kind="inquiry" /><Details><p>InquiryForm receives controlled values, errors, status, readiness, a verification slot, and change/submit callbacks. The controller owns configuration, verification, and email requests. This fixture never loads Cloudflare or sends email. The form uses an elevated card, a gradient top edge, and a full-width submit action. Its privacy link opens in a new tab with an accessible hint.</p></Details>
  </>,
  'ask': () => <>
<ExampleFrame label="Production Ask panel · labelled fixture states">
        <Specimen kind="ask" />
      </ExampleFrame>
      <Details heading="Answer states and behavior"><p>Suggested prompts and exact matches are answered locally. New questions may be routed to reviewed material or receive a labelled draft.</p><div className="ds-card-grid">
        <DocCard title="Prompts follow the reader" meta="Suggestions">
          Three prompts open the panel, with more behind one disclosure. After an answer,
          up to four related prompts help the reader explore further. Refusal answers remain
          available when asked for, but are not suggested.
        </DocCard>
        <DocCard title="Input first" meta="Order">
          The input comes first, followed by its character limit and privacy reminder, the
          source note, the answer, and related prompts. Questions over the shared 400-character
          limit remain editable and cannot be submitted; the endpoint rejects them without truncation.
        </DocCard>
        <DocCard title="One panel, two placements" meta="Composition">
          The same component renders as a section of the homepage and as the <code>/ask</code> page.
          On the page each reviewed answer takes the URL, so one can be sent to someone else; in the section
          it leaves the URL alone, or it would fight the <code>#faq</code> anchor the nav uses. The
          page also gives a case study somewhere to link back to — every citation leads out of the
          panel, and the reader needs a way back to asking.
        </DocCard>
        <DocCard title="Draft, do not redirect" meta="When nothing is written">
          A draft uses only the relevant case studies selected for the question. It is labelled
          unreviewed, and its citation links name the studies used in the reply. Without supporting
          material, the panel offers email instead of an unsupported answer.
        </DocCard>
        <DocCard title="Refuse rather than guess" meta="The governing rule">
          Missing information, connection failures, and usage limits have distinct messages.
          Connection failures offer a manual retry without clearing the question. Suggested questions
          and email stay available. The initial answer download also has loading, error, and retry states.
        </DocCard>
        <DocCard title="Approved only" meta="Content gate">
          Answers carry a review status and a fingerprint of the case studies they cite. Only approved
          answers reach the build, and an approved answer whose sources change fails the content tests
          — so it drops out rather than contradicting the page it links to.
        </DocCard>
        <DocCard title="Off the critical path" meta="Loading">
          The answer set is fetched when the section scrolls into view, not imported into the bundle.
          On /ask it loads immediately. An unavailable or empty answer set shows a retry and email fallback.
        </DocCard>
        <DocCard title="Accessibility" meta="Required behaviour">
          The answer region is <code>aria-live=&quot;polite&quot;</code> so a reply is announced without stealing
          focus. Every control clears 44px, the input is labelled, and no answer depends on motion.
        </DocCard>
      </div></Details>
  </>,
  'github-activity': () => <>
<ExampleFrame label="Production activity · deterministic fixture">
        <Specimen kind="github" />
      </ExampleFrame><Details><p>The production calendar uses a rolling-year snapshot from the same-origin endpoint. Its controller handles fetching and caching. GitHubActivity accepts status, data, a profile destination, and an optional interaction callback. This short deterministic fixture illustrates states, not real activity.</p></Details>
  </>,
  'cookie-banner': () => <>
<ExampleFrame label="Production consent banner · local callbacks">
        <Specimen kind="consent" />
      </ExampleFrame>
  </>,
  'privacy-consent': () => <>
<ExampleFrame label="Page-specific privacy composition"><PatternPreview kind="privacy" /></ExampleFrame><Details><p>Declining analytics must leave the portfolio usable. Production stores the visitor’s explicit choice; the banner specimen above changes only its own local message. Form and Ask copy explain their own data use near the action.</p></Details>
  </>,
  'motion': () => <>
<p className="ds-reading-copy">Use short feedback for controls and restrained signature effects for identity. Ambient effects should pause offscreen and when the tab is hidden. <a href="#reduced-motion">Provide a stable alternative</a> for every moving treatment.</p>
  </>,
  'motion-tokens': () => <>
<MotionTokens />
  </>,
  'logo-loader': () => <>
<ExampleFrame label="Production navigation logo · hover response"><NavLogo href="#logo-loader" onClick={event => event.preventDefault()} /></ExampleFrame><Details><p>The logo’s four shapes animate on hover using <code>--duration-nav</code>. Reduced motion keeps them still. The homepage-only LogoLoader uses a full-page opening state and rotating phrases; it is not a general-purpose loading indicator. It remains in <SourceLink path="src/main.jsx" />. Ask and GitHub loading states use their own status messages.</p></Details>
  </>,
  'alien-arrival': () => <>
<ExampleFrame label="Signature animation">
        <AlienReplayDemo className="ds-alien-arrival-demo" ufoSize="1.8em" alienSize="1.35em" />
      </ExampleFrame>
  </>,
  'pixel-orbit': ({ theme }) => <>
<ExampleFrame label="Canvas motif">
        <div
          data-design-system-galaxy-theme={theme}
          style={{ position: 'relative', width: '100%', minHeight: 220, overflow: 'hidden', borderRadius: 'var(--radius-image)' }}
        >
          <Galaxy density={1.45} speed={0.55} style="pixel" accent="workflow" theme={theme} />
        </div>
      </ExampleFrame>
  </>,
  'hover-reveal': () => <>
<ExampleFrame label="Shared action · hover and keyboard focus"><LinkButton href="#contact-cards" variant="secondary">Explore contact cards</LinkButton></ExampleFrame><ul className="ds-reading-copy"><li>Use hover to confirm a link or action. Never reveal essential text only on hover.</li><li>Keyboard focus receives a visible outline even when the pointer is elsewhere.</li><li>Contact borders and card lifts stop under reduced motion; content remains in its final readable position.</li></ul>
  </>,
  'reduced-motion': () => <>
<ExampleFrame label="Stable fallback"><div className="ds-reduced-motion-preview" data-audit-example="reduced-motion-pattern"><span /><strong>No movement required</strong><p>Canvas movement stops, animated decoration settles, and anchor navigation is immediate. Try changing the system preference while this page is open.</p></div></ExampleFrame>
  </>,
  'content': () => <>
<div className="ds-two-column"><DocCard title="Prefer evidence"><p>“The team adopted shared components across the product.”</p></DocCard><DocCard title="Avoid inflated claims"><p>“A revolutionary system that transformed everything.”</p></DocCard></div><p className="ds-reading-copy">These are writing examples, not claims about a project. Use only outcomes supported by the authored case study.</p>
  </>,
  'case-study-anatomy': () => <>
<ol className="ds-reading-copy"><li><strong>Context:</strong> the product, audience, and constraint.</li><li><strong>Role:</strong> Omar’s responsibility and collaborators.</li><li><strong>Problem:</strong> what was difficult and why it mattered.</li><li><strong>Decisions:</strong> the chosen approach and its tradeoffs.</li><li><strong>Outcome:</strong> supported results and remaining limitations.</li><li><strong>Next step:</strong> related work or a relevant question.</li></ol>
  </>,
  'metadata-labels': () => <>
<dl className="ds-definition-list"><div><dt>Role</dt><dd>Describe the actual responsibility, such as “Product design,” without implying ownership of the entire project.</dd></div><div><dt>Period and client</dt><dd>Use the authored year and organization; keep labels short and consistent across cards and detail pages.</dd></div><div><dt>Source</dt><dd>Link to the specific case study that supports an answer. Avoid an unlabeled “Learn more.”</dd></div></dl>
  </>,
  'microcopy': () => <>
<dl className="ds-definition-list"><div><dt>Action</dt><dd>“Discuss Product Audit” names the service. “Submit” does not explain the outcome.</dd></div><div><dt>Validation</dt><dd>“Enter a valid email address.” Identify what needs fixing, beside the field.</dd></div><div><dt>Recovery</dt><dd>“Try loading again” offers a clear next step. Keep entered text intact when something fails.</dd></div><div><dt>Confirmation</dt><dd>Report what actually happened. A clipboard action should say “Copied” only after success.</dd></div></dl>
  </>,
  'accessibility': () => <>
<ul className="ds-reading-copy"><li>Use real links, buttons, labels, and headings.</li><li>Check every state with the keyboard, not just the default screenshot.</li><li>Test both themes, reduced motion, forced colors, and zoom.</li><li>Validate the complete composition: accessible pieces can still form a confusing page.</li></ul>
  </>,
  'focus-keyboard': () => <>
<ExampleFrame label="Focus and keyboard specimen"><AccessibilityPreview kind="focus" /></ExampleFrame><ul className="ds-reading-copy"><li>Use the skip link to bypass repeated navigation.</li><li>Escape closes the documentation menu and returns to its trigger; choosing a section focuses its heading.</li><li>A lightbox contains focus until it closes, then restores the opening tile.</li><li>Disclosure buttons expose expanded state; collapsed controls leave the Tab order.</li></ul>
  </>,
  'contrast-touch': () => <>
<ExampleFrame label="Contrast and touch specimen"><AccessibilityPreview kind="contrast" /></ExampleFrame><ul className="ds-reading-copy"><li>Normal text needs at least 4.5:1 contrast; large text needs 3:1.</li><li>Essential control boundaries and focus indicators need 3:1 against adjacent colors.</li><li>The site targets 44px controls. Visual icon size can be smaller than its hit area.</li><li>Measure gradients across their full range and translucent fills against their actual backgrounds.</li><li>Disabled controls are distinct from readable secondary copy. Do not rely on color alone for errors or status.</li></ul>
  </>,
  'forms-announcements': () => <>
<dl className="ds-definition-list"><div><dt>Field errors</dt><dd>Use visible error text, <code>aria-invalid</code>, and <code>aria-describedby</code>. The error summary links to fields and receives focus after a failed submission.</dd></div><div><dt>Results</dt><dd>Use a polite status announcement for sending and success. Ask announces its answer without stealing focus from the input.</dd></div><div><dt>Verification</dt><dd>Explain why sending is unavailable, preserve fields, and provide email as an alternative. Never announce success before it occurs.</dd></div></dl><p><a href="#form-fields">Try field states</a> or <a href="#inquiry-form">inspect the complete inquiry flow</a>.</p>
  </>,
  'resources': () => <>
<dl className="ds-definition-list">{[
 ['src/design-tokens.css', 'Shared token definitions and theme mappings.'],
 ['src/ui/', 'Shared production components.'],
 ['src/design-system.jsx', 'Reference-page rendering and example composition.'],
 ['src/design-system-page.css', 'Documentation layout and responsive navigation styles.'],
 ['src/design-system-primitives.jsx', 'Documentation-only cards, frames, and headings.'],
 ['src/content/design-system.mjs', 'Canonical section order and labels.'],
 ['src/design-system-specimens.jsx', 'Local, deterministic component fixtures.'],
 ['DESIGN.md', 'Design rules and review expectations.'],
 ['docs/ai-workflow.md', 'How AI-assisted work is bounded and reviewed.'],
].map(([path, description]) => <div key={path}><dt><SourceLink path={path} /></dt><dd>{description}</dd></div>)}</dl>
  </>,
  'token-reference': () => <>
<TokenReference />
  </>,
  'audit-notes': () => <>
<Specimen kind="inventory" />
  </>,
  'layout-breakpoints': () => <>
<div className="ds-two-column"><DocCard title="Content widths"><dl className="ds-definition-list">{['--content-reading-width', '--content-answer-width', '--content-about-width'].map(token => <div key={token}><dt><code>{token}</code></dt><dd><TokenValue name={token} /></dd></div>)}</dl><p>The homepage and services share a 1200px maximum container. Reading and form columns remain narrower.</p></DocCard><DocCard title="Existing layout boundaries"><dl className="ds-definition-list"><div><dt>600px</dt><dd>Compact portfolio layout rules.</dd></div><div><dt>640px</dt><dd>Service cards and inquiry fields stack below this width; engagement terms use a single column at 640px and below.</dd></div><div><dt>820px</dt><dd>The homepage hero changes between stacked and side-by-side layouts.</dd></div><div><dt>900px</dt><dd>Production navigation changes to its mobile menu.</dd></div><div><dt>1054px</dt><dd>The documentation sidebar becomes a menu at this width. Service cards use two columns below it.</dd></div></dl></DocCard></div>
  </>,
  'icons': () => <>
<ExampleFrame label="Standard Lucide icons"><AppIcon icon={ArrowUpRight} size={24} /><AppIcon icon={Copy} size={24} /><AppIcon icon={Check} size={24} /><AppIcon icon={Clock} size={24} /></ExampleFrame><ExampleFrame label="Signal gradient icons"><SignalGradientIcon icon={Palette} /><SignalGradientIcon icon={Box} /><SignalGradientIcon icon={Zap} /></ExampleFrame><Details><p>AppIcon defaults to a 16px icon and a 2px absolute stroke. Icons beside text are decorative. Icon-only buttons require an accessible label and a 44px hit area. Timing uses a clock; inclusion checks use DS green. Category badges remain text-only.</p></Details>
  </>,
};

const DesignSystem = () => {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem('omar.theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const [navOpen, setNavOpen] = React.useState(() => window.innerWidth > 1054);
  const triggerRef = React.useRef(null);
  const navigationRef = React.useRef(null);
  const { activeId, request, navigate } = useDocumentationNavigation();

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1054px)');
    return onMediaChange(mq, event => setNavOpen(!event.matches));
  }, []);
  React.useLayoutEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  React.useEffect(() => { try { localStorage.setItem('omar.theme', theme); } catch { /* Theme still works without storage. */ } }, [theme]);

  React.useEffect(() => {
    if (!navOpen) return;
    const outside = event => {
      if (window.innerWidth <= 1054 && !navigationRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setNavOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape' && window.innerWidth <= 1054) {
        setNavOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [navOpen]);
  const toggleNavigation = () => {
    const opening = !navOpen;
    setNavOpen(opening);
    if (opening && window.innerWidth <= 1054) requestAnimationFrame(() => navigationRef.current?.querySelector('button')?.focus());
  };
  const handleNavigate = id => {
    if (window.innerWidth <= 1054) setNavOpen(false);
    navigate(id);
  };

  return <TokenTheme.Provider value={theme}><div className="ds-shell">
    <a className="ds-skip-link" href="#ds-main" onClick={event => {
      event.preventDefault(); setNavOpen(window.innerWidth > 1054);
      document.getElementById('ds-main').focus();
    }}>Skip to content</a>
    <style>{footerAlienStyles}</style>
    <SignalGradientDefs />
    <TopBar theme={theme} setTheme={setTheme} navOpen={navOpen} onToggleNav={toggleNavigation} triggerRef={triggerRef} />
    <div className={`ds-layout${!navOpen ? ' sidebar-collapsed' : ''}`}>
      <aside id="ds-section-navigation" ref={navigationRef} className="ds-sidebar" hidden={!navOpen} aria-label="Documentation navigation">
        <SideNavigation activeId={activeId} request={request} onNavigate={handleNavigate} />
        <nav className="ds-site-header__nav ds-mobile-site-nav" aria-label="Site">
          <a href="/work">Work</a><a href="/design-system" aria-current="page">Design System</a><a href="/about">About</a>
          <a href="/#faq">Ask</a><a href="/#contact">Contact</a><a className="ds-header-cta" href="/#contact">Get in touch</a>
        </nav>
      </aside>
      <main id="ds-main" className="ds-content" tabIndex={-1}>
        {DESIGN_SYSTEM_SECTIONS.map(section => {
          const Renderer = SECTION_RENDERERS[section.renderer];
          return <section key={section.id} id={section.id} data-doc-section className={`ds-section${section.id === 'overview' ? ' ds-hero' : ''}`} aria-labelledby={`${section.id}-title`}>
            {section.id !== 'overview' && <SectionHeader id={section.id} eyebrow={DESIGN_SYSTEM_GROUPS.find(group => group.id === section.group).title} title={section.title}>{section.summary}</SectionHeader>}
            <Renderer theme={theme} />
          </section>;
        })}
      </main>
    </div>
    <BackToTopButton />
  </div></TokenTheme.Provider>;
};

ReactDOM.createRoot(document.getElementById('root')).render(<DesignSystem />);
