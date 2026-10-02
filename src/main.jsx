import { LinkButton } from './ui/controls.jsx';
import { CaseStudyTag, CaseStudyMetadata } from './ui/case-study-meta.jsx';
import React from 'react';
import { SiteNavigation } from './ui/navigation.jsx';
import { ContactCard } from './ui/contact-card.jsx';
import { AboutLightbox, AboutStack } from './ui/about-media.jsx';
import { ABOUT_PHOTOS } from './content/about-photos.js';
import { CaseCard, caseAccentGradient } from './ui/case-card.jsx';
import { CaseStudyBody } from './ui/case-study-body.jsx';
import { SiteFooter } from './ui/site-footer.jsx';
import { ConsentBanner } from './ui/consent-banner.jsx';
import { AskPanel } from './ui/ask-panel.jsx';
import { useViewportWidth, usePrefersReducedMotion } from './ui/hooks.js';
import './ui/components.css';

import ReactDOM from 'react-dom/client';
import './about-page.css';
import * as Sentry from '@sentry/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { AppIcon, ArrowLeft, ArrowUpRight, NotebookPen, Rocket, Sparkles, Target } from './ui-icons.jsx';
import { Galaxy } from './galaxy.jsx';
import { GitHubContributions } from './github-contributions.jsx';
import { LAYOUT, LINKEDIN_URL, GITHUB_URL, SUBSTACK_URL, BEHANCE_URL, BOOKING_URL } from './constants.js';
import { CASE_STUDIES } from './case-studies.js';
import { PRIVACY_POLICY } from './content/privacy-policy.mjs';
import { HOME_PAGE_COPY, WORK_PAGE_COPY } from './content/static-page-copy.mjs';
import { buildIndex, matchQuestion, nearestTopic, rankNearest } from './ask.mjs';
import { onMediaChange } from './media-query.js';
import { isPortfolioRoutePath, parsePortfolioRoute } from './routes.js';
import { isGaEnabled } from './analytics-env.mjs';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENABLED = import.meta.env.PROD && Boolean(SENTRY_DSN);
// Google Analytics loads only on the production build served from the production
// host, so dev, tests, and Vercel previews never reach the production GA4
// property. Consent still gates it on top of this.
const GA_ENABLED = isGaEnabled(
  import.meta.env,
  typeof window !== 'undefined' ? window.location.hostname : '',
);
const ANALYTICS_CONSENT_KEY = 'omar.analyticsConsent';
const LEGACY_CONSENT_KEY = 'omar.consent';
const ANALYTICS_ACCEPTED = 'accepted';
const ANALYTICS_DECLINED = 'declined';
const GA_SCRIPT_ID = 'omar-ga4-script';
const GA_MEASUREMENT_ID = 'G-T7W0PFD3HD';

let sentryInitialized = false;
const initSentryIfEnabled = () => {
  if (!SENTRY_ENABLED || sentryInitialized) return;
  Sentry.init({ dsn: SENTRY_DSN, environment: 'production' });
  sentryInitialized = true;
};

const getStoredAnalyticsConsent = () => {
  if (typeof window !== 'undefined') {
    const sessionConsent = window.__omarAnalyticsConsent;
    if (sessionConsent === ANALYTICS_ACCEPTED || sessionConsent === ANALYTICS_DECLINED) return sessionConsent;
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (stored === ANALYTICS_ACCEPTED || stored === ANALYTICS_DECLINED) {
      if (typeof window !== 'undefined') window.__omarAnalyticsConsent = stored;
      return stored;
    }

    if (localStorage.getItem(LEGACY_CONSENT_KEY) === 'true') {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, ANALYTICS_ACCEPTED);
      localStorage.removeItem(LEGACY_CONSENT_KEY);
      if (typeof window !== 'undefined') window.__omarAnalyticsConsent = ANALYTICS_ACCEPTED;
      return ANALYTICS_ACCEPTED;
    }
  } catch {
    return null;
  }

  return null;
};

const storeAnalyticsConsent = (value) => {
  if (typeof window !== 'undefined') window.__omarAnalyticsConsent = value;

  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    localStorage.removeItem(LEGACY_CONSENT_KEY);
  } catch {
    // Consent state still updates for this session through React state.
  }
};

const hasAcceptedAnalytics = () => getStoredAnalyticsConsent() === ANALYTICS_ACCEPTED;

const setupAnalyticsQueue = () => {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
};

const configureGoogleAnalytics = () => {
  setupAnalyticsQueue();
  if (window.__omarGaConfigured) return;

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  window.__omarGaConfigured = true;
};

