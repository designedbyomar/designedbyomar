import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppIcon, ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Menu, Moon, Sun, X } from './ui-icons.jsx';
import { footerAlienStyles, FooterArrival } from './footer-alien.jsx';

const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 9999, background: 'transparent',
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
    <a href="index.html" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--fg-primary)' }}>
      ← Back to Site
    </a>
    <ThemeToggle theme={theme} setTheme={setTheme} />
  </header>
);

const ColorSwatch = ({ name, variable, hexLight, hexDark, theme }) => {
  const isDark = theme === 'dark';
  const color = `var(${variable})`;
  const displayHex = isDark && hexDark ? hexDark : hexLight;

  return (
    <div className="swatch" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        width: '100%', height: 120, borderRadius: 8, background: color,
        boxShadow: 'var(--shadow-card-subtle)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 12
      }}>
        <button className="copy-button" onClick={() => navigator.clipboard.writeText(displayHex)}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', backdropFilter: 'blur(4px)',
            padding: '6px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
            cursor: 'pointer', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>Copy Hex</button>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 4 }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', textTransform: 'uppercase' }}>{displayHex}</div>
      </div>
    </div>
  );
};

const TypoRow = ({ role, font, size, weight, letterSpacing, lineHeight, sample }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: 24, alignItems: 'center', padding: '24px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 8 }}>{role}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.6 }}>
        {font} <br />
        Size: {size}<br />
        Weight: {weight}<br />
        Tracking: {letterSpacing}<br />
        Leading: {lineHeight}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <style>{footerAlienStyles + `
        .ds-faa-wrapper { 
          --faa-ufo-w: 5.6em;
          width: 4.6em; 
          height: 3.6em; 
        }
        .ds-faa-wrapper .faa-ufo { top: -0.9em; width: var(--faa-ufo-w); }
        .ds-faa-wrapper .faa-beam { top: 0.15em; width: 3.2em; height: 2.4em; }
      `}</style>
      <div style={{
        minHeight: 170,
        borderRadius: 12,
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
          <FooterArrival played={true} ufoSize="5.6em" alienSize="4.6em" />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', lineHeight: 1.7 }}>
          Sequence: UFO arrive 1.0s, beam pulse 1.1s at 0.9s delay, alien land 0.5s at 1.4s delay, UFO exit 0.9s at 2.0s delay.<br />
          Colors: ship-red UFO body, preview-pink beam, develop-blue alien. Reduced motion shows the final landed state without motion.
        </div>
        <button
          type="button"
          onClick={() => !prefersReducedMotion && setRunId(id => id + 1)}
          disabled={prefersReducedMotion}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 14px', borderRadius: 8, border: 'none', cursor: prefersReducedMotion ? 'not-allowed' : 'pointer',
            background: prefersReducedMotion ? 'var(--bg-subtle)' : 'var(--fg-primary)',
            color: prefersReducedMotion ? 'var(--fg-disabled)' : 'var(--bg-page)',
            fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-card-subtle)'
          }}
        >
          {prefersReducedMotion ? 'Reduced motion enabled' : 'Replay animation'}
        </button>
      </div>
    </div>
  );
};

const PixelOrbitPreview = () => (
  <div style={{
    position: 'relative', width: 160, height: 120, borderRadius: 16,
    background: 'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--bg-subtle) 90%, transparent) 0%, transparent 72%)'
  }}>
    {[
      { left: '18%', top: '56%', color: 'var(--color-develop-blue)' },
      { left: '28%', top: '26%', color: 'var(--color-preview-pink)' },
      { left: '42%', top: '18%', color: 'var(--fg-primary)' },
      { left: '62%', top: '22%', color: 'var(--fg-secondary)' },
      { left: '76%', top: '44%', color: 'var(--color-ship-red)' },
      { left: '68%', top: '66%', color: 'var(--color-develop-blue)' },
      { left: '46%', top: '74%', color: 'var(--fg-primary)' },
      { left: '24%', top: '70%', color: 'var(--color-preview-pink)' },
      { left: '10%', top: '44%', color: 'var(--fg-secondary)' },
    ].map((dot, index) => (
      <span key={index} style={{
        position: 'absolute', left: dot.left, top: dot.top, width: index % 3 === 0 ? 4 : 3, height: index % 3 === 0 ? 4 : 3,
        background: dot.color, display: 'block', boxShadow: '0 0 0 1px rgba(0,0,0,0.02)'
      }} />
    ))}
  </div>
);

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
            <TypoRow role="Display Hero" font="Geist Sans" size="clamp(44px, 7vw, 88px)" weight="600" letterSpacing="-0.04em" lineHeight="0.96" sample="Compression as identity." />
            <TypoRow role="Section Heading" font="Geist Sans" size="40px" weight="600" letterSpacing="-2.4px" lineHeight="1.20" sample="Feature sections & titles" />
            <TypoRow role="Sub-heading" font="Geist Sans" size="32px" weight="600" letterSpacing="-1.28px" lineHeight="1.25" sample="Sub-components & cards" />
            <TypoRow role="Card Title" font="Geist Sans" size="24px" weight="600" letterSpacing="-0.96px" lineHeight="1.33" sample="Focused UI headings" />
            <TypoRow role="Body Large" font="Geist Sans" size="20px" weight="400" letterSpacing="normal" lineHeight="1.80" sample="The quick brown fox jumps over the lazy dog. Relaxed leading for long-form reading." />
            <TypoRow role="Body" font="Geist Sans" size="18px" weight="400" letterSpacing="normal" lineHeight="1.56" sample="Standard reading text for paragraphs and generic UI components." />
            <TypoRow role="Body Small" font="Geist Sans" size="16px" weight="400" letterSpacing="normal" lineHeight="1.50" sample="Secondary reading text and standard UI elements." />
            <TypoRow role="Body Semibold" font="Geist Sans" size="16px" weight="600" letterSpacing="-0.32px" lineHeight="1.50" sample="Strong functional labels" />
            <TypoRow role="Button / Link" font="Geist Sans" size="14px" weight="500" letterSpacing="normal" lineHeight="1.43" sample="Actionable elements" />
            <TypoRow role="Mono Body" font="Geist Mono" size="16px" weight="400" letterSpacing="normal" lineHeight="1.50" sample="console.log('System initialized');" />
            <TypoRow role="Mono Label" font="Geist Mono" size="12px" weight="500" letterSpacing="0.08em" lineHeight="1.0" sample={<span style={{ textTransform: 'uppercase' }}>Technical Label</span>} />
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
                  padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', cursor: 'pointer', transition: 'opacity 150ms', fontFamily: 'inherit'
                }} onMouseEnter={e => e.currentTarget.style.opacity = '0.86'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Primary Action
                </button>

                <button style={{
                  background: 'transparent', color: 'var(--fg-primary)',
                  padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background 150ms', fontFamily: 'inherit'
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Secondary Action
                </button>

                <div style={{
                  background: theme === 'dark' ? 'rgba(50, 145, 255, 0.15)' : '#ebf5ff',
                  color: 'var(--color-develop-blue)',
                  padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                }}>
                  Status Pill
                </div>
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
