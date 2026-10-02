import React from 'react';
import { AppIcon, Check, Copy } from '../ui-icons.jsx';
export const Button = ({ variant = 'primary', children, icon: Icon, className = '', ...props }) => (
  <button className={`${['primary', 'secondary', 'quiet'].includes(variant) ? `ds-button ds-button--${variant}` : `ui-button ui-button--${variant}`} ${className}`.trim()} type="button" {...props}>
    {children}
    {Icon && <AppIcon icon={Icon} size={14} />}
  </button>
);

export const IconButton = ({ icon, label, variant = 'standard', className = '', ...props }) => (
  <button {...props} className={`${variant === 'unstyled' ? '' : 'ds-icon-button'} ${className}`.trim()} type="button" aria-label={label} title={label}>
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
export const useCopy = ({ legacyFallback = true, onCopied } = {}) => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const confirmCopied = () => {
    setCopied(true);
    onCopied?.();
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
      if (legacyFallback && legacyCopy(value)) confirmCopied();
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


export const LinkButton = ({ variant = 'primary', className = '', children, ...props }) => (
  <a {...props} className={`${['primary', 'secondary', 'quiet'].includes(variant) ? `ds-button ds-button--${variant}` : `ui-button ui-button--${variant}`} ${className}`.trim()}>{children}</a>
);

// Controlled copy presentation. Clipboard ownership stays with the caller.
export const CopyControl = ({ copied = false, children, ...props }) => (
  <Button variant="unstyled" {...props}>
    <AppIcon icon={copied ? Check : Copy} size={13} />
    {children}
  </Button>
);
