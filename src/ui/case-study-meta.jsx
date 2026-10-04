export const CaseStudyTag = ({ children }) => (
  <span style={{ fontSize: 'var(--font-size-label-sm)', fontWeight: 'var(--font-weight-medium)', padding: 'var(--space-tag-block) var(--control-padding-block)', borderRadius: 'var(--radius-circle)', color: 'var(--fg-secondary)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>{children}</span>
);

export const CaseStudyMetadata = ({ children, variant = 'role', style = {} }) => (
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)', ...(variant === 'role' ? { marginBottom: 'var(--space-4)' } : {}), ...style }}>{children}</div>
);
