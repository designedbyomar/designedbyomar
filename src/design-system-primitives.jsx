import React from 'react';
import { AppIcon, Check, Copy } from './ui-icons.jsx';

export const Button = ({ variant = 'primary', children, icon: Icon, ...props }) => (
  <button className={`ds-button ds-button--${variant}`} type="button" {...props}>
    {children}
    {Icon && <AppIcon icon={Icon} size={14} />}
  </button>
);

export const IconButton = ({ icon, label, className = '', ...props }) => (
  <button {...props} className={`ds-icon-button ${className}`.trim()} type="button" aria-label={label} title={label}>
    <AppIcon icon={icon} size={16} />
  </button>
);

// Legacy clipboard path for non-secure contexts and older browsers that lack the
// async Clipboard API. Returns whether the copy succeeded.
const legacyCopy = (value) => {
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
};

// Shared clipboard behaviour for every copy control: writes the value, flips to a
// confirmed state for 1.2s, and clears its timer on unmount. The async Clipboard
// API is feature-detected — it is absent in non-secure contexts and some
// browsers — with an execCommand fallback, and the confirmed state is only shown
// when a copy actually happened, never on a blocked or failing clipboard.
const useCopy = () => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const confirmCopied = () => {
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1200);
  };

  const copy = async (value) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        confirmCopied();
        return;
      }
      if (legacyCopy(value)) confirmCopied();
      else setCopied(false);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy };
};

export const CopyButton = ({ value, label = 'Copy value' }) => {
  const { copied, copy } = useCopy();
  return (
    <button
      className="ds-copy-button"
      type="button"
      aria-label={copied ? `Copied ${label}` : label}
      title={copied ? 'Copied' : label}
      onClick={() => copy(value)}
    >
      <AppIcon icon={copied ? Check : Copy} size={13} />
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

// Icon-only copy control shown on hover/focus next to a section title. Copies a
// reference the user can paste back when asking for a change to that section.
const SectionAnchorCopy = ({ title, anchor }) => {
  const { copied, copy } = useCopy();
  const label = `Copy a reference to the "${title}" section`;
  return (
    <button
      className="ds-section-header__copy"
      type="button"
      aria-label={copied ? `Copied reference to the "${title}" section` : label}
      title={copied ? 'Copied' : label}
      onClick={() => copy(`Design System — "${title}" (/design-system#${anchor})`)}
    >
      <AppIcon icon={copied ? Check : Copy} size={15} />
    </button>
  );
};

export const SectionHeader = ({ id, eyebrow, title, children }) => (
  <div className="ds-section-header">
    <div className="mono-label">{eyebrow}</div>
    {id ? (
      <div className="ds-section-header__title-row">
        <h2 id={`${id}-title`}>{title}</h2>
        <SectionAnchorCopy title={title} anchor={id} />
      </div>
    ) : (
      <h2>{title}</h2>
    )}
    {children && <p>{children}</p>}
  </div>
);

export const DocCard = ({ title, meta, children }) => (
  <article className="ds-doc-card">
    <div>
      {meta && <div className="mono-label ds-doc-card__meta">{meta}</div>}
      <h3>{title}</h3>
    </div>
    <div className="ds-doc-card__body">{children}</div>
  </article>
);

export const ExampleFrame = ({ label, children }) => (
  <div className="ds-example-frame">
    {label && <div className="mono-label ds-example-frame__label">{label}</div>}
    <div className="ds-example-frame__content">{children}</div>
  </div>
);

export const TokenSwatch = ({ name, token, value, className = '' }) => (
  <div className={`ds-token-swatch ${className}`}>
    <div className="ds-token-swatch__preview" style={{ background: `var(${token})` }} />
    <div className="ds-token-swatch__content">
      <div>
        <h3>{name}</h3>
        <p className="ds-token-swatch__token">{token}</p>
        <p>{value}</p>
      </div>
      <CopyButton value={token} label={`Copy ${token}`} />
    </div>
  </div>
);
