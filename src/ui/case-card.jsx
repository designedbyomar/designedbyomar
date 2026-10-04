import { CaseStudyTag } from './case-study-meta.jsx';
import React from 'react';
import { LAYOUT, ASPECT_RATIOS } from '../constants.js';
import { getCaseStudyCoverImage, getCaseStudyCoverSrcSet } from '../case-study-media.mjs';
import { useViewportWidth, usePrefersReducedMotion } from './hooks.js';
const TABLET_BREAKPOINT = LAYOUT.TABLET_BREAKPOINT;
export const caseAccentGradient = (accent) => `linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 70%, white) 100%)`;

const CASE_CARD_IMAGE_SIZES = {
  wide: '(max-width: 900px) calc(72vw - 35px), 830px',
  standard: '(max-width: 900px) calc(72vw - 35px), 405px',
};

const CaseCardImage = ({ c, featured, sizes, style }) => (
  <img
    data-case-cover-still
    src={getCaseStudyCoverImage(c)}
    srcSet={getCaseStudyCoverSrcSet(c)}
    sizes={sizes}
    alt={`${c.title} preview`}
    loading={featured ? 'eager' : 'lazy'}
    style={style}
  />
);

const DeferredCaseCardVideo = ({ c, featured, sizes }) => {
  const containerRef = React.useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shouldLoadVideo, setShouldLoadVideo] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setShouldLoadVideo(false);
      setIsPlaying(false);
      return undefined;
    }
    if (typeof IntersectionObserver !== 'function' || !containerRef.current) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setShouldLoadVideo(true);
      observer.disconnect();
    }, { rootMargin: '600px 0px', threshold: 0 });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const transition = prefersReducedMotion ? 'none' : 'opacity var(--duration-base) ease';
  const mediaStyle = {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block',
    transition,
  };

  return (
    <div ref={containerRef} data-deferred-case-video style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CaseCardImage
        c={c}
        featured={featured}
        sizes={sizes}
        style={{ ...mediaStyle, opacity: isPlaying ? 0 : 1 }}
      />
      {shouldLoadVideo && (
        <video
          data-case-cover-video
          src={c.coverVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setIsPlaying(true)}
          style={{ ...mediaStyle, opacity: isPlaying ? 1 : 0 }}
        />
      )}
    </div>
  );
};