const loadGoogleAnalytics = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!GA_ENABLED) return Promise.resolve(false);
  if (!hasAcceptedAnalytics()) return Promise.resolve(false);
  if (window.__omarGaReady) return Promise.resolve(true);
  if (window.__omarGaLoadPromise) return window.__omarGaLoadPromise;

  window.__omarGaLoadPromise = new Promise((resolve) => {
    configureGoogleAnalytics();

    if (document.getElementById(GA_SCRIPT_ID)) {
      window.__omarGaReady = true;
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.onload = () => {
      window.__omarGaReady = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return window.__omarGaLoadPromise;
};

if (typeof window !== 'undefined') {
  window.trackAnalyticsEvent = (eventName, params) => {
    if (!GA_ENABLED || !hasAcceptedAnalytics() || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
  };
}

const trackPortfolioEvent = (eventName, params) => {
  if (typeof window === 'undefined' || typeof window.trackAnalyticsEvent !== 'function') return;
  window.trackAnalyticsEvent(eventName, params);
};

// ============================================================
// Portrait
// ============================================================
const HERO_STATS = [
  {
    value: '12+ years',
    label: 'SaaS · fintech · AI · enterprise',
    desktop: { top: '48%', left: '-10%', maxWidth: 172 },
    mobile: { top: '42%', left: '-1%', maxWidth: 144 },
    motion: { phase: 0.2, radiusX: 7, radiusY: 4, boostX: 8, boostY: 5, parallaxX: -0.34, parallaxY: -0.14, rotate: 1.2, rotateBoost: 0.8, rotateDir: -1 },
  },
  {
    value: '500+ research interviews',
    label: 'Career-wide · customers, operators, teams',
    desktop: { top: '72%', left: '-10%', maxWidth: 180 },
    mobile: { top: '63%', left: '-2%', maxWidth: 150 },
    motion: { phase: 1.8, radiusX: 7, radiusY: 5, boostX: 8, boostY: 6, parallaxX: -0.36, parallaxY: 0.10, rotate: 1.3, rotateBoost: 0.85, rotateDir: -1 },
  },
  {
    value: '4 design systems',
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
  const [touchHintDismissed, setTouchHintDismissed] = React.useState(false);
  const [desktopHintDismissed, setDesktopHintDismissed] = React.useState(false);
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
    return onMediaChange(mediaQuery, sync);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();
    return onMediaChange(mediaQuery, sync);
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
      background: 'rgba(255, 255, 255, var(--opacity-68))',
      border: '1px solid rgba(23, 23, 23, var(--opacity-10))',
      boxShadow: '0 18px 36px rgba(10, 114, 239, var(--opacity-10)), 0 10px 24px rgba(255, 91, 79, var(--opacity-8))',
    }
    : {
      background: 'rgba(10, 10, 10, var(--opacity-42))',
      border: '1px solid rgba(255, 255, 255, var(--opacity-12))',
      boxShadow: '0 18px 44px rgba(0, 0, 0, var(--opacity-26))',
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
      style={{ position: 'relative', width: '100%', maxWidth: 'var(--size-portrait-wrapper)', aspectRatio: '1/1', margin: '0 auto', cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      aria-label="Show hero highlights"
      aria-pressed={statsVisible}
      onMouseEnter={(event) => {
        if (!isTouchLayout) {
          setDesktopStatsVisible(true);
          setDesktopHintDismissed(true);
          updatePointerMotion(event.clientX, event.clientY, event.timeStamp || performance.now());
        }
      }}
      onMouseMove={(event) => updatePointerMotion(event.clientX, event.clientY, event.timeStamp || performance.now())}
      onMouseLeave={() => {
        if (!isTouchLayout) setDesktopStatsVisible(false);
        resetPointerMotion();
      }}
      onFocus={() => { if (!isTouchLayout) { setDesktopStatsVisible(true); setDesktopHintDismissed(true); } }}
      onBlur={() => {
        if (!isTouchLayout) setDesktopStatsVisible(false);
        resetPointerMotion();
      }}
      onClick={() => { if (isTouchLayout) { setTouchStatsVisible((prev) => !prev); setTouchHintDismissed(true); } }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (isTouchLayout) {
          setTouchStatsVisible((prev) => !prev);
          setTouchHintDismissed(true);
        } else {
          setDesktopStatsVisible((prev) => !prev);
        }
      }}
    >
      {isLight && (
        <>
          <div style={{
            position: 'absolute', inset: '11% 8% 18%', zIndex: 'var(--z-base)', pointerEvents: 'none',
            borderRadius: '48% 52% 46% 54% / 42% 46% 54% 58%',
            background: 'var(--gradient-hero-radial-blur)',
            filter: 'var(--blur-heavy)', opacity: 0.95,
          }} />
          <div style={{
            position: 'absolute', inset: '4% 10% auto auto', width: '34%', height: '30%', zIndex: 'var(--z-base)', pointerEvents: 'none',
            borderRadius: '9999px',
            background: 'var(--gradient-hero-overlay-pink)',
            filter: 'var(--blur-heavy)', opacity: 0.7,
          }} />
        </>
      )}
      <div style={{ position: 'absolute', inset: '6% 6% 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 'var(--z-component-action)' }}>
        <img data-hero-portrait src={isLight ? '/Images/omar-light.webp' : '/Images/omar.webp'} srcSet={isLight ? undefined : '/Images/omar-mobile.webp 640w, /Images/omar.webp 1230w'} sizes={isLight ? undefined : '(max-width: 820px) min(100vw, 590px), 590px'} alt="Omar Tavarez" fetchPriority="high" draggable={false} style={{
          width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom',
          filter: isLight
            ? 'drop-shadow(0 18px 44px rgba(10, 114, 239, var(--opacity-16))) drop-shadow(0 26px 48px rgba(255, 91, 79, var(--opacity-12))) sepia(0.14) saturate(1.08) hue-rotate(-6deg) brightness(1.04) contrast(0.98)'
            : 'drop-shadow(0 20px 60px rgba(0, 0, 0, var(--opacity-55)))',
          userSelect: 'none', pointerEvents: 'none',
          WebkitMaskImage: 'var(--gradient-mask-fade-vertical)',
          maskImage: 'var(--gradient-mask-fade-vertical)',
        }} />
      </div>
      {isLight && (
        <div style={{
          position: 'absolute', inset: '8% 12% 4%', zIndex: 'var(--z-component-content)', pointerEvents: 'none',
          borderRadius: '40% 60% 52% 48% / 44% 42% 58% 56%',
          background: 'var(--gradient-overlay-diagonal)',
          opacity: 0.65,
        }} />
      )}
      <div style={{ position: 'absolute', top: '2%', right: '-12%', bottom: '-8%', left: '-12%', zIndex: 'var(--z-component-cover)', pointerEvents: 'none' }}><Galaxy {...galaxy} /></div>
      <div className="hero-stats-layer" aria-hidden={!statsVisible ? true : undefined}>
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
      {isTouchLayout && (
        <p aria-hidden="true" style={{
          position: 'absolute', bottom: '-28px', left: 0, right: 0, margin: 0,
          textAlign: 'center',
          fontSize: 'var(--font-size-body-xs)', fontFamily: 'var(--font-mono)',
          color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)',
          opacity: touchHintDismissed ? 0 : 1,
          transition: prefersReducedMotion ? 'none' : 'opacity var(--duration-base-plus) ease',
          pointerEvents: 'none',
        }}>
          Tap for highlights
        </p>
      )}
      {!isTouchLayout && (
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '-28px', left: 0, right: 0,
          opacity: desktopHintDismissed ? 0 : 1,
          transition: prefersReducedMotion ? 'none' : 'opacity var(--duration-base-plus) ease',
          pointerEvents: 'none',
        }}>
          <p style={{
            margin: 0, textAlign: 'center',
            fontSize: 'var(--font-size-body-xs)', fontFamily: 'var(--font-mono)',
            color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)',
            animation: (prefersReducedMotion || desktopHintDismissed) ? 'none' : 'hintPulse 2.5s ease-in-out infinite',
          }}>
            Hover for highlights
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// LogoLoader
// ============================================================
const LOADER_PHRASES = [
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

const LogoLoader = ({ visible, prefersReducedMotion = false }) => {
  const [index, setIndex] = React.useState(() => Math.floor(Math.random() * LOADER_PHRASES.length));
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (!visible || prefersReducedMotion) return;
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIndex((prev) => {
          let next = Math.floor(Math.random() * LOADER_PHRASES.length);
          if (next === prev) next = (next + 1) % LOADER_PHRASES.length;
          return next;
        });
        setIsExiting(false);
      }, 400); // Allow exit animation to complete
    }, 1400); // 1.4s overall rotation duration
    return () => clearInterval(interval);
  }, [visible, prefersReducedMotion]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-page)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
      transition: prefersReducedMotion ? 'none' : 'opacity var(--duration-slower-xl) ease',
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
        height: 'var(--size-window-bar)',
        marginTop: 'var(--layout-1)',
        display: 'flex',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>{LOADER_PHRASES[index]}</div>
        {LOADER_PHRASES[index].split('').map((char, i) => {
          if (char === ' ') return <span key={`${index}-${i}-space`} style={{ width: '0.4em' }}>&nbsp;</span>;
          return (
            <span
              key={`${index}-${i}`}
              aria-hidden="true"
              style={{
                display: 'inline-block',
                animation: prefersReducedMotion
                  ? 'none'
                  : isExiting
                    ? `letterExit var(--duration-base-plus) var(--easing-ease-in-out-strong) ${i * 5}ms forwards`
                    : `letterEnter var(--duration-slow) cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 10}ms forwards`,
                opacity: prefersReducedMotion ? 1 : 0,
                willChange: prefersReducedMotion ? 'auto' : 'transform, opacity, filter'
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

const MOBILE_BREAKPOINT = LAYOUT.MOBILE_BREAKPOINT;
const COMPACT_LAYOUT_BREAKPOINT = LAYOUT.LAYOUT_BREAKPOINT;
const WIDE_LAYOUT_BREAKPOINT = LAYOUT.MAX_WIDTH;
const TABLET_BREAKPOINT = LAYOUT.TABLET_BREAKPOINT;

// ============================================================
// Nav
// ============================================================
const Nav = ({ theme, setTheme, onHome, scrollToSection }) => {
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
  const handleLogoClick = (e) => { e.preventDefault(); trackSectionNavigation('top', 'nav_logo'); onHome(); };
  const goSection = (id) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMobileMenu();
    scrollToSection(id, isMobile ? 'mobile_nav' : 'nav');
  };
  return <SiteNavigation theme={theme} setTheme={(t) => {
    setTheme(t);
    trackPortfolioEvent('theme_toggle', { new_theme: t });
  }} scrolled={scrolled} isMobile={isMobile} isMobileMenuOpen={isMobileMenuOpen}
    closeMobileMenu={closeMobileMenu} onToggleMenu={() => setIsMobileMenuOpen(open => !open)}
    handleLogoClick={handleLogoClick} goSection={goSection} onEvent={trackPortfolioEvent} />;
};

// ============================================================
// Hero
// ============================================================
const Dot = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
    <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: 'var(--color-status-online)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-status-online) 22%, transparent)', display: 'inline-block' }} />
  </span>
);

const SHOW_ROLE_STATUS = false;
const ROLE_STATUS_COPY = 'CURRENTLY LOOKING FOR MY NEXT ROLE.';

const Hero = ({ galaxy, theme, scrollToSection }) => (
  <section id="top" className="hero-editorial-outer" style={{ padding: 'var(--space-7) var(--space-6) var(--layout-2)' }}>
    {/* Inner max-width box carries the grid, so the hero lines up with the
        content sections' containers instead of insetting an extra gutter. */}
    <div className="hero-editorial" style={{
      maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto',
      display: 'grid', gridTemplateColumns: '1.1fr 1fr', alignItems: 'center', gap: 'var(--layout-1)',
    }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {SHOW_ROLE_STATUS && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)' }}>
          <Dot /> <span>{ROLE_STATUS_COPY}</span>
        </div>
      )}
      <h1 style={{ fontSize: 'var(--font-size-hero-title)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: 0 }}>
        {HOME_PAGE_COPY.titleLead} <span style={{ color: 'var(--fg-tertiary)' }}>{HOME_PAGE_COPY.titleAccent}</span>
      </h1>
      <p style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 'var(--font-weight-regular)', lineHeight: 'var(--line-height-relaxed-plus)', color: 'var(--fg-secondary)', margin: 0, maxWidth: 520 }}>
        {HOME_PAGE_COPY.description}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <LinkButton variant="portfolio" href="/work" onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollToSection('work', 'hero_cta'); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--bg-page)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-standard)', background: 'var(--fg-primary)',
          minHeight: 'var(--control-hit-area)', textDecoration: 'none', transition: 'opacity var(--duration-fast)',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.86'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          View case studies
          <AppIcon icon={ArrowUpRight} size={12} />
        </LinkButton>
        <LinkButton variant="portfolio" href="#contact" onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollToSection('contact', 'hero_cta'); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--fg-primary)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-standard)', background: 'transparent',
          minHeight: 'var(--control-hit-area)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', textDecoration: 'none', transition: 'background var(--duration-fast)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >Say hello</LinkButton>
        <LinkButton variant="portfolio" href="/Omar%20Tavarez%20Resume.pdf" target="_blank" rel="noopener noreferrer"
          onClick={() => { if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('resume_download', { section: 'hero' }); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
            fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)',
            color: 'var(--fg-secondary)', minHeight: 'var(--control-hit-area)', padding: 'var(--space-2) var(--space-3)',
            textDecoration: 'none', borderRadius: 'var(--radius-standard)', background: 'transparent',
            transition: 'color var(--duration-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-secondary)'}
        >
          Resume
          <AppIcon icon={ArrowUpRight} size={12} />
        </LinkButton>
      </div>
      <div style={{ fontSize: 'var(--font-size-body-xs)', fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Recent impact: <span style={{ color: 'var(--fg-secondary)', textTransform: 'none', letterSpacing: 'normal' }}>~40% faster workflows • 1,600+ enterprise users • $20M+ revenue-driving workflows</span>
      </div>
    </div>
    <Portrait galaxy={galaxy} theme={theme} />
    </div>
  </section>
);

// ============================================================
// About
// ============================================================
const ABOUT_HEADER = `I work on the part most teams avoid.`;
const ABOUT_SUBHEAD = `Messy workflows, edge cases, and systems that don't scale — that's where design actually matters.`;
const ABOUT_SHORT = `I turn undefined product problems into shipped software across AI, fintech, healthcare, and enterprise SaaS. 12+ years leading 0→1 products, building design systems, and partnering with product, engineering, and leadership to move strategy into real product outcomes.`;

// /about page content — verbatim from the approved copy kit (about-page-copy.md).
const ABOUT_HERO_H1 = 'I started out designing flyers for my own parties.';
const ABOUT_HERO_LEDE = 'Now I turn undefined product problems into shipped software across AI, fintech, healthcare, and enterprise SaaS. 12+ years leading 0→1 products, building design systems, and partnering with product, engineering, and leadership to move strategy into real product outcomes.';

const ABOUT_CAPTION = 'Where it started: flyers from the DJ years, and a lifetime of drawing. A few UX sketches snuck in.';

// Each section is a two-column row: `side` is which side the image cluster sits on
// (desktop), alternating down the page. Tools & craft is a text-only interlude.
const ABOUT_SECTIONS = [
  {
    heading: 'Background',
    side: 'left',
    paras: [
      "I grew up in Brooklyn as an artist, and I've been drawing and painting my whole life. I found design through music. I was a professional DJ, and I started designing flyers for my own parties. That led to Photoshop, music covers, and the early internet, and then graphic, web and visual design. Product came through the practical side: HTML, CSS, small agency work, and learning how to turn ideas into interfaces people could actually use. Over time, that path moved through e-commerce, SaaS, fintech, healthcare, ad sales, media, and enterprise tools.",
      "The through-line has always been the same: I like hard product problems. The kind with messy data, edge cases, operational constraints, business pressure, and users who need the product to work because their job depends on it.",
    ],
    caption: ABOUT_CAPTION,
    images: ['drawings', 'flyers'],
  },
  {
    heading: 'How I work',
    side: 'right',
    paras: [
      "I'm a generalist with a systems mindset. I usually start in plain text: writing, mapping the problem, naming the tradeoffs, and cutting through ambiguity. Then I move quickly into flows, prototypes, and working artifacts.",
      "I'd rather put a rough prototype in a teammate's hands than spend another week polishing a deck. I care about craft, but I care more about momentum, clarity, and whether the work helps the team make a better decision.",
      "I've led workshops, shaped product direction, built design systems, and partnered closely with engineers to ship. Not for process theater — for speed, consistency, and better product quality.",
    ],
    link: { href: '/design-system', label: 'See the design system this site runs on' },
    images: ['reading'],
  },
  {
    heading: 'Currently',
    side: 'left',
    paras: [
      "I run an independent product design practice. My engagements are equal parts consulting and building — I'm as likely to be rebuilding a design system as shipping a feature to production — for a mix of companies I keep private.",
      "Lately that's meant embedded work with a fintech lending platform: rebuilding their design system and shipping tools their brokers use every day. One was a lender comparison tool — brokers weigh quotes to find the right fit for a borrower, and the matrix they'd inherited had become something you decoded rather than read. Another was sponsor expiration: designing how records lapse on a schedule instead of quietly going stale.",
      "Before this I spent two years as the founding designer at Wisdom, an early-stage healthcare SaaS platform, leading design across Management Portal, Reporting, Insurance Verification, and Posting Assistant — including an AI-assisted payment posting workflow that cut manual posting time by about 40%.",
      "Previously: Plastiq, Disney, Simplero, GoNation.",
    ],
    images: ['designsystem'],
  },
  {
    heading: 'Tools & craft',
    interlude: true,
    paras: [
      "Figma, React, HTML/CSS/JS, Claude Code, ChatGPT, Codex, Notion, Linear, and Obsidian.",
      "I use AI tools as part of my design workflow — to explore faster, prototype smarter, write better documentation, pressure-test ideas, and move from concept to implementation with less friction. I still believe taste, judgment, and product thinking are the real tools. The software just helps me move faster.",
    ],
  },
  {
    heading: 'Off the clock',
    side: 'right',
    paras: [
      "Amateur boxer, music producer, former DJ, and dedicated father. When I'm not training, I'm usually outdoors — hiking, traveling, and meeting new people. I'm usually thinking about systems, behavior, design, music, training, or why Brooklyn still has the best energy of any place on earth.",
    ],
    images: ['family', 'evening', 'hike'],
  },
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
  { name: 'WelcomeLend', src: '/Images/Carousel/welcomelend.svg', maxW: 118, maxH: 24, basis: 145 },
];

const LogoCarousel = () => (
  <Reveal as="section" className="logo-band" variant="soft" delay={90} aria-label="Companies Omar has worked with" style={{ padding: '0 0 var(--space-8)' }}>
    <div className="logo-carousel">
      <div className="logo-track">
        {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((logo, index) => {
          const isClone = index >= COMPANY_LOGOS.length;
          return (
            <div
              key={`${logo.name}-${index}`}
              className="logo-mark"
              aria-hidden={isClone ? true : undefined}
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

const About = () => (
  <>
    <Reveal as="section" id="about" variant="section" style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-3) var(--space-6) var(--layout-2)' }}>
      <div className="about-grid" style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto', display: 'grid', gridTemplateColumns: LAYOUT.GRID_DESKTOP, gap: 'var(--layout-3)', alignItems: 'start' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
          <span style={{ color: 'var(--color-develop-blue)' }}>01 — </span>About
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 'var(--content-reading-width)' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: 0 }}>
            {ABOUT_HEADER}
          </h2>
          <p style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 'var(--font-weight-regular)', lineHeight: 'var(--line-height-relaxed-plus)', color: 'var(--fg-secondary)', margin: 0 }}>
            {ABOUT_SUBHEAD}
          </p>
          <p style={{ fontSize: 'var(--font-size-body-lg)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-secondary)', margin: 0 }}>
            {ABOUT_SHORT}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <LinkButton variant="portfolio" href="/about" onClick={() => trackPortfolioEvent('about_page_open', { ui_location: 'about_section' })} style={{
              alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', padding: 'var(--control-padding-block) var(--space-4)',
              minHeight: 'var(--control-hit-area)', borderRadius: 'var(--radius-standard)', background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', transition: 'background var(--duration-fast)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Read more about me
              <AppIcon icon={ArrowUpRight} size={12} />
            </LinkButton>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-body-xs)',
              color: 'var(--fg-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-label-compact)',
              marginTop: 'var(--space-8)'
            }}>
              Built across startups, scaleups, and enterprise teams.
            </div>
          </div>
        </div>
      </div>
    </Reveal>
    <LogoCarousel />
  </>
);


// ============================================================
// About page (/about) — replaces the old drawer
// ============================================================
// A framed photo: an overflow-clipped frame (fixed aspect) around the image, so
// the intro/parallax can scale the image without it spilling. Opens the lightbox.
const ABOUT_HERO_KEYS = ['portrait', 'boxing', 'dj'];

// An image cluster: one framed photo, or a loose overlapping stack.
// A subtle scroll "float" — each [data-parallax] element drifts by a capped
// offset from its distance to the viewport center. Off under reduced motion.
const useAboutParallax = (rootRef, reducedMotion) => {
  React.useEffect(() => {
    if (reducedMotion || !rootRef.current) return undefined;
    const els = Array.from(rootRef.current.querySelectorAll('[data-parallax]'));
    if (!els.length) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const rel = (r.top + r.height / 2 - vh / 2) / vh;
        const speed = parseFloat(el.dataset.parallax) || 0;
        const y = Math.max(-20, Math.min(20, -rel * speed * 120));
        el.style.setProperty('--parallax-y', `${y.toFixed(1)}px`);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef, reducedMotion]);
};

// A body section: a two-column row (text + image cluster, side alternating), or
// a full-measure text-only interlude.
const AboutRow = ({ section, onOpen }) => {
  const body = (
    <div className="about-row__text">
      <h2>{section.heading}</h2>
      {section.paras.map((para, i) => <p key={i}>{para}</p>)}
      {section.caption && <p className="about-caption">{section.caption}</p>}
      {section.link && (
        <p><LinkButton variant="portfolio" className="about-link" href={section.link.href}>{section.link.label}</LinkButton></p>
      )}
    </div>
  );

  if (section.interlude || !section.images?.length) {
    return <section className="about-section about-interlude">{body}</section>;
  }

  return (
    <section className="about-row" data-side={section.side}>
      {body}
      <AboutStack photos={ABOUT_PHOTOS} images={section.images} onOpen={onOpen} />
    </section>
  );
};

const AboutPage = () => {
  const [lightbox, setLightbox] = React.useState(null);
  const rootRef = React.useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  useAboutParallax(rootRef, reducedMotion);
  const ctaBase = {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minHeight: 'var(--control-hit-area)',
    padding: 'var(--control-padding-block) var(--control-padding-roomy)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)',
    borderRadius: 'var(--radius-standard)', textDecoration: 'none',
  };
  return (
    <article className="about-page" ref={rootRef}>
      <div className="about-hero about-row" data-side="right">
        <div className="about-row__text about-hero__lede">
          <div className="about-eyebrow">About</div>
          <h1>{ABOUT_HERO_H1}</h1>
          <p className="about-lede">{ABOUT_HERO_LEDE}</p>
        </div>
        <AboutStack photos={ABOUT_PHOTOS} images={ABOUT_HERO_KEYS} onOpen={setLightbox} eager className="about-collage" tilePrefix="about-collage__tile" />
      </div>

      {ABOUT_SECTIONS.map((section) => (
        <AboutRow key={section.heading} section={section} onOpen={setLightbox} />
      ))}

      <section className="about-section about-cta-section">
        <div className="about-cta">
          <LinkButton variant="portfolio" href="/work" style={{ ...ctaBase, color: 'var(--bg-page)', background: 'var(--fg-primary)' }}>
            See the work <AppIcon icon={ArrowUpRight} size={12} />
          </LinkButton>
          <LinkButton variant="portfolio" href="/ask" style={{ ...ctaBase, color: 'var(--fg-primary)', background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>
            Ask about the work <AppIcon icon={ArrowUpRight} size={12} />
          </LinkButton>
          <LinkButton variant="portfolio"
            href="mailto:omar@designedbyomar.com"
            onClick={() => { if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('contact_click_email', { link_url: 'mailto:omar@designedbyomar.com', section: 'about' }); }}
            style={{ ...ctaBase, color: 'var(--fg-primary)', background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}
          >
            Email me <AppIcon icon={ArrowUpRight} size={12} />
          </LinkButton>
        </div>
      </section>

      {lightbox && <AboutLightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  );
};

// ============================================================
// Case Studies — data
// ============================================================
// ============================================================
// Work — homepage section
// ============================================================
const Work = () => {
  const viewportWidth = useViewportWidth();
  const workHeadColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : LAYOUT.GRID_DESKTOP;
  const secondaryColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : 'repeat(2, minmax(0, 1fr))';

  return (
    <section id="work" style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-3) var(--space-6)' }}>
      <div style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto' }}>
        <Reveal className="work-head" variant="section" style={{ display: 'grid', gridTemplateColumns: workHeadColumns, gap: viewportWidth <= TABLET_BREAKPOINT ? 24 : 64, alignItems: 'start', marginBottom: 'var(--control-copy-reserve)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
            <span style={{ color: 'var(--color-preview-pink)' }}>02 — </span>Selected work
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 'var(--content-reading-width)' }}>
            <h2 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: 0 }}>
              {WORK_PAGE_COPY.titleLead} <span style={{ color: 'var(--fg-tertiary)' }}>{WORK_PAGE_COPY.titleAccent}</span>
            </h2>
            <p style={{ fontSize: 'var(--font-size-body-xl)', lineHeight: 'var(--line-height-relaxed-xl)', color: 'var(--fg-secondary)', margin: 0 }}>
              {HOME_PAGE_COPY.workDescription}
            </p>
          </div>
        </Reveal>

        <Reveal delay={70} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)', marginBottom: 'var(--space-7)' }}>
          <CaseCard c={CASE_STUDIES[0]} featured wideMedia />
        </Reveal>
        <Reveal delay={130} style={{ display: 'grid', gridTemplateColumns: secondaryColumns, gap: 'var(--space-8)', marginBottom: 'var(--space-7)', alignItems: 'stretch' }}>
          <CaseCard c={CASE_STUDIES[1]} />
          <CaseCard c={CASE_STUDIES[2]} />
        </Reveal>
        <Reveal delay={180} style={{ display: 'grid', gridTemplateColumns: secondaryColumns, gap: 'var(--space-8)', marginBottom: 'var(--layout-1)', alignItems: 'stretch' }}>
          <CaseCard c={CASE_STUDIES[3]} />
          <CaseCard c={CASE_STUDIES[4]} />
        </Reveal>

        <Reveal as="div" delay={230} style={{ display: 'inline-flex' }}>
          <LinkButton variant="portfolio" href="/work" style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', padding: 'var(--control-padding-block) var(--space-4)',
            minHeight: 'var(--control-hit-area)', borderRadius: 'var(--radius-standard)', background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
            textDecoration: 'none', transition: 'background var(--duration-fast)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            See all {CASE_STUDIES.length} case studies
            <AppIcon icon={ArrowUpRight} size={12} />
          </LinkButton>
        </Reveal>
      </div>
    </section>
  );
};

// ============================================================
// WorkIndexPage — the full case-study index at /work
// ============================================================
const WorkIndexPage = () => {
  const viewportWidth = useViewportWidth();
  const headColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : LAYOUT.GRID_DESKTOP;
  const featuredColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : 'repeat(2, minmax(0, 1fr))';

  return (
    <section style={{ padding: 'var(--space-8) var(--space-6) var(--layout-3)' }}>
      <div style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto' }}>
        <Reveal className="work-head" variant="section" style={{ display: 'grid', gridTemplateColumns: headColumns, gap: viewportWidth <= TABLET_BREAKPOINT ? 24 : 64, alignItems: 'start', marginBottom: 'var(--control-copy-reserve)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
            <span style={{ color: 'var(--color-preview-pink)' }}>All — </span>{CASE_STUDIES.length} case studies
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 'var(--content-reading-width)' }}>
            <h1 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: 0 }}>
              {WORK_PAGE_COPY.titleLead} <span style={{ color: 'var(--fg-tertiary)' }}>{WORK_PAGE_COPY.titleAccent}</span>
            </h1>
            <p style={{ fontSize: 'var(--font-size-body-xl)', lineHeight: 'var(--line-height-relaxed-xl)', color: 'var(--fg-secondary)', margin: 0 }}>
              {WORK_PAGE_COPY.description}
            </p>
          </div>
        </Reveal>

        {/* The two leading case studies keep a featured tier here, as they do on the
            homepage — a uniform grid flattened the flagship to the same weight as
            everything else on the page most likely to be sent to a hiring manager. */}
        <Reveal delay={70} style={{ display: 'grid', gridTemplateColumns: featuredColumns, gap: 'var(--space-8)', alignItems: 'stretch', marginBottom: 'var(--space-8)' }}>
          {CASE_STUDIES.slice(0, 2).map((c) => <CaseCard key={c.id} c={c} featured />)}
        </Reveal>

        <Reveal delay={130} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-8)', alignItems: 'stretch' }}>
          {CASE_STUDIES.slice(2).map((c) => <CaseCard key={c.id} c={c} />)}
        </Reveal>
      </div>
    </section>
  );
};

