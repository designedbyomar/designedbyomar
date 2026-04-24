import React from 'react';
import ReactDOM from 'react-dom/client';
// ============================================================
// Galaxy — canvas pixel orbit
// ============================================================
const Galaxy = ({ density = 1, speed = 1, style = 'pixel', accent = 'mono', theme = 'dark' }) => {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const activeRef = React.useRef(false);
  React.useEffect(() => {
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
    let tick = () => {};
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
      if (style === 'ethereal') { ctx.fillStyle = toAlpha(bgPage, theme === 'dark' ? 0.18 : 0.22); ctx.fillRect(0,0,w,h); }
      else ctx.clearRect(0,0,w,h);
      for (const p of particles) {
        p.a += p.av * dt * speed; p.twinkle += p.tv;
        const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * p.tilt;
        const back = Math.sin(p.a) < 0;
        ctx.globalAlpha = Math.max(0, Math.min(1, (back ? 0.22 : 1) * (0.55 + Math.sin(p.twinkle) * 0.45) * (p.outer ? 0.45 : 1)));
        ctx.fillStyle = p.color;
        const s = p.size * (back ? 0.85 : 1);
        ctx.fillRect(Math.round(x - s/2), Math.round(y - s/2), s, s);
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
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />;
};

// ============================================================
// Portrait
// ============================================================
const HERO_STATS = [
  {
    value: '15+',
    label: 'Years building digital products',
    desktop: { top: '48%', left: '-10%', maxWidth: 172 },
    mobile: { top: '42%', left: '-1%', maxWidth: 144 },
    motion: { phase: 0.2, radiusX: 7, radiusY: 4, boostX: 8, boostY: 5, parallaxX: -0.34, parallaxY: -0.14, rotate: 1.2, rotateBoost: 0.8, rotateDir: -1 },
  },
  {
    value: '500+',
    label: 'User interviews across AI, fintech, healthcare, and ops workflows',
    desktop: { top: '72%', left: '-10%', maxWidth: 202 },
    mobile: { top: '63%', left: '-2%', maxWidth: 160 },
    motion: { phase: 1.8, radiusX: 7, radiusY: 5, boostX: 8, boostY: 6, parallaxX: -0.36, parallaxY: 0.10, rotate: 1.3, rotateBoost: 0.85, rotateDir: -1 },
  },
  {
    value: '90%+',
    label: 'User adoption across enterprise tooling',
    desktop: { top: '18%', right: '2%', maxWidth: 186 },
    mobile: { top: '14%', right: '0%', maxWidth: 148 },
    motion: { phase: 3.1, radiusX: 7, radiusY: 4, boostX: 8, boostY: 5, parallaxX: 0.34, parallaxY: -0.14, rotate: 1.2, rotateBoost: 0.8, rotateDir: 1 },
  },
  {
    value: '30+',
    label: 'Products shipped',
    desktop: { bottom: '12%', right: '4%', maxWidth: 164 },
    mobile: { bottom: '14%', right: '4%', maxWidth: 138 },
    motion: { phase: 4.6, radiusX: 6, radiusY: 4, boostX: 7, boostY: 5, parallaxX: 0.28, parallaxY: 0.16, rotate: 1.0, rotateBoost: 0.75, rotateDir: 1 },
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
      style={{ position:'relative', width:'100%', maxWidth:590, aspectRatio:'1/1', margin:'0 auto', cursor:isTouchLayout ? 'pointer' : 'default' }}
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
            position:'absolute', inset:'11% 8% 18%', zIndex:0, pointerEvents:'none',
            borderRadius:'48% 52% 46% 54% / 42% 46% 54% 58%',
            background:'radial-gradient(circle at 50% 38%, color-mix(in srgb, #fff2d8 82%, var(--color-preview-pink) 18%) 0%, color-mix(in srgb, #fff4e6 76%, var(--color-ship-red) 24%) 34%, color-mix(in srgb, #f6f7ff 80%, var(--color-develop-blue) 20%) 72%, rgba(255,255,255,0) 100%)',
            filter:'blur(26px)', opacity:0.95,
          }}/>
          <div style={{
            position:'absolute', inset:'4% 10% auto auto', width:'34%', height:'30%', zIndex:0, pointerEvents:'none',
            borderRadius:'9999px',
            background:'radial-gradient(circle, color-mix(in srgb, var(--color-preview-pink) 22%, white) 0%, rgba(255,255,255,0) 72%)',
            filter:'blur(18px)', opacity:0.7,
          }}/>
        </>
      )}
      <div style={{ position:'absolute', inset:'6% 6% 0', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1 }}>
        <img src={isLight ? '/Images/omar-light.png' : '/Images/omar.png'} alt="Omar Tavarez" draggable={false} style={{
          width:'100%', height:'100%', objectFit:'contain', objectPosition:'center bottom',
          filter: isLight
            ? 'drop-shadow(0 18px 44px rgba(10,114,239,0.16)) drop-shadow(0 26px 48px rgba(255,91,79,0.12)) sepia(0.14) saturate(1.08) hue-rotate(-6deg) brightness(1.04) contrast(0.98)'
            : 'drop-shadow(0 20px 60px rgba(0,0,0,0.55))',
          userSelect:'none', pointerEvents:'none',
          WebkitMaskImage:'linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0.6) 82%, rgba(0,0,0,0) 100%)',
          maskImage:'linear-gradient(to bottom, #000 0%, #000 62%, rgba(0,0,0,0.6) 82%, rgba(0,0,0,0) 100%)',
        }}/>
      </div>
      {isLight && (
        <div style={{
          position:'absolute', inset:'8% 12% 4%', zIndex:1, pointerEvents:'none',
          borderRadius:'40% 60% 52% 48% / 44% 42% 58% 56%',
          background:'linear-gradient(155deg, color-mix(in srgb, var(--color-preview-pink) 10%, transparent) 0%, transparent 34%, color-mix(in srgb, var(--color-develop-blue) 11%, transparent) 67%, color-mix(in srgb, var(--color-ship-red) 10%, transparent) 100%)',
          opacity:0.65,
        }}/>
      )}
      {!isLight && (
        <div style={{ position:'absolute', top:'2%', right:'-12%', bottom:'-8%', left:'-12%', zIndex:2, pointerEvents:'none' }}><Galaxy {...galaxy} /></div>
      )}
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
      position:'fixed', inset:0, background:'var(--bg-page)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      zIndex:9999, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
      transition:'opacity 500ms ease',
    }}>
      <div className="logo-loader">
        <svg width="86" height="18" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <path id="shape-circle"   d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z"/>
          <path id="shape-rect"     d="M39.9286 0H21.5V18H39.9286V0Z"/>
          <path id="shape-triangle" d="M53.75 0L64.5 18H43L53.75 0Z"/>
          <path id="shape-d"        d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z"/>
        </svg>
      </div>
      
      <div aria-live="polite" aria-atomic="true" style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
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
                  ? `letterExit 250ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 5}ms forwards`
                  : `letterEnter 300ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 10}ms forwards`,
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

