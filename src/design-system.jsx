import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppIcon, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Menu, Moon, Sun, X, Sparkles, Target, Rocket, NotebookPen } from './ui-icons.jsx';
import { footerAlienStyles, FooterArrival } from './footer-alien.jsx';
import { Galaxy } from './galaxy.jsx';

const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: 9999, background: 'transparent',
      color: 'var(--fg-primary)', border: 'none',
      boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background 150ms',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {isDark ? <AppIcon icon={Moon} size={16} /> : <AppIcon icon={Sun} size={16} />}
    </button>
  );
};

const Header = ({ theme, setTheme }) => (
  <header style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
    <a href="index.html" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--fg-primary)' }}>
      ← Back to Site
    </a>
    <ThemeToggle theme={theme} setTheme={setTheme} />
  </header>
);

const ColorSwatch = ({ name, variable, hexLight, hexDark, theme }) => {
  const isDark = theme === 'dark';
  const color = `var(${variable})`;
  const displayHex = isDark && hexDark ? hexDark : hexLight;
  const [copied, setCopied] = React.useState(false);
  const resetTimerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayHex);
      setCopied(true);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="swatch" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        width: '100%', height: 120, borderRadius: 8, background: color,
        boxShadow: 'var(--shadow-card-subtle)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 12
      }}>
        <button className="copy-button" onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy hex'}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', backdropFilter: 'blur(4px)',
            padding: '6px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
            cursor: 'pointer', color: copied ? '#4ade80' : 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            transition: 'color 150ms ease'
          }}>
          {copied ? '✓ Copied' : 'Copy Hex'}
        </button>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 4 }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', textTransform: 'uppercase' }}>{displayHex}</div>
      </div>
    </div>
  );
};

const TypoRow = ({ role, font, size, weight, letterSpacing, lineHeight, sample, sizeToken, weightToken, lineHeightToken }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 2fr', gap: 24, alignItems: 'center', padding: '24px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 8 }}>{role}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.6 }}>
        {font} <br />
        Size: {size}{sizeToken && <span style={{ color: 'var(--fg-secondary)' }}> · <code style={{ color: 'var(--color-develop-blue)' }}>{sizeToken}</code></span>}<br />
        Weight: {weight}{weightToken && <span style={{ color: 'var(--fg-secondary)' }}> · <code style={{ color: 'var(--color-develop-blue)' }}>{weightToken}</code></span>}<br />
        Tracking: {letterSpacing}<br />
        Leading: {lineHeight}{lineHeightToken && <span style={{ color: 'var(--fg-secondary)' }}> · <code style={{ color: 'var(--color-develop-blue)' }}>{lineHeightToken}</code></span>}
      </div>
    </div>
    <div style={{
      fontFamily: font.includes('Mono') ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: size,
      fontWeight: weight,
      letterSpacing: letterSpacing,
      lineHeight: lineHeight,
      color: 'var(--fg-primary)'
    }}>
      {sample}
    </div>
  </div>
);

const RadiusBox = ({ label, radius }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
    <div style={{
      width: 80, height: 80, background: 'var(--bg-subtle)', boxShadow: 'var(--shadow-ring)',
      borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <span style={{ fontSize: 12, color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)' }}>{typeof radius === 'number' ? `${radius}px` : radius}</span>
    </div>
    <span className="mono-label" style={{ margin: 0, fontSize: 10, textAlign: 'center' }}>{label}</span>
  </div>
);

const SpaceRow = ({ token, px }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 24 }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', minWidth: 92 }}>--{token}</span>
    <div style={{ width: `var(--${token})`, height: '100%', background: 'var(--color-develop-blue)', opacity: 0.2, borderRadius: 1 }} />
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)' }}>{px}px</span>
  </div>
);

const SPACE_TOKENS_UI = [
  { token: 'space-1', px: 4 },
  { token: 'space-2', px: 8 },
  { token: 'space-3', px: 12 },
  { token: 'space-4', px: 16 },
  { token: 'space-5', px: 20 },
  { token: 'space-6', px: 24 },
  { token: 'space-7', px: 32 },
  { token: 'space-8', px: 40 },
];

const SPACE_TOKENS_LAYOUT = [
  { token: 'layout-1', px: 48 },
  { token: 'layout-2', px: 64 },
  { token: 'layout-3', px: 96 },
  { token: 'layout-4', px: 120 },
];

const NavMarkIcon = ({ color = 'currentColor', width = 86, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z" fill={color} />
    <path d="M39.9286 0H21.5V18H39.9286V0Z" fill={color} />
    <path d="M53.75 0L64.5 18H43L53.75 0Z" fill={color} />
    <path d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z" fill={color} />
  </svg>
);

const FooterAlienArrivalDemo = () => {
  const [runId, setRunId] = React.useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
      <style>{footerAlienStyles + `
        .ds-faa-wrapper {
          --faa-ufo-w: 3.2em;
          width: 2.6em;
          height: 2em;
          font-size: 14px;
        }
        .ds-faa-wrapper .faa-ufo { top: -0.9em; width: var(--faa-ufo-w); }
        .ds-faa-wrapper .faa-beam { top: 0.15em; width: 1.8em; height: 1.4em; }
      `}</style>
      <div style={{
        width: '100%',
        minHeight: 120,
        borderRadius: 10,
        boxShadow: 'var(--shadow-ring)',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, color-mix(in oklab, var(--bg-subtle) 78%, transparent), var(--bg-page))',
      }}>
        <span
          key={runId}
          className="ds-faa-wrapper"
          aria-label="Pixel alien footer arrival animation"
        >
          <FooterArrival played={true} ufoSize="3.2em" alienSize="2.6em" />
        </span>
      </div>
      <button
        type="button"
        onClick={() => !prefersReducedMotion && setRunId(id => id + 1)}
        disabled={prefersReducedMotion}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 14px', borderRadius: 8, border: 'none', cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
          background: prefersReducedMotion ? 'var(--bg-subtle)' : 'var(--fg-primary)',
          color: prefersReducedMotion ? 'var(--fg-disabled)' : 'var(--bg-page)',
          fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-card-subtle)'
        }}
      >
        {prefersReducedMotion ? 'Reduced motion' : 'Replay animation'}
      </button>
    </div>
  );
};