// ============================================================
// CaseStudyBody — migrated long-form content
// ============================================================
// Prose holds a 640px measure for readability; images span the full container,
// which is what fills the empty right-hand column on these pages.
// ============================================================
// CaseStudyPage — individual case study page
// ============================================================
const CaseStudyPage = ({ c, onBack }) => {
  React.useEffect(() => {
    if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('case_study_view', { case_study_id: c.id });
  }, [c.id]);

  const accent = c.accent;
  const idx = CASE_STUDIES.findIndex(x => x.id === c.id);
  const prev = CASE_STUDIES[(idx - 1 + CASE_STUDIES.length) % CASE_STUDIES.length];
  const next = CASE_STUDIES[(idx + 1) % CASE_STUDIES.length];

  return (
    <article style={{ maxWidth: 'var(--content-about-width)', margin: '0 auto', padding: 'var(--space-8) var(--space-6) var(--layout-3)' }}>
      <LinkButton variant="portfolio" href="/work" onClick={(e) => { e.preventDefault(); onBack(); }} style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)',
        textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)',
        marginBottom: 'var(--space-8)', transition: 'color var(--duration-fast)',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-tertiary)'}
      >
        <AppIcon icon={ArrowLeft} size={12} />
        Back to work
      </LinkButton>

      {/*
        A citation in the Ask panel lands here, and until this link existed the
        assistant simply disappeared at that point — the reader had to know to
        scroll the homepage to find it again.
      */}
      <LinkButton variant="portfolio" href="/ask" onClick={() => trackPortfolioEvent('ask_page_click', { ui_location: 'case_study', case_study_id: c.id })} style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)',
        textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)',
        marginBottom: 'var(--space-8)', marginLeft: 'var(--space-6)', transition: 'color var(--duration-fast)',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-tertiary)'}
      >
        Ask about this work
        <AppIcon icon={ArrowUpRight} size={12} />
      </LinkButton>

      {/* Cover */}
      <div className="cs-cover" style={{
        position: 'relative', width: '100%',
        background: caseAccentGradient(accent),
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card-subtle)', marginBottom: 'var(--layout-1)',
      }}>
        {(c.coverImage || c.coverVideo) && (
          <div style={{
            position: 'absolute', inset: '56px 28px 24px',
            borderRadius: 'var(--radius-image)', overflow: 'hidden',
            background: 'var(--bg-page)',
            boxShadow: '0 18px 48px rgba(0, 0, 0, var(--opacity-28)), inset 0 0 0 1px rgba(255, 255, 255, var(--opacity-8))',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-compact)',
              height: 34, padding: '0 var(--space-3)',
              background: 'color-mix(in oklab, var(--bg-page) 86%, white 14%)',
              borderBottom: '1px solid color-mix(in oklab, var(--color-gray-100) 88%, transparent)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-circle)', background: 'rgba(255, 95, 86, var(--opacity-95))', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-circle)', background: 'rgba(255, 189, 46, var(--opacity-95))', display: 'inline-block' }} />
              <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-circle)', background: 'rgba(39, 201, 63, var(--opacity-95))', display: 'inline-block' }} />
              <div style={{
                marginLeft: 'var(--control-padding-block)', flex: 1, height: 12, borderRadius: 'var(--radius-circle)',
                background: 'color-mix(in oklab, var(--color-gray-100) 92%, transparent)',
                opacity: 0.78,
              }} />
            </div>
            <div style={{
              width: '100%', height: 'calc(100% - 34px)',
              overflowY: 'auto', overflowX: 'hidden',
              background: 'var(--bg-page)',
            }}>
              {c.coverVideo
                ? <video src={c.coverVideo} autoPlay muted loop playsInline style={{ width: '100%', height: 'auto', display: 'block' }} />
                : <img src={c.coverImage} alt={`${c.title} dashboard preview`} style={{ width: '100%', height: 'auto', display: 'block' }} />}
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute', top: 'var(--space-5)', left: 22,
          fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-white)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)',
          background: 'rgba(0, 0, 0, var(--opacity-32))', padding: 'var(--space-tag-cover-block) var(--control-padding-block)', borderRadius: 'var(--radius-subtle)',
          backdropFilter: 'var(--blur-base)', WebkitBackdropFilter: 'var(--blur-base)',
        }}>{c.num} · {c.year} · {c.client}</div>
      </div>

      {/* Title + meta */}
      <div style={{ marginBottom: 'var(--layout-1)' }}>
        <h1 style={{
          fontSize: 'var(--font-size-case-title)', fontWeight: 'var(--font-weight-semibold)',
          lineHeight: 'var(--line-height-solid)', letterSpacing: 'var(--tracking-display)',
          color: 'var(--fg-primary)', margin: '0 0 var(--space-5)',
        }}>{c.title}</h1>
        <p style={{ fontSize: 'var(--font-size-case-lede)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-secondary)', margin: '0 0 var(--space-6)' }}>{c.subtitle}</p>
        <CaseStudyMetadata>{c.role}</CaseStudyMetadata>
        <div style={{ display: 'flex', gap: 'var(--space-compact)', flexWrap: 'wrap' }}>
          {c.tags.map(t => (
            <CaseStudyTag key={t}>{t}</CaseStudyTag>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <div className="cs-metrics-grid" style={{
        borderRadius: 'var(--radius-image)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card-subtle)',
        background: 'var(--bg-page)', marginBottom: 'var(--layout-2)',
      }}>
        {c.metrics.map((m, i) => (
          <div key={i} style={{
            padding: 'var(--space-7) var(--space-6)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 'var(--font-weight-bold)', letterSpacing: 'var(--tracking-display)', color: accent, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', marginTop: 'var(--control-padding-block)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)' }}>{m.label}</div>
            {m.qualifier && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', marginTop: 'var(--space-compact)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)', opacity: 0.72 }}>{m.qualifier}</div>
            )}
          </div>
        ))}
      </div>

      {/* Challenge / Approach / Outcome */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-2)', maxWidth: 'var(--content-reading-width)', margin: '0 auto', width: '100%' }}>
        {[
          { label: 'Challenge', body: c.challenge },
          { label: 'Approach', body: c.approach },
          { label: 'Outcome', body: c.outcome },
        ].map(({ label, body }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: accent, textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', marginBottom: 'var(--space-4)' }}>{label}</div>
            <p style={{ fontSize: 'var(--font-size-prose)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-primary)', margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      <CaseStudyBody blocks={c.body} accent={accent} />

      {c.relatedLink && (
        <div style={{ maxWidth: 'var(--content-reading-width)', margin: '0 auto', width: '100%', marginTop: 'var(--layout-2)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-gray-100)' }}>
          <p style={{ fontSize: 'var(--font-size-body-md)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-secondary)', margin: '0 0 var(--space-4)' }}>{c.relatedLink.note}</p>
          <LinkButton variant="portfolio" href={c.relatedLink.href} className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)' }}>
            {c.relatedLink.label}
            <AppIcon icon={ArrowUpRight} size={12} />
          </LinkButton>
        </div>
      )}

      {/* Prev / Next */}
      <div className="cs-prevnext" style={{
        marginTop: 'var(--layout-3)', paddingTop: 'var(--space-7)',
        borderTop: '1px solid var(--color-gray-100)',
      }}>
        <LinkButton variant="portfolio"
          href={`/work/${prev.id}/`}
          onClick={() => trackPortfolioEvent('case_study_next_previous_click', {
            direction: 'previous',
            case_study_id: c.id,
            target_case_study_id: prev.id,
          })}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-micro)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', marginBottom: 'var(--control-padding-block)' }}>← Previous</div>
          <div style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: 'var(--tracking-card)', color: 'var(--fg-primary)' }}>{prev.title}</div>
          <div style={{ fontSize: 'var(--font-size-body-xs)', color: 'var(--fg-tertiary)', marginTop: 'var(--space-1)' }}>{prev.client}</div>
        </LinkButton>
        <LinkButton variant="portfolio"
          href={`/work/${next.id}/`}
          onClick={() => trackPortfolioEvent('case_study_next_previous_click', {
            direction: 'next',
            case_study_id: c.id,
            target_case_study_id: next.id,
          })}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-micro)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', marginBottom: 'var(--control-padding-block)' }}>Next →</div>
          <div style={{ fontSize: 'var(--font-size-heading-md)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: 'var(--tracking-card)', color: 'var(--fg-primary)' }}>{next.title}</div>
          <div style={{ fontSize: 'var(--font-size-body-xs)', color: 'var(--fg-tertiary)', marginTop: 'var(--space-1)' }}>{next.client}</div>
        </LinkButton>
      </div>
    </article>
  );
};

// ============================================================
// Contact + Footer
// ============================================================
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
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    if (!mq.matches) animRef.current = requestAnimationFrame(loop);

    const onMotionChange = (e) => {
      if (e.matches) cancelAnimationFrame(animRef.current);
      else animRef.current = requestAnimationFrame(loop);
    };
    const stopWatching = onMediaChange(mq, onMotionChange);
    return () => {
      cancelAnimationFrame(animRef.current);
      stopWatching();
    };
  }, []);

  const facts = [
    { label: 'Core Expertise', value: 'AI workflows, design systems, enterprise UX, fintech, healthcare SaaS.', icon: Sparkles },
    { label: 'Role Focus', value: 'Principal, Lead, and Design Manager roles across 0→1 product delivery.', icon: Target },
    { label: 'Experience', value: 'Welcome Lend, Wisdom, Plastiq, Disney — AI workflows to enterprise platforms.', icon: Rocket },
    { label: 'Writing', value: null, custom: true, icon: NotebookPen },
  ];

  return (
    <>
      <section
      ref={sectionRef}
      id="at-a-glance"
      className="facts-section"
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        padding: 'var(--layout-4) var(--space-6)',
        overflow: 'hidden',
        background: 'var(--color-develop-blue)',
      }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="fact-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-ship-red)" />
            <stop offset="50%" stopColor="var(--color-preview-pink)" />
            <stop offset="100%" stopColor="var(--color-develop-blue)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Swirling mesh gradient — rAF driven, no CSS transition needed */}
      <div ref={gradRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 1,
      }} />
      <div style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto', position: 'relative', zIndex: 'var(--z-component-cover)' }}>
        <Reveal className="work-head" variant="section" style={{
          display: 'grid',
          gridTemplateColumns: viewportWidth <= TABLET_BREAKPOINT ? '1fr' : LAYOUT.GRID_DESKTOP,
          gap: viewportWidth <= TABLET_BREAKPOINT ? 'var(--space-6)' : 'var(--layout-2)',
          alignItems: 'start',
          marginBottom: 'var(--layout-1)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-body-sm)',
            color: 'color-mix(in srgb, var(--fg-on-dark) 74%, transparent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-label)'
          }}>
            <span style={{ color: 'color-mix(in srgb, var(--color-develop-blue) 48%, var(--fg-on-dark) 52%)' }}>03 — </span>At a Glance
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-on-dark)', margin: 0, maxWidth: 760 }}>
            The short version: <span style={{ color: 'color-mix(in srgb, var(--fg-on-dark) 74%, transparent)' }}>I design systems, workflows, and products that scale.</span>
          </h2>
        </Reveal>
        <Reveal variant="section" className="facts-grid" style={{
          display: 'grid',
          gridTemplateColumns: factsColumns,
          gap: 'var(--space-5)',
        }}>
          {facts.map((f) => (
            <div key={f.label} style={{
              padding: 'var(--space-6) var(--space-5)',
              borderRadius: 'var(--radius-image)',
              background: 'var(--bg-subtle)',
              boxShadow: 'var(--shadow-card-subtle)',
              transition: 'box-shadow var(--duration-fast-mid) ease, transform var(--duration-fast-mid) ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-full)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <AppIcon icon={f.icon} size={24} stroke="url(#fact-icon-gradient)" style={{ marginBottom: 'var(--space-4)', display: 'block', flexShrink: 0 }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', marginBottom: 'var(--space-3)' }}>
                {f.label}
              </div>
              {f.custom ? (
                <div style={{ fontSize: 'var(--font-size-body-xl)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  Sharing insights on design and product strategy via{' '}
                  <LinkButton variant="portfolio" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-develop-blue)', textDecoration: 'none', borderBottom: '1px solid currentColor' }} onClick={() => { if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('contact_click_linkedin', { link_url: LINKEDIN_URL, section: 'at_a_glance' }); }}>LinkedIn</LinkButton>
                  {' '}and{' '}
                  <LinkButton variant="portfolio" href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-preview-pink)', textDecoration: 'none', borderBottom: '1px solid currentColor' }} onClick={() => { if (window.trackAnalyticsEvent) window.trackAnalyticsEvent('contact_click_substack', { link_url: SUBSTACK_URL, section: 'at_a_glance' }); }}>Substack</LinkButton>
                </div>
              ) : (
                <div style={{ fontSize: 'var(--font-size-body-xl)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  {f.value}
                </div>
              )}
            </div>
          ))}
        </Reveal>
        <Reveal variant="section">
          <GitHubContributions profileUrl={GITHUB_URL} />
        </Reveal>
      </div>
    </section>
    </>
  );
};