// ============================================================
// Nav
// ============================================================
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
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
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
      style={{ display:'flex', alignItems:'center', textDecoration:'none', cursor:'pointer' }}
      aria-label="designedbyomar"
    >
      <svg key={key} width="86" height="18" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z" style={shapeStyle(0)}/>
        <path d="M39.9286 0H21.5V18H39.9286V0Z" style={shapeStyle(55)}/>
        <path d="M53.75 0L64.5 18H43L53.75 0Z" style={shapeStyle(110)}/>
        <path d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z" style={shapeStyle(165)}/>
      </svg>
    </a>
  );
};

const Nav = ({ theme, setTheme, onOpenAbout, onHome }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const goSection = (id) => (e) => {
    e.preventDefault();
    if (window.location.hash && window.location.hash !== '#') {
      window.location.hash = '';
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' }), 40);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  };
  const navLink = {
    fontSize:14, fontWeight:500, color:'var(--fg-secondary)',
    textDecoration:'none', padding:'6px 10px', borderRadius:6,
    transition:'color 150ms, background 150ms', cursor:'pointer',
    background:'transparent', border:'none', fontFamily:'inherit',
  };
  return (
    <header style={{
      position:'sticky', top:0, zIndex:50,
      background: scrolled ? 'color-mix(in oklab, var(--bg-page) 82%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      boxShadow: scrolled ? 'rgba(127,127,127,0.18) 0px -1px 0px 0px inset' : 'none',
      transition:'background 200ms, box-shadow 200ms',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <NavLogo onClick={(e) => { e.preventDefault(); onHome(); }} />
        <nav style={{ display:'flex', gap:2 }}>
          <a href="#work" onClick={goSection('work')} style={navLink}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--fg-primary)';e.currentTarget.style.background='var(--bg-subtle)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--fg-secondary)';e.currentTarget.style.background='transparent';}}
          >Work</a>
          <button onClick={onOpenAbout} style={navLink}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--fg-primary)';e.currentTarget.style.background='var(--bg-subtle)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--fg-secondary)';e.currentTarget.style.background='transparent';}}
          >About</button>
          <a href="#contact" onClick={goSection('contact')} style={navLink}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--fg-primary)';e.currentTarget.style.background='var(--bg-subtle)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--fg-secondary)';e.currentTarget.style.background='transparent';}}
          >Contact</a>
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ThemeToggle theme={theme} setTheme={(t) => {
            setTheme(t);
            if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('theme_toggle', { new_theme: t });
          }} />
          <a href="#contact" onClick={goSection('contact')} style={{
            fontSize:14, fontWeight:500, color:'var(--bg-page)', padding:'8px 14px',
            borderRadius:6, background:'var(--fg-primary)', textDecoration:'none', transition:'opacity 150ms',
          }}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.86'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >Get in touch</a>
        </div>
      </div>
    </header>
  );
};

// ============================================================
// Hero
// ============================================================
const Dot = () => (
  <span style={{ display:'inline-flex', alignItems:'center' }}>
    <span style={{ width:6, height:6, borderRadius:9999, background:'#22c55e', boxShadow:'0 0 0 3px rgba(34,197,94,0.22)', display:'inline-block' }}/>
  </span>
);

