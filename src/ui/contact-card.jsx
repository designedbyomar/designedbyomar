import { CopyControl, LinkButton, useCopy } from './controls.jsx';
export const ContactCard = ({ label, value, href, eventName, copyValue, section, copyEventName, copyTarget, onEvent = () => {} }) => {
  const { copied, copy } = useCopy({ legacyFallback: false, onCopied: () => {
    if (copyEventName) onEvent(copyEventName, { section: section || 'contact', copy_target: copyTarget });
  } });
  const handleCopy = () => { if (copyValue) copy(copyValue); };

  const hasCopyButton = Boolean(copyValue);

  return (
    <div className="contact-card" style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: hasCopyButton ? 'var(--control-padding-roomy) var(--control-copy-reserve) var(--control-padding-roomy) var(--space-5)' : 'var(--control-padding-roomy) var(--space-5)', borderRadius: 'var(--radius-comfort)',
      background: 'var(--bg-page)', boxShadow: 'var(--shadow-card-subtle)', textDecoration: 'none',
      transition: 'transform var(--duration-fast-mid) ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <LinkButton variant="contact-copy" href={href} target="_blank" rel="noopener noreferrer" className="contact-card-link" aria-label={`${label} ${value}`}
        style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 'var(--z-component-content)' }}
        onClick={() => {
          if (eventName) {
            onEvent(eventName, { link_url: href, ...(section && { section }) });
          }
        }}
      />
      {copyValue && (
        <CopyControl copied={copied}
          type="button"
          data-copy-button="true"
          aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
          title={copied ? 'Copied' : 'Copy'}
          onClick={handleCopy}
          style={{
            position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
            width: 'var(--control-copy-size)', height: 'var(--control-copy-size)', borderRadius: 'var(--radius-circle)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
            background: 'color-mix(in oklab, var(--bg-page) 76%, var(--bg-subtle) 24%)',
            color: copied ? 'var(--color-develop-blue)' : 'var(--fg-tertiary)',
            boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
            opacity: 1,
            pointerEvents: 'auto',
            zIndex: 'var(--z-component-action)',
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
        </CopyControl>
      )}
      <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-label-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)' }}>{label}</span>
      <span aria-hidden="true" style={{ fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-primary)', letterSpacing: 'var(--tracking-body-tight)' }}>{value}</span>
    </div>
  );
};
