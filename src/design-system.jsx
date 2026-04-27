import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppIcon, ArrowLeft, ArrowRight, ArrowUpRight, Box, Check, Copy, Moon, Sun, X } from './ui-icons.jsx';
const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:36, height:36, borderRadius:9999, background:'transparent',
      color:'var(--fg-primary)', border:'none',
      boxShadow:'inset 0 0 0 1px var(--color-gray-100)', cursor:'pointer', transition:'background 150ms',
    }}
      onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      {isDark
        ? <AppIcon icon={Moon} size={16} strokeWidth={1.8} />
        : <AppIcon icon={Sun} size={16} strokeWidth={1.8} />
      }
    </button>
  );
};

const Header = ({ theme, setTheme }) => (
  <header style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
    <a href="index.html" style={{fontFamily:'var(--font-mono)', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--fg-primary)'}}>
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
        display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding: 12
      }}>
        <button className="copy-button" onClick={() => navigator.clipboard.writeText(displayHex)} 
          style={{ 
            background: 'rgba(255,255,255,0.2)', border:'none', backdropFilter:'blur(4px)', 
            padding:'6px 10px', borderRadius:6, fontFamily:'var(--font-mono)', fontSize:11,
            cursor: 'pointer', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>Copy Hex</button>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 4 }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-tertiary)', textTransform:'uppercase' }}>{displayHex}</div>
      </div>
    </div>
  );
};

const TypoRow = ({ role, font, size, weight, letterSpacing, lineHeight, sample }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: 24, alignItems: 'center', padding: '24px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 8 }}>{role}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', lineHeight: 1.6 }}>
        {font} <br/>
        Size: {size}<br/>
        Weight: {weight}<br/>
        Tracking: {letterSpacing}<br/>
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
    <path d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z" fill={color}/>
    <path d="M39.9286 0H21.5V18H39.9286V0Z" fill={color}/>
    <path d="M53.75 0L64.5 18H43L53.75 0Z" fill={color}/>
    <path d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z" fill={color}/>
  </svg>
);

const PixelAlienIcon = ({ color = 'currentColor', size = 64 }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
    <rect x="5" y="0" width="2" height="1" fill={color}/>
    <rect x="9" y="0" width="2" height="1" fill={color}/>
    <rect x="4" y="1" width="8" height="1" fill={color}/>
    <rect x="3" y="2" width="10" height="1" fill={color}/>
    <rect x="2" y="3" width="12" height="1" fill={color}/>
    <rect x="2" y="4" width="3" height="1" fill={color}/>
    <rect x="7" y="4" width="2" height="1" fill={color}/>
    <rect x="11" y="4" width="3" height="1" fill={color}/>
    <rect x="2" y="5" width="12" height="1" fill={color}/>
    <rect x="1" y="6" width="3" height="1" fill={color}/>
    <rect x="5" y="6" width="6" height="1" fill={color}/>
    <rect x="12" y="6" width="3" height="1" fill={color}/>
    <rect x="0" y="7" width="2" height="1" fill={color}/>
    <rect x="4" y="7" width="3" height="1" fill={color}/>
    <rect x="9" y="7" width="3" height="1" fill={color}/>
    <rect x="14" y="7" width="2" height="1" fill={color}/>
    <rect x="0" y="8" width="2" height="1" fill={color}/>
    <rect x="4" y="8" width="3" height="1" fill={color}/>
    <rect x="9" y="8" width="3" height="1" fill={color}/>
    <rect x="14" y="8" width="2" height="1" fill={color}/>
    <rect x="4" y="9" width="2" height="1" fill={color}/>
    <rect x="10" y="9" width="2" height="1" fill={color}/>
    <rect x="3" y="10" width="3" height="1" fill={color}/>
    <rect x="10" y="10" width="3" height="1" fill={color}/>
  </svg>
);

const FOOTER_ALIEN_PIXELS = [
  [3,0,1,1],[7,0,1,1],
  [4,1,1,1],[6,1,1,1],
  [2,2,7,1],
  [1,3,2,1],[4,3,3,1],[8,3,2,1],
  [0,4,11,1],
  [0,5,1,1],[2,5,7,1],[10,5,1,1],
  [0,6,1,1],[2,6,1,1],[8,6,1,1],[10,6,1,1],
  [3,7,2,1],[6,7,2,1],
];

const FooterAlienPixel = ({ size = '4.6em', style, ...rest }) => (
  <svg
    viewBox="0 0 11 8"
    width={size}
    height="auto"
    role="img"
    shapeRendering="crispEdges"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      display: 'inline-block',
      verticalAlign: 'top',
      color: 'var(--color-develop-blue)',
      ...style,
    }}
    {...rest}
  >
    {FOOTER_ALIEN_PIXELS.map(([x, y, w, h], i) => (
      <rect key={i} x={x} y={y} width={w} height={h} fill="currentColor" />
    ))}
  </svg>
);