// ============================================================
// Ask — pre-generated answers, matched client-side
// ============================================================

/**
 * Suggested prompts, in preference order. The first three carry the section on
 * their own; the rest are a tap away. Ids that are not approved are skipped.
 */
const ASK_SUGGESTED_IDS = [
  'kind-of-designer',
  'design-systems',
  'fintech-depth',
  'ai-llm-work',
  'leadership-or-ic',
  'technical-depth',
  'looking-for',
  'business-outcomes',
];

const ASK_MAX_SUGGESTIONS = 8;

/**
 * Three is enough to show what the box is for without becoming a wall of
 * buttons above the answer. The rest are behind one control, and the full set is
 * behind the link to /ask.
 */
const ASK_COLLAPSED_SUGGESTIONS = 3;

/**
 * Follow-ups shown once an answer is on screen. Fewer than the opening set:
 * they are a next step from something the reader is already looking at, not a
 * second menu — which is also why they are never collapsed.
 */
const ASK_MAX_FOLLOW_UPS = 4;

/**
 * Refusals answer a question honestly when it is asked, but suggesting one
 * invites it. Nothing on a hiring page should prompt a visitor to ask whether
 * Omar will work for free.
 */
const isSuggestable = (answer) => answer.topic !== 'refusal';

const loadAskAnswers = async () => {
  // Dev reads the source file so drafts are visible while reviewing. The
  // production build writes a filtered copy containing approved answers only,
  // so draft text never ships — see generateAskAnswers in postbuild.js.
  if (import.meta.env.DEV) {
    const mod = await import('./content/ask-answers.json');
    return (mod.default ?? mod).answers ?? [];
  }
  const response = await fetch('/ask-answers.json');
  if (!response.ok) throw new Error(`ask-answers.json: ${response.status}`);
  const doc = await response.json();
  return doc.answers ?? [];
};