const PixelOrbitPreview = () => {
  const theme = typeof document !== 'undefined'
    ? (document.documentElement.getAttribute('data-theme') || 'dark')
    : 'dark';
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: 180,
      overflow: 'visible',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute',
        top: '-12%',
        right: '-12%',
        bottom: '-12%',
        left: '-12%',
        pointerEvents: 'none',
      }}>
        <Galaxy density={1.9} speed={0.75} style="pixel" accent="workflow" theme={theme} />
      </div>
    </div>
  );
};

const CustomElementCard = ({ label, note, children }) => (
  <div style={{ padding: 28, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ minHeight: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', borderRadius: 8, boxShadow: 'var(--shadow-ring)' }}>
      {children}
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>{note}</div>
    </div>
  </div>
);

const SystemCard = ({ label, note, children }) => (
  <div style={{ padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ minHeight: 132, borderRadius: 10, boxShadow: 'var(--shadow-ring)', background: 'var(--bg-page)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>{note}</div>
    </div>
  </div>
);

const MiniHeaderPreview = () => (
  <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
    <div style={{ background: 'color-mix(in oklab, var(--bg-page) 82%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-gray-100)', width: '100%', padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <NavMarkIcon color="var(--fg-primary)" width={72} height={15} />
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-secondary)', fontWeight: 500 }}>
        <span>Work</span>
        <span>About</span>
        <span style={{ color: 'var(--fg-primary)' }}>Contact</span>
      </div>
    </div>
  </div>
);

const MiniCaseCoverPreview = ({ gradient = 'linear-gradient(135deg, var(--color-develop-blue) 0%, color-mix(in srgb, var(--color-omar-black) 86%, var(--color-develop-blue) 14%) 100%)' }) => (
  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden', background: gradient, boxShadow: 'var(--shadow-card-subtle)' }}>
    <div style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(0,0,0,0.32)', padding: '5px 9px', borderRadius: 4, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>02 · 2025 · Wisdom</div>
    <div style={{ position: 'absolute', left: '16%', right: '16%', bottom: '-6%', top: '22%', background: 'var(--bg-page)', borderRadius: '10px 10px 0 0', boxShadow: '0 -1px 0 0 rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,0.35)' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 18, display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid color-mix(in srgb, var(--color-gray-100) 72%, transparent)' }}>
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--color-develop-blue)', opacity: 0.7 }} />
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--color-preview-pink)', opacity: 0.7 }} />
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--color-ship-red)', opacity: 0.7 }} />
      </div>
      <div style={{ position: 'absolute', top: 40, left: 16, right: 16, height: 10, borderRadius: 3, background: 'color-mix(in srgb, var(--color-develop-blue) 18%, transparent)' }} />
      <div style={{ position: 'absolute', top: 58, left: 16, width: '40%', height: 10, borderRadius: 3, background: 'color-mix(in srgb, var(--color-preview-pink) 30%, transparent)' }} />
      <div style={{ position: 'absolute', top: 58, left: '46%', width: '38%', height: 10, borderRadius: 3, background: 'color-mix(in srgb, var(--color-gray-100) 40%, transparent)' }} />
    </div>
  </div>
);

const MiniFooterPreview = () => (
  <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr)', gap: 18, alignItems: 'start' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <NavMarkIcon color="var(--fg-primary)" width={72} height={15} />
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg-tertiary)' }}>Product design for AI workflows, enterprise systems, fintech, and healthcare SaaS.</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Site Links</div>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Work</span>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>About</span>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Design System</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Social</div>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>LinkedIn</span>
    </div>
  </div>
);

const MiniCookieBannerPreview = () => (
  <div style={{
    width: '100%',
    background: 'color-mix(in oklab, var(--bg-page) 82%, transparent)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: 'var(--shadow-card-full)',
    borderRadius: 12,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    border: '1px solid var(--color-gray-100)',
  }}>
    <p style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.4, margin: 0 }}>
      I use cookies to understand how you interact with my work.
    </p>
    <div style={{
      background: 'var(--fg-primary)',
      color: 'var(--bg-page)',
      padding: '6px 12px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
    }}>
      Accept
    </div>
  </div>
);