// ============================================================
// CaseCard — gradient cover tile used on homepage + drawer
// ============================================================
export const CaseCard = ({ c, featured = false, wideMedia = false, allowVideo = true }) => {
  const viewportWidth = useViewportWidth();
  const useSharedMobileAspectRatio = viewportWidth <= TABLET_BREAKPOINT;
  const mediaAspectRatio = useSharedMobileAspectRatio ? ASPECT_RATIOS.THUMBNAIL : featured ? ASPECT_RATIOS.WIDE : ASPECT_RATIOS.THUMBNAIL;
  const accent = c.accent;

  return (
    <a href={`/work/${c.id}/`} className="case-card" data-case-study-id={c.id} style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%',
      textDecoration: 'none', color: 'inherit',
      borderRadius: 'var(--radius-image)', transition: 'transform var(--duration-base) ease',
    }}>
      <div className="case-card-media" style={{
        position: 'relative', width: '100%',
        aspectRatio: mediaAspectRatio,
        background: caseAccentGradient(accent),
        borderRadius: 'var(--radius-image)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card-subtle)',
      }}>
        <div className="case-card-sheen" />
        {(c.coverImage || c.coverVideo) ? (
          <div style={{
            position: 'absolute', left: '14%', right: '14%', bottom: '5%', top: '18%',
            borderRadius: 'var(--radius-comfort)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: `0 -1px 0 0 rgba(255,255,255,0.1), 0 24px 60px rgba(0,0,0,var(--opacity-35))`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              height: 'var(--size-window-bar)', padding: '0 var(--space-2)', flexShrink: 0,
              background: 'color-mix(in oklab, var(--bg-page) 86%, white 14%)',
              borderBottom: '1px solid color-mix(in oklab, var(--color-gray-100) 88%, transparent)',
            }}>
              <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: 'var(--color-window-close)', display: 'inline-block' }} />
              <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: 'var(--color-window-minimize)', display: 'inline-block' }} />
              <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: 'var(--color-window-expand)', display: 'inline-block' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-page)' }}>
              {c.coverVideo && allowVideo
                ? <DeferredCaseCardVideo c={c} featured={featured} sizes={wideMedia ? CASE_CARD_IMAGE_SIZES.wide : CASE_CARD_IMAGE_SIZES.standard} />
                : <CaseCardImage c={c} featured={featured} sizes={wideMedia ? CASE_CARD_IMAGE_SIZES.wide : CASE_CARD_IMAGE_SIZES.standard} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />}
            </div>
          </div>
        ) : (
          <div className="case-card-screen" style={{
            position: 'absolute', left: '16%', right: '16%', bottom: '-6%', top: '22%',
            background: 'var(--bg-page)',
            borderRadius: 'var(--radius-cover) var(--radius-cover) 0 0',
            boxShadow: `0 -1px 0 0 rgba(255,255,255,0.1), 0 24px 60px rgba(0, 0, 0, var(--opacity-35))`,
          }}>
            <div style={{
              position: 'absolute', top: 'var(--control-padding-block)', left: 'var(--control-padding-block)', right: 'var(--control-padding-block)', height: 18,
              display: 'flex', alignItems: 'center', gap: 'var(--space-tag-cover-block)',
              borderBottom: `1px solid color-mix(in oklab, ${accent} 18%, transparent)`,
            }}>
              <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: accent, opacity: 0.7 }} />
              <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: 'var(--fg-tertiary)', opacity: 0.7 }} />
              <span style={{ width: 'var(--size-window-dot)', height: 'var(--size-window-dot)', borderRadius: 'var(--radius-circle)', background: 'var(--color-gray-100)', opacity: 0.7 }} />
            </div>
            <div className="case-card-line case-card-line--full" style={{
              position: 'absolute', top: 'var(--space-8)', left: 'var(--space-4)', right: 'var(--space-4)', height: 10, borderRadius: 'var(--radius-subtle)',
              background: `color-mix(in oklab, ${accent} 18%, transparent)`,
            }} />
            <div className="case-card-line case-card-line--left" style={{
              position: 'absolute', top: 58, left: 'var(--space-4)', width: '40%', height: 10, borderRadius: 'var(--radius-subtle)',
              background: `color-mix(in oklab, ${accent} 30%, transparent)`,
            }} />
            <div className="case-card-line case-card-line--right" style={{
              position: 'absolute', top: 58, left: '46%', width: '38%', height: 10, borderRadius: 'var(--radius-subtle)',
              background: `color-mix(in oklab, ${accent} 18%, transparent)`,
            }} />
          </div>
        )}
        {/* accent tag */}
        <div className="case-card-tag" style={{
          position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-micro)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-white)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)',
          background: 'rgba(0, 0, 0, var(--opacity-32))', padding: 'var(--space-tag-cover-block) var(--space-tag-inline)', borderRadius: 'var(--radius-subtle)',
          backdropFilter: 'var(--blur-base)', WebkitBackdropFilter: 'var(--blur-base)',
        }}>{c.num} · {c.year} · {c.client}</div>
      </div>

      <div style={{ padding: 'var(--space-1) var(--space-1) 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--control-padding-block)' }}>
          <h3 style={{
            fontSize: featured ? 'var(--font-size-case-featured)' : 'var(--font-size-case-card)',
            fontWeight: 'var(--font-weight-semibold)', letterSpacing: 'var(--tracking-card)',
            color: 'var(--fg-primary)', margin: 0, lineHeight: 'var(--line-height-snug)',
          }}>{c.title}</h3>
        </div>
        <p style={{ fontSize: featured ? 'var(--font-size-body-lg)' : 'var(--font-size-body-md)' , lineHeight: 'var(--line-height-relaxed-plus)', color: 'var(--fg-secondary)', margin: '0 0 var(--control-padding-inline)' }}>{c.subtitle}</p>
        <div style={{ display: 'flex', gap: 'var(--space-compact)', flexWrap: 'wrap', marginTop: 'auto' }}>
          {c.tags.slice(0, 3).map(t => (
            <CaseStudyTag key={t}>{t}</CaseStudyTag>
          ))}
        </div>
      </div>
    </a>
  );
};
