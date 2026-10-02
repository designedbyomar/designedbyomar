import { Button, LinkButton } from './controls.jsx';
export const ConsentBanner = ({ onAccept, onDecline, onPrivacy, isVisible = true, isNarrow = false, prefersReducedMotion = false, embedded = false }) => {
  const baseButtonStyle = {
    minHeight: 'var(--control-hit-area)',
    padding: 'var(--control-padding-block) var(--space-4)',
    borderRadius: 'var(--radius-comfort)',
    fontSize: 'var(--font-size-body-xs)',
    fontWeight: 'var(--font-weight-semibold)',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    transition: prefersReducedMotion ? 'none' : 'transform var(--duration-fast) ease, opacity var(--duration-fast) ease, background var(--duration-fast) ease',
  };

  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      bottom: embedded ? undefined : 24,
      left: embedded ? undefined : 24,
      right: embedded ? undefined : 24,
      zIndex: embedded ? undefined : 10000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth: 'var(--content-consent-width)',
        width: '100%',
        background: 'color-mix(in oklab, var(--bg-page) 82%, transparent)',
        backdropFilter: 'var(--blur-heavy)',
        WebkitBackdropFilter: 'var(--blur-heavy)',
        boxShadow: 'var(--shadow-card-full)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--control-padding-roomy) var(--space-6)',
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        alignItems: isNarrow ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isNarrow ? 'var(--space-4)' : 'var(--space-6)',
        pointerEvents: 'auto',
        opacity: isVisible ? 1 : 0,
        transform: prefersReducedMotion || isVisible ? 'none' : 'translateY(24px) scale(0.98)',
        transition: prefersReducedMotion ? 'none' : 'opacity var(--duration-slowest-xxl) cubic-bezier(0.16, 1, 0.3, 1), transform var(--duration-slowest-xxl) cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid var(--color-gray-100)',
      }}>
        <p style={{ fontSize: 'var(--font-size-body-md)', color: 'var(--fg-secondary)', lineHeight: 'var(--line-height-relaxed)', margin: 0 }}>
          This site uses simple analytics cookies to improve the experience. No ads, no creepy tracking, no selling your data. <LinkButton variant="consent" href="#" onClick={(e) => { e.preventDefault(); onPrivacy(); }} style={{ color: 'var(--fg-primary)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Privacy Policy</LinkButton>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isNarrow ? 'flex-end' : 'center', gap: 'var(--space-3)', width: isNarrow ? '100%' : 'auto' }}>
          <Button variant="consent"
            type="button"
            onClick={onDecline}
            style={{
              ...baseButtonStyle,
              background: 'transparent',
              color: 'var(--fg-primary)',
              boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Decline
          </Button>
          <Button variant="consent"
            type="button"
            onClick={onAccept}
            style={{
              ...baseButtonStyle,
              background: 'var(--fg-primary)',
              color: 'var(--bg-page)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.9';
              if (!prefersReducedMotion) e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