// Body paragraphs of an answer, with the first mention of each cited case study
// turned into a link to its page. `citedIds` is the same set the citation chips
// use, so nothing links that the answer was not grounded in, and each study
// links once across the whole answer — `remaining` shrinks as studies are used,
// so a later paragraph does not re-link one an earlier paragraph already did.
/**
 * `linkable` is set when the panel is the page rather than a section of one.
 * It turns the answer on screen into part of the URL, so an answer can be sent
 * to someone else — the thing a reader most wants to do with a good one, and
 * impossible while the panel only exists mid-scroll on the homepage. The
 * homepage panel leaves the URL alone, or it would fight the #faq anchor.
 */
const Ask = ({ prefersReducedMotion, linkable = false }) => {
  const [answers, setAnswers] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [missed, setMissed] = React.useState(false);
  // A drafted reply, when the written set had no answer. Held apart from
  // `result` so the UI can never present unreviewed text as reviewed.
  const [drafted, setDrafted] = React.useState(null);
  // null | 'looking' | 'drafting'. Two waits, and they say different things:
  // looking is still hoping for a written answer, drafting has given up on one.
  // Reporting the second while the first is true was simply untrue.
  const [phase, setPhase] = React.useState(null);
  // Identifies the interaction that owns the answer region, so a response
  // arriving for an older one can be discarded rather than rendered.
  const requestRef = React.useRef(0);
  const abortRef = React.useRef(null);
  const resolvedHashRef = React.useRef(null);
  const sentinelRef = React.useRef(null);
  // 'idle' | 'copied' | 'failed'. A rejected clipboard write used to look
  // identical to never having pressed the button, and clipboard writes are
  // rejected routinely — insecure origin, denied permission, no gesture.
  const [copyState, setCopyState] = React.useState('idle');
  const [suggestionsExpanded, setSuggestionsExpanded] = React.useState(false);
  const suggestionListRef = React.useRef(null);
  const reasonRef = React.useRef('');
  // Set only by the expand control, so focus is never taken on mount, on
  // collapse, or when the row switches to follow-ups.
  const focusRevealedRef = React.useRef(false);
  const copyResetRef = React.useRef(null);

  React.useEffect(() => () => {
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
  }, []);

  const settle = (state) => {
    setCopyState(state);
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
    copyResetRef.current = window.setTimeout(() => setCopyState('idle'), 1200);
  };

  // Moves focus to the first prompt the expansion revealed. Anything else would
  // strand a keyboard user behind the control they just pressed.
  React.useEffect(() => {
    if (!focusRevealedRef.current) return;
    focusRevealedRef.current = false;
    const revealed = suggestionListRef.current
      ?.querySelectorAll('[data-ask-suggestion="true"]')[ASK_COLLAPSED_SUGGESTIONS];
    revealed?.focus();
  }, [suggestionsExpanded]);

  const copyLink = async (answer) => {
    // A clipboard write is async, and selecting another answer while it is in
    // flight used to land its result on the new answer's button: it would read
    // "Copied" while the clipboard held the previous answer's link, and the
    // visitor would send the wrong one. Same token every other late arrival is
    // checked against — `claim()` bumps it on each answer change.
    const token = requestRef.current;
    const current = () => requestRef.current === token;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/ask#${answer.id}`);
      if (!current()) return;
      trackPortfolioEvent('ask_share_click', { answer_id: answer.id });
      settle('copied');
    } catch {
      // No clipboard permission, or an insecure origin. show() has already put
      // this answer's id in the hash, so the address bar is the link — say so
      // rather than leaving the press looking like it did nothing.
      if (current()) settle('failed');
    }
  };

  // Loaded when the section comes into view rather than on focus: the fetch
  // lands well after LCP, and the panel never renders as an empty shell before
  // we know whether there is anything approved to show.
  React.useEffect(() => {
    let cancelled = false;
    const load = () => loadAskAnswers()
      .then(loaded => { if (!cancelled) setAnswers(loaded); })
      .catch(() => { if (!cancelled) setAnswers([]); });

    // On /ask the panel is the page, so there is nothing to scroll to and
    // nothing to protect — a deep-linked answer has to resolve on arrival.
    if (linkable) { load(); return () => { cancelled = true; }; }

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => { cancelled = true; observer.disconnect(); };
  }, [linkable]);

  const index = React.useMemo(() => (answers?.length ? buildIndex(answers) : null), [answers]);

  const openingSuggestions = React.useMemo(() => {
    if (!answers?.length) return [];
    const byId = new Map(answers.map(a => [a.id, a]));
    const picked = ASK_SUGGESTED_IDS.map(id => byId.get(id)).filter(Boolean);
    for (const answer of answers) {
      if (picked.length >= ASK_MAX_SUGGESTIONS) break;
      if (!picked.includes(answer) && isSuggestable(answer)) picked.push(answer);
    }
    return picked.slice(0, ASK_MAX_SUGGESTIONS);
  }, [answers]);

  // The question that produced whatever is on screen. Held rather than read
  // from `query`, which keeps changing as the visitor types the next one.
  const answered = result?.question ?? drafted?.question ?? null;

  /**
   * Once an answer is showing, the opening six are stale — they are the same
   * six the visitor has already passed over. Rank the set against the question
   * just answered instead, so the row becomes a next step rather than a menu
   * that never changes.
   */
  const followUps = React.useMemo(() => {
    if (!index || !answered) return [];
    return rankNearest(
      answered,
      index,
      ASK_MAX_FOLLOW_UPS + 1,
      a => isSuggestable(a) && a.id !== result?.id,
    ).slice(0, ASK_MAX_FOLLOW_UPS);
  }, [index, answered, result]);

  // Follow-ups are never collapsed: there are at most four of them and they are
  // the next step from an answer already on screen. Only the opening set, which
  // a visitor meets before they have asked anything, is worth hiding.
  const showingFollowUps = followUps.length > 0;
  const fullSet = showingFollowUps ? followUps : openingSuggestions;
  const collapsible = !showingFollowUps && fullSet.length > ASK_COLLAPSED_SUGGESTIONS;
  const suggestions = collapsible && !suggestionsExpanded
    ? fullSet.slice(0, ASK_COLLAPSED_SUGGESTIONS)
    : fullSet;

  // Drives both the submit guard and the button's disabled styling, so the two
  // cannot disagree — a button that looks pressable and does nothing is worse
  // than one that looks disabled.
  const canSubmit = Boolean(query.trim()) && Boolean(index) && !phase;

  /**
   * Every interaction that takes over the answer region claims it first.
   *
   * A draft streams in over several seconds, and the visitor can pick a
   * suggestion while it is still arriving. Clearing the draft is not enough:
   * the reader keeps yielding chunks that rebuild it, and the superseded
   * request still runs its fallback at the end — which would replace the
   * answer they just chose. Claiming aborts the request and invalidates every
   * write that belonged to it.
   */
  const claim = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    requestRef.current += 1;
    return requestRef.current;
  };

  /**
   * Take over the answer region for `answer`, cancelling whatever held it.
   *
   * Kept separate from show() for the one caller that must not touch the URL:
   * the hash listener is reacting to the URL, so writing it back would be
   * circular. Everything else about taking over is identical, and has to be —
   * without the claim, an in-flight request resolves over the top of a
   * deep-linked answer, which is how this went wrong.
   */
  const take = (answer) => {
    claim();
    setResult(answer);
    setMissed(false);
    setDrafted(null);
    setPhase(null);
    setCopyState('idle');
  };

  const clearAnswer = () => {
    claim();
    setResult(null);
    setMissed(false);
    setDrafted(null);
    setPhase(null);
    setCopyState('idle');
  };

  const show = (answer, { historyMode = 'push' } = {}) => {
    take(answer);
    if (!linkable) return;
    const hash = `#${answer.id}`;
    if (window.location.hash !== hash) history[`${historyMode}State`](null, '', hash);
    resolvedHashRef.current = answer.id;
  };

  /**
   * Resolve /ask#<answer-id>, on arrival and on every later history change.
   *
   * Goes through take(), not a bare setResult: following a link to another
   * answer while a request is in flight has to cancel that request, or it
   * resolves over the top and the page stops showing the answer its URL names.
   * The listener is registered after `take` exists so it uses the real one.
   */
  React.useEffect(() => {
    if (!linkable || !answers?.length) return undefined;

    const resolveLocation = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id === resolvedHashRef.current) return;
      resolvedHashRef.current = id;
      if (!id) {
        clearAnswer();
        return;
      }
      const answer = answers.find(a => a.id === id);
      if (answer) {
        take(answer);
      } else {
        clearAnswer();
      }
    };

    resolveLocation();
    window.addEventListener('popstate', resolveLocation);
    window.addEventListener('hashchange', resolveLocation);
    return () => {
      window.removeEventListener('popstate', resolveLocation);
      window.removeEventListener('hashchange', resolveLocation);
    };
    // `take` is stable in everything that matters — refs and setters — so it is
    // deliberately not a dependency; including it would re-register per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkable, answers]);

  const fallBack = () => { setResult(null); setDrafted(null); setMissed(true); };

  /**
   * Token overlap could not be trusted with this one. Ask the endpoint, which
   * puts every written question to a model and returns the one this is asking
   * for — or, when none of them is, drafts a reply only from the case studies
   * the router explicitly names.
   *
   * Any failure — offline, rate limited, no key, provider down — fails closed
   * to the email handoff without attaching loosely related citations.
   */
  const ask = async (asked, reviewedHistoryMode = 'push') => {
    reasonRef.current = '';
    const token = requestRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const current = () => requestRef.current === token;

    setPhase('looking');
    // Set once headers arrive, so a failure can say which side of them it fell on.
    let received = false;
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: asked }),
        signal: controller.signal,
      });
      if (!current()) return 'superseded';

      const kind = response.headers.get('X-Ask-Source');
      const sourceIds = (response.headers.get('X-Ask-Sources') ?? '').split(',').filter(Boolean);
      // Why the endpoint did what it did. Reported so a failure shows up as a
      // pattern in analytics rather than needing to be reproduced live.
      reasonRef.current = response.headers.get('X-Ask-Reason') || '';
      received = true;

      if (kind === 'reviewed') {
        const id = response.headers.get('X-Ask-Answer-Id');
        const reviewed = answers.find(a => a.id === id);
        // 'exact' cannot reach here — the client answers those itself — so this
        // is the router's pick.
        const matchedBy = response.headers.get('X-Ask-Matched-By') || 'router';
        if (reviewed) {
          show(reviewed, { historyMode: reviewedHistoryMode });
          // A written answer was served, so this is not a missing answer and the
          // wording is not recorded. Only the id, which is not personal and is
          // what says whether routing is picking sensibly.
          trackPortfolioEvent('ask_routed', { answer_id: reviewed.id, matched_by: matchedBy });
          return matchedBy;
        }
      }

      if (kind === 'generated' && response.body) {
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let text = '';
        setPhase('drafting');
        setDrafted({ text: '', sources: sourceIds, question: asked });
        setMissed(false);
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!current()) { await reader.cancel().catch(() => {}); return 'superseded'; }
          text += value;
          setDrafted({ text, sources: sourceIds, question: asked });
        }
        if (text.trim()) return 'generated';
      }
    } catch {
      // Aborted, offline, or the stream broke — handled below unless something
      // newer has taken over. The endpoint never answered a request that failed
      // before its headers, so without this the event would report `none` and
      // a dropped connection would read as a server fallback with no cause.
      if (current()) {
        reasonRef.current = controller.signal.aborted ? 'client-abort'
          : received ? 'client-stream-error'
          : 'client-network-error';
      }
    } finally {
      if (current()) setPhase(null);
    }

    if (!current()) return 'superseded';

    // The endpoint could not help, and the loose local match is deliberately
    // not used in its place. Without an explicit routing boundary, even a
    // plausible-looking citation can support the wrong subject.
    fallBack();
    return 'fallback';
  };

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const asked = query.trim();
    const hit = matchQuestion(asked, index);

    // Exact phrases and guarded management intent are deterministic. They are
    // answered here and nothing is sent anywhere. Everything else is routed,
    // because a non-exact overlap score is as likely to be wrong as right.
    if (hit?.exact || hit?.guarded) {
      const matchedBy = hit.exact ? 'exact' : 'guardrail';
      trackPortfolioEvent('ask_submit', { matched: true, matched_by: matchedBy, answer_id: hit.answer.id });
      show(hit.answer);
      return;
    }

    // The question itself is the point of this event: it is the only signal
    // for which answers are missing. Disclosed in the privacy policy, and the
    // consent gate in trackAnalyticsEvent means a declined visitor sends
    // nothing at all.
    const near = nearestTopic(asked, index);
    trackPortfolioEvent('ask_submit', { matched: false, matched_by: 'routing' });
    // Nothing written is on screen any more, so the hash must not keep
    // pointing at the answer that was.
    let reviewedHistoryMode = 'push';
    if (linkable && window.location.hash) {
      history.pushState(null, '', window.location.pathname);
      reviewedHistoryMode = 'replace';
    }
    resolvedHashRef.current = '';
    claim();
    setResult(null);
    setMissed(false);
    setDrafted(null);
    ask(asked, reviewedHistoryMode).then(answered => {
      if (answered === 'superseded') return;
      // A written answer was served by the router,
      // so `ask_routed` has already reported it, without the wording. Recording
      // it here too would put covered questions into the missing-answer count,
      // which is the one signal that decides what gets written next, and would
      // send their wording against what the privacy policy says.
      if (answered === 'router') return;
      trackPortfolioEvent('ask_no_match', {
        question: asked,
        nearest_id: near?.id ?? 'none',
        answered_by: answered,
        reason: reasonRef.current || 'none',
        local_score: hit ? Math.round(hit.score * 100) / 100 : 0,
      });
    });
  };

  if (!answers?.length) return <div ref={sentinelRef} aria-hidden="true" />;

  return <AskPanel {...{ query, setQuery, submit, canSubmit, prefersReducedMotion, result, linkable,
    copyState, copyLink, phase, drafted, missed, suggestions, showingFollowUps, collapsible,
    suggestionsExpanded, setSuggestionsExpanded, focusRevealedRef, fullSet, show, sentinelRef,
    suggestionListRef }} studies={CASE_STUDIES} onEvent={trackPortfolioEvent} />;
};