const MotionRow = ({ name, timing, note }) => (
  <div style={{ padding: '18px 0', borderBottom: '1px solid var(--color-gray-100)', display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 1fr', gap: 24, alignItems: 'start' }}>
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 6 }}>{name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{timing}</div>
    </div>
    <div style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>{note}</div>
  </div>
);

const ResponsiveTable = () => (
  <div style={{ border: '1px solid var(--color-gray-100)', borderRadius: 12, overflow: 'hidden', marginTop: 32 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
      <thead style={{ background: 'var(--bg-subtle)', color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase' }}>
        <tr>
          <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Breakpoint</th>
          <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Change</th>
          <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Reason</th>
        </tr>
      </thead>
      <tbody style={{ color: 'var(--fg-secondary)' }}>
        <tr><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)', color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>≤ 1200px</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Contact cards 3 → 2 cols</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Prevent card text pinch</td></tr>
        <tr><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)', color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>≤ 1054px</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>At a Glance 2 → 1 cols</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Maintain line length</td></tr>
        <tr><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)', color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>≤ 900px</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Hamburger Nav swap</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Navigation density</td></tr>
        <tr><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)', color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>≤ 600px</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Grid stack cleanup</td><td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Mobile readability</td></tr>
        <tr><td style={{ padding: '16px 20px', color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>Reduced Motion</td><td style={{ padding: '16px 20px' }}>Skip translate / transitions</td><td style={{ padding: '16px 20px' }}>Accessibility / Performance</td></tr>
      </tbody>
    </table>
  </div>
);

const ICON_SET = [
  { label: 'Arrow Up Right', icon: ArrowUpRight },
  { label: 'Arrow Right', icon: ArrowRight },
  { label: 'Arrow Left', icon: ArrowLeft },
  { label: 'Menu', icon: Menu },
  { label: 'Copy', icon: Copy },
  { label: 'Check', icon: Check },
  { label: 'Close', icon: X },
  { label: 'Sun', icon: Sun },
  { label: 'Moon', icon: Moon },
  { label: 'Sparkles', icon: Sparkles },
  { label: 'Target', icon: Target },
  { label: 'Rocket', icon: Rocket },
  { label: 'Writing', icon: NotebookPen },
];

const IconCard = ({ label, icon }) => (
  <div style={{ padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ minHeight: 84, borderRadius: 8, boxShadow: 'var(--shadow-ring)', display: 'grid', placeItems: 'center', background: 'var(--bg-page)' }}>
      <AppIcon icon={icon} size={22} />
    </div>
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lucide Icon</div>
    </div>
  </div>
);

const DesignSystemContactCard = ({ label, value, copyValue }) => {
  const [copied, setCopied] = React.useState(false);
  const resetTimerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleCopy = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <a className="contact-card" href="mailto:omar@designedbyomar.com" style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 56px 18px 20px', borderRadius: 8,
      background: 'var(--bg-page)', boxShadow: 'var(--shadow-card-subtle)', textDecoration: 'none',
      transition: 'transform 180ms ease',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <button
        type="button"
        aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        title={copied ? 'Copied' : 'Copy'}
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 28, height: 28, borderRadius: 9999,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          background: 'color-mix(in oklab, var(--bg-page) 76%, var(--bg-subtle) 24%)',
          color: copied ? 'var(--color-develop-blue)' : 'var(--fg-tertiary)',
          boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
          zIndex: 2,
          transition: 'color 150ms ease, background 150ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = copied ? 'var(--color-develop-blue)' : 'var(--fg-primary)';
          e.currentTarget.style.background = 'var(--bg-subtle)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = copied ? 'var(--color-develop-blue)' : 'var(--fg-tertiary)';
          e.currentTarget.style.background = 'color-mix(in oklab, var(--bg-page) 76%, var(--bg-subtle) 24%)';
        }}
      >
        <AppIcon icon={copied ? Check : Copy} size={13} />
      </button>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>{value}</span>
    </a>
  );
};

