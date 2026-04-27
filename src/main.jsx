import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { AppIcon, ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Menu, Moon, Sun, X } from './ui-icons.jsx';
import { footerAlienStyles, FooterArrival } from './footer-alien.jsx';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENABLED = import.meta.env.PROD && Boolean(SENTRY_DSN);

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
  });
}

// ============================================================
// Galaxy — canvas pixel orbit
// ============================================================
const Galaxy = ({ density = 1, speed = 1, style = 'pixel', accent = 'mono', theme = 'dark' }) => {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = false;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const styles = getComputedStyle(document.documentElement);
    const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
    const toAlpha = (color, alpha) => {
      const value = color.trim();
      if (value.startsWith('#')) {
        let hex = value.slice(1);
        if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
        const int = Number.parseInt(hex, 16);
        return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
      }
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const [r, g, b] = match[1].split(',').map((part) => part.trim());
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return value;
    };
    const fgPrimary = token('--fg-primary', theme === 'dark' ? '#ededed' : '#171717');
    const fgSecondary = token('--fg-secondary', theme === 'dark' ? '#a1a1a1' : '#4d4d4d');
    const fgTertiary = token('--fg-tertiary', theme === 'dark' ? '#8f8f8f' : '#666666');
    const bgPage = token('--bg-page', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    const developBlue = token('--color-develop-blue', theme === 'dark' ? '#3291ff' : '#0a72ef');
    const previewPink = token('--color-preview-pink', theme === 'dark' ? '#ff3da0' : '#de1d8d');
    const shipRed = token('--color-ship-red', theme === 'dark' ? '#ff6b60' : '#ff5b4f');
    let w = 0, h = 0, cx = 0, cy = 0, rMin = 0, rMax = 0;
    let inView = true;
    let pageVisible = document.visibilityState === 'visible';
    let last = performance.now();
    let tick = () => { };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * DPR); canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = w / 2; cy = h * 0.61;
      rMin = Math.min(w, h) * 0.36; rMax = Math.min(w, h) * 0.57;
      rebuild();
    };
    const palettes = {
      mono: [fgPrimary, fgSecondary, fgTertiary],
      photo: [developBlue, previewPink, shipRed, fgPrimary, fgSecondary],
      workflow: [developBlue, previewPink, shipRed, fgPrimary, fgTertiary],
    };
    let particles = [];
    const rebuild = () => {
      particles = new Array(Math.round(140 * density)).fill(0).map(() => mk());
      if (style === 'ethereal') for (let i = 0; i < 60 * density; i++) particles.push(mk(true));
    };
    const mk = (outer = false) => {
      const rp = Math.random(), ring = rp < 0.45 ? 0 : rp < 0.8 ? 1 : 2;
      const ringR = rMin + (rMax - rMin) * (ring === 0 ? 0.05 : ring === 1 ? 0.45 : 0.9);
      const r = ringR + (Math.random() - 0.5) * (rMax - rMin) * 0.22;
      const dir = Math.random() < 0.85 ? 1 : -1;
      const ringSpeed = ring === 0 ? 0.00055 : ring === 1 ? 0.00038 : 0.00024;
      return {
        a: Math.random() * Math.PI * 2, r,
        av: dir * ringSpeed * (0.7 + Math.random() * 0.8),
        tilt: 0.32 + Math.random() * 0.08,
        size: style === 'pixel' ? (Math.random() < 0.55 ? 2 : Math.random() < 0.85 ? 3 : 4) : style === 'ethereal' ? 0.6 + Math.random() * 1.8 : (Math.random() < 0.6 ? 2 : 3),
        color: palettes[accent][Math.floor(Math.random() * palettes[accent].length)],
        twinkle: Math.random() * Math.PI * 2, tv: 0.01 + Math.random() * 0.03,
        outer: !!outer, z: 0.5 + Math.random() * 0.9,
      };
    };
    const updateRunning = () => {
      const shouldRun = inView && pageVisible;
      if (shouldRun === activeRef.current) return;
      activeRef.current = shouldRun;
      if (shouldRun) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        updateRunning();
      }, { threshold: 0.05 });
    observer?.observe(canvas);
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === 'visible';
      updateRunning();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    tick = (now) => {
      if (!activeRef.current) return;
      const dt = Math.min(40, now - last); last = now;
      if (style === 'ethereal') { ctx.fillStyle = toAlpha(bgPage, theme === 'dark' ? 0.18 : 0.22); ctx.fillRect(0, 0, w, h); }
      else ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.a += p.av * dt * speed; p.twinkle += p.tv;
        const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * p.tilt;
        const back = Math.sin(p.a) < 0;
        ctx.globalAlpha = Math.max(0, Math.min(1, (back ? 0.22 : 1) * (0.55 + Math.sin(p.twinkle) * 0.45) * (p.outer ? 0.45 : 1)));
        ctx.fillStyle = p.color;
        const s = p.size * (back ? 0.85 : 1);
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };
    updateRunning();
    return () => {
      cancelAnimationFrame(rafRef.current);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resize);
    };
  }, [density, speed, style, accent, theme]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

// ============================================================
// Portrait
// ============================================================
const HERO_STATS = [
  {
    value: '15+ years',
    label: 'SaaS · fintech · AI · enterprise',
    desktop: { top: '48%', left: '-10%', maxWidth: 172 },
    mobile: { top: '42%', left: '-1%', maxWidth: 144 },
    motion: { phase: 0.2, radiusX: 7, radiusY: 4, boostX: 8, boostY: 5, parallaxX: -0.34, parallaxY: -0.14, rotate: 1.2, rotateBoost: 0.8, rotateDir: -1 },
  },
  {
    value: '500+ interviews',
    label: 'Customers · operators · teams',
    desktop: { top: '72%', left: '-10%', maxWidth: 180 },
    mobile: { top: '63%', left: '-2%', maxWidth: 150 },
    motion: { phase: 1.8, radiusX: 7, radiusY: 5, boostX: 8, boostY: 6, parallaxX: -0.36, parallaxY: 0.10, rotate: 1.3, rotateBoost: 0.85, rotateDir: -1 },
  },
  {
    value: '2 design systems',
    label: 'Consistency at scale',
    desktop: { top: '18%', right: '2%', maxWidth: 180 },
    mobile: { top: '14%', right: '0%', maxWidth: 148 },
    motion: { phase: 3.1, radiusX: 7, radiusY: 4, boostX: 8, boostY: 5, parallaxX: 0.34, parallaxY: -0.14, rotate: 1.2, rotateBoost: 0.8, rotateDir: 1 },
  },
  {
    value: '30+ launches',
    label: 'Products · platforms · workflows',
    desktop: { bottom: '8%', right: '4%', maxWidth: 180 },
    mobile: { bottom: '10%', right: '4%', maxWidth: 144 },
    motion: { phase: 4.6, radiusX: 6, radiusY: 4, boostX: 7, boostY: 5, parallaxX: 0.28, parallaxY: 0.16, rotate: 1.0, rotateBoost: 0.75, rotateDir: 1 },
  },
  {
    value: '1,600+ users',
    label: 'Enterprise tool adoption',
    desktop: { top: '44%', right: '-10%', maxWidth: 170 },
    mobile: { top: '38%', right: '0%', maxWidth: 140 },
    motion: { phase: 2.4, radiusX: 6, radiusY: 5, boostX: 7, boostY: 6, parallaxX: 0.32, parallaxY: -0.12, rotate: 1.1, rotateBoost: 0.8, rotateDir: 1 },
  },
];