const AskSection = ({ scrollToSection }) => {
  const viewportWidth = useViewportWidth();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isStacked = viewportWidth <= TABLET_BREAKPOINT;
  const faqColumns = isStacked ? '1fr' : 'minmax(340px, 440px) minmax(0, 1fr)';

  const contactCta = (
    <LinkButton variant="portfolio" href="#contact" onClick={(event) => {
      event.preventDefault();
      scrollToSection('contact', 'faq_cta');
    }} style={{
      alignSelf: 'flex-start',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      minHeight: 'var(--control-hit-area)',
      fontSize: 'var(--font-size-body-md)',
      fontWeight: 'var(--font-weight-medium)',
      color: 'var(--fg-primary)',
      padding: 'var(--control-padding-block) var(--space-4)',
      borderRadius: 'var(--radius-standard)',
      background: 'transparent',
      boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
      textDecoration: 'none',
      transition: 'background var(--duration-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      Start a conversation
      <AppIcon icon={ArrowUpRight} size={12} />
    </LinkButton>
  );

  return (
    <section id="faq" style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-4) var(--space-6)' }}>
      <Reveal className="faq-grid" variant="section" style={{
        maxWidth: LAYOUT.MAX_WIDTH,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: faqColumns,
        gap: isStacked ? 'var(--space-8)' : 'var(--layout-2)',
        alignItems: 'start',
      }}>
        <div style={{
          position: isStacked ? 'relative' : 'sticky',
          // Only while sticky. On a relative element `top` shifts it visually
          // without reflowing, so setting it unconditionally slid this whole
          // column 96px down over the panel beneath it on every phone.
          top: isStacked ? undefined : 96,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          maxWidth: isStacked ? 760 : 440,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', paddingBottom: isStacked ? 'var(--space-4)' : 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
              <span style={{ color: 'var(--color-preview-pink)' }}>04 — </span>Ask
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: 0 }}>
              Ask about the work.
            </h2>
            <p style={{ fontSize: 'var(--font-size-body-xl)', lineHeight: 'var(--line-height-relaxed-xl)', color: 'var(--fg-secondary)', margin: 0 }}>
              Pick a question or type your own.
            </p>
          </div>
          {!isStacked && contactCta}
        </div>

        <div id="ask-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
          <Ask prefersReducedMotion={prefersReducedMotion} />
          {/*
            Stacked, the left column sits above the panel, which put a competing
            CTA between the heading and the input. Here it follows the panel, so
            the input is the first thing met. Desktop keeps it in the sticky
            column, where it does not compete.
          */}
          {isStacked && contactCta}
          <LinkButton variant="portfolio" href="/ask" onClick={() => trackPortfolioEvent('ask_page_click', { ui_location: 'faq_section' })} className="text-link" style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            minHeight: 'var(--control-hit-area)',
            fontSize: 'var(--font-size-body-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--fg-secondary)',
          }}>
            See every answer
            <AppIcon icon={ArrowUpRight} size={12} />
          </LinkButton>
        </div>
      </Reveal>
    </section>
  );
};

/**
 * The same panel as a page of its own.
 *
 * Two things the homepage section cannot do. An answer here has a URL, so a
 * recruiter can send one to a hiring manager instead of describing it. And it
 * is somewhere to link back to: every citation in the panel leads out to a
 * case study, and until this existed, taking one left the reader with no way
 * back to asking.
 */
const AskPage = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <article style={{ maxWidth: 880, margin: '0 auto', padding: 'var(--space-8) var(--space-6) var(--layout-3)' }}>
      <LinkButton variant="portfolio" href="/" onClick={(e) => { e.preventDefault(); history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)',
        textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)',
        marginBottom: 'var(--space-8)', transition: 'color var(--duration-fast)',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--fg-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-tertiary)'}
      >
        <AppIcon icon={ArrowLeft} size={12} />
        Back to home
      </LinkButton>

      <h1 style={{ fontSize: 'clamp(32px, 4.2vw, 56px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: '0 0 var(--space-5)' }}>
        Ask about the work.
      </h1>
      <p style={{ fontSize: 'var(--font-size-body-xl)', lineHeight: 'var(--line-height-relaxed-xl)', color: 'var(--fg-secondary)', margin: '0 0 var(--space-4)', maxWidth: 'var(--content-answer-width)' }}>
        Pick a question or type your own. Every answer here has its own link, so you can send one on.
      </p>

      <div id="ask-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
        <Ask prefersReducedMotion={prefersReducedMotion} linkable />
      </div>
    </article>
  );
};