const Hero = ({ galaxy, theme }) => (
  <section id="top" className="hero-editorial" style={{
    maxWidth:1200, margin:'0 auto', padding:'32px 24px 72px',
    display:'grid', gridTemplateColumns:'1.1fr 1fr', alignItems:'center', gap:48,
  }}>
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <div style={{ display:'flex', gap:18, flexWrap:'wrap', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        <Dot /> <span>CURRENTLY LOOKING FOR MY NEXT ROLE.</span>
      </div>
      <h1 style={{ fontSize:'clamp(44px, 7vw, 88px)', fontWeight:600, lineHeight:0.96, letterSpacing:'-0.04em', color:'var(--fg-primary)', margin:0 }}>
        Omar <span style={{ color:'var(--fg-primary)' }}>Tavarez</span>
      </h1>
      <p style={{ fontSize:'clamp(17px, 1.5vw, 21px)', fontWeight:400, lineHeight:1.55, color:'var(--fg-secondary)', margin:0, maxWidth:520 }}>
        I partner with product and engineering leaders to translate complex workflows into scalable systems — using prototypes to align teams and measurable outcomes to guide decisions.
      </p>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <a href="#work" onClick={(e)=>{e.preventDefault();document.getElementById('work')?.scrollIntoView({behavior:'smooth'});}} style={{
          display:'inline-flex', alignItems:'center', gap:8, fontSize:14, fontWeight:500,
          color:'var(--bg-page)', padding:'10px 16px', borderRadius:6, background:'var(--fg-primary)',
          textDecoration:'none', transition:'opacity 150ms',
        }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.86'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >
          View case studies
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>
        </a>
        <a href="#contact" onClick={(e)=>{e.preventDefault();document.getElementById('contact')?.scrollIntoView({behavior:'smooth'});}} style={{
          display:'inline-flex', alignItems:'center', gap:8, fontSize:14, fontWeight:500,
          color:'var(--fg-primary)', padding:'10px 16px', borderRadius:6, background:'transparent',
          boxShadow:'inset 0 0 0 1px var(--color-gray-100)', textDecoration:'none', transition:'background 150ms',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
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
  { name: 'Plastiq',      src: '/Images/Carousel/plastiq.svg',                    maxW: 90,  maxH: 24, basis: 110 },
  { name: 'Disney',        src: '/Images/Carousel/disney.svg',                     maxW: 65,  maxH: 24, basis: 70 },
  { name: 'Raven Health',  src: '/Images/Carousel/raven-health-logo.svg',          maxW: 100, maxH: 26, basis: 130 },
  { name: 'GoNation',      src: '/Images/Carousel/gonation-dark.svg',              maxW: 110, maxH: 20, basis: 140 },
  { name: 'Time Inc.',     src: '/Images/Carousel/Time_Inc._logo.svg',             maxW: 75,  maxH: 20, basis: 85 },
  { name: 'Pyle',          src: '/Images/Carousel/Pyle_wordmark.svg',              maxW: 70,  maxH: 28, basis: 100 },
  { name: 'Wisdom',        src: '/Images/Carousel/Wisdom_Logo_Full-White.svg',     maxW: 130, maxH: 34, basis: 115 },
  { name: 'Meredith',      src: '/Images/Carousel/meredith-vector-logo.svg',       maxW: 120, maxH: 26, basis: 150 },
  { name: 'Simplero',      src: '/Images/Carousel/simplero.svg',                   maxW: 90,  maxH: 24, basis: 110 },
];

const LogoCarousel = () => (
  <Reveal as="section" className="logo-band" variant="soft" delay={90} aria-label="Companies Omar has worked with" style={{ padding:'18px 0 40px' }}>
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
  <Reveal as="section" id="about" variant="section" style={{ borderTop:'1px solid var(--color-gray-100)', padding:'96px 24px 48px' }}>
    <div className="about-grid" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'220px 1fr', gap:64, alignItems:'start' }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
        <span style={{ color:'var(--color-develop-blue)' }}>01 — </span>About
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:32, maxWidth:760 }}>
        <p style={{ fontSize:'clamp(20px, 2vw, 28px)', fontWeight:500, lineHeight:1.4, letterSpacing:'-0.02em', color:'var(--fg-primary)', margin:0 }}>
          {ABOUT_SHORT}
        </p>
        <button onClick={onOpenDrawer} style={{
          alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:8,
          fontSize:14, fontWeight:500, color:'var(--fg-primary)', padding:'10px 16px',
          borderRadius:6, background:'transparent', boxShadow:'inset 0 0 0 1px var(--color-gray-100)',
          border:'none', cursor:'pointer', fontFamily:'inherit', transition:'background 150ms',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          Read more about me
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
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
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:80, background:open?'rgba(0,0,0,0.45)':'transparent', backdropFilter:open?'blur(4px)':'none', WebkitBackdropFilter:open?'blur(4px)':'none', opacity:open?1:0, pointerEvents:open?'auto':'none', transition:'opacity 250ms ease' }}/>
      <aside role="dialog" aria-label="About Omar" style={{
        position:'fixed', top:0, right:0, bottom:0, zIndex:81, width:'min(640px, 92vw)',
        background:'var(--bg-page)', boxShadow:open?'-24px 0 80px rgba(0,0,0,0.35), inset 1px 0 0 var(--color-gray-100)':'none',
        transform:open?'translateX(0)':'translateX(100%)', transition:'transform 340ms cubic-bezier(0.22,1,0.36,1)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 28px', borderBottom:'1px solid var(--color-gray-100)' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>About / long-form</div>
          <button onClick={onClose} aria-label="Close" style={{ width:32, height:32, borderRadius:9999, display:'grid', placeItems:'center', background:'transparent', color:'var(--fg-primary)', border:'none', cursor:'pointer', boxShadow:'inset 0 0 0 1px var(--color-gray-100)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ padding:'36px 36px 72px', overflowY:'auto', flex:1 }}>
          <h2 style={{ fontSize:'clamp(28px, 3.2vw, 40px)', fontWeight:600, lineHeight:1.05, letterSpacing:'-0.04em', color:'var(--fg-primary)', margin:'0 0 20px' }}>
            A longer version,<br/><span style={{ color:'var(--fg-tertiary)' }}>for the curious.</span>
          </h2>
          <p style={{ fontSize:17, lineHeight:1.65, color:'var(--fg-secondary)', margin:'0 0 36px', maxWidth:560 }}>{ABOUT_SHORT}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:28, maxWidth:560 }}>
            {ABOUT_LONG.map(s => (
              <div key={s.heading}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.heading}</div>
                <p style={{ fontSize:15, lineHeight:1.65, color:'var(--fg-secondary)', margin:0 }}>{s.body}</p>
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
const CaseCard = ({ c, featured = false }) => (
  <a href={`/work/${c.id}`} className="case-card" style={{
    display:'flex', flexDirection:'column', gap:16,
    textDecoration:'none', color:'inherit',
    borderRadius:12, transition:'transform 220ms ease',
  }}>
    <div className="case-card-media" style={{
      position:'relative', width:'100%',
      aspectRatio: featured ? '16/8' : '4/3',
      background:`linear-gradient(135deg, ${c.swatch[0]} 0%, ${c.swatch[1]} 100%)`,
      borderRadius:12, overflow:'hidden',
      boxShadow:'var(--shadow-card-subtle)',
    }}>
      <div className="case-card-sheen"/>
      {/* stacked "screen" silhouettes */}
      <div className="case-card-screen" style={{
        position:'absolute', left:'16%', right:'16%', bottom:'-6%', top:'22%',
        background:c.swatch[2],
        borderRadius:'10px 10px 0 0',
        boxShadow:`0 -1px 0 0 rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,0.35)`,
      }}>
        <div style={{
          position:'absolute', top:10, left:10, right:10, height:18,
          display:'flex', alignItems:'center', gap:5,
          borderBottom:`1px solid ${c.swatch[3]}22`,
        }}>
          <span style={{ width:6, height:6, borderRadius:9999, background:c.swatch[3], opacity:0.7 }}/>
          <span style={{ width:6, height:6, borderRadius:9999, background:c.swatch[0], opacity:0.7 }}/>
          <span style={{ width:6, height:6, borderRadius:9999, background:c.swatch[1], opacity:0.7 }}/>
        </div>
        <div className="case-card-line case-card-line--full" style={{
          position:'absolute', top:40, left:16, right:16, height:10, borderRadius:3,
          background:`${c.swatch[3]}22`,
        }}/>
        <div className="case-card-line case-card-line--left" style={{
          position:'absolute', top:58, left:16, width:'40%', height:10, borderRadius:3,
          background:`${c.swatch[0]}44`,
        }}/>
        <div className="case-card-line case-card-line--right" style={{
          position:'absolute', top:58, left:'46%', width:'38%', height:10, borderRadius:3,
          background:`${c.swatch[3]}22`,
        }}/>
      </div>
      {/* accent tag */}
      <div className="case-card-tag" style={{
        position:'absolute', top:16, left:16,
        fontFamily:'var(--font-mono)', fontSize:10, fontWeight:500,
        color:'#fff', textTransform:'uppercase', letterSpacing:'0.08em',
        background:'rgba(0,0,0,0.32)', padding:'5px 9px', borderRadius:4,
        backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
      }}>{c.num} · {c.year} · {c.client}</div>
    </div>

    <div style={{ padding:'4px 4px 0' }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap', marginBottom:10 }}>
        <h3 style={{
          fontSize: featured ? 'clamp(24px, 2.6vw, 32px)' : 22,
          fontWeight:600, letterSpacing:'-0.025em',
          color:'var(--fg-primary)', margin:0, lineHeight:1.15,
        }}>{c.title}</h3>
      </div>
      <p style={{ fontSize: featured ? 16 : 14, lineHeight:1.55, color:'var(--fg-secondary)', margin:'0 0 14px', maxWidth:560 }}>{c.subtitle}</p>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {c.tags.slice(0, 3).map(t => (
          <span key={t} style={{ fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:9999, color:'var(--fg-secondary)', boxShadow:'inset 0 0 0 1px var(--color-gray-100)' }}>{t}</span>
        ))}
      </div>
    </div>
  </a>
);

// ============================================================
// Work — homepage section
// ============================================================
const Work = ({ onOpenDrawer }) => (
  <section id="work" style={{ borderTop:'1px solid var(--color-gray-100)', padding:'96px 24px' }}>
    <div style={{ maxWidth:1200, margin:'0 auto' }}>
      <Reveal className="work-head" variant="section" style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:64, alignItems:'start', marginBottom:56 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          <span style={{ color:'var(--color-preview-pink)' }}>02 — </span>Selected work
        </div>
        <h2 style={{ fontSize:'clamp(32px, 4.2vw, 56px)', fontWeight:600, lineHeight:1.02, letterSpacing:'-0.04em', color:'var(--fg-primary)', margin:0, maxWidth:760 }}>
          A decade of systems work — <span style={{ color:'var(--fg-tertiary)' }}>across fintech, healthcare, and enterprise.</span>
        </h2>
      </Reveal>

      <Reveal delay={70} style={{ display:'grid', gridTemplateColumns:'1fr', gap:32, marginBottom:32 }}>
        <CaseCard c={CASE_STUDIES[0]} featured />
      </Reveal>
      <Reveal delay={130} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:32, marginBottom:48 }}>
        <CaseCard c={CASE_STUDIES[1]} />
        <CaseCard c={CASE_STUDIES[2]} />
      </Reveal>

      <Reveal as="div" delay={180} style={{ display:'inline-flex' }}>
        <button onClick={onOpenDrawer} style={{
          display:'inline-flex', alignItems:'center', gap:8,
          fontSize:14, fontWeight:500, color:'var(--fg-primary)', padding:'10px 16px',
          borderRadius:6, background:'transparent', boxShadow:'inset 0 0 0 1px var(--color-gray-100)',
          border:'none', cursor:'pointer', fontFamily:'inherit', transition:'background 150ms',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          See all {CASE_STUDIES.length} case studies
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </Reveal>
    </div>
  </section>
);

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
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:80, background:open?'rgba(0,0,0,0.45)':'transparent', backdropFilter:open?'blur(4px)':'none', WebkitBackdropFilter:open?'blur(4px)':'none', opacity:open?1:0, pointerEvents:open?'auto':'none', transition:'opacity 250ms ease' }}/>
      <aside role="dialog" aria-label="All case studies" style={{
        position:'fixed', top:0, right:0, bottom:0, zIndex:81, width:'min(980px, 96vw)',
        background:'var(--bg-page)', boxShadow:open?'-24px 0 80px rgba(0,0,0,0.35), inset 1px 0 0 var(--color-gray-100)':'none',
        transform:open?'translateX(0)':'translateX(100%)', transition:'transform 340ms cubic-bezier(0.22,1,0.36,1)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 28px', borderBottom:'1px solid var(--color-gray-100)' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>All case studies · {CASE_STUDIES.length}</div>
          <button onClick={onClose} aria-label="Close" style={{ width:32, height:32, borderRadius:9999, display:'grid', placeItems:'center', background:'transparent', color:'var(--fg-primary)', border:'none', cursor:'pointer', boxShadow:'inset 0 0 0 1px var(--color-gray-100)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ padding:'28px', overflowY:'auto', flex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
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
    <article style={{ maxWidth:1040, margin:'0 auto', padding:'40px 24px 96px' }}>
      <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{
        display:'inline-flex', alignItems:'center', gap:8,
        fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)',
        textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.08em',
        marginBottom:40, transition:'color 150ms',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-tertiary)'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
        Back to work
      </a>

      {/* Cover */}
      <div style={{
        position:'relative', width:'100%', aspectRatio:'21/9',
        background:`linear-gradient(135deg, ${c.swatch[0]} 0%, ${c.swatch[1]} 100%)`,
        borderRadius:16, overflow:'hidden',
        boxShadow:'var(--shadow-card-subtle)', marginBottom:48,
      }}>
        <div style={{
          position:'absolute', top:20, left:22,
          fontFamily:'var(--font-mono)', fontSize:11, fontWeight:500,
          color:'#fff', textTransform:'uppercase', letterSpacing:'0.08em',
          background:'rgba(0,0,0,0.32)', padding:'5px 10px', borderRadius:4,
          backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
        }}>{c.num} · {c.year} · {c.client}</div>
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom:48 }}>
        <h1 style={{
          fontSize:'clamp(40px, 6vw, 80px)', fontWeight:600,
          lineHeight:1.0, letterSpacing:'-0.04em',
          color:'var(--fg-primary)', margin:'0 0 20px',
        }}>{c.title}</h1>
        <p style={{ fontSize:'clamp(17px, 1.4vw, 21px)', lineHeight:1.5, color:'var(--fg-secondary)', margin:'0 0 24px', maxWidth:760 }}>{c.subtitle}</p>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>{c.role}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {c.tags.map(t => (
            <span key={t} style={{ fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:9999, color:'var(--fg-secondary)', boxShadow:'inset 0 0 0 1px var(--color-gray-100)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <div className="cs-metrics-grid" style={{
        display:'grid', gridTemplateColumns:`repeat(${c.metrics.length}, 1fr)`,
        borderRadius:12, overflow:'hidden',
        boxShadow:'var(--shadow-card-subtle)',
        background:'var(--bg-page)', marginBottom:64,
      }}>
        {c.metrics.map((m, i) => (
          <div key={i} style={{
            padding:'32px 24px', textAlign:'center',
            borderRight: i < c.metrics.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
          }}>
            <div style={{ fontSize:'clamp(28px, 3.2vw, 44px)', fontWeight:700, letterSpacing:'-0.04em', color:c.accent, lineHeight:1 }}>{m.value}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-tertiary)', marginTop:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Challenge / Approach / Outcome */}
      <div style={{ display:'flex', flexDirection:'column', gap:56, maxWidth:760 }}>
        {[
          { label:'Challenge', body:c.challenge },
          { label:'Approach',  body:c.approach  },
          { label:'Outcome',   body:c.outcome   },
        ].map(({ label, body }) => (
          <div key={label}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:c.accent, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>{label}</div>
            <p style={{ fontSize:'clamp(16px, 1.25vw, 19px)', lineHeight:1.65, color:'var(--fg-primary)', margin:0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <div className="cs-prevnext" style={{
        marginTop:96, paddingTop:32,
        borderTop:'1px solid var(--color-gray-100)',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:24,
      }}>
        <a href={`/work/${prev.id}`} style={{ textDecoration:'none', color:'inherit' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>← Previous</div>
          <div style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.025em', color:'var(--fg-primary)' }}>{prev.title}</div>
          <div style={{ fontSize:13, color:'var(--fg-tertiary)', marginTop:4 }}>{prev.client}</div>
        </a>
        <a href={`/work/${next.id}`} style={{ textDecoration:'none', color:'inherit', textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Next →</div>
          <div style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.025em', color:'var(--fg-primary)' }}>{next.title}</div>
          <div style={{ fontSize:13, color:'var(--fg-tertiary)', marginTop:4 }}>{next.client}</div>
        </a>
      </div>
    </article>
  );
};

// ============================================================
// Contact + Footer
// ============================================================
const ContactCard = ({ label, value, href, eventName }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="contact-card" style={{
    display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px', borderRadius: 8,
    background: 'var(--bg-page)', boxShadow: 'var(--shadow-card-subtle)', textDecoration: 'none',
    transition: 'transform 180ms ease',
  }}
    onClick={() => {
      if (window.trackAnalyticsEvent && eventName) {
        window.trackAnalyticsEvent(eventName, { link_url: href });
      }
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}
  >
    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
    <span style={{ fontSize:16, fontWeight:500, color:'var(--fg-primary)', letterSpacing:'-0.01em' }}>{value} ↗</span>
  </a>
);

// ============================================================
// Key Facts (AEO Section)
// ============================================================
const KeyFacts = () => {
  const sectionRef = React.useRef(null);
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });

  const handleMouseMove = React.useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
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
        padding: '72px 24px',
        overflow: 'hidden',
        background: 'var(--bg-page)',
      }}
    >
      {/* Animated gradient background */}
      <div className="facts-gradient" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 600px 400px at ${mousePos.x}% ${mousePos.y}%, var(--color-ship-red) 0%, transparent 70%),
          radial-gradient(ellipse 500px 350px at ${Math.max(0, mousePos.x - 30)}% ${Math.min(100, mousePos.y + 20)}%, var(--color-preview-pink) 0%, transparent 70%),
          radial-gradient(ellipse 550px 380px at ${Math.min(100, mousePos.x + 25)}% ${Math.max(0, mousePos.y - 15)}%, var(--color-develop-blue) 0%, transparent 70%)
        `,
        opacity: 0.12,
        transition: 'background 150ms ease-out',
      }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal variant="section" className="facts-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
        }}>
          {facts.map((f, i) => (
            <div key={i} style={{
              padding: '24px 20px',
              borderRadius: 12,
              background: 'var(--bg-subtle)',
              boxShadow: 'var(--shadow-card-subtle)',
              transition: 'box-shadow 180ms ease, transform 180ms ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-full)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
                {f.label}
              </div>
              {f.custom ? (
                <div style={{ fontSize:15, fontWeight:500, color:'var(--fg-primary)', lineHeight:1.5 }}>
                  Sharing insights on design and product strategy via{' '}
                  <a href="https://www.linkedin.com/in/omartavarez/" target="_blank" rel="noopener noreferrer" style={{ color:'var(--color-develop-blue)', textDecoration:'none', borderBottom:'1px solid currentColor' }}>LinkedIn</a>
                  {' '}and{' '}
                  <a href="https://substack.com/@designedbyomar" target="_blank" rel="noopener noreferrer" style={{ color:'var(--color-preview-pink)', textDecoration:'none', borderBottom:'1px solid currentColor' }}>Substack</a>
                </div>
              ) : (
                <div style={{ fontSize:15, fontWeight:500, color:'var(--fg-primary)', lineHeight:1.5 }}>
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

const Contact = () => (
  <section id="contact" style={{ borderTop:'1px solid var(--color-gray-100)', padding:'112px 24px 96px' }}>
    <Reveal className="contact-grid" variant="section" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'220px 1fr', gap:64, alignItems:'start' }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
        <span style={{ color:'var(--color-ship-red)' }}>03 — </span>Contact
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:40, maxWidth:820 }}>
        <h2 style={{ fontSize:'clamp(36px, 6vw, 80px)', fontWeight:600, lineHeight:0.98, letterSpacing:'-0.04em', color:'var(--fg-secondary)', margin:0 }}>
          Turn complexity <br/><span style={{ color:'var(--fg-secondary)' }}>into clarity. </span><br/><span style={{ color:'var(--fg-primary)' }}>Let's talk.</span>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
          <ContactCard label="Email" value="omar@designedbyomar.com" href="mailto:omar@designedbyomar.com" eventName="contact_click_email" />
          <ContactCard label="Resume / CV" value="Open PDF" href="/Omar%20Tavarez%20Resume.pdf" eventName="resume_download" />
          <ContactCard label="LinkedIn" value="in/omartavarez" href="https://www.linkedin.com/in/omartavarez/" eventName="contact_click_linkedin" />
          <ContactCard label="GitHub" value="designedbyomar" href="https://github.com/designedbyomar" eventName="contact_click_github" />
          <ContactCard label="Substack" value="@designedbyomar" href="https://substack.com/@designedbyomar" eventName="contact_click_substack" />
        </div>
      </div>
    </Reveal>
  </section>
);

const SiteFooter = () => (
  <footer style={{ borderTop:'1px solid var(--fg-primary)', padding:'24px 24px' }}>
    <style dangerouslySetInnerHTML={{__html: `
      .footer-easter-egg {
        position: absolute; left: 50%; top: 50%; transform: translate(-50%, 12px);
        opacity: 0; filter: blur(8px); pointer-events: none;
        transition: all 400ms cubic-bezier(0.22, 1, 0.36, 1);
        text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
        color: var(--color-develop-blue); font-weight: 600;
      }
      .footer-easter-egg:hover { color: var(--color-preview-pink); }
      .footer-inner:hover .footer-easter-egg {
        opacity: 1; filter: blur(0px); pointer-events: auto; transform: translate(-50%, -50%);
      }
      .footer-text { transition: opacity 300ms ease, filter 300ms ease; }
      .footer-inner:hover .footer-text { opacity: 0.15; filter: blur(2px); }
      @media (prefers-reduced-motion: reduce) {
        .footer-easter-egg { transform: translate(-50%, -50%); transition: opacity 200ms ease; filter: none; }
        .footer-inner:hover .footer-easter-egg { transform: translate(-50%, -50%); }
        .footer-inner:hover .footer-text { filter: none; }
      }
    `}} />
    <div className="footer-inner" style={{
      maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center',
      flexWrap:'wrap', gap:12, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-tertiary)',
      textTransform:'uppercase', letterSpacing:'0.06em', position:'relative'
    }}>
      <div className="footer-text" style={{ display:'flex', gap: 16 }}>
        <span>© 2026 Omar Tavarez</span>
        <a href="/privacy" style={{ textDecoration:'none', color:'inherit', transition:'color 150ms' }} onMouseEnter={e=>e.currentTarget.style.color='var(--fg-secondary)'} onMouseLeave={e=>e.currentTarget.style.color='inherit'}>Privacy Policy</a>
        <a href="https://github.com/designedbyomar" target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'inherit' }}>GitHub</a>
        <a href="https://substack.com/@designedbyomar" target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'inherit' }}>Substack</a>
      </div>
      
      <a href="design-system.html" className="footer-easter-egg" aria-label="See Design System">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        See design system
      </a>

      <span className="footer-text" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
        Designed by Omar. Built with AI-native coding tools
        <span aria-hidden="true" style={{ display:'inline-flex', color:'var(--color-develop-blue)', flex:'0 0 auto' }}>
          <svg width="18" height="14" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
            <rect x="5" y="0" width="2" height="1" fill="currentColor"/>
            <rect x="9" y="0" width="2" height="1" fill="currentColor"/>
            <rect x="4" y="1" width="8" height="1" fill="currentColor"/>
            <rect x="3" y="2" width="10" height="1" fill="currentColor"/>
            <rect x="2" y="3" width="12" height="1" fill="currentColor"/>
            <rect x="2" y="4" width="3" height="1" fill="currentColor"/>
            <rect x="7" y="4" width="2" height="1" fill="currentColor"/>
            <rect x="11" y="4" width="3" height="1" fill="currentColor"/>
            <rect x="2" y="5" width="12" height="1" fill="currentColor"/>
            <rect x="1" y="6" width="3" height="1" fill="currentColor"/>
            <rect x="5" y="6" width="6" height="1" fill="currentColor"/>
            <rect x="12" y="6" width="3" height="1" fill="currentColor"/>
            <rect x="0" y="7" width="2" height="1" fill="currentColor"/>
            <rect x="4" y="7" width="3" height="1" fill="currentColor"/>
            <rect x="9" y="7" width="3" height="1" fill="currentColor"/>
            <rect x="14" y="7" width="2" height="1" fill="currentColor"/>
            <rect x="0" y="8" width="2" height="1" fill="currentColor"/>
            <rect x="4" y="8" width="3" height="1" fill="currentColor"/>
            <rect x="9" y="8" width="3" height="1" fill="currentColor"/>
            <rect x="14" y="8" width="2" height="1" fill="currentColor"/>
            <rect x="4" y="9" width="2" height="1" fill="currentColor"/>
            <rect x="10" y="9" width="2" height="1" fill="currentColor"/>
            <rect x="3" y="10" width="3" height="1" fill="currentColor"/>
            <rect x="10" y="10" width="3" height="1" fill="currentColor"/>
          </svg>
        </span>
      </span>
    </div>
  </footer>
);

// ============================================================
// Privacy Policy Page
// ============================================================
const PrivacyPolicyPage = ({ theme, onBack }) => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px', minHeight: '100vh' }}>
    <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{
      display:'inline-flex', alignItems:'center', fontSize:14, fontWeight:500, color:'var(--fg-secondary)', textDecoration:'none', marginBottom:48
    }}>← Back to home</a>
    <h1 style={{ fontSize:32, fontWeight:600, letterSpacing:'-0.03em', color:'var(--fg-primary)', marginBottom:32 }}>Privacy Policy</h1>
    
    <div style={{ display:'flex', flexDirection:'column', gap:24, color:'var(--fg-secondary)', lineHeight:1.6, fontSize:15 }}>
      <p>Last updated: April 2026</p>
      
      <h2 style={{ fontSize:20, fontWeight:600, color:'var(--fg-primary)', marginTop:16 }}>1. Data Collection</h2>
      <p>This website ("designedbyomar.com") uses Google Analytics 4 to collect basic, anonymized telemetry data such as page views, scroll depth, and interaction events (like theme toggling or external link clicks). This helps me understand which case studies are resonating and improve the overall portfolio experience.</p>
      
      <h2 style={{ fontSize:20, fontWeight:600, color:'var(--fg-primary)', marginTop:16 }}>2. Cookies</h2>
      <p>Google Analytics utilizes cookies to distinguish unique users and sessions. By continuing to use this site, you consent to the use of these tracking mechanisms unless you have disabled cookies in your browser or are using privacy-enhancing browser extensions.</p>

      <h2 style={{ fontSize:20, fontWeight:600, color:'var(--fg-primary)', marginTop:16 }}>3. Third-party Links</h2>
      <p>This site contains links to other websites, including LinkedIn and Read.cv. Please be aware that I am not responsible for the privacy practices of such other sites. I encourage users to be aware when they leave my site and to read the privacy statements of any other site that collects personally identifiable information.</p>
      
      <h2 style={{ fontSize:20, fontWeight:600, color:'var(--fg-primary)', marginTop:16 }}>4. Contact</h2>
      <p>For any questions regarding this policy, please reach out to <a href="mailto:omar@designedbyomar.com" style={{ color:'var(--color-develop-blue)', textDecoration:'none' }}>omar@designedbyomar.com</a>.</p>
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
    return m ? { type:'case', id: m[1] } : { type:'home' };
  };
  const [route, setRoute] = React.useState(() => parse(window.location.pathname));
  
  React.useEffect(() => {
    const on = () => { setRoute(parse(window.location.pathname)); window.scrollTo(0, 0); };
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  React.useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.href) {
        const url = new URL(a.href);
        if (url.origin === window.location.origin) {
          if (url.pathname.startsWith('/work/') || url.pathname === '/privacy' || url.pathname === '/') {
            // Internal React route
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

  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));
    const pageReady = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const heroSrc = theme === 'light' ? '/Images/omar-light.png' : '/Images/omar.png';
    const heroImageReady = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = heroSrc;
      if (img.complete) resolve();
    });

    Promise.all([minDelay, pageReady, fontsReady, heroImageReady]).then(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [loading, theme]);

  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [workOpen, setWorkOpen] = React.useState(false);
  const galaxy = { density:1.9, speed:0.75, style:'pixel', accent:'workflow', theme };

  const route = useRoute();
  const currentCase = route.type === 'case' ? CASE_STUDIES.find(c => c.id === route.id) : null;

  const goHome = () => {
    if (window.location.pathname !== '/') {
      history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <LogoLoader visible={loading} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 400ms ease 120ms' }}>
        <Nav theme={theme} setTheme={setTheme} onOpenAbout={() => setAboutOpen(true)} onHome={goHome} />
        <main>
          {route.type === 'privacy' ? (
            <PrivacyPolicyPage theme={theme} onBack={goHome} />
          ) : currentCase ? (
            <CaseStudyPage c={currentCase} onBack={goHome} />
          ) : (
            <>
              <Hero galaxy={galaxy} theme={theme} />
              <About onOpenDrawer={() => setAboutOpen(true)} />
              <Work onOpenDrawer={() => setWorkOpen(true)} />
              <KeyFacts />
              <Contact />
            </>
          )}
        </main>
        <SiteFooter />
      </div>
      <AboutDrawer open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <WorkDrawer open={workOpen} onClose={() => setWorkOpen(false)} />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);