const DesignSystemFAQAccordion = () => {
  const [openIndex, setOpenIndex] = React.useState(-1);
  const [showAllQuestions, setShowAllQuestions] = React.useState(false);
  const items = [
    {
      question: 'What kind of product designer is Omar?',
      answer: 'I am a principal product designer for complex B2B products, AI workflows, enterprise systems, fintech, healthcare SaaS, and design systems.',
    },
    {
      question: 'How does Omar approach design systems?',
      answer: 'I treat design systems as product infrastructure: reusable foundations that improve consistency, engineering alignment, speed, governance, and long-term quality.',
    },
    {
      question: 'What is Omar’s experience with AI and healthcare SaaS?',
      answer: 'At Wisdom, I designed AI-assisted dental operations workflows, management tools, and operational systems for scale.',
    },
    {
      question: 'What is Omar’s experience with fintech and embedded payments?',
      answer: 'At Plastiq, I led 0 to 1 design for embedded payments and API workflows supporting meaningful payment volume.',
    },
    {
      question: 'What enterprise product experience does Omar have?',
      answer: 'At Disney, I designed workflow and communication tools for large cross-brand media teams.',
    },
    {
      question: 'How does Omar work with founders and engineers?',
      answer: 'I clarify ambiguous ideas, map workflows, prototype quickly, document edge cases, and partner with engineering early enough to ship.',
    },
    {
      question: 'What business outcomes has Omar influenced?',
      answer: 'My work has contributed to faster workflows, stronger adoption, reduced operational drag, and clearer product foundations.',
    },
  ];
  const defaultVisibleIndices = [0, 1, 2, 3, 4, 5];
  const visibleItems = showAllQuestions
    ? items.map((item, index) => ({ item, index }))
    : defaultVisibleIndices.map(index => ({ item: items[index], index }));
  const toggleQuestionVisibility = () => {
    setShowAllQuestions(showingAll => {
      const nextShowingAll = !showingAll;
      if (!nextShowingAll && !defaultVisibleIndices.includes(openIndex)) setOpenIndex(-1);
      return nextShowingAll;
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      gap: 32,
      alignItems: 'start',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--color-preview-pink)' }}>04 — </span>FAQ
        </div>
        <h3 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, lineHeight: 0.98, letterSpacing: '-0.04em', color: 'var(--fg-primary)', margin: 0 }}>
          Questions founders and design leaders usually ask
        </h3>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--fg-secondary)', margin: 0 }}>
          A quick read on how I work, where I fit, and the kinds of product problems I solve best.
        </p>
        <a href="#" style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--fg-primary)',
          padding: '10px 14px',
          minHeight: 44,
          borderRadius: 6,
          background: 'transparent',
          boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
          textDecoration: 'none',
        }}>
          Start a conversation
          <AppIcon icon={ArrowUpRight} size={12} />
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {visibleItems.map(({ item, index }) => {
          const isOpen = openIndex === index;
          const answerId = `ds-faq-answer-${index}`;
          const buttonId = `ds-faq-question-${index}`;
          return (
            <div
              key={item.question}
              className={`faq-item${isOpen ? ' is-open' : ''}`}
              style={{
                borderRadius: 8,
                boxShadow: isOpen ? 'inset 0 0 0 1px color-mix(in srgb, var(--color-gray-100) 72%, transparent)' : 'var(--shadow-card-subtle)',
                transition: 'box-shadow 180ms ease, transform 180ms ease',
              }}
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                style={{
                  width: '100%',
                  minHeight: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '18px 20px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--fg-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: 1.25,
                  color: isOpen ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                  transition: 'color 180ms ease',
                }}>
                  {item.question}
                </span>
                <AppIcon icon={ChevronDown} size={17} style={{
                  flexShrink: 0,
                  color: isOpen ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 180ms ease, color 180ms ease',
                }} />
              </button>
              <div
                id={answerId}
                role="region"
                aria-labelledby={buttonId}
                className="faq-answer"
                style={{
                  maxHeight: isOpen ? 180 : 0,
                  opacity: isOpen ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 240ms ease, opacity 180ms ease',
                }}
              >
                <p style={{
                  margin: 0,
                  padding: '0 20px 20px',
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'var(--fg-secondary)',
                  maxWidth: 680,
                }}>
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          aria-expanded={showAllQuestions}
          className="text-link faq-view-all-link"
          onClick={() => toggleQuestionVisibility()}
        >
          {showAllQuestions ? 'Show fewer questions' : 'View all questions'}
          <AppIcon icon={ChevronDown} size={14} style={{ transform: showAllQuestions ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
      </div>
    </div>
  );
};

const DesignSystem = () => {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('omar.theme') || 'dark');
  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('omar.theme', theme); }, [theme]);

  return (
    <div style={{ paddingBottom: 160 }}>
      <Header theme={theme} setTheme={setTheme} />

      <main style={{ maxWidth: 1040, margin: '80px auto', padding: '0 24px' }}>

        {/* Intro */}
        <div style={{ marginBottom: 120 }}>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 88px)', fontWeight: 600, lineHeight: 0.96, letterSpacing: '-0.04em', color: 'var(--fg-primary)', margin: '0 0 24px' }}>
            designedbyomar <span style={{ color: 'var(--fg-tertiary)' }}>Design System</span>
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.8, color: 'var(--fg-secondary)', maxWidth: 640 }}>
            The core reference for designedbyomar visual language, interaction behavior, and shared UI primitives, including the Lucide icon set used across the site.
          </p>
        </div>

        {/* Colors */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Color System</h2>
          </div>

          <div className="mono-label">Primary & Neutrals</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 32, marginBottom: 80 }}>
            <ColorSwatch name="Page Background" variable="--bg-page" theme={theme} hexLight="#ffffff" hexDark="#0a0a0a" />
            <ColorSwatch name="Subtle Surface" variable="--bg-subtle" theme={theme} hexLight="#fafafa" hexDark="#1a1a1a" />
            <ColorSwatch name="Primary Text" variable="--fg-primary" theme={theme} hexLight="#171717" hexDark="#ededed" />
            <ColorSwatch name="Secondary Text" variable="--fg-secondary" theme={theme} hexLight="#4d4d4d" hexDark="#a1a1a1" />
            <ColorSwatch name="Tertiary Text" variable="--fg-tertiary" theme={theme} hexLight="#666666" hexDark="#8f8f8f" />
            <ColorSwatch name="Border/Divider" variable="--color-gray-100" theme={theme} hexLight="#ebebeb" hexDark="#2e2e2e" />
            <ColorSwatch name="On-Dark Foreground" variable="--fg-on-dark" theme={theme} hexLight="#ffffff" hexDark="#0a0a0a" />
            <ColorSwatch name="Focus Ring" variable="--color-focus" theme={theme} hexLight="#0072f5" hexDark="#3291ff" />
          </div>

          <div className="mono-label">Workflow Accents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 32 }}>
            <ColorSwatch name="Develop Blue" variable="--color-develop-blue" theme={theme} hexLight="#0a72ef" hexDark="#3291ff" />
            <ColorSwatch name="Preview Pink" variable="--color-preview-pink" theme={theme} hexLight="#de1d8d" hexDark="#ff3da0" />
            <ColorSwatch name="Ship Red" variable="--color-ship-red" theme={theme} hexLight="#ff5b4f" hexDark="#ff6b60" />
          </div>
        </section>

        {/* Typography */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Typography Map</h2>
          </div>

          <div style={{ borderTop: '1px solid var(--color-gray-100)' }}>
            <TypoRow role="Display Hero" font="Geist Sans" size="clamp(44px, 7vw, 88px)" weight="600" letterSpacing="-0.04em" lineHeight="0.96" sample="Compression as identity." sizeToken="--font-size-display-lg" weightToken="--font-weight-semibold" lineHeightToken="--line-height-tight" />
            <TypoRow role="Section Heading" font="Geist Sans" size="40px" weight="600" letterSpacing="-2.4px" lineHeight="1.20" sample="Feature sections & titles" sizeToken="--font-size-heading-xl" weightToken="--font-weight-semibold" lineHeightToken="--line-height-snug-plus" />
            <TypoRow role="Sub-heading" font="Geist Sans" size="32px" weight="600" letterSpacing="-1.28px" lineHeight="1.25" sample="Sub-components & cards" sizeToken="--font-size-display-sm" weightToken="--font-weight-semibold" lineHeightToken="--line-height-card" />
            <TypoRow role="Card Title" font="Geist Sans" size="24px" weight="600" letterSpacing="-0.96px" lineHeight="1.33" sample="Focused UI headings" sizeToken="--font-size-heading-lg" weightToken="--font-weight-semibold" lineHeightToken="--line-height-normal" />
            <TypoRow role="Body Large" font="Geist Sans" size="20px" weight="400" letterSpacing="normal" lineHeight="1.80" sample="The quick brown fox jumps over the lazy dog. Relaxed leading for long-form reading." sizeToken="--font-size-heading-md" weightToken="--font-weight-regular" lineHeightToken="--line-height-looser" />
            <TypoRow role="Body" font="Geist Sans" size="18px" weight="400" letterSpacing="normal" lineHeight="1.56" sample="Standard reading text for paragraphs and generic UI components." sizeToken="--font-size-body-xl" weightToken="--font-weight-regular" lineHeightToken="--line-height-relaxed-mid" />
            <TypoRow role="Body Small" font="Geist Sans" size="16px" weight="400" letterSpacing="normal" lineHeight="1.50" sample="Secondary reading text and standard UI elements." sizeToken="--font-size-body-lg" weightToken="--font-weight-regular" lineHeightToken="--line-height-relaxed" />
            <TypoRow role="Body Semibold" font="Geist Sans" size="16px" weight="600" letterSpacing="-0.32px" lineHeight="1.50" sample="Strong functional labels" sizeToken="--font-size-body-lg" weightToken="--font-weight-semibold" lineHeightToken="--line-height-relaxed" />
            <TypoRow role="Button / Link" font="Geist Sans" size="14px" weight="500" letterSpacing="normal" lineHeight="1.43" sample="Actionable elements" sizeToken="--font-size-body-md" weightToken="--font-weight-medium" lineHeightToken="--line-height-button" />
            <TypoRow role="Caption" font="Geist Sans" size="11px" weight="500" letterSpacing="0.04em" lineHeight="1.33" sample="Captions, badges, and tertiary metadata" sizeToken="--font-size-label-sm" weightToken="--font-weight-medium" lineHeightToken="--line-height-normal" />
            <TypoRow role="Micro" font="Geist Sans" size="10px" weight="500" letterSpacing="0.08em" lineHeight="1.33" sample={<span style={{ textTransform: 'uppercase' }}>Tiny utility text</span>} sizeToken="--font-size-micro" weightToken="--font-weight-medium" lineHeightToken="--line-height-normal" />
            <TypoRow role="Mono Body" font="Geist Mono" size="16px" weight="400" letterSpacing="normal" lineHeight="1.50" sample="console.log('System initialized');" sizeToken="--font-size-body-lg" weightToken="--font-weight-regular" lineHeightToken="--line-height-relaxed" />
            <TypoRow role="Mono Label" font="Geist Mono" size="12px" weight="500" letterSpacing="0.08em" lineHeight="1.0" sample={<span style={{ textTransform: 'uppercase' }}>Technical Label</span>} sizeToken="--font-size-mono-md" weightToken="--font-weight-medium" lineHeightToken="--line-height-solid" />
          </div>
        </section>

        {/* Shadows and Depths */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Elevation & shadow-as-border</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>

            {/* Level 1 */}
            <div>
              <div style={{
                height: 180, background: 'var(--bg-page)', borderRadius: 8,
                boxShadow: 'var(--shadow-ring)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <span className="mono-label" style={{ margin: 0 }}>Ring (--shadow-ring)</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>Shadow-as-border replacing traditional CSS borders everywhere.</p>
            </div>

            {/* Level 2 */}
            <div>
              <div style={{
                height: 180, background: 'var(--bg-page)', borderRadius: 8,
                boxShadow: 'var(--shadow-card-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <span className="mono-label" style={{ margin: 0 }}>Level 2 (Subtle)</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>Standard cards. Ring + `0px 2px 2px` drop shadow.</p>
            </div>

            {/* Level 3 */}
            <div>
              <div style={{
                height: 180, background: 'var(--bg-page)', borderRadius: 8,
                boxShadow: 'var(--shadow-card-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <span className="mono-label" style={{ margin: 0 }}>Level 3 (Full Stack)</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>Featured panels. Combines border, lift, distance blur, and inner highlight glow.</p>
            </div>

          </div>
        </section>

        {/* Custom Elements */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Custom Elements</h2>
          </div>

          <div className="mono-label">Site-specific motifs & signatures</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            <CustomElementCard
              label="Geometric Nav Mark"
              note="Primary site signature used in navigation and the loader. Four primitives: circle, square, triangle, and D-form."
            >
              <NavMarkIcon color="var(--fg-primary)" width={150} height={32} />
            </CustomElementCard>

            <CustomElementCard
              label="Pixel Alien / Footer Arrival"
              note="Production footer animation. A ship-red UFO enters, casts a preview-pink beam, drops the develop-blue alien, then exits. Plays once on entry in the live footer and respects reduced-motion settings."
            >
              <FooterAlienArrivalDemo />
            </CustomElementCard>

            <CustomElementCard
              label="Pixel Orbit Motif"
              note="The square-particle galaxy used in the dark hero portrait. This is the static motif language behind the animated canvas treatment."
            >
              <PixelOrbitPreview />
            </CustomElementCard>
          </div>
        </section>

        {/* Iconography */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Iconography</h2>
          </div>

          <div className="mono-label">Lucide Icons</div>
          <div style={{ maxWidth: 760, marginBottom: 32 }}>
            <p style={{ fontSize: 16, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0 }}>
              This platform uses Lucide Icons through the shared `AppIcon` wrapper in `src/ui-icons.jsx`. The wrapper keeps stroke weight, sizing, and rendering behavior consistent across navigation, contact cards, drawers, and utility actions.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {ICON_SET.map(({ label, icon }) => <IconCard key={label} label={label} icon={icon} />)}
          </div>
        </section>

        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Header & Navigation</h2>
          </div>

          <div className="mono-label">Sticky nav, mobile swap, logo motion</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <SystemCard
              label="Desktop / Mobile Header"
              note="Production header stays transparent at rest, shifts into a blurred shell on scroll, and swaps desktop links for theme toggle + hamburger at the tablet breakpoint."
            >
              <MiniHeaderPreview />
            </SystemCard>
            <SystemCard
              label="Interaction Rules"
              note="Desktop keeps inline Work, About, Contact, and CTA. Mobile keeps only the logo, theme toggle, and menu trigger; the rest moves into the dropdown panel. The geometric mark also runs a bounce sequence on hover."
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                Scroll state: transparent → blur shell<br />
                Mobile switch: at `900px` and below<br />
                Menu contents: Work, About, Contact, Get in touch<br />
                Logo motion: 580ms staggered bounce on hover
              </div>
            </SystemCard>
          </div>
        </section>

        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Case Study Cover System</h2>
          </div>

          <div className="mono-label">Homepage work cards and browser-window shells</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <SystemCard
              label="Homepage Cover Tile"
              note="Live case cards use a gradient shell, browser-window silhouette, glass metadata chip, and hover sheen. The first card keeps a featured treatment on wider screens and normalizes to a shared aspect ratio on smaller viewports."
            >
              <MiniCaseCoverPreview />
            </SystemCard>
            <SystemCard
              label="Interaction Pattern"
              note="The card body is a flex column so copy and tags align cleanly. Non-featured cards stretch to equal height, and the tag row anchors to the bottom to keep the reading rhythm consistent."
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                Featured ratio: `16 / 8` on desktop<br />
                Shared mobile ratio: `4 / 3` at `900px` and below<br />
                Hover: lift, sheen, screen shift, tag nudge<br />
                Metadata chip: glass tag anchored top-left
              </div>
            </SystemCard>
          </div>
        </section>

        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Footer System</h2>
          </div>

          <div className="mono-label">Brand block, link columns, signoff motion</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <SystemCard
              label="Footer Grid"
              note="The production footer is a real layout system, not a loose link list. It uses a brand block plus two utility columns, then collapses from three columns to two and finally to one as the viewport narrows."
            >
              <MiniFooterPreview />
            </SystemCard>
            <SystemCard
              label="Footer Signoff"
              note="The signoff uses mono uppercase copy, the footer-arrival alien, and subtle horizontal hover motion on links. This is the canonical home of the Pixel Alien in the live site."
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                Layout: `1.35fr / 0.85fr / 0.85fr` on wide screens<br />
                Collapse: 3 → 2 → 1 columns<br />
                Links: 160ms color + translateX hover treatment<br />
                Brand system link: lives in footer, not as a top-level nav item
              </div>
            </SystemCard>
          </div>
        </section>

        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Overlays & Notifications</h2>
          </div>

          <div className="mono-label">Floating patterns, consent banners, and glass shells</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <SystemCard
              label="Cookie Consent Banner"
              note="A non-intrusive floating banner for privacy compliance. Uses the standard glassmorphism stack (blur + opacity + shadow) to maintain depth without breaking the layout."
            >
              <MiniCookieBannerPreview />
            </SystemCard>
            <SystemCard
              label="Interaction & Motion"
              note="The banner animates from the bottom with a 600ms spring-like transition. It persists via localStorage and respects the global theme toggle automatically."
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                Entrance: `translateY(24px)` → `0` @ 1200ms delay<br />
                Stacking: `z-index: 10000`<br />
                Backdrop: `blur(16px)` + `var(--bg-page) @ 82%`<br />
                Persistence: `omar.consent` in localStorage
              </div>
            </SystemCard>
          </div>
        </section>

        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Motion System</h2>
          </div>

          <div className="mono-label">Live site behaviors, not placeholder animation</div>
          <div style={{ borderTop: '1px solid var(--color-gray-100)' }}>
            <MotionRow name="Loader Mark Bounce" timing="4s looping sequence" note="The four-part nav mark runs a staggered bounce as the loader centerpiece before the site settles into the hero." />
            <MotionRow name="Reveal on Scroll" timing="560ms opacity / 720ms translate" note="Sections use staggered reveal classes with a soft upward settle. Reduced motion skips the translation and shows final state immediately." />
            <MotionRow name="Case Card Hover" timing="220–360ms layered transitions" note="Case-study cards combine overall lift, screen shift, sheen motion, tag nudge, and line travel to make the covers feel alive without becoming noisy." />
            <MotionRow name="Logo Marquee" timing="44s linear" note="Company logos scroll as a masked, continuously moving strip. Reduced motion stops the marquee and leaves the marks in a stable state." />
            <MotionRow name="Facts Mesh Gradient" timing="rAF driven" note="The At a Glance section background is not a static fill. It is a live radial-mesh composition driven by time and pointer position." />
            <MotionRow name="Footer Alien Arrival" timing="1.0s / 1.1s / 0.5s / 0.9s" note="The footer animation is the canonical narrative motion moment: UFO in, beam pulse, alien lands, UFO out. Reduced motion shows the landed state instead." />
          </div>
        </section>

        {/* Opacity System */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Opacity System</h2>
          </div>

          <div className="mono-label">Transparency scale for color variations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
            {[
              { name: '5%', value: 0.05 },
              { name: '8%', value: 0.08 },
              { name: '10%', value: 0.10 },
              { name: '12%', value: 0.12 },
              { name: '16%', value: 0.16 },
              { name: '18%', value: 0.18 },
              { name: '22%', value: 0.22 },
              { name: '26%', value: 0.26 },
              { name: '28%', value: 0.28 },
              { name: '32%', value: 0.32 },
              { name: '35%', value: 0.35 },
              { name: '42%', value: 0.42 },
              { name: '45%', value: 0.45 },
              { name: '55%', value: 0.55 },
              { name: '60%', value: 0.60 },
              { name: '68%', value: 0.68 },
              { name: '95%', value: 0.95 },
            ].map(level => (
              <div key={level.name} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  width: '100%', height: 80, borderRadius: 8, background: `rgba(10, 114, 239, ${level.value})`,
                  boxShadow: 'var(--shadow-card-subtle)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>var(--opacity-{Math.round(level.value * 100)})</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)', textAlign: 'center' }}>{level.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Motion & Timing Tokens */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Motion & Timing Tokens</h2>
          </div>

          <div className="mono-label">Duration scale and easing functions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Durations */}
            <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>Duration tokens</div>
              {[
                { name: 'fastest', value: '120ms' },
                { name: 'fast-mid', value: '160ms' },
                { name: 'fast', value: '150ms' },
                { name: 'fast-plus', value: '180ms' },
                { name: 'base-short', value: '200ms' },
                { name: 'base', value: '220ms' },
                { name: 'base-plus', value: '250ms' },
                { name: 'base-plus-xl', value: '260ms' },
                { name: 'slow', value: '300ms' },
                { name: 'slower', value: '320ms' },
                { name: 'slowest', value: '340ms' },
                { name: 'slowest-xl', value: '360ms' },
                { name: 'very-slow', value: '400ms' },
                { name: 'slower-xl', value: '500ms' },
                { name: 'slowest-xxl', value: '600ms' },
              ].map(dur => (
                <div key={dur.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)' }}>--duration-{dur.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)' }}>{dur.value}</span>
                </div>
              ))}
            </div>

            {/* Easing */}
            <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>Easing functions</div>
              {[
                { name: 'ease-out', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
                { name: 'ease-in-out', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
                { name: 'ease-linear', value: 'linear' },
              ].map(easing => (
                <div key={easing.name} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)' }}>--easing-{easing.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>{easing.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Z-Index Scale */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Z-Index Scale</h2>
          </div>

          <div className="mono-label">Stacking context hierarchy</div>
          <div style={{ border: '1px solid var(--color-gray-100)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead style={{ background: 'var(--bg-subtle)', color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Token</th>
                  <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Value</th>
                  <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>Use Case</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--fg-secondary)' }}>
                {[
                  { token: 'z-base', value: '0', use: 'Default layer' },
                  { token: 'z-dropdown', value: '10', use: 'Dropdowns, popovers' },
                  { token: 'z-sticky', value: '20', use: 'Sticky headers, sidebars' },
                  { token: 'z-fixed', value: '50', use: 'Fixed navigation' },
                  { token: 'z-modal-backdrop', value: '100', use: 'Modal background overlay' },
                  { token: 'z-modal', value: '101', use: 'Modal dialogs' },
                  { token: 'z-popover', value: '102', use: 'Popovers above modals' },
                  { token: 'z-tooltip', value: '103', use: 'Tooltips (topmost)' },
                  { token: 'z-critical', value: '9999', use: 'Emergency/global alerts' },
                ].map(row => (
                  <tr key={row.token}>
                    <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)', color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>--{row.token}</td>
                    <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)', fontFamily: 'var(--font-mono)' }}>{row.value}</td>
                    <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gray-100)' }}>{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Blur Effects */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Blur Effects</h2>
          </div>

          <div className="mono-label">Backdrop & filter blur strengths</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { name: 'Subtle', token: '--blur-subtle', value: 'blur(4px)' },
              { name: 'Base', token: '--blur-base', value: 'blur(6px)' },
              { name: 'Medium', token: '--blur-medium', value: 'blur(10px)' },
              { name: 'Strong', token: '--blur-strong', value: 'blur(12px)' },
              { name: 'Heavy', token: '--blur-heavy', value: 'blur(16px)' },
            ].map(blur => (
              <div key={blur.token} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  width: '100%', height: 140, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)',
                  background: `linear-gradient(135deg, var(--color-develop-blue), var(--color-preview-pink))`,
                  position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{
                    position: 'absolute', inset: 0, backdropFilter: blur.value,
                    WebkitBackdropFilter: blur.value, background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Blurred content</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 4 }}>{blur.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{blur.token}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-secondary)' }}>{blur.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gradient Patterns */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Gradient Patterns</h2>
          </div>

          <div className="mono-label">Static gradient tokens for hero & overlays</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { name: 'Hero Radial Blur', token: '--gradient-hero-radial-blur', desc: 'Soft radial blur for hero background with pink, red, blue bleed.' },
              { name: 'Hero Overlay Pink', token: '--gradient-hero-overlay-pink', desc: 'Radial pink circle overlay for hero foreground depth.' },
              { name: 'Mask Fade Vertical', token: '--gradient-mask-fade-vertical', desc: 'Vertical fade mask for image bottoms.' },
              { name: 'Overlay Diagonal', token: '--gradient-overlay-diagonal', desc: 'Subtle diagonal multi-color overlay (155deg).' },
            ].map(grad => (
              <div key={grad.token} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  width: '100%', height: 160, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)',
                  background: `var(${grad.token})`, overflow: 'hidden', position: 'relative'
                }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{grad.token}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 4 }}>{grad.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>{grad.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Text Constants */}
        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Text Constants</h2>
          </div>

          <div className="mono-label">Exported from <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>src/constants.js</code></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <div style={{ padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>NAV_LINKS</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`{
  WORK: 'Work',
  ABOUT: 'About',
  FAQ: 'FAQ',
  CONTACT: 'Contact'
}`}
              </pre>
            </div>

            <div style={{ padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>CASE_STUDIES</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`[
  { name: 'Plastiq', slug: 'plastiq' },
  { name: 'Wisdom', slug: 'wisdom' },
  { name: 'Enterprise', slug: 'enterprise' }
]`}
              </pre>
            </div>

            <div style={{ padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>THEME</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`{
  LIGHT: 'light',
  DARK: 'dark'
}`}
              </pre>
            </div>

            <div style={{ padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>ROUTES</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`{
  PRIVACY: '/privacy',
  WORK: 'work',
  CONTACT: 'contact',
  SECTION: 'section'
}`}
              </pre>
            </div>

            <div style={{ padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>SECTION_KEYS</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`{
  TOP: 'top',
  WORK: 'work',
  ABOUT: 'about',
  AT_A_GLANCE: 'at-a-glance',
  FAQ: 'faq',
  CONTACT: 'contact'
}`}
              </pre>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 160 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Responsive Rules</h2>
          </div>

          <div className="mono-label">Production breakpoints and layout swaps</div>
          <div style={{ borderTop: '1px solid var(--color-gray-100)' }}>
            <ResponsiveTable />
          </div>
        </section>

        {/* Components */}
        <section>
          <div className="section-head">
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-1.28px', color: 'var(--fg-primary)', margin: 0 }}>Primitive UI</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>

            {/* Buttons */}
            <div>
              <div className="mono-label">Buttons & Badges</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <button style={{
                  background: 'var(--fg-primary)', color: 'var(--bg-page)',
                  minHeight: 44, padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'opacity 150ms', fontFamily: 'inherit'
                }} onMouseEnter={e => e.currentTarget.style.opacity = '0.86'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Primary Action
                </button>

                <button style={{
                  background: 'transparent', color: 'var(--fg-primary)',
                  minHeight: 44, padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background 150ms', fontFamily: 'inherit'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Secondary Action
                </button>

                <button style={{
                  background: 'transparent', color: 'var(--fg-primary)',
                  minHeight: 44, padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background 150ms', fontFamily: 'inherit'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Read more about me
                </button>

                <a href="#" className="text-link" onClick={(event) => event.preventDefault()}>
                  Text link
                  <AppIcon icon={ArrowUpRight} size={12} />
                </a>

                <div style={{
                  background: theme === 'dark' ? 'rgba(50, 145, 255, 0.15)' : '#ebf5ff',
                  color: 'var(--color-develop-blue)',
                  padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                }}>
                  Status Pill
                </div>
              </div>
              <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                Primary and secondary action buttons use a 44px minimum height. Drawer-opening actions like Read more about me use the secondary button pattern. Shared text links use the <code>.text-link</code> class: fg-secondary text, fg-primary hover, and a 4px horizontal shift. Footer links and FAQ view-all use this treatment.
              </div>
            </div>

            {/* Contact Card */}
            <div>
              <div className="mono-label">Contact Card — Animated Border</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <DesignSystemContactCard label="Email" value="omar@designedbyomar.com" copyValue="omar@designedbyomar.com" />
                  {[
                    { label: 'LinkedIn', value: 'in/omartavarez' },
                    { label: 'GitHub', value: 'designedbyomar' },
                  ].map(({ label, value }) => (
                    <a key={label} className="contact-card" href="#" style={{
                      position: 'relative',
                      display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px', borderRadius: 8,
                      background: 'var(--bg-page)', boxShadow: 'var(--shadow-card-subtle)', textDecoration: 'none',
                      transition: 'transform 180ms ease',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                      <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>{value}</span>
                    </a>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                  Card click opens the destination, top-right icon copies when present. Border treatment remains the same: conic-gradient cycles ship-red → preview-pink → develop-blue · 3s linear · border-only via ::before (inset −1.5px) + ::after cover (inset 0) + foreground content at z-index 2.
                </div>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div>
              <div className="mono-label">FAQ Accordion — Animated Disclosure</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
                <DesignSystemFAQAccordion />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.8 }}>
                  Disclosure rows use a quiet bg-subtle surface on hover. Open rows keep bg-subtle plus a light token-based outline. View all is a <code>.text-link</code> disclosure control with aria-expanded; preserve labelled answer regions.
                </div>
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <div className="mono-label">Border Radius Scale</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 32 }}>
                <RadiusBox label="Micro" radius={2} />
                <RadiusBox label="Subtle" radius={4} />
                <RadiusBox label="Standard" radius={6} />
                <RadiusBox label="Comfort." radius={8} />
                <RadiusBox label="Image" radius={12} />
                <RadiusBox label="Large" radius={64} />
                <RadiusBox label="XL" radius={100} />
                <RadiusBox label="Circle" radius="50%" />
              </div>
            </div>

            {/* Spacing System */}
            <div>
              <div className="mono-label">Spacing Scale</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg-page)', padding: 24, borderRadius: 8, boxShadow: 'var(--shadow-ring)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>UI band — component spacing</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SPACE_TOKENS_UI.map(t => <SpaceRow key={t.token} token={t.token} px={t.px} />)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Layout band — section rhythm</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SPACE_TOKENS_LAYOUT.map(t => <SpaceRow key={t.token} token={t.token} px={t.px} />)}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DesignSystem />);