const Contact = () => {
  const viewportWidth = useViewportWidth();
  const contactGridColumns = viewportWidth <= TABLET_BREAKPOINT ? '1fr' : LAYOUT.GRID_DESKTOP;
  const contactCardColumns = viewportWidth <= MOBILE_BREAKPOINT ? '1fr' : viewportWidth <= WIDE_LAYOUT_BREAKPOINT ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))';

  return (
    <section id="contact" style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-4) var(--space-6) var(--layout-3)' }}>
      <Reveal className="contact-grid" variant="section" style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto', display: 'grid', gridTemplateColumns: contactGridColumns, gap: viewportWidth <= TABLET_BREAKPOINT ? 'var(--space-6)' : 'var(--layout-2)', alignItems: 'start' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>
          <span style={{ color: 'var(--color-ship-red)' }}>05 — </span>Contact
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', maxWidth: 820 }}>
          <h2 style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-semi-tight)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-secondary)', margin: 0 }}>
            Turn complexity <br /><span style={{ color: 'var(--fg-secondary)' }}>into clarity. </span><br /><span style={{ color: 'var(--fg-primary)' }}>Let's talk.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: contactCardColumns, gap: 'var(--space-4)' }}>
            <ContactCard onEvent={trackPortfolioEvent} label="Book a call" value="20 minutes" href={BOOKING_URL} eventName="contact_click_booking" section="contact" />
            <ContactCard onEvent={trackPortfolioEvent} label="Email" value="omar@designedbyomar.com" href="mailto:omar@designedbyomar.com" eventName="contact_click_email" copyValue="omar@designedbyomar.com" copyEventName="copy_email_click" copyTarget="email" />
            <ContactCard onEvent={trackPortfolioEvent} label="Resume / CV" value="Open PDF" href="/Omar%20Tavarez%20Resume.pdf" eventName="resume_download" />
            <ContactCard onEvent={trackPortfolioEvent} label="LinkedIn" value="in/omartavarez" href={LINKEDIN_URL} eventName="contact_click_linkedin" section="contact" />
            <ContactCard onEvent={trackPortfolioEvent} label="GitHub" value="designedbyomar" href={GITHUB_URL} eventName="contact_click_github" section="contact" />
            <ContactCard onEvent={trackPortfolioEvent} label="Substack" value="@designedbyomar" href={SUBSTACK_URL} eventName="contact_click_substack" section="contact" />
            <ContactCard onEvent={trackPortfolioEvent} label="Behance" value="omartavarez" href={BEHANCE_URL} eventName="contact_click_behance" section="contact" />
          </div>
        </div>
      </Reveal>
    </section>
  );
};

// ============================================================
// Alien pixel icon + retro arrival animation
// ============================================================
// ============================================================
// Privacy Policy Page
// ============================================================
const PrivacyPolicyPage = ({ onBack }) => {
  const sectionHeadingStyle = {
    fontSize: 'var(--font-size-heading-md)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--fg-primary)',
    margin: 'var(--space-5) 0 0',
  };
  const listStyle = {
    margin: 0,
    paddingLeft: '1.2em',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  };
  const privacyLinkStyle = {
    color: 'var(--fg-primary)',
    fontWeight: 'var(--font-weight-medium)',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  };
  const renderPrivacyBlock = (block, index) => {
    const key = `${block.type}-${block.text?.slice(0, 32) || index}`;
    if (block.type === 'heading') return <h2 key={key} style={sectionHeadingStyle}>{block.text}</h2>;
    if (block.type === 'list') {
      return (
        <ul key={key} style={listStyle}>
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    }
    return (
      <p key={key} style={{ margin: 0 }}>
        {block.text}
        {block.link && <LinkButton variant="portfolio" href={block.link.href} style={privacyLinkStyle}>{block.link.label}</LinkButton>}
        {block.suffix || ''}
      </p>
    );
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 'var(--layout-4) var(--space-6)', minHeight: '100vh' }}>
      <LinkButton variant="portfolio" href="#" className="text-link" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ marginBottom: 'var(--layout-1)' }}>← Back to home</LinkButton>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 88px)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-semi-tight)', letterSpacing: 'var(--tracking-display)', color: 'var(--fg-primary)', margin: '0 0 var(--space-4)' }}>{PRIVACY_POLICY.title}</h1>
        <p style={{ fontSize: 'var(--font-size-heading-lg)', lineHeight: 'var(--line-height-snug-plus)', color: 'var(--fg-secondary)', margin: 0 }}>{PRIVACY_POLICY.subtitle}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', color: 'var(--fg-secondary)', lineHeight: 'var(--line-height-relaxed-xl)', fontSize: 'var(--font-size-body-xl)' }}>
        <p style={{ margin: 0 }}>Last updated: {PRIVACY_POLICY.lastUpdated}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {PRIVACY_POLICY.blocks.slice(0, 3).map(renderPrivacyBlock)}
        </div>
        {PRIVACY_POLICY.blocks.slice(3).map(renderPrivacyBlock)}
      </div>
    </div>
  );
};

// ============================================================
// Cookie Banner
// ============================================================
const CookieBanner = ({ onAccept, onDecline, onPrivacy }) => {
  const viewportWidth = useViewportWidth();
  const [isVisible, setIsVisible] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const isNarrow = viewportWidth <= 640;

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return undefined;
    }
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setPrefersReducedMotion(event.matches);
    return onMediaChange(mediaQuery, onChange);
  }, []);

  return <ConsentBanner onAccept={onAccept} onDecline={onDecline} onPrivacy={onPrivacy}
    isVisible={isVisible} isNarrow={isNarrow} prefersReducedMotion={prefersReducedMotion} />;
};

// ============================================================
// Route metadata + analytics
// ============================================================
const SITE_ORIGIN = 'https://www.designedbyomar.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/Images/og-image.png`;
const WORK_TITLE = 'Selected Work — Omar Tavarez';
const WORK_DESCRIPTION = 'Selected product design case studies by Omar Tavarez across AI workflows, design systems, fintech, healthcare SaaS, and enterprise UX.';
const WORK_URL = `${SITE_ORIGIN}/work`;
const ASK_TITLE = 'Ask about the work — Omar Tavarez';
const ASK_DESCRIPTION = 'Answers about Omar Tavarez\u2019s product design work \u2014 design systems, fintech and embedded payments, AI workflows, healthcare SaaS and enterprise UX \u2014 written from the published case studies.';
const ASK_URL = `${SITE_ORIGIN}/ask`;
const ABOUT_TITLE = 'About — Omar Tavarez';
const ABOUT_DESCRIPTION = 'Omar Tavarez is a principal product designer who turns undefined product problems into shipped software across AI, fintech, healthcare, and enterprise SaaS. Former DJ, lifelong artist, amateur boxer.';
const ABOUT_URL = `${SITE_ORIGIN}/about`;
const LOADER_SESSION_KEY = 'omar.loader-seen';

const toAbsoluteUrl = (pathOrUrl) => {
  if (!pathOrUrl) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
};

const imageType = (imageUrl) => {
  if (imageUrl.endsWith('.webp')) return 'image/webp';
  if (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
};

const personSchema = {
  '@type': 'Person',
  name: 'Omar Tavarez',
  url: `${SITE_ORIGIN}/`,
  jobTitle: 'Principal Product Designer',
  email: 'omar@designedbyomar.com',
  sameAs: [
    LINKEDIN_URL,
    GITHUB_URL,
    SUBSTACK_URL,
    BEHANCE_URL,
  ],
  knowsAbout: [
    'Product Design',
    'Design Systems',
    'AI Workflows',
    'Fintech',
    'Healthcare SaaS',
    'Enterprise UX',
  ],
};

const buildHomeStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'designedbyomar',
      url: `${SITE_ORIGIN}/`,
      description: 'Portfolio site for Omar Tavarez, a principal product designer focused on AI workflows, design systems, fintech, healthcare SaaS, and enterprise UX.',
    },
    personSchema,
  ],
});

const buildWorkStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: WORK_TITLE,
      url: WORK_URL,
      description: WORK_DESCRIPTION,
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
    },
    personSchema,
  ],
});

const buildAskStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: ASK_TITLE,
      url: ASK_URL,
      description: ASK_DESCRIPTION,
      isPartOf: {
        '@type': 'WebSite',
        name: 'designedbyomar',
        url: `${SITE_ORIGIN}/`,
      },
    },
    personSchema,
  ],
});

const buildRouteStructuredData = (route, currentCase) => {
  if (currentCase) {
    const url = `${SITE_ORIGIN}/work/${currentCase.id}/`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: `${currentCase.title} — Omar Tavarez`,
          url,
          description: currentCase.subtitle,
          image: toAbsoluteUrl(currentCase.ogImage),
          isPartOf: {
            '@type': 'WebSite',
            name: 'designedbyomar',
            url: `${SITE_ORIGIN}/`,
          },
        },
        {
          '@type': 'CreativeWork',
          name: currentCase.title,
          url,
          description: currentCase.subtitle,
          creator: personSchema,
          about: currentCase.tags,
        },
        personSchema,
      ],
    };
  }

  if (route.type === 'privacy') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: 'Privacy Policy — Omar Tavarez',
          url: `${SITE_ORIGIN}/privacy`,
          description: 'Privacy policy and data collection details for designedbyomar.com.',
          isPartOf: {
            '@type': 'WebSite',
            name: 'designedbyomar',
            url: `${SITE_ORIGIN}/`,
          },
        },
        personSchema,
      ],
    };
  }

  if (route.type === 'about') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ProfilePage',
          name: ABOUT_TITLE,
          url: ABOUT_URL,
          description: ABOUT_DESCRIPTION,
          isPartOf: {
            '@type': 'WebSite',
            name: 'designedbyomar',
            url: `${SITE_ORIGIN}/`,
          },
          mainEntity: personSchema,
        },
        personSchema,
      ],
    };
  }

  if (route.type === 'work') {
    return buildWorkStructuredData();
  }

  if (route.type === 'ask') {
    return buildAskStructuredData();
  }

  return buildHomeStructuredData();
};

const setHeadValue = (selector, attribute, value) => {
  const element = document.head.querySelector(selector);
  if (element && value) element.setAttribute(attribute, value);
};

const syncStructuredData = (route, currentCase) => {
  const script = document.head.querySelector('#structured-data') || document.head.querySelector('script[type="application/ld+json"]');
  if (!script) return;
  script.textContent = JSON.stringify(buildRouteStructuredData(route, currentCase), null, 2);
};