const FooterAlienUFO = ({ size = '5.6em' }) => (
  <svg
    viewBox="0 0 11 5"
    width={size}
    height="auto"
    aria-hidden="true"
    shapeRendering="crispEdges"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <g fill="var(--color-ship-red)">
      <rect x="3" y="0" width="5" height="1" />
      <rect x="2" y="1" width="7" height="1" />
      <rect x="0" y="2" width="11" height="1" />
      <rect x="1" y="3" width="9" height="1" />
    </g>
    <g fill="var(--color-preview-pink)">
      <rect x="2" y="4" width="1" height="1" />
      <rect x="4" y="4" width="1" height="1" />
      <rect x="6" y="4" width="1" height="1" />
      <rect x="8" y="4" width="1" height="1" />
    </g>
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
    <div style={{ display:'flex', flexDirection:'column', gap:16, width:'100%' }}>
      <style>{`
        .ds-footer-alien-arrival {
          --faa-ufo-w: 5.6em;
          position: relative;
          display: inline-block;
          width: 4.6em;
          height: 3.6em;
          overflow: visible;
          line-height: 0;
        }
        .ds-footer-alien-arrival .faa-ufo {
          position: absolute;
          left: 50%;
          top: -0.9em;
          width: var(--faa-ufo-w);
          transform: translate(-50%, 0) translateX(-260%);
          opacity: 0;
          pointer-events: none;
          will-change: transform, opacity;
        }
        .ds-footer-alien-arrival .faa-beam {
          position: absolute;
          left: 50%;
          top: 0.15em;
          width: 3.2em;
          height: 2.4em;
          transform: translateX(-50%) scaleY(0);
          transform-origin: top center;
          opacity: 0;
          background: linear-gradient(
            180deg,
            color-mix(in oklab, var(--color-preview-pink) 70%, transparent),
            color-mix(in oklab, var(--color-preview-pink) 8%, transparent)
          );
          clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
          mix-blend-mode: screen;
          pointer-events: none;
          will-change: transform, opacity;
        }
        .ds-footer-alien-arrival .faa-alien {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translate(-50%, 0);
          line-height: 0;
          opacity: 0;
          will-change: transform, opacity;
        }
        .ds-footer-alien-arrival[data-playing="true"] .faa-alien {
          opacity: 1;
        }
        @media (prefers-reduced-motion: no-preference) {
          .ds-footer-alien-arrival[data-playing="true"] .faa-ufo {
            animation:
              faa-ufo-arrive 1.0s cubic-bezier(.2,.7,.2,1) forwards,
              faa-ufo-leave 0.9s cubic-bezier(.6,.0,.7,.3) 2.0s forwards;
          }
          .ds-footer-alien-arrival[data-playing="true"] .faa-beam {
            animation: faa-beam-pulse 1.1s ease-in-out 0.9s forwards;
          }
          .ds-footer-alien-arrival[data-playing="true"] .faa-alien {
            animation: faa-alien-land 0.5s cubic-bezier(.2,.9,.3,1.4) 1.4s both;
          }
        }
        @keyframes faa-ufo-arrive {
          from { transform: translate(-50%, 0) translateX(-260%); opacity: 0; }
          to { transform: translate(-50%, 0) translateX(0); opacity: 1; }
        }
        @keyframes faa-ufo-leave {
          from { transform: translate(-50%, 0) translateX(0); opacity: 1; }
          to { transform: translate(-50%, 0) translateX(280%); opacity: 0; }
        }
        @keyframes faa-beam-pulse {
          0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
          25% { transform: translateX(-50%) scaleY(1); opacity: 0.85; }
          75% { transform: translateX(-50%) scaleY(1); opacity: 0.55; }
          100% { transform: translateX(-50%) scaleY(0); opacity: 0; }
        }
        @keyframes faa-alien-land {
          0% { opacity: 0; transform: translate(-50%, -0.6em) scale(0.55); }
          60% { opacity: 1; transform: translate(-50%, 0.05em) scale(1.05); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
      <div style={{
        minHeight: 170,
        borderRadius: 12,
        boxShadow: 'var(--shadow-ring)',
        display:'grid',
        placeItems:'center',
        background:'linear-gradient(180deg, color-mix(in oklab, var(--bg-subtle) 78%, transparent), var(--bg-page))',
      }}>
        <span
          key={runId}
          className="ds-footer-alien-arrival"
          data-playing="true"
          aria-label="Pixel alien footer arrival animation"
        >
          <span className="faa-ufo" aria-hidden="true">
            <FooterAlienUFO />
          </span>
          <span className="faa-beam" aria-hidden="true" />
          <span className="faa-alien">
            <FooterAlienPixel />
          </span>
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', lineHeight:1.7 }}>
          Sequence: UFO arrive 1.0s, beam pulse 1.1s at 0.9s delay, alien land 0.5s at 1.4s delay, UFO exit 0.9s at 2.0s delay.<br/>
          Colors: ship-red UFO body, preview-pink beam, develop-blue alien. Reduced motion shows the final landed state without motion.
        </div>
        <button
          type="button"
          onClick={() => !prefersReducedMotion && setRunId(id => id + 1)}
          disabled={prefersReducedMotion}
          style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            padding:'10px 14px', borderRadius:8, border:'none', cursor:prefersReducedMotion ? 'not-allowed' : 'pointer',
            background: prefersReducedMotion ? 'var(--bg-subtle)' : 'var(--fg-primary)',
            color: prefersReducedMotion ? 'var(--fg-disabled)' : 'var(--bg-page)',
            fontSize:13, fontWeight:600, boxShadow:'var(--shadow-card-subtle)'
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
    position:'relative', width:160, height:120, borderRadius:16,
    background:'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--bg-subtle) 90%, transparent) 0%, transparent 72%)'
  }}>
    {[
      { left:'18%', top:'56%', color:'var(--color-develop-blue)' },
      { left:'28%', top:'26%', color:'var(--color-preview-pink)' },
      { left:'42%', top:'18%', color:'var(--fg-primary)' },
      { left:'62%', top:'22%', color:'var(--fg-secondary)' },
      { left:'76%', top:'44%', color:'var(--color-ship-red)' },
      { left:'68%', top:'66%', color:'var(--color-develop-blue)' },
      { left:'46%', top:'74%', color:'var(--fg-primary)' },
      { left:'24%', top:'70%', color:'var(--color-preview-pink)' },
      { left:'10%', top:'44%', color:'var(--fg-secondary)' },
    ].map((dot, index) => (
      <span key={index} style={{
        position:'absolute', left:dot.left, top:dot.top, width:index % 3 === 0 ? 4 : 3, height:index % 3 === 0 ? 4 : 3,
        background:dot.color, display:'block', boxShadow:'0 0 0 1px rgba(0,0,0,0.02)'
      }}/>
    ))}
  </div>
);

const CustomElementCard = ({ label, note, children }) => (
  <div style={{ padding: 28, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)', display:'flex', flexDirection:'column', gap:18 }}>
    <div style={{ minHeight: 132, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-page)', borderRadius: 8, boxShadow:'var(--shadow-ring)' }}>
      {children}
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color:'var(--fg-primary)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14, color:'var(--fg-secondary)', lineHeight: 1.5 }}>{note}</div>
    </div>
  </div>
);

const ICON_SET = [
  { label: 'Arrow Up Right', icon: ArrowUpRight },
  { label: 'Arrow Right', icon: ArrowRight },
  { label: 'Arrow Left', icon: ArrowLeft },
  { label: 'Copy', icon: Copy },
  { label: 'Check', icon: Check },
  { label: 'Close', icon: X },
  { label: 'Box', icon: Box },
  { label: 'Sun', icon: Sun },
  { label: 'Moon', icon: Moon },
];

const IconCard = ({ label, icon }) => (
  <div style={{ padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ minHeight: 84, borderRadius: 8, boxShadow: 'var(--shadow-ring)', display: 'grid', placeItems: 'center', background: 'var(--bg-page)' }}>
      <AppIcon icon={icon} size={22} strokeWidth={2.2} />
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
        <AppIcon icon={copied ? Check : Copy} size={13} strokeWidth={2.2} />
      </button>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      <span style={{ fontSize:16, fontWeight:500, color:'var(--fg-primary)', letterSpacing:'-0.01em' }}>{value}</span>
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
            <TypoRow role="Mono Label" font="Geist Mono" size="12px" weight="500" letterSpacing="0.08em" lineHeight="1.0" sample={<span style={{textTransform:'uppercase'}}>Technical Label</span>} />
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
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 16
              }}>
                <span className="mono-label" style={{margin:0}}>Level 1 (Ring)</span>
              </div>
              <p style={{fontSize: 14, color:'var(--fg-secondary)', lineHeight: 1.5}}>Shadow-as-border replacing traditional CSS borders everywhere.</p>
            </div>

            {/* Level 2 */}
            <div>
              <div style={{ 
                height: 180, background: 'var(--bg-page)', borderRadius: 8,
                boxShadow: 'var(--shadow-card-subtle)',
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 16
              }}>
                <span className="mono-label" style={{margin:0}}>Level 2 (Subtle)</span>
              </div>
              <p style={{fontSize: 14, color:'var(--fg-secondary)', lineHeight: 1.5}}>Standard cards. Ring + `0px 2px 2px` drop shadow.</p>
            </div>

            {/* Level 3 */}
            <div>
              <div style={{ 
                height: 180, background: 'var(--bg-page)', borderRadius: 8,
                boxShadow: 'var(--shadow-card-full)',
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 16
              }}>
                <span className="mono-label" style={{margin:0}}>Level 3 (Full Stack)</span>
              </div>
              <p style={{fontSize: 14, color:'var(--fg-secondary)', lineHeight: 1.5}}>Featured panels. Combines border, lift, distance blur, and inner highlight glow.</p>
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
              label="Pixel Alien / Static Mark"
              note="The current pixel alien mark used as the footer signoff character. Rendered in develop blue with crisp-edge pixel geometry as the base asset for the animated footer sequence."
            >
              <PixelAlienIcon color="var(--color-develop-blue)" size={86} />
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
                }} onMouseEnter={e=>e.currentTarget.style.opacity='0.86'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  Primary Action
                </button>
                
                <button style={{
                  background: 'transparent', color: 'var(--fg-primary)',
                  padding: '10px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background 150ms', fontFamily: 'inherit'
                }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
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

            {/* Feature Workflows */}
            <div>
              <div className="mono-label">Workflow Paradigm</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                
                <div style={{ padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-develop-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Develop</div>
                  <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.96px', margin: '0 0 12px' }}>Write Code</h3>
                  <p style={{ fontSize: 16, color: 'var(--fg-secondary)', lineHeight: 1.5, margin: 0 }}>Build features seamlessly attached to your repository context.</p>
                </div>

                <div style={{ padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-preview-pink)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Preview</div>
                  <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.96px', margin: '0 0 12px' }}>Review Instantly</h3>
                  <p style={{ fontSize: 16, color: 'var(--fg-secondary)', lineHeight: 1.5, margin: 0 }}>Every change generates a collaborative URL securely isolated.</p>
                </div>

                <div style={{ padding: 24, borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ship-red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Ship</div>
                  <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.96px', margin: '0 0 12px' }}>Deploy to Edge</h3>
                  <p style={{ fontSize: 16, color: 'var(--fg-secondary)', lineHeight: 1.5, margin: 0 }}>Push reliably across a global network with immutable artifacts.</p>
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
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
                      <span style={{ fontSize:16, fontWeight:500, color:'var(--fg-primary)', letterSpacing:'-0.01em' }}>{value}</span>
                    </a>
                  ))}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', lineHeight:1.8 }}>
                  Card click opens the destination, top-right icon copies when present. Border treatment remains the same: conic-gradient cycles ship-red → preview-pink → develop-blue · 3s linear · border-only via ::before (inset −1.5px) + ::after cover (inset 0) + foreground content at z-index 2.
                </div>
              </div>
            </div>

            {/* Inputs & Metrics */}
            <div>
              <div className="mono-label">Interactive Forms & Metrics</div>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* Input Demo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-primary)' }}>Email Address</label>
                    <input type="email" placeholder="you@example.com" style={{
                      width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                      background: 'var(--bg-page)', color: 'var(--fg-primary)',
                      border: 'none', borderRadius: 6, boxShadow: 'var(--shadow-card-subtle)',
                      outline: 'none', transition: 'box-shadow 150ms'
                    }} onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--color-focus)'} 
                       onBlur={e => e.target.style.boxShadow = 'var(--shadow-card-subtle)'} />
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', border: 'none', boxShadow: 'var(--shadow-ring)',
                      background: 'var(--bg-subtle)'
                    }} />
                    <span style={{ fontSize: 14, color: 'var(--fg-secondary)' }}>Option one</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', border: 'none', boxShadow: '0 0 0 2px var(--color-focus)',
                      background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-focus)' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--fg-primary)' }}>Option two (Selected)</span>
                  </label>
                </div>

                {/* Metric Card */}
                <div style={{ flex: 1, minWidth: 280, padding: '32px 40px', borderRadius: 12, boxShadow: 'var(--shadow-card-subtle)', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 'clamp(40px, 5vw, 48px)', fontWeight: 600, letterSpacing: '-2.4px', color: 'var(--fg-primary)', lineHeight: 1, marginBottom: 16 }}>10x faster</div>
                  <div style={{ fontSize: 16, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>Performance optimized for the modern edge.</div>
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
