import { AppIcon, Check, Copy } from './ui-icons.jsx';

export { Button, IconButton, CopyButton } from './ui/controls.jsx';
import { useCopy, CopyButton } from './ui/controls.jsx';

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