const getRouteMeta = (route, currentCase) => {
  if (route.type === 'ask') {
    return {
      title: ASK_TITLE,
      description: ASK_DESCRIPTION,
      url: ASK_URL,
      robots: 'index,follow,max-image-preview:large',
      image: DEFAULT_OG_IMAGE,
      imageType: imageType(DEFAULT_OG_IMAGE),
      imageWidth: 1200,
      imageHeight: 630,
      imageAlt: ASK_TITLE,
    };
  }

  if (route.type === 'work') {
    return {
      title: WORK_TITLE,
      description: WORK_DESCRIPTION,
      url: WORK_URL,
      robots: 'index,follow,max-image-preview:large',
      image: DEFAULT_OG_IMAGE,
      imageType: imageType(DEFAULT_OG_IMAGE),
      imageWidth: 1200,
      imageHeight: 630,
      imageAlt: WORK_TITLE,
    };
  }

  if (route.type === 'privacy') {
    return {
      title: 'Privacy Policy — Omar Tavarez',
      description: 'Privacy policy and data collection details for designedbyomar.com.',
      url: `${SITE_ORIGIN}/privacy`,
      robots: 'index,follow,max-image-preview:large',
      image: DEFAULT_OG_IMAGE,
      imageType: imageType(DEFAULT_OG_IMAGE),
      imageWidth: 1200,
      imageHeight: 630,
      imageAlt: 'Privacy Policy — Omar Tavarez',
    };
  }

  if (route.type === 'about') {
    return {
      title: ABOUT_TITLE,
      description: ABOUT_DESCRIPTION,
      url: `${SITE_ORIGIN}/about`,
      robots: 'index,follow,max-image-preview:large',
      image: DEFAULT_OG_IMAGE,
      imageType: imageType(DEFAULT_OG_IMAGE),
      imageWidth: 1200,
      imageHeight: 630,
      imageAlt: ABOUT_TITLE,
    };
  }

  if (currentCase) {
    return {
      title: `${currentCase.title} — Omar Tavarez`,
      description: currentCase.subtitle,
      url: `${SITE_ORIGIN}/work/${currentCase.id}/`,
      robots: 'index,follow,max-image-preview:large',
      image: toAbsoluteUrl(currentCase.ogImage),
      imageType: imageType(toAbsoluteUrl(currentCase.ogImage)),
      imageWidth: 1200,
      imageHeight: 627,
      imageAlt: currentCase.title,
    };
  }

  return {
    title: 'designedbyomar — Omar Tavarez',
    description: 'Omar Tavarez is a principal product designer focused on AI workflows, design systems, fintech, healthcare SaaS, and enterprise product strategy.',
    url: `${SITE_ORIGIN}/`,
    robots: 'index,follow,max-image-preview:large',
    image: DEFAULT_OG_IMAGE,
    imageType: imageType(DEFAULT_OG_IMAGE),
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: 'designedbyomar — Omar Tavarez',
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
  setHeadValue('meta[property="og:image"]', 'content', meta.image);
  setHeadValue('meta[property="og:image:type"]', 'content', meta.imageType);
  setHeadValue('meta[property="og:image:width"]', 'content', meta.imageWidth);
  setHeadValue('meta[property="og:image:height"]', 'content', meta.imageHeight);
  setHeadValue('meta[property="og:image:alt"]', 'content', meta.imageAlt);
  setHeadValue('meta[name="twitter:title"]', 'content', meta.title);
  setHeadValue('meta[name="twitter:description"]', 'content', meta.description);
  setHeadValue('meta[name="twitter:image"]', 'content', meta.image);
};

const trackPageView = (meta, route, currentCase) => {
  if (!GA_ENABLED || !hasAcceptedAnalytics() || typeof window.gtag !== 'function') return;

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
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-7) var(--space-6)', background: 'var(--bg-page)', color: 'var(--fg-primary)' }}>
    <div style={{ width: '100%', maxWidth: 'var(--content-answer-width)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-7) 28px', background: 'color-mix(in oklab, var(--bg-subtle) 72%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--fg-tertiary)', marginBottom: 'var(--control-padding-inline)' }}>
        Unexpected error
      </div>
      <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1, letterSpacing: 'var(--tracking-display)', margin: '0 0 var(--space-4)' }}>
        This view failed to load.
      </h1>
      <p style={{ fontSize: 'var(--font-size-body-xl)', lineHeight: 'var(--line-height-relaxed-xl)', color: 'var(--fg-secondary)', margin: '0 0 var(--space-6)' }}>
        Refresh the page or head back home. The issue has been logged for review.
      </p>
      <LinkButton variant="portfolio" href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--bg-page)', padding: 'var(--control-padding-block) var(--space-4)', borderRadius: 'var(--radius-standard)', background: 'var(--fg-primary)', textDecoration: 'none' }}>
        Back home
      </LinkButton>
    </div>
  </div>
);

// ============================================================
// Routing
// ============================================================
// ============================================================
const useRoute = () => {
  const [route, setRoute] = React.useState(() => parsePortfolioRoute(window.location.pathname));

  React.useEffect(() => {
    const on = () => {
      const next = parsePortfolioRoute(window.location.pathname);
      setRoute(next);
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
          if (isPortfolioRoutePath(url.pathname)) {
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

const routeKey = (route) => `${route.type}:${route.id || ''}`;

const instantScrollToTop = () => {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousScrollBehavior;
};

const SECTION_LABELS = {
  top: 'Top',
  about: 'About',
  work: 'Work',
  'at-a-glance': 'At a Glance',
  faq: 'FAQ',
  contact: 'Contact',
};

const trackSectionNavigation = (id, uiLocation) => {
  if (!uiLocation || typeof window.trackAnalyticsEvent !== 'function') return;
  window.trackAnalyticsEvent('section_navigation_click', {
    section_id: id,
    section_label: SECTION_LABELS[id] || id,
    ui_location: uiLocation,
  });
};

// ============================================================
// App
// ============================================================
const App = () => {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('omar.theme') || 'dark');
  const prefersReducedMotion = usePrefersReducedMotion();
  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('omar.theme', theme); }, [theme]);

  const [loading, setLoading] = React.useState(() => {
    try {
      return sessionStorage.getItem(LOADER_SESSION_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const [analyticsConsent, setAnalyticsConsent] = React.useState(() => getStoredAnalyticsConsent());
  const [analyticsReady, setAnalyticsReady] = React.useState(false);
  const analyticsAccepted = analyticsConsent === ANALYTICS_ACCEPTED;
  const showCookieBanner = analyticsConsent === null;

  const handleAcceptCookies = () => {
    storeAnalyticsConsent(ANALYTICS_ACCEPTED);
    setAnalyticsConsent(ANALYTICS_ACCEPTED);
  };

  const handleDeclineCookies = () => {
    storeAnalyticsConsent(ANALYTICS_DECLINED);
    setAnalyticsConsent(ANALYTICS_DECLINED);
    setAnalyticsReady(false);
  };

  const showPrivacy = () => {
    history.pushState(null, '', '/privacy');
    window.dispatchEvent(new Event('popstate'));
  };

  React.useEffect(() => {
    if (!loading) return;
    let cancelled = false;
    const pageReady = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const heroImage = document.querySelector('[data-hero-portrait]');
    const heroImageReady = heroImage
      ? (typeof heroImage.decode === 'function'
        ? heroImage.decode().catch(() => undefined)
        : new Promise((resolve) => {
          if (heroImage.complete) {
            resolve();
            return;
          }
          heroImage.addEventListener('load', resolve, { once: true });
          heroImage.addEventListener('error', resolve, { once: true });
        }))
      : Promise.resolve();

    Promise.all([pageReady, fontsReady, heroImageReady]).then(() => {
      if (!cancelled) {
        try {
          sessionStorage.setItem(LOADER_SESSION_KEY, 'true');
        } catch {
          // Session storage can be unavailable in private browsing or locked-down contexts.
        }
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loading]);

  const galaxy = { density: 1.9, speed: 0.75, style: 'pixel', accent: 'workflow', theme };

  const route = useRoute();
  const currentCase = route.type === 'case' ? CASE_STUDIES.find(c => c.id === route.id) : null;
  const previousRouteKeyRef = React.useRef(null);

  React.useEffect(() => {
    const meta = getRouteMeta(route, currentCase);
    syncRouteHead(meta);
    syncStructuredData(route, currentCase);
  }, [route, currentCase]);

  React.useEffect(() => {
    if (!analyticsAccepted) {
      setAnalyticsReady(false);
      return undefined;
    }

    let cancelled = false;
    loadGoogleAnalytics().then((ready) => {
      if (!cancelled) setAnalyticsReady(Boolean(ready));
    });

    return () => {
      cancelled = true;
    };
  }, [analyticsAccepted]);

  React.useEffect(() => {
    if (!analyticsAccepted || !analyticsReady) return;
    const meta = getRouteMeta(route, currentCase);
    trackPageView(meta, route, currentCase);
  }, [route, currentCase, analyticsAccepted, analyticsReady]);

  React.useEffect(() => {
    if (analyticsAccepted) initSentryIfEnabled();
  }, [analyticsAccepted]);

  React.useEffect(() => {
    syncSentryContext(route, currentCase, theme);
  }, [route, currentCase, theme]);

  const scrollToSectionElement = (id, behavior = 'smooth') => {
    const el = document.getElementById(id);
    if (!el) return false;

    const headerHeight = 64;
    const paddingMap = {
      'about': 96,
      'work': 96,
      'at-a-glance': 120,
      'faq': 120,
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
      behavior
    });

    return true;
  };

  React.useEffect(() => {
    if (!('scrollRestoration' in history)) return undefined;
    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  React.useLayoutEffect(() => {
    const nextRouteKey = routeKey(route);
    if (previousRouteKeyRef.current === nextRouteKey) return undefined;

    previousRouteKeyRef.current = nextRouteKey;

    if (route.type === 'home' && window.location.hash) {
      const id = window.location.hash.slice(1);
      const frame = window.requestAnimationFrame(() => {
        scrollToSectionElement(id, 'auto');
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => {
      instantScrollToTop();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [route]);

  const isHomePath = () => {
    const p = window.location.pathname;
    return p === '/' || p === '/index.html' || p === '' || p.endsWith('/index.html');
  };

  const isWorkPath = () => {
    const p = window.location.pathname;
    return p === '/work' || p === '/work/';
  };

  const goHome = () => {
    if (!isHomePath()) {
      history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id, uiLocation) => {
    trackSectionNavigation(id, uiLocation);

    const performScroll = () => {
      scrollToSectionElement(id, 'smooth');
    };

    if (id === 'work') {
      // /work is its own index page now, so this navigates instead of scrolling.
      if (!isWorkPath()) {
        history.pushState(null, '', '/work');
        window.dispatchEvent(new Event('popstate'));
      }
      return;
    }

    if (!isHomePath()) {
      history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(performScroll);
      });
    } else {
      performScroll();
    }
  };

  return (
    <>
      <style>{`
        /* Responsive case study layout */
        .cs-cover {
          aspect-ratio: 16 / 9;
        }
        @media (max-width: 768px) {
          .cs-cover {
            aspect-ratio: 4 / 3;
            min-height: 280px;
          }
        }
        @media (max-width: 480px) {
          .cs-cover {
            aspect-ratio: 3 / 2;
            min-height: 240px;
          }
        }

        /* Metrics grid — 3 cols by default, break straight to 1 col on narrow viewports */
        .cs-metrics-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
        }
        .cs-metrics-grid > div {
          border-right: 1px solid var(--color-gray-100);
          border-bottom: none;
        }
        .cs-metrics-grid > div:nth-child(3n),
        .cs-metrics-grid > div:last-child {
          border-right: none;
        }
        @media (max-width: 640px) {
          .cs-metrics-grid {
            grid-template-columns: 1fr !important;
          }
          .cs-metrics-grid > div {
            border-right: none !important;
            border-bottom: 1px solid var(--color-gray-100);
          }
          .cs-metrics-grid > div:last-child {
            border-bottom: none;
          }
        }

        /* Prev/Next nav — always side by side, text wraps, next right-aligned */
        .cs-prevnext {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: var(--space-6);
        }
        .cs-prevnext > a {
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .cs-prevnext > a:last-child {
          text-align: right;
        }
      `}</style>
      <LogoLoader visible={loading} prefersReducedMotion={prefersReducedMotion} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity var(--duration-very-slow) ease var(--duration-fastest)' }}>
        <Nav theme={theme} setTheme={setTheme} onHome={goHome} scrollToSection={scrollToSection} />
        <main>
          {route.type === 'privacy' ? (
            <PrivacyPolicyPage theme={theme} onBack={goHome} />
          ) : route.type === 'about' ? (
            <AboutPage />
          ) : route.type === 'ask' ? (
            <AskPage />
          ) : route.type === 'work' ? (
            <WorkIndexPage />
          ) : currentCase ? (
            <CaseStudyPage c={currentCase} onBack={() => scrollToSection('work', 'case_back')} />
          ) : (
            <>
              <Hero galaxy={galaxy} theme={theme} scrollToSection={scrollToSection} />
              <About />
              <Work />
              <KeyFacts />
              <AskSection scrollToSection={scrollToSection} />
              <Contact />
            </>
          )}
        </main>
        <SiteFooter onEvent={trackPortfolioEvent} onLogoClick={() => trackSectionNavigation('top', 'footer_logo')} onHome={goHome} scrollToSection={scrollToSection} />
      </div>
      {showCookieBanner && <CookieBanner onAccept={handleAcceptCookies} onDecline={handleDeclineCookies} onPrivacy={showPrivacy} />}
      {analyticsAccepted && (
        <>
          <SpeedInsights />
          <Analytics />
        </>
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Sentry.ErrorBoundary fallback={<AppShellErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </>
);