const Portrait = ({ galaxy, theme }) => {
  const isLight = theme === 'light';
  const portraitRef = React.useRef(null);
  const statCardRefs = React.useRef([]);
  const motionRef = React.useRef({
    raf: 0,
    prevTime: 0,
    orbitTime: 0,
    speed: 0.26,
    targetSpeed: 0.26,
    pointerX: 0,
    pointerY: 0,
    easedPointerX: 0,
    easedPointerY: 0,
    lastClientX: null,
    lastClientY: null,
    lastMoveTime: 0,
    pointerInside: false,
  });
  const [desktopStatsVisible, setDesktopStatsVisible] = React.useState(false);
  const [touchStatsVisible, setTouchStatsVisible] = React.useState(false);
  const [isTouchLayout, setIsTouchLayout] = React.useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const sync = () => setIsTouchLayout(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener?.('change', sync);
    return () => mediaQuery.removeEventListener?.('change', sync);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener?.('change', sync);
    return () => mediaQuery.removeEventListener?.('change', sync);
  }, []);

  React.useEffect(() => {
    if (!isTouchLayout) setTouchStatsVisible(false);
  }, [isTouchLayout]);

  const statsVisible = isTouchLayout ? touchStatsVisible : desktopStatsVisible;

  React.useEffect(() => {
    const state = motionRef.current;
    const resetCards = () => {
      statCardRefs.current.forEach((card) => {
        if (!card) return;
        card.style.setProperty('--float-x', '0px');
        card.style.setProperty('--float-y', '0px');
        card.style.setProperty('--float-r', '0deg');
        card.style.setProperty('--hover-x', '0px');
        card.style.setProperty('--hover-y', '0px');
        card.style.setProperty('--hover-r', '0deg');
        card.style.setProperty('--hover-scale', '1');
      });
    };
    if (prefersReducedMotion || !statsVisible) {
      resetCards();
      return undefined;
    }

    const animate = (now) => {
      if (document.visibilityState !== 'visible') {
        state.prevTime = now;
        state.raf = requestAnimationFrame(animate);
        return;
      }
      const dt = state.prevTime ? Math.min(40, now - state.prevTime) : 16;
      state.prevTime = now;
      state.speed += (state.targetSpeed - state.speed) * 0.08;
      state.targetSpeed += ((state.pointerInside ? 0.24 : 0.18) - state.targetSpeed) * 0.02;
      state.easedPointerX += (state.pointerX - state.easedPointerX) * 0.09;
      state.easedPointerY += (state.pointerY - state.easedPointerY) * 0.09;
      state.orbitTime += dt * (0.00068 + state.speed * 0.00135);
      const pointerActive = !isTouchLayout && state.pointerInside && state.lastClientX != null && state.lastClientY != null;
      const sharedEngage = pointerActive ? 1 : 0;

      statCardRefs.current.forEach((card, index) => {
        if (!card) return;
        const motion = HERO_STATS[index]?.motion;
        if (!motion) return;
        const oscillationX = Math.cos(state.orbitTime + motion.phase) * (motion.radiusX + state.speed * motion.boostX);
        const oscillationY = Math.sin(state.orbitTime * 1.08 + motion.phase) * (motion.radiusY + state.speed * motion.boostY);
        const parallaxX = state.easedPointerX * 22 * motion.parallaxX;
        const parallaxY = state.easedPointerY * 18 * motion.parallaxY;
        const rotation = Math.sin(state.orbitTime * 0.9 + motion.phase) * (motion.rotate + state.speed * motion.rotateBoost) + state.easedPointerX * motion.rotateDir * 2.8;
        let hoverX = 0;
        let hoverY = 0;
        let hoverR = 0;
        let hoverScale = 1;

        if (sharedEngage) {
          hoverY -= 3.5 + state.speed * 2.5;
          hoverR += Math.sin(state.orbitTime * 0.72 + motion.phase) * (0.4 + state.speed * 0.35) * motion.rotateDir;
          hoverScale += 0.012 + state.speed * 0.006;
        }

        if (pointerActive) {
          const rect = card.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dx = state.lastClientX - centerX;
          const dy = state.lastClientY - centerY;
          const distance = Math.hypot(dx, dy);
          const raw = Math.max(0, 1 - distance / 420);
          const proximity = raw * raw * (3 - 2 * raw);
          const directionX = Math.max(-1, Math.min(1, dx / 180));
          const directionY = Math.max(-1, Math.min(1, dy / 180));
          hoverX = directionX * proximity * (5 + state.speed * 5);
          hoverY += -proximity * (4.5 + state.speed * 4.5);
          hoverR += (directionX * motion.rotateDir * 1.6 + directionY * 0.6) * proximity;
          hoverScale += proximity * (0.018 + state.speed * 0.01);
        }

        card.style.setProperty('--float-x', `${(oscillationX + parallaxX).toFixed(2)}px`);
        card.style.setProperty('--float-y', `${(oscillationY + parallaxY).toFixed(2)}px`);
        card.style.setProperty('--float-r', `${rotation.toFixed(2)}deg`);
        card.style.setProperty('--hover-x', `${hoverX.toFixed(2)}px`);
        card.style.setProperty('--hover-y', `${hoverY.toFixed(2)}px`);
        card.style.setProperty('--hover-r', `${hoverR.toFixed(2)}deg`);
        card.style.setProperty('--hover-scale', hoverScale.toFixed(3));
      });

      state.raf = requestAnimationFrame(animate);
    };

    state.raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.prevTime = 0;
    };
  }, [isTouchLayout, prefersReducedMotion, statsVisible]);

  const cardBaseStyle = isLight
    ? {
      background: 'rgba(255,255,255,0.68)',
      border: '1px solid rgba(23,23,23,0.10)',
      boxShadow: '0 18px 36px rgba(10,114,239,0.10), 0 10px 24px rgba(255,91,79,0.08)',
    }
    : {
      background: 'rgba(10,10,10,0.42)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 18px 44px rgba(0,0,0,0.26)',
    };

  const updatePointerMotion = (clientX, clientY, timestamp = performance.now()) => {
    if (isTouchLayout || prefersReducedMotion) return;
    const rect = portraitRef.current?.getBoundingClientRect();
    if (!rect) return;
    const normalizedX = (clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (clientY - rect.top) / rect.height - 0.5;
    const state = motionRef.current;
    const deltaX = state.lastClientX == null ? 0 : clientX - state.lastClientX;
    const deltaY = state.lastClientY == null ? 0 : clientY - state.lastClientY;
    const deltaTime = state.lastMoveTime ? Math.max(16, timestamp - state.lastMoveTime) : 16;
    const velocity = Math.min(1, Math.hypot(deltaX, deltaY) / deltaTime * 0.22);
    const distance = Math.min(1, Math.hypot(normalizedX, normalizedY) * 1.8);
    state.pointerX = normalizedX;
    state.pointerY = normalizedY;
    state.pointerInside = true;
    state.targetSpeed = 0.26 + distance * 0.18 + velocity * 0.9;
    state.lastClientX = clientX;
    state.lastClientY = clientY;
    state.lastMoveTime = timestamp;
  };

  const resetPointerMotion = () => {
    const state = motionRef.current;
    state.pointerX = 0;
    state.pointerY = 0;
    state.pointerInside = false;
    state.targetSpeed = 0.18;
    state.lastClientX = null;
    state.lastClientY = null;
    state.lastMoveTime = 0;
  };

  return (
    <div
      ref={portraitRef}
      style={{ position: 'relative', width: '100%', maxWidth: 590, aspectRatio: '1/1', margin: '0 auto', cursor: isTouchLayout ? 'pointer' : 'default' }}
      role="button"
      tabIndex={0}
      aria-label="Show hero highlights"
      aria-pressed={statsVisible}
      onMouseEnter={(event) => {
        if (!isTouchLayout) {
          setDesktopStatsVisible(true);
          updatePointerMotion(event.clientX, event.clientY, event.timeStamp || performance.now());
        }
      }}
      onMouseMove={(event) => updatePointerMotion(event.clientX, event.clientY, event.timeStamp || performance.now())}
      onMouseLeave={() => {
        if (!isTouchLayout) setDesktopStatsVisible(false);
        resetPointerMotion();
      }}
      onFocus={() => { if (!isTouchLayout) setDesktopStatsVisible(true); }}
      onBlur={() => {
        if (!isTouchLayout) setDesktopStatsVisible(false);
        resetPointerMotion();
      }}
      onClick={() => { if (isTouchLayout) setTouchStatsVisible((prev) => !prev); }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (isTouchLayout) {
          setTouchStatsVisible((prev) => !prev);
        } else {
          setDesktopStatsVisible((prev) => !prev);
        }
      }}
    >
      {isLight && (
        <>
          <div style={{
            position: 'absolute', inset: '11% 8% 18%', zIndex: 0, pointerEvents: 'none',
            borderRadius: '48% 52% 46% 54% / 42% 46% 54% 58%',
            background: 'radial-gradient(circle at 50% 38%, color-mix(in srgb, #fff2d8 82%, var(--color-preview-pink) 18%) 0%, color-mix(in srgb, #fff4e6 76%, var(--color-ship-red) 24%) 34%, color-mix(in srgb, #f6f7ff 80%, var(--color-develop-blue) 20%) 72%, rgba(255,255,255,0) 100%)',
            filter: 'blur(26px)', opacity: 0.95,
          }} />
          <div style={{
            position: 'absolute', inset: '4% 10% auto auto', width: '34%', height: '30%', zIndex: 0, pointerEvents: 'none',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--color-preview-pink) 22%, white) 0%, rgba(255,255,255,0) 72%)',
            filter: 'blur(18px)', opacity: 0.7,
          }} />
        </>
      )}
      <div style={{ position: 'absolute', inset: '6% 6% 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 3 }}>
        <img src={isLight ? '/Images/omar-light.webp' : '/Images/omar.webp'} alt="Omar Tavarez" draggable={false} style={{
          width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom',
          filter: isLight
            ? 'drop-shadow(0 18px 44px rgba(10,114,239,0.16)) drop-shadow(0 26px 48px rgba(255,91,79,0.12)) sepia(0.14) saturate(1.08) hue-rotate(-6deg) brightness(1.04) contrast(0.98)'
            : 'drop-shadow(0 20px 60px rgba(0,0,0,0.55))',
          userSelect: 'none', pointerEvents: 'none',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0.6) 82%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0.6) 82%, rgba(0,0,0,0) 100%)',
        }} />
      </div>
      {isLight && (
        <div style={{
          position: 'absolute', inset: '8% 12% 4%', zIndex: 2, pointerEvents: 'none',
          borderRadius: '40% 60% 52% 48% / 44% 42% 58% 56%',
          background: 'linear-gradient(155deg, color-mix(in srgb, var(--color-preview-pink) 10%, transparent) 0%, transparent 34%, color-mix(in srgb, var(--color-develop-blue) 11%, transparent) 67%, color-mix(in srgb, var(--color-ship-red) 10%, transparent) 100%)',
          opacity: 0.65,
        }} />
      )}
      <div style={{ position: 'absolute', top: '2%', right: '-12%', bottom: '-8%', left: '-12%', zIndex: 1, pointerEvents: 'none' }}><Galaxy {...galaxy} /></div>
      <div className="hero-stats-layer" aria-hidden={!statsVisible}>
        {HERO_STATS.map((stat, index) => {
          const position = isTouchLayout ? stat.mobile : stat.desktop;
          return (
            <div
              key={stat.value}
              ref={(node) => { statCardRefs.current[index] = node; }}
              className={`hero-stat-card${statsVisible ? ' is-visible' : ''}`}
              style={{
                ...cardBaseStyle,
                ...position,
                transitionDelay: '0ms',
              }}
            >
              <div className="hero-stat-value">{stat.value}</div>
              <div className="hero-stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// LogoLoader
// ============================================================
const LogoLoader = ({ visible }) => {
  const phrases = [
    "Designing the experience",
    "Crafting the details",
    "Shaping the system",
    "Building the flow",
    "Refining the interface",
    "Prototyping ideas",
    "Polishing the pixels",
    "Aligning the vision",
    "Structuring the journey",
    "Tuning the experience",
    "Design in progress",
    "Good design takes a second",
    "Making complexity feel simple",
    "Turning systems into clarity",
    "Building something thoughtful",
  ];
  const [index, setIndex] = React.useState(() => Math.floor(Math.random() * phrases.length));
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIndex((prev) => {
          let next = Math.floor(Math.random() * phrases.length);
          if (next === prev) next = (next + 1) % phrases.length;
          return next;
        });
        setIsExiting(false);
      }, 400); // Allow exit animation to complete
    }, 1400); // 1.4s overall rotation duration
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity var(--duration-slower-xl) ease',
    }}>
      <div className="logo-loader">
        <svg width="86" height="18" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <path id="shape-circle" d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z" />
          <path id="shape-rect" d="M39.9286 0H21.5V18H39.9286V0Z" />
          <path id="shape-triangle" d="M53.75 0L64.5 18H43L53.75 0Z" />
          <path id="shape-d" d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z" />
        </svg>
      </div>

      <div aria-live="polite" aria-atomic="true" style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--font-size-body-xs)',
        color: 'var(--fg-secondary)',
        height: 20,
        marginTop: 48,
        display: 'flex',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{ display: 'none' }}>{phrases[index]}</div>
        {phrases[index].split('').map((char, i) => {
          if (char === ' ') return <span key={`${index}-${i}-space`} style={{ width: '0.4em' }}>&nbsp;</span>;
          return (
            <span
              key={`${index}-${i}`}
              aria-hidden="true"
              style={{
                display: 'inline-block',
                animation: isExiting
                  ? `letterExit var(--duration-base-plus) cubic-bezier(0.4, 0, 0.2, 1) ${i * 5}ms forwards`
                  : `letterEnter var(--duration-slow) cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 10}ms forwards`,
                opacity: 0,
                willChange: 'transform, opacity, filter'
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const useReveal = ({ once = true, threshold = 0.16, rootMargin = '0px 0px -10% 0px' } = {}) => {
  const ref = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setIsVisible(false);
      }
    }, { threshold, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, isVisible];
};

const Reveal = ({ as: Tag = 'div', children, delay = 0, variant = 'soft', once = true, threshold = 0.16, rootMargin = '0px 0px -10% 0px', className = '', style = {}, ...rest }) => {
  const [ref, isVisible] = useReveal({ once, threshold, rootMargin });
  return (
    <Tag
      ref={ref}
      className={`reveal${isVisible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      data-variant={variant}
      style={{ ...style, transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

const MOBILE_BREAKPOINT = 600;
const COMPACT_LAYOUT_BREAKPOINT = 1054;
const WIDE_LAYOUT_BREAKPOINT = 1200;
const TABLET_BREAKPOINT = 900;

const useViewportWidth = () => {
  const [viewportWidth, setViewportWidth] = React.useState(() => (
    typeof window === 'undefined' ? 1280 : window.innerWidth
  ));

  React.useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return viewportWidth;
};

// ============================================================
// Nav
// ============================================================
const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 9999, background: 'transparent',
      color: 'var(--fg-primary)', border: 'none',
      boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background var(--duration-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {isDark
        ? <AppIcon icon={Moon} size={16} />
        : <AppIcon icon={Sun} size={16} />
      }
    </button>
  );
};

const NavLogo = ({ onClick }) => {
  const [key, setKey] = React.useState(0);
  const shapeStyle = (delay) => ({
    transformBox: 'fill-box',
    transformOrigin: 'bottom center',
    animation: key > 0 ? `navShapeBounce 580ms cubic-bezier(0.22,1,0.36,1) ${delay}ms both` : 'none',
    fill: 'var(--fg-primary)',
  });
  return (
    <a href="#" onClick={onClick}
      onMouseEnter={() => setKey(k => k + 1)}
      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}
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

const Nav = ({ theme, setTheme, onOpenAbout, onHome, scrollToSection }) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth <= TABLET_BREAKPOINT;
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  React.useEffect(() => {
    if (!isMobile && isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [isMobile, isMobileMenuOpen]);
  React.useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goSection = (id) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMobileMenu();
    scrollToSection(id);
  };
  const navLink = {
    fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-secondary)',
    textDecoration: 'none', padding: 'var(--space-1) var(--space-2)', borderRadius: 6,
    transition: 'color var(--duration-fast), background var(--duration-fast)', cursor: 'pointer',
    background: 'transparent', border: 'none', fontFamily: 'inherit',
  };
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'color-mix(in oklab, var(--bg-page) 82%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      boxShadow: scrolled ? 'rgba(127,127,127,0.18) 0px -1px 0px 0px inset' : 'none',
      transition: 'background var(--duration-base-short), box-shadow var(--duration-base-short)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--space-6)', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <NavLogo onClick={(e) => { e.preventDefault(); onHome(); }} />
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 2 }}>
            <a href="#work" onClick={goSection('work')} style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >Work</a>
            <button onClick={onOpenAbout} style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >About</button>
            <a href="#contact" onClick={goSection('contact')} style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >Contact</a>
          </nav>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ThemeToggle theme={theme} setTheme={(t) => {
            setTheme(t);
            if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('theme_toggle', { new_theme: t });
          }} />
          {isMobile ? (
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(open => !open)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 9999, background: 'transparent',
                color: 'var(--fg-primary)', border: 'none', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
                cursor: 'pointer', transition: 'background var(--duration-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <AppIcon icon={isMobileMenuOpen ? X : Menu} size={17} />
            </button>
          ) : (
            <a href="#contact" onClick={goSection('contact')} style={{
              fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--bg-page)', padding: 'var(--space-2) var(--space-3)',
              borderRadius: 6, background: 'var(--fg-primary)', textDecoration: 'none', transition: 'opacity var(--duration-fast)',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.86'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >Get in touch</a>
          )}
        </div>
        {isMobile && isMobileMenuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 24, right: 24, zIndex: 60,
            padding: 'var(--space-3)', borderRadius: 14, background: 'color-mix(in oklab, var(--bg-page) 94%, transparent)',
            boxShadow: 'var(--shadow-card-full)', border: '1px solid var(--color-gray-100)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <a href="#work" onClick={goSection('work')} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>Work</a>
              <button onClick={() => { closeMobileMenu(); onOpenAbout(); }} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>About</button>
              <a href="#contact" onClick={goSection('contact')} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>Contact</a>
              <a href="#contact" onClick={goSection('contact')} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--bg-page)', padding: 'var(--space-3) var(--space-4)', marginTop: 6,
                borderRadius: 8, background: 'var(--fg-primary)', textDecoration: 'none', transition: 'opacity var(--duration-fast)',
              }} onMouseEnter={e => e.currentTarget.style.opacity = '0.86'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Get in touch</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// ============================================================
// Hero
// ============================================================
const Dot = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
    <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.22)', display: 'inline-block' }} />
  </span>
);

const Hero = ({ galaxy, theme, scrollToSection }) => (
  <section id="top" className="hero-editorial" style={{
    maxWidth: 1200, margin: '0 auto', padding: 'var(--space-7) var(--space-6) var(--layout-2)',
    display: 'grid', gridTemplateColumns: '1.1fr 1fr', alignItems: 'center', gap: 'var(--layout-1)',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Dot /> <span>CURRENTLY LOOKING FOR MY NEXT ROLE.</span>
      </div>
      <h1 style={{ fontSize: 'clamp(44px, 7vw, 88px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-tight)', letterSpacing: '-0.04em', color: 'var(--fg-primary)', margin: 0 }}>
        Complex systems. <span style={{ color: 'var(--fg-tertiary)' }}>Clear products.</span>
      </h1>
      <p style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 'var(--font-weight-regular)', lineHeight: 'var(--line-height-relaxed-plus)', color: 'var(--fg-secondary)', margin: 0, maxWidth: 520 }}>
        AI, enterprise SaaS, fintech, and healthcare. I turn complex operations into scalable products.
      </p>
      <div style={{ fontSize: 'var(--font-size-body-xs)', fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: -8 }}>
        Recent impact: <span style={{ color: 'var(--fg-secondary)', textTransform: 'none', letterSpacing: 'normal' }}>~40% faster workflows • 300% customer scaling • $20M+ workflows</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <a href="#work" onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollToSection('work'); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--bg-page)', padding: 'var(--space-2) var(--space-4)', borderRadius: 6, background: 'var(--fg-primary)',
          textDecoration: 'none', transition: 'opacity var(--duration-fast)',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.86'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          View case studies
          <AppIcon icon={ArrowUpRight} size={12} />
        </a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollToSection('contact'); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--fg-primary)', padding: 'var(--space-2) var(--space-4)', borderRadius: 6, background: 'transparent',
          boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', textDecoration: 'none', transition: 'background var(--duration-fast)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >Say hello</a>
      </div>
    </div>
    <Portrait galaxy={galaxy} theme={theme} />
  </section>
);

// ============================================================
// About
// ============================================================
const ABOUT_SHORT = `I build and scale complex product systems that drive revenue and operational efficiency. With 10+ years across fintech, healthcare SaaS, AI workflows, and enterprise platforms, I've led 0→1 products, scaled design systems, and partnered with executive teams to turn strategy into measurable impact.`;

const ABOUT_LONG = [
  { heading: 'Background', body: `I grew up in Brooklyn as an artist — I taught myself design through Photoshop and eventually found my way into product through the front door: HTML, CSS, and small agency work. Over the past decade I've worked across E-commerce, SaaS, Fintech, and Media. I care most about the space where design meets business outcomes — where decisions are hard and the stakes are real.` },
  { heading: 'How I work', body: `I'm a generalist who leans toward structure. Early days are spent in plain text: writing, outlining, narrowing the problem. Prototypes come early, even ugly ones. I prefer a working artifact in a teammate's hands over a polished deck in a meeting. I've led teams, run workshops, and managed design systems end-to-end — not for process's sake, but so teams can ship faster without tripping over inconsistency.` },
  { heading: 'Currently', body: `Principal Product Designer at Wisdom, an early-stage healthcare SaaS platform. Leading design for a Management Portal that replaces 200+ spreadsheets with real-time operational intelligence, and an AI-assisted payment posting workflow that cut manual processing time by 40%. Previously: Plastiq, Disney, Simplero, GoNation.` },
  { heading: 'Tools & craft', body: `Figma, React, Framer, Protopie, Principle. I write real code when the prototype needs to breathe — enough HTML/CSS/JS to ship and enough to collaborate fluently with engineers. I use Obsidian for thinking, Linear for tracking, and Notion for documentation.` },
  { heading: 'Off the clock', body: `Amateur boxer, music producer, dedicated father. I'll talk your ear off about systems thinking, the cognitive science of decision-making, and why Brooklyn is the best city on earth.` },
];

const COMPANY_LOGOS = [
  { name: 'Plastiq', src: '/Images/Carousel/plastiq.svg', maxW: 90, maxH: 24, basis: 110 },
  { name: 'Disney', src: '/Images/Carousel/disney.svg', maxW: 65, maxH: 24, basis: 70 },
  { name: 'Raven Health', src: '/Images/Carousel/raven-health-logo.svg', maxW: 100, maxH: 26, basis: 130 },
  { name: 'GoNation', src: '/Images/Carousel/gonation-dark.svg', maxW: 110, maxH: 20, basis: 140 },
  { name: 'Time Inc.', src: '/Images/Carousel/Time_Inc._logo.svg', maxW: 75, maxH: 20, basis: 85 },
  { name: 'Pyle', src: '/Images/Carousel/Pyle_wordmark.svg', maxW: 70, maxH: 28, basis: 100 },
  { name: 'Wisdom', src: '/Images/Carousel/Wisdom_Logo_Full-White.svg', maxW: 130, maxH: 34, basis: 115 },
  { name: 'Meredith', src: '/Images/Carousel/meredith-vector-logo.svg', maxW: 120, maxH: 26, basis: 150 },
  { name: 'Simplero', src: '/Images/Carousel/simplero.svg', maxW: 90, maxH: 24, basis: 110 },
];

const LogoCarousel = () => (
  <Reveal as="section" className="logo-band" variant="soft" delay={90} aria-label="Companies Omar has worked with" style={{ padding: '18px 0 40px' }}>
    <div className="logo-carousel">
      <div className="logo-track">
        {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((logo, index) => {
          const isClone = index >= COMPANY_LOGOS.length;
          return (
            <div
              key={`${logo.name}-${index}`}
              className="logo-mark"
              aria-hidden={isClone}
              style={{ '--logo-basis': `${logo.basis}px` }}
            >
              <img
                src={logo.src}
                alt={isClone ? '' : logo.name}
                loading="lazy"
                style={{ maxWidth: logo.maxW, maxHeight: logo.maxH }}
              />
            </div>
          );
        })}
      </div>
    </div>
  </Reveal>
);

const About = ({ onOpenDrawer }) => (
  <>
    <Reveal as="section" id="about" variant="section" style={{ borderTop: '1px solid var(--color-gray-100)', padding: '96px 24px 48px' }}>
      <div className="about-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 64, alignItems: 'start' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--color-develop-blue)' }}>01 — </span>About
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 760 }}>
          <p style={{ fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 'var(--font-weight-medium)', lineHeight: 'var(--line-height-medium)', letterSpacing: '-0.02em', color: 'var(--fg-primary)', margin: 0 }}>
            {ABOUT_SHORT}
          </p>
          <button onClick={onOpenDrawer} style={{
            alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', padding: '10px 16px',
            borderRadius: 6, background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background var(--duration-fast)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Read more about me
            <AppIcon icon={ArrowUpRight} size={12} />
          </button>
        </div>
      </div>
    </Reveal>
    <LogoCarousel />
  </>
);

const AboutDrawer = ({ open, onClose }) => {
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: open ? 'rgba(0,0,0,0.45)' : 'transparent', backdropFilter: open ? 'blur(4px)' : 'none', WebkitBackdropFilter: open ? 'blur(4px)' : 'none', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity var(--duration-base-plus) ease' }} />
      <aside role="dialog" aria-label="About Omar" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 81, width: 'min(640px, 92vw)',
        background: 'var(--bg-page)', boxShadow: open ? '-24px 0 80px rgba(0,0,0,0.35), inset 1px 0 0 var(--color-gray-100)' : 'none',
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform var(--duration-slowest) cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--color-gray-100)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>About / long-form</div>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 9999, display: 'grid', placeItems: 'center', background: 'transparent', color: 'var(--fg-primary)', border: 'none', cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>
            <AppIcon icon={X} size={14} />
          </button>
        </div>
        <div style={{ padding: '36px 36px 72px', overflowY: 'auto', flex: 1 }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: '-0.04em', color: 'var(--fg-primary)', margin: '0 0 20px' }}>
            A longer version,<br /><span style={{ color: 'var(--fg-tertiary)' }}>for the curious.</span>
          </h2>
          <p style={{ fontSize: 'var(--font-size-tall)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-secondary)', margin: '0 0 36px', maxWidth: 560 }}>{ABOUT_SHORT}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 560 }}>
            {ABOUT_LONG.map(s => (
              <div key={s.heading}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.heading}</div>
                <p style={{ fontSize: 'var(--font-size-tall)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-secondary)', margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

// ============================================================
// Case Studies — data
// ============================================================
const CASE_STUDIES = [
  {
    id: 'mgmt-portal', num: '01', year: '2025', client: 'Wisdom',
    title: 'Management Portal',
    subtitle: 'Ops command center replacing 200+ spreadsheets with real-time operational intelligence.',
    coverImage: '/Images/case-studies/management-portal/team-lead-dashboard.webp',
    role: 'Lead Product Designer — Strategy & UX Architecture',
    tags: ['B2B SaaS', 'Systems Design', '0→1', 'AI'],
    metrics: [
      { value: '200+', label: 'Excel files replaced' },
      { value: '260→900', label: 'Office scale supported' },
      { value: '90%+', label: 'Weekly active usage' },
    ],
    accent: '#3291ff',
    swatch: ['#3291ff', '#0a0a0a', '#ededed', '#ff3da0'],
    challenge: `Wisdom's ops team managed 260+ offices across 9 Team Leads using 200+ interconnected Google Sheets. Risk was invisible until it became a crisis — at-risk clients were caught too late, capacity was opaque, and manual reconciliation was creating payroll and billing errors.`,
    approach: `Designed a centralized Management Portal as an ops command center. Built an LLM-powered Office Watchlist that detects A/R aging signals and ranks offices by urgency before issues escalate. Added workforce capacity views, per-specialist performance tracking, centralized profiles, and executive portfolio dashboards — replacing manual PDFs and spreadsheets with in-app reporting.`,
    outcome: `Platform in development for Q1–Q2 2026 rollout. Designed to support 260→900 office scale, achieve 90%+ WAU among Team Leads, reduce churn from 1.8% to below 1.0%, and decommission 200+ operational spreadsheets. Shifts the ops model from reactive firefighting to proactive risk management.`,
  },
  {
    id: 'posting-asst', num: '02', year: '2025', client: 'Wisdom',
    title: 'Posting Assistant',
    subtitle: 'AI-assisted insurance payment posting workflow that kept specialists in control.',
    role: 'Lead Product Designer',
    tags: ['AI Workflow', 'Research', 'Healthcare SaaS'],
    metrics: [
      { value: '40%', label: 'Manual time reduced' },
      { value: '40+', label: 'User interviews' },
      { value: '3', label: 'Workflow stacks shipped' },
    ],
    accent: '#ff3da0',
    swatch: ['#ff3da0', '#ff6b60', '#0a0a0a', '#3291ff'],
    challenge: `Insurance payment posting was chaotic — documents came in every format, specialists jumped between screens comparing EOBs, and every posting required manual judgment calls. Slow, error-prone, and impossible to scale.`,
    approach: `Instead of jumping to full automation, started with an assistive workflow: OCR + LLMs extracted key data from scanned insurance documents and surfaced it in a structured review interface. Preserved specialist control while reducing cognitive load. Used OBS Studio to run observational research across multiple monitors. Once trust was established, integrated with Open Dental for deeper automation.`,
    outcome: `40% reduction in manual posting time. Transformed a messy multi-screen workflow into a structured AI-assisted tool. Created a path to scale without adding headcount, and a strong foundation for full automation in the next phase.`,
  },
  {
    id: 'page-builder', num: '03', year: '2023', client: 'Simplero',
    title: 'Page Builder 2.0',
    subtitle: 'CRM page builder rebuilt from scratch in 2 months to stop churn from competitors.',
    role: 'Lead Product Designer & Architect',
    tags: ['CRM', 'SaaS', 'Design System'],
    metrics: [
      { value: '9%', label: 'Sales increase' },
      { value: '2 mo.', label: 'Delivery speed' },
      { value: '4', label: 'Core capabilities shipped' },
    ],
    accent: '#ff5b4f',
    swatch: ['#ff5b4f', '#f59e0b', '#0a0a0a', '#ededed'],
    challenge: `Users found Simplero's page builder so limiting they resorted to custom CSS and were threatening to migrate to competitors. The old builder prevented migration from other platforms and was driving churn.`,
    approach: `Led the full redesign from scratch: user and expert interviews, competitive analysis, product requirements (no PM — I owned that role), and close collaboration with the Lead Engineer to ship fast. Delivered a WYSIWYG editor, style guide, color picker, and competitor page import — all in 2 months.`,
    outcome: `9% increase in sales post-launch. Customer migration increased. Engineers shipped with minimal friction. Users who previously exported to external developers stayed on platform. Positioned Simplero as a credible CRM platform, not just a tool.`,
  },
  {
    id: 'connect-api', num: '04', year: '2021', client: 'Plastiq',
    title: 'Connect API Payments',
    subtitle: 'PCI Level 1 embedded payments widget shipped with $20M+ monthly volume in month one.',
    role: 'Lead Product Designer',
    tags: ['Fintech', 'API', 'Developer Experience', 'B2B'],
    metrics: [
      { value: '$20M+', label: 'Monthly volume in month 1' },
      { value: '3', label: 'Pre-launch partnerships' },
      { value: '8 wks', label: 'Client onboarding time' },
    ],
    accent: '#0a72ef',
    swatch: ['#0a72ef', '#3291ff', '#0a0a0a', '#ededed'],
    challenge: `Build a PCI-compliant embedded payments widget that would let enterprise clients integrate card and ACH payments into their own platforms — while eliminating merchant fees, expanding working capital, and onboarding partners in weeks.`,
    approach: `Worked closely with the PM to define the product vision from zero. Designed an end-to-end payment widget and developer portal through iterative wireframing and expert interviews. Baked PCI Level 1 certification into the design process from day one — not as an afterthought. Partnered with Billfire, Brex, and PayGround before launch.`,
    outcome: `$20M+ monthly payment volume exceeded in the first month. Three strategic partnerships secured pre-launch. Clients consistently commented on the solidity and intuitiveness of the partner portal. Clients can get up and running in 8 weeks.`,
  },
  {
    id: 'athena-ds', num: '05', year: '2021', client: 'Plastiq',
    title: 'Athena Design System 2.0',
    subtitle: 'Enterprise design system that became the foundation for Plastiq\'s IPO-era brand.',
    role: 'Lead Product Designer — Visual, UX & Interaction Design',
    tags: ['Design System', 'Enterprise', 'Cross-functional'],
    metrics: [
      { value: '3+', label: 'Products standardized' },
      { value: '1', label: 'Cross-org process built' },
      { value: 'IPO', label: 'Foundation for readiness' },
    ],
    accent: '#9f6bff',
    swatch: ['#7928ca', '#ff3da0', '#0a0a0a', '#3291ff'],
    challenge: `Siloed teams creating inconsistent patterns, duplicate work, and a confusing product experience. Design had no process. Engineering couldn't pick up components. Product was shipping features faster than the system could absorb them.`,
    approach: `Co-led workshops to establish design system principles and KPIs. Audited all products holistically. Built documentation around layout grid, dashboard components, payment widget, and feedback indicators. Collaborated with Engineering to build a Storybook equivalent. Created foundational elements: Type, Color, Brand, Spacing — all scoped to scale across multiple products and marketing channels.`,
    outcome: `Engineering pickup time for global components dropped significantly. Design and product teams aligned on goals. Consistent brand language across all DS-adopted surfaces. The DS became Plastiq's foundation for its IPO-era brand evolution.`,
  },
  {
    id: 'plastiq-mktg', num: '06', year: '2022', client: 'Plastiq',
    title: 'Plastiq Marketing Site',
    subtitle: 'Pre-IPO brand relaunch delivered WCAG-compliant in 3–4 weeks.',
    role: 'Lead Product Designer — IA, Interaction, Creative Strategy, Brand',
    tags: ['Brand', 'Website', 'Cross-functional', 'WCAG'],
    metrics: [
      { value: '3–4 wks', label: 'Full delivery timeline' },
      { value: '8', label: 'Cross-functional team' },
      { value: 'WCAG', label: 'Compliant at launch' },
    ],
    accent: '#ff6b60',
    swatch: ['#ff6b60', '#ff3da0', '#0a0a0a', '#ededed'],
    challenge: `Plastiq needed a complete site overhaul in 3–4 weeks ahead of going public. The old site lacked polish, buried products in navigation, and failed to communicate value to investors or ideal customers.`,
    approach: `Took initiative as creative lead despite no formal assignment. Created the visual language, brand direction, and content strategy. Led workshops to align an 8-person cross-functional team (design, copy, marketing, engineering). Built the design system from scratch using my proprietary color system, then directed atomic-scale production across all pages.`,
    outcome: `Delivered on time. WCAG compliant. Drove growth in PayPro (paid tier). Fulfilled the "One Plastiq" unified brand vision. Early analytics and investor feedback overwhelmingly positive.`,
  },
  {
    id: 'disney-cct', num: '07', year: '2020', client: 'The Walt Disney Company',
    title: 'Critical Communication Tool',
    subtitle: 'Enterprise subscription manager used to coordinate 250 critical incidents.',
    role: 'Lead Senior UX Designer',
    tags: ['Enterprise', 'Accessibility', 'Mobile-first', 'Scalable'],
    metrics: [
      { value: '1,600+', label: 'Users signed up' },
      { value: '200K+', label: 'Emails sent' },
      { value: '250', label: 'Critical incidents covered' },
    ],
    accent: '#22c55e',
    swatch: ['#22c55e', '#3291ff', '#0a0a0a', '#ededed'],
    challenge: `A 2019 fire in Italy disrupted Disney network coverage — and the right people were never notified. The support tool was broken: key stakeholders either missed notifications entirely or were flooded with irrelevant ones. With Disney+ launching in months and the Fox acquisition underway, the stakes for fixing this were enormous.`,
    approach: `Led all UX activities solo across a large cross-functional team. Designed a self-service subscription manager that was scalable (infinitely addable brands/tags), flexible (no architecture changes for new assignments), responsive (mobile-first for commuting execs), and intuitive (correct on first login). Used hierarchical toggles, progressive disclosure, and modals to manage cognitive load. Ran usability testing and a full WCAG 2.0 compliance audit before launch.`,
    outcome: `1,600+ users signed up. 200,000+ emails sent. 250 critical incidents communicated — covering NBA Finals, Presidential Debate, NFL Draft, Emmys, and more. SVP of Software Engineering and SVP of Technology Business Operations Strategy both praised the design publicly. Zero major bugs post-launch.`,
  },
  {
    id: 'disney-uap', num: '08', year: '2019–21', client: 'Disney (DTC&I)',
    title: 'Unified Ad Platform',
    subtitle: 'Four brand ad-sales platforms consolidated into one cross-brand system.',
    role: 'Senior UX Designer',
    tags: ['Enterprise', 'Design System', 'Multi-brand', 'React'],
    metrics: [
      { value: '1→4', label: 'Brands consolidated' },
      { value: '$M+', label: 'Booking impact' },
      { value: '2', label: 'Designers led' },
    ],
    accent: '#f59e0b',
    swatch: ['#f59e0b', '#ff6b60', '#0a0a0a', '#ededed'],
    challenge: `ESPN, Freeform, FX Networks, and National Geographic each had their own ad sales platform. No standardization, no cross-brand collaboration, no efficiency. Booking ads across Disney's portfolio required navigating completely different systems.`,
    approach: `Audited and analyzed complex data sets across all four brands: reporting, client relations, dashboards, internal communications. Unified nomenclature, process, and front-end UI aligned to backend architecture. Led a team of two designers. Built React components designed to plug into the Adapt design system — laying the foundation for a future-proof cross-brand system.`,
    outcome: `All four brands unified under the AdVisor platform. Users across Freeform, FX, and NatGeo immediately started using it and reported improved productivity over their previous systems. Laid the foundation for Disney's cross-brand Adapt design system and in-house React component library.`,
  },
];

// ============================================================
// CaseCard — gradient cover tile used on homepage + drawer
// ============================================================
const CaseCard = ({ c, featured = false }) => {
  const viewportWidth = useViewportWidth();
  const useSharedMobileAspectRatio = viewportWidth <= TABLET_BREAKPOINT;
  const mediaAspectRatio = useSharedMobileAspectRatio ? '4/3' : featured ? '16/8' : '4/3';

  return (
    <a href={`/work/${c.id}`} className="case-card" style={{
      display: 'flex', flexDirection: 'column', gap: 16, height: '100%',
      textDecoration: 'none', color: 'inherit',
      borderRadius: 12, transition: 'transform var(--duration-base) ease',
    }}>
      <div className="case-card-media" style={{
        position: 'relative', width: '100%',
        aspectRatio: mediaAspectRatio,
        background: `linear-gradient(135deg, ${c.swatch[0]} 0%, ${c.swatch[1]} 100%)`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: 'var(--shadow-card-subtle)',
      }}>
        <div className="case-card-sheen" />
        {/* stacked "screen" silhouettes */}
        <div className="case-card-screen" style={{
          position: 'absolute', left: '16%', right: '16%', bottom: '-6%', top: '22%',
          background: c.swatch[2],
          borderRadius: '10px 10px 0 0',
          boxShadow: `0 -1px 0 0 rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,0.35)`,
        }}>
          <div style={{
            position: 'absolute', top: 10, left: 10, right: 10, height: 18,
            display: 'flex', alignItems: 'center', gap: 5,
            borderBottom: `1px solid ${c.swatch[3]}22`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: c.swatch[3], opacity: 0.7 }} />
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: c.swatch[0], opacity: 0.7 }} />
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: c.swatch[1], opacity: 0.7 }} />
          </div>
          <div className="case-card-line case-card-line--full" style={{
            position: 'absolute', top: 40, left: 16, right: 16, height: 10, borderRadius: 3,
            background: `${c.swatch[3]}22`,
          }} />
          <div className="case-card-line case-card-line--left" style={{
            position: 'absolute', top: 58, left: 16, width: '40%', height: 10, borderRadius: 3,
            background: `${c.swatch[0]}44`,
          }} />
          <div className="case-card-line case-card-line--right" style={{
            position: 'absolute', top: 58, left: '46%', width: '38%', height: 10, borderRadius: 3,
            background: `${c.swatch[3]}22`,
          }} />
        </div>
        {/* accent tag */}
        <div className="case-card-tag" style={{
          position: 'absolute', top: 16, left: 16,
          fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-micro)', fontWeight: 'var(--font-weight-medium)',
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em',
          background: 'rgba(0,0,0,0.32)', padding: '5px 9px', borderRadius: 4,
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        }}>{c.num} · {c.year} · {c.client}</div>
      </div>

      <div style={{ padding: '4px 4px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <h3 style={{
            fontSize: featured ? 'clamp(24px, 2.6vw, 32px)' : 22,
            fontWeight: 'var(--font-weight-semibold)', letterSpacing: '-0.025em',
            color: 'var(--fg-primary)', margin: 0, lineHeight: 'var(--line-height-snug)',
          }}>{c.title}</h3>
        </div>
        <p style={{ fontSize: featured ? 16 : 14, lineHeight: 'var(--line-height-relaxed-plus)', color: 'var(--fg-secondary)', margin: '0 0 14px', maxWidth: 560 }}>{c.subtitle}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
          {c.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 'var(--font-size-label-sm)', fontWeight: 'var(--font-weight-medium)', padding: '3px 10px', borderRadius: 9999, color: 'var(--fg-secondary)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>{t}</span>
          ))}
        </div>
      </div>
    </a>
  );
};

// ============================================================
// Work — homepage section
// ============================================================
const Work = ({ onOpenDrawer }) => {
  const viewportWidth = useViewportWidth();
  const workHeadColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : '220px 1fr';
  const secondaryColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : 'repeat(2, minmax(0, 1fr))';

  return (
    <section id="work" style={{ borderTop: '1px solid var(--color-gray-100)', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal className="work-head" variant="section" style={{ display: 'grid', gridTemplateColumns: workHeadColumns, gap: viewportWidth <= TABLET_BREAKPOINT ? 24 : 64, alignItems: 'start', marginBottom: 56 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span style={{ color: 'var(--color-preview-pink)' }}>02 — </span>Selected work
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: '-0.04em', color: 'var(--fg-primary)', margin: 0, maxWidth: 760 }}>
            A decade of systems work — <span style={{ color: 'var(--fg-tertiary)' }}>across fintech, healthcare, and enterprise.</span>
          </h2>
        </Reveal>

        <Reveal delay={70} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, marginBottom: 32 }}>
          <CaseCard c={CASE_STUDIES[0]} featured />
        </Reveal>
        <Reveal delay={130} style={{ display: 'grid', gridTemplateColumns: secondaryColumns, gap: 32, marginBottom: 48, alignItems: 'stretch' }}>
          <CaseCard c={CASE_STUDIES[1]} />
          <CaseCard c={CASE_STUDIES[2]} />
        </Reveal>

        <Reveal as="div" delay={180} style={{ display: 'inline-flex' }}>
          <button onClick={onOpenDrawer} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', padding: '10px 16px',
            borderRadius: 6, background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background var(--duration-fast)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            See all {CASE_STUDIES.length} case studies
            <AppIcon icon={ArrowUpRight} size={12} />
          </button>
        </Reveal>
      </div>
    </section>
  );
};

// ============================================================
// WorkDrawer — all case studies
// ============================================================
const WorkDrawer = ({ open, onClose }) => {
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: open ? 'rgba(0,0,0,0.45)' : 'transparent', backdropFilter: open ? 'blur(4px)' : 'none', WebkitBackdropFilter: open ? 'blur(4px)' : 'none', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity var(--duration-base-plus) ease' }} />
      <aside role="dialog" aria-label="All case studies" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 81, width: 'min(980px, 96vw)',
        background: 'var(--bg-page)', boxShadow: open ? '-24px 0 80px rgba(0,0,0,0.35), inset 1px 0 0 var(--color-gray-100)' : 'none',
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform var(--duration-slowest) cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--color-gray-100)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>All case studies · {CASE_STUDIES.length}</div>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 9999, display: 'grid', placeItems: 'center', background: 'transparent', color: 'var(--fg-primary)', border: 'none', cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>
            <AppIcon icon={X} size={14} />
          </button>
        </div>
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {CASE_STUDIES.map(c => (
              <div key={c.id} onClick={onClose}>
                <CaseCard c={c} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

// ============================================================
// CaseStudyPage — individual case study page
// ============================================================
const CaseStudyPage = ({ c, onBack }) => {
  React.useEffect(() => {
    if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('case_study_view', { case_study_id: c.id });
  }, [c.id]);

  const idx = CASE_STUDIES.findIndex(x => x.id === c.id);
  const prev = CASE_STUDIES[(idx - 1 + CASE_STUDIES.length) % CASE_STUDIES.length];
  const next = CASE_STUDIES[(idx + 1) % CASE_STUDIES.length];

  return (
    <article style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px 96px' }}>
      <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)',
        textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 40, transition: 'color var(--duration-fast)',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-tertiary)'}
      >
        <AppIcon icon={ArrowLeft} size={12} />
        Back to work
      </a>

      {/* Cover */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '21/9',
        background: `linear-gradient(135deg, ${c.swatch[0]} 0%, ${c.swatch[1]} 100%)`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: 'var(--shadow-card-subtle)', marginBottom: 48,
      }}>
        {c.coverImage && (
          <div style={{
            position: 'absolute', inset: '56px 28px 24px',
            borderRadius: 12, overflow: 'hidden',
            background: 'var(--bg-page)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 12px',
              background: 'color-mix(in oklab, var(--bg-page) 86%, white 14%)',
              borderBottom: '1px solid color-mix(in oklab, var(--color-gray-100) 88%, transparent)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'rgba(255,95,86,0.95)', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'rgba(255,189,46,0.95)', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'rgba(39,201,63,0.95)', display: 'inline-block' }} />
              <div style={{
                marginLeft: 10, flex: 1, height: 12, borderRadius: 9999,
                background: 'color-mix(in oklab, var(--color-gray-100) 92%, transparent)',
                opacity: 0.78,
              }} />
            </div>
            <div style={{
              width: '100%', height: 'calc(100% - 34px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-page)',
            }}>
              <img src={c.coverImage} alt={`${c.title} dashboard preview`} style={{
                width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center top', display: 'block',
              }} />
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute', top: 20, left: 22,
          fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', fontWeight: 'var(--font-weight-medium)',
          color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em',
          background: 'rgba(0,0,0,0.32)', padding: '5px 10px', borderRadius: 4,
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        }}>{c.num} · {c.year} · {c.client}</div>
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 'var(--font-weight-semibold)',
          lineHeight: 'var(--line-height-solid)', letterSpacing: '-0.04em',
          color: 'var(--fg-primary)', margin: '0 0 20px',
        }}>{c.title}</h1>
        <p style={{ fontSize: 'clamp(17px, 1.4vw, 21px)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-secondary)', margin: '0 0 24px', maxWidth: 760 }}>{c.subtitle}</p>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>{c.role}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {c.tags.map(t => (
            <span key={t} style={{ fontSize: 'var(--font-size-label-sm)', fontWeight: 'var(--font-weight-medium)', padding: '3px 10px', borderRadius: 9999, color: 'var(--fg-secondary)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <div className="cs-metrics-grid" style={{
        display: 'grid', gridTemplateColumns: `repeat(${c.metrics.length}, 1fr)`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: 'var(--shadow-card-subtle)',
        background: 'var(--bg-page)', marginBottom: 64,
      }}>
        {c.metrics.map((m, i) => (
          <div key={i} style={{
            padding: '32px 24px', textAlign: 'center',
            borderRight: i < c.metrics.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
          }}>
            <div style={{ fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 'var(--font-weight-bold)', letterSpacing: '-0.04em', color: c.accent, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Challenge / Approach / Outcome */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56, maxWidth: 760 }}>
        {[
          { label: 'Challenge', body: c.challenge },
          { label: 'Approach', body: c.approach },
          { label: 'Outcome', body: c.outcome },
        ].map(({ label, body }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: c.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
            <p style={{ fontSize: 'clamp(16px, 1.25vw, 19px)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-primary)', margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <div className="cs-prevnext" style={{
        marginTop: 96, paddingTop: 32,
        borderTop: '1px solid var(--color-gray-100)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
      }}>
        <a href={`/work/${prev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-micro)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>← Previous</div>
          <div style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: '-0.025em', color: 'var(--fg-primary)' }}>{prev.title}</div>
          <div style={{ fontSize: 'var(--font-size-body-xs)', color: 'var(--fg-tertiary)', marginTop: 4 }}>{prev.client}</div>
        </a>
        <a href={`/work/${next.id}`} style={{ textDecoration: 'none', color: 'inherit', textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-micro)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Next →</div>
          <div style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: '-0.025em', color: 'var(--fg-primary)' }}>{next.title}</div>
          <div style={{ fontSize: 'var(--font-size-body-xs)', color: 'var(--fg-tertiary)', marginTop: 4 }}>{next.client}</div>
        </a>
      </div>
    </article>
  );
};

// ============================================================
// Contact + Footer
// ============================================================
const ContactCard = ({ label, value, href, eventName, copyValue }) => {
  const [copied, setCopied] = React.useState(false);
  const resetTimerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleCopy = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!copyValue) return;

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const hasCopyButton = Boolean(copyValue);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="contact-card" style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 8, padding: hasCopyButton ? '18px 56px 18px 20px' : '18px 20px', borderRadius: 8,
      background: 'var(--bg-page)', boxShadow: 'var(--shadow-card-subtle)', textDecoration: 'none',
      transition: 'transform var(--duration-fast-mid) ease',
    }}
      onClick={() => {
        if (window.trackAnalyticsEvent && eventName) {
          window.trackAnalyticsEvent(eventName, { link_url: href });
        }
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {copyValue && (
        <button
          type="button"
          data-copy-button="true"
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
            opacity: 1,
            pointerEvents: 'auto',
            zIndex: 2,
            transition: 'opacity var(--duration-fast) ease, color var(--duration-fast) ease, background var(--duration-fast) ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = copied ? 'var(--color-develop-blue)' : 'var(--fg-primary)';
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = copied ? 'var(--color-develop-blue)' : 'var(--fg-tertiary)';
            e.currentTarget.style.background = 'color-mix(in oklab, var(--bg-page) 76%, var(--bg-subtle) 24%)';
          }}
        >
          <AppIcon icon={copied ? Check : Copy} size={13} />
        </button>
      )}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>{value}</span>
    </a>
  );
};

// ============================================================
// Key Facts (AEO Section)
// ============================================================
const KeyFacts = () => {
  const sectionRef = React.useRef(null);
  const gradRef = React.useRef(null);
  const mouseRef = React.useRef({ x: 0.5, y: 0.5 });
  const animRef = React.useRef(null);
  const viewportWidth = useViewportWidth();
  const factsColumns = viewportWidth <= COMPACT_LAYOUT_BREAKPOINT ? '1fr' : viewportWidth <= WIDE_LAYOUT_BREAKPOINT ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)';

  const handleMouseMove = React.useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  React.useEffect(() => {
    const loop = (ts) => {
      const t = ts / 1000;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Blob A — ship-red: drifts top-left area, mouse pushes right/down
      const ax = 25 + Math.sin(t * 0.35) * 22 + mx * 45;
      const ay = 45 + Math.cos(t * 0.28) * 28 + my * 35;

      // Blob B — preview-pink: drifts top-right area, mouse pushes left/down
      const bx = 72 + Math.cos(t * 0.42) * 20 - mx * 35;
      const by = 28 + Math.sin(t * 0.38) * 22 + my * 45;

      // Blob C — develop-blue: drifts bottom-center, mouse pushes slightly
      const cx = 50 + Math.sin(t * 0.31 + 2) * 28 + mx * 20;
      const cy = 72 + Math.cos(t * 0.33) * 24 - my * 30;

      if (gradRef.current) {
        gradRef.current.style.background = `
          radial-gradient(ellipse 120% 110% at ${ax}% ${ay}%, var(--color-ship-red)     0%, color-mix(in srgb, var(--color-ship-red) 0%, transparent) 100%),
          radial-gradient(ellipse 130% 120% at ${bx}% ${by}%, var(--color-preview-pink) 0%, color-mix(in srgb, var(--color-preview-pink) 0%, transparent) 100%),
          radial-gradient(ellipse 140% 130% at ${cx}% ${cy}%, var(--color-develop-blue) 0%, color-mix(in srgb, var(--color-develop-blue) 0%, transparent) 100%)
        `;
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const facts = [
    { label: 'Core Expertise', value: 'AI Workflows, Design Systems, Enterprise UX, Fintech, Healthcare SaaS' },
    { label: 'Role Focus', value: 'Principal Designer / Head of Design in the Making — Product Strategy, IA, Interaction & Prototyping, 0→1 Delivery' },
    { label: 'Experience', value: 'Impactful work at Disney, Plastiq, Simplero, and Wisdom (2019–Present)' },
    { label: 'Writing', value: null, custom: true },
  ];

  return (
    <section
      ref={sectionRef}
      id="facts"
      className="facts-section"
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        padding: 'var(--layout-4) var(--space-6)',
        overflow: 'hidden',
        background: 'var(--color-develop-blue)',
      }}
    >
      {/* Swirling mesh gradient — rAF driven, no CSS transition needed */}
      <div ref={gradRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 1,
      }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal className="work-head" variant="section" style={{
          display: 'grid',
          gridTemplateColumns: viewportWidth <= TABLET_BREAKPOINT ? '1fr' : '220px 1fr',
          gap: viewportWidth <= TABLET_BREAKPOINT ? 'var(--space-6)' : 'var(--layout-2)',
          alignItems: 'start',
          marginBottom: 'var(--layout-1)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-body-sm)',
            color: 'color-mix(in srgb, var(--fg-on-dark) 74%, transparent)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            <span style={{ color: 'color-mix(in srgb, var(--color-develop-blue) 48%, var(--fg-on-dark) 52%)' }}>03 — </span>At a Glance
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: '-0.04em', color: 'var(--fg-on-dark)', margin: 0, maxWidth: 760 }}>
            The short version: <span style={{ color: 'color-mix(in srgb, var(--fg-on-dark) 74%, transparent)' }}>systems thinking, product depth, and cross-functional range.</span>
          </h2>
        </Reveal>
        <Reveal variant="section" className="facts-grid" style={{
          display: 'grid',
          gridTemplateColumns: factsColumns,
          gap: 'var(--space-5)',
        }}>
          {facts.map((f, i) => (
            <div key={i} style={{
              padding: 'var(--space-6) var(--space-5)',
              borderRadius: 12,
              background: 'var(--bg-subtle)',
              boxShadow: 'var(--shadow-card-subtle)',
              transition: 'box-shadow var(--duration-fast-mid) ease, transform var(--duration-fast-mid) ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-full)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)' }}>
                {f.label}
              </div>
              {f.custom ? (
                <div style={{ fontSize: 'var(--font-size-tall)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  Sharing insights on design and product strategy via{' '}
                  <a href="https://www.linkedin.com/in/omartavarez/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-develop-blue)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>LinkedIn</a>
                  {' '}and{' '}
                  <a href="https://substack.com/@designedbyomar" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-preview-pink)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>Substack</a>
                </div>
              ) : (
                <div style={{ fontSize: 'var(--font-size-tall)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  {f.value}
                </div>
              )}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

const Contact = () => {
  const viewportWidth = useViewportWidth();
  const contactGridColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : '220px 1fr';
  const contactCardColumns = viewportWidth <= MOBILE_BREAKPOINT ? '1fr' : viewportWidth <= WIDE_LAYOUT_BREAKPOINT ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))';

  return (
    <section id="contact" style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-4) var(--space-6) var(--layout-3)' }}>
      <Reveal className="contact-grid" variant="section" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: contactGridColumns, gap: viewportWidth <= TABLET_BREAKPOINT ? 'var(--space-6)' : 'var(--layout-2)', alignItems: 'start' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span style={{ color: 'var(--color-ship-red)' }}>04 — </span>Contact
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', maxWidth: 820 }}>
          <h2 style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-semi-tight)', letterSpacing: '-0.04em', color: 'var(--fg-secondary)', margin: 0 }}>
            Turn complexity <br /><span style={{ color: 'var(--fg-secondary)' }}>into clarity. </span><br /><span style={{ color: 'var(--fg-primary)' }}>Let's talk.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: contactCardColumns, gap: 'var(--space-4)' }}>
            <ContactCard label="Email" value="omar@designedbyomar.com" href="mailto:omar@designedbyomar.com" eventName="contact_click_email" copyValue="omar@designedbyomar.com" />
            <ContactCard label="Resume / CV" value="Open PDF" href="/Omar%20Tavarez%20Resume.pdf" eventName="resume_download" />
            <ContactCard label="LinkedIn" value="in/omartavarez" href="https://www.linkedin.com/in/omartavarez/" eventName="contact_click_linkedin" />
            <ContactCard label="GitHub" value="designedbyomar" href="https://github.com/designedbyomar" eventName="contact_click_github" />
            <ContactCard label="Substack" value="@designedbyomar" href="https://substack.com/@designedbyomar" eventName="contact_click_substack" />
          </div>
        </div>
      </Reveal>
    </section>
  );
};

// ============================================================
// Alien pixel icon + retro arrival animation
// ============================================================
const FooterAlien = () => {
  const ref = React.useRef(null);
  const [played, setPlayed] = React.useState(false);

  React.useEffect(() => {
    if (played) return;
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setPlayed(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setPlayed(true);
        obs.disconnect();
      }
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [played]);

  return <div ref={ref} style={{ display: 'inline-block' }}><FooterArrival played={played} /></div>;
};

const SiteFooter = ({ onOpenAbout, onHome, scrollToSection }) => {
  const footerLabelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-body-sm)',
    color: 'var(--fg-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };
  const footerLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: 'fit-content',
    fontSize: 'var(--font-size-tall)',
    fontWeight: 'var(--font-weight-medium)',
    lineHeight: 'var(--line-height-medium)',
    color: 'var(--fg-secondary)',
    textDecoration: 'none',
    transition: 'color var(--duration-fast-mid) ease, transform var(--duration-fast-mid) ease',
  };
  const footerButtonStyle = {
    ...footerLinkStyle,
    padding: 0,
    background: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  const enhanceLink = (event, color = 'var(--fg-primary)') => {
    event.currentTarget.style.color = color;
    event.currentTarget.style.transform = 'translateX(4px)';
  };

  const resetLink = (event, color = 'var(--fg-secondary)') => {
    event.currentTarget.style.color = color;
    event.currentTarget.style.transform = 'translateX(0)';
  };

  const goSection = (id) => (event) => {
    event.preventDefault();
    scrollToSection(id);
  };

  return (
    <footer style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-1) var(--space-6) var(--layout-2)' }}>
      <style dangerouslySetInnerHTML={{
        __html: footerAlienStyles + `
        .site-footer-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(180px, 0.85fr) minmax(180px, 0.85fr);
          gap: 40px 72px;
        }
        .site-footer-block {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }
        @media (max-width: 900px) {
          .site-footer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 36px 32px;
          }
          .site-footer-brand {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 600px) {
          .site-footer-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 32px;
          }
        }
      `}} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="site-footer-grid">
          <div className="site-footer-block site-footer-brand" style={{ gap: 'var(--space-6)' }}>
            <div style={{ display: 'inline-flex', width: 'fit-content' }}>
              <NavLogo onClick={(event) => { event.preventDefault(); onHome(); }} />
            </div>
            <p style={{ maxWidth: 360, margin: 0, fontSize: 'var(--font-size-body-lg)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-tertiary)' }}>
              Product design for AI workflows, enterprise systems, fintech, and healthcare SaaS.
            </p>
            <span className="footer-signoff" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              width: 'fit-content',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-body-sm)',
              lineHeight: 'var(--line-height-relaxed-plus)',
              color: 'var(--fg-tertiary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              <span>Designed by Omar. Built with AI-native coding tools.</span>
              <FooterAlien />
            </span>
          </div>

          <div className="site-footer-block">
            <span style={footerLabelStyle}>Site Links</span>
            <button
              type="button"
              className="site-footer-link"
              onClick={goSection('work')}
              style={footerButtonStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              Work
            </button>
            <button
              type="button"
              className="site-footer-link"
              onClick={onOpenAbout}
              style={footerButtonStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              About
            </button>
            <a
              href="#contact"
              className="site-footer-link"
              onClick={goSection('contact')}
              style={footerLinkStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              Contact
            </a>
            <a
              href="/privacy"
              className="site-footer-link"
              style={footerLinkStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              Privacy Policy
            </a>
            <a
              href="design-system.html"
              className="site-footer-link"
              aria-label="See Design System"
              style={footerLinkStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              Design System
            </a>
          </div>

          <div className="site-footer-block">
            <span style={footerLabelStyle}>Social</span>
            <a
              href="https://www.linkedin.com/in/omartavarez/"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-link"
              style={footerLinkStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/designedbyomar"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-link"
              style={footerLinkStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              GitHub
            </a>
            <a
              href="https://substack.com/@designedbyomar"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-link"
              style={footerLinkStyle}
              onMouseEnter={(event) => enhanceLink(event)}
              onMouseLeave={(event) => resetLink(event)}
            >
              Substack
            </a>
            <span style={{ paddingTop: 8, fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              © 2026 Omar Tavarez
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};

// ============================================================
// Privacy Policy Page
// ============================================================
const PrivacyPolicyPage = ({ theme, onBack }) => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px', minHeight: '100vh' }}>
    <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-secondary)', textDecoration: 'none', marginBottom: 48
    }}>← Back to home</a>
    <h1 style={{ fontSize: 'var(--font-size-display-sm)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: '-0.03em', color: 'var(--fg-primary)', marginBottom: 32 }}>Privacy Policy</h1>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--fg-secondary)', lineHeight: 'var(--line-height-relaxed-xl)', fontSize: 'var(--font-size-tall)' }}>
      <p>Last updated: April 2026</p>

      <h2 style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--fg-primary)', marginTop: 16 }}>1. Data Collection</h2>
      <p>This website ("designedbyomar.com") uses Google Analytics 4 to collect basic, anonymized telemetry data such as page views, scroll depth, and interaction events (like theme toggling or external link clicks). This helps me understand which case studies are resonating and improve the overall portfolio experience.</p>

      <h2 style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--fg-primary)', marginTop: 16 }}>2. Cookies</h2>
      <p>Google Analytics utilizes cookies to distinguish unique users and sessions. By continuing to use this site, you consent to the use of these tracking mechanisms unless you have disabled cookies in your browser or are using privacy-enhancing browser extensions.</p>

      <h2 style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--fg-primary)', marginTop: 16 }}>3. Third-party Links</h2>
      <p>This site contains links to other websites, including LinkedIn, GitHub, and Substack. Please be aware that I am not responsible for the privacy practices of such other sites. I encourage users to be aware when they leave my site and to read the privacy statements of any other site that collects personally identifiable information.</p>

      <h2 style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--fg-primary)', marginTop: 16 }}>4. Contact</h2>
      <p>For any questions regarding this policy, please reach out to <a href="mailto:omar@designedbyomar.com" style={{ color: 'var(--color-develop-blue)', textDecoration: 'none' }}>omar@designedbyomar.com</a>.</p>
    </div>
  </div>
);

// ============================================================
// Cookie Banner
// ============================================================
const CookieBanner = ({ onAccept, onPrivacy }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      right: 24,
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth: 580,
        width: '100%',
        background: 'color-mix(in oklab, var(--bg-page) 82%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card-full)',
        borderRadius: 16,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        pointerEvents: 'auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px) scale(0.98)',
        transition: 'all var(--duration-slowest-xxl) cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid var(--color-gray-100)',
      }}>
        <p style={{ fontSize: 'var(--font-size-body-md)', color: 'var(--fg-secondary)', lineHeight: 'var(--line-height-relaxed)', margin: 0 }}>
          I use cookies to understand how you interact with my work. Learn more in the <a href="#" onClick={(e) => { e.preventDefault(); onPrivacy(); }} style={{ color: 'var(--fg-primary)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Privacy Policy</a>.
        </p>
        <button 
          onClick={onAccept}
          style={{
            background: 'var(--fg-primary)',
            color: 'var(--bg-page)',
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: 'var(--font-size-body-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'transform var(--duration-fast) ease, opacity var(--duration-fast) ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Accept
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Route metadata + analytics
// ============================================================
const SITE_ORIGIN = 'https://designedbyomar.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/Images/og-image.png`;
const LOADER_SESSION_KEY = 'omar.loader-seen';

const setHeadValue = (selector, attribute, value) => {
  const element = document.head.querySelector(selector);
  if (element && value) element.setAttribute(attribute, value);
};

const getRouteMeta = (route, currentCase) => {
  if (route.type === 'privacy') {
    return {
      title: 'Privacy Policy — Omar Tavarez',
      description: 'Privacy policy and data collection details for designedbyomar.com.',
      url: `${SITE_ORIGIN}/privacy`,
      robots: 'index,follow,max-image-preview:large',
    };
  }

  if (currentCase) {
    return {
      title: `${currentCase.title} — Omar Tavarez`,
      description: currentCase.subtitle,
      url: `${SITE_ORIGIN}/work/${currentCase.id}/`,
      robots: 'index,follow,max-image-preview:large',
    };
  }

  return {
    title: 'designedbyomar — Omar Tavarez',
    description: 'Omar Tavarez is a product designer focused on AI workflows, design systems, fintech, healthcare SaaS, and enterprise product strategy.',
    url: `${SITE_ORIGIN}/`,
    robots: 'index,follow,max-image-preview:large',
  };
};

const syncRouteHead = (meta) => {
  document.title = meta.title;
  setHeadValue('meta[name="description"]', 'content', meta.description);
  setHeadValue('meta[name="robots"]', 'content', meta.robots);
  setHeadValue('link[rel="canonical"]', 'href', meta.url);
  setHeadValue('meta[property="og:title"]', 'content', meta.title);
  setHeadValue('meta[property="og:description"]', 'content', meta.description);
  setHeadValue('meta[property="og:url"]', 'content', meta.url);
  setHeadValue('meta[property="og:image"]', 'content', DEFAULT_OG_IMAGE);
  setHeadValue('meta[name="twitter:title"]', 'content', meta.title);
  setHeadValue('meta[name="twitter:description"]', 'content', meta.description);
  setHeadValue('meta[name="twitter:image"]', 'content', DEFAULT_OG_IMAGE);
};

const trackPageView = (meta, route, currentCase) => {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: meta.title,
    page_location: meta.url,
    page_path: window.location.pathname,
    page_type: route.type,
    case_study_id: currentCase?.id,
  });
};

const syncSentryContext = (route, currentCase, theme) => {
  if (!SENTRY_ENABLED) return;

  Sentry.setTag('route_type', route.type);
  Sentry.setTag('theme', theme);
  Sentry.setContext('page', {
    pathname: window.location.pathname,
    routeType: route.type,
    caseStudyId: currentCase?.id ?? null,
    theme,
  });
};

const AppShellErrorFallback = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 24px', background: 'var(--bg-page)', color: 'var(--fg-primary)' }}>
    <div style={{ width: '100%', maxWidth: 720, borderRadius: 16, padding: '32px 28px', background: 'color-mix(in oklab, var(--bg-subtle) 72%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-tertiary)', marginBottom: 14 }}>
        Unexpected error
      </div>
      <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
        This view failed to load.
      </h1>
      <p style={{ fontSize: 'var(--font-size-tall)', lineHeight: 'var(--line-height-relaxed-xl)', color: 'var(--fg-secondary)', margin: '0 0 24px' }}>
        Refresh the page or head back home. The issue has been logged for review.
      </p>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--bg-page)', padding: '10px 16px', borderRadius: 6, background: 'var(--fg-primary)', textDecoration: 'none' }}>
        Back home
      </a>
    </div>
  </div>
);

// ============================================================
// Routing
// ============================================================
// ============================================================
const useRoute = () => {
  const parse = (path) => {
    if (path.match(/^\/privacy\/?$/)) return { type: 'privacy' };
    const m = path.match(/^\/work\/(.+?)(\/)?$/);
    return m ? { type: 'case', id: m[1] } : { type: 'home' };
  };
  const [route, setRoute] = React.useState(() => parse(window.location.pathname));

  React.useEffect(() => {
    const on = () => {
      const next = parse(window.location.pathname);
      setRoute(prev => {
        if (prev.type !== next.type || (prev.type === 'case' && prev.id !== next.id)) {
          window.scrollTo(0, 0);
        }
        return next;
      });
    };
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  React.useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.href) {
        const url = new URL(a.href);
        if (url.origin === window.location.origin) {
          if (url.pathname === window.location.pathname && url.hash) return;
          if (url.pathname.startsWith('/work/') || url.pathname === '/privacy' || url.pathname === '/') {
            e.preventDefault();
            history.pushState(null, '', url.pathname + url.search + url.hash);
            window.dispatchEvent(new Event('popstate'));
          } else if (url.pathname.endsWith('.html')) {
            // Let normal HTML navigation happen
          }
        }
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return route;
};

// ============================================================
// App
// ============================================================
const App = () => {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('omar.theme') || 'dark');
  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('omar.theme', theme); }, [theme]);

  const [loading, setLoading] = React.useState(() => {
    try {
      return sessionStorage.getItem(LOADER_SESSION_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const [cookieConsent, setCookieConsent] = React.useState(() => {
    try {
      return localStorage.getItem('omar.consent') === 'true';
    } catch {
      return true; // Default to true if storage fails to avoid annoying users
    }
  });

  const handleAcceptCookies = () => {
    try {
      localStorage.setItem('omar.consent', 'true');
      setCookieConsent(true);
    } catch (e) {
      setCookieConsent(true);
    }
  };

  const showPrivacy = () => {
    setAboutOpen(false);
    setWorkOpen(false);
    history.pushState(null, '', '/privacy');
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    const pageReady = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const heroSrc = theme === 'light' ? '/Images/omar-light.webp' : '/Images/omar.webp';
    const heroImageReady = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = heroSrc;
      if (img.complete) resolve();
    });

    Promise.all([pageReady, fontsReady, heroImageReady]).then(() => {
      if (!cancelled) {
        try {
          sessionStorage.setItem(LOADER_SESSION_KEY, 'true');
        } catch { }
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loading, theme]);

  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [workOpen, setWorkOpen] = React.useState(false);
  const galaxy = { density: 1.9, speed: 0.75, style: 'pixel', accent: 'workflow', theme };

  const route = useRoute();
  const currentCase = route.type === 'case' ? CASE_STUDIES.find(c => c.id === route.id) : null;

  React.useEffect(() => {
    const meta = getRouteMeta(route, currentCase);
    syncRouteHead(meta);
    trackPageView(meta, route, currentCase);
  }, [route, currentCase]);

  React.useEffect(() => {
    syncSentryContext(route, currentCase, theme);
  }, [route, currentCase, theme]);

  const isHomePath = () => {
    const p = window.location.pathname;
    return p === '/' || p === '/index.html' || p === '' || p.endsWith('/index.html');
  };

  const goHome = () => {
    if (!isHomePath()) {
      history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const performScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const headerHeight = 64;
        const paddingMap = {
          'about': 96,
          'work': 96,
          'contact': 120
        };
        const paddingTop = paddingMap[id] || 0;
        const offset = paddingTop - headerHeight;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition + offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    };

    if (!isHomePath()) {
      history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
      setTimeout(performScroll, 120);
    } else {
      performScroll();
    }
  };

  return (
    <>
      <LogoLoader visible={loading} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity var(--duration-very-slow) ease var(--duration-fastest)' }}>
        <Nav theme={theme} setTheme={setTheme} onOpenAbout={() => setAboutOpen(true)} onHome={goHome} scrollToSection={scrollToSection} />
        <main>
          {route.type === 'privacy' ? (
            <PrivacyPolicyPage theme={theme} onBack={goHome} />
          ) : currentCase ? (
            <CaseStudyPage c={currentCase} onBack={goHome} />
          ) : (
            <>
              <Hero galaxy={galaxy} theme={theme} scrollToSection={scrollToSection} />
              <About onOpenDrawer={() => setAboutOpen(true)} />
              <Work onOpenDrawer={() => setWorkOpen(true)} />
              <KeyFacts />
              <Contact />
            </>
          )}
        </main>
        <SiteFooter onOpenAbout={() => setAboutOpen(true)} onHome={goHome} scrollToSection={scrollToSection} />
      </div>
      <AboutDrawer open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <WorkDrawer open={workOpen} onClose={() => setWorkOpen(false)} />
      {!cookieConsent && <CookieBanner onAccept={handleAcceptCookies} onPrivacy={showPrivacy} />}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Sentry.ErrorBoundary fallback={<AppShellErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
    <SpeedInsights />
    <Analytics />
  </>
);
