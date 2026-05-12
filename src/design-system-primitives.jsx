import React from 'react';
import { AppIcon, Check, Copy } from './ui-icons.jsx';

export const Button = ({ variant = 'primary', children, icon: Icon, ...props }) => (
  <button className={`ds-button ds-button--${variant}`} type="button" {...props}>
    {children}
    {Icon && <AppIcon icon={Icon} size={14} />}
  </button>
);

export const IconButton = ({ icon, label, ...props }) => (
  <button className="ds-icon-button" type="button" aria-label={label} title={label} {...props}>
    <AppIcon icon={icon} size={16} />
  </button>
);

export const CopyButton = ({ value, label = 'Copy value' }) => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      className="ds-copy-button"
      type="button"
      aria-label={copied ? `Copied ${label}` : label}
      title={copied ? 'Copied' : label}
      onClick={handleCopy}
    >
      <AppIcon icon={copied ? Check : Copy} size={13} />
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

export const SectionHeader = ({ eyebrow, title, children }) => (
  <div className="ds-section-header">
    <div className="mono-label">{eyebrow}</div>
    <h2>{title}</h2>
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
