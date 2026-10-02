import { normalizeBlocks } from '../content/case-study-blocks.mjs';
const CS_TEXT_WIDTH = { maxWidth: 'var(--content-reading-width)', width: '100%' };
const csSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csWordCount = (blocks) => blocks.reduce(
  (n, b) => n + `${b.text || ''} ${(b.items || []).join(' ')}`.trim().split(/\s+/).filter(Boolean).length,
  0,
);

export const CaseStudyBody = ({ blocks: rawBlocks, accent, idPrefix = '' }) => {
  // Normalized so this renderer and postbuild.js agree on what a block is.
  const blocks = normalizeBlocks(rawBlocks);
  if (!blocks.length) return null;

  const sections = blocks.filter((b) => b.type === 'heading' && b.level === 2);
  const showToc = csWordCount(blocks) > 1200 && sections.length > 2;

  return (
    <div style={{ marginTop: 'var(--layout-2)', paddingTop: 'var(--layout-1)', borderTop: '1px solid var(--color-gray-100)' }}>
      {showToc && (
        <nav aria-label="On this page" style={{ ...CS_TEXT_WIDTH, margin: '0 auto var(--layout-1)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: accent, textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', marginBottom: 'var(--space-4)' }}>On this page</div>
          <ol style={{ margin: 0, paddingLeft: '1.1em', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {sections.map((h) => (
              <li key={h.text}>
                <a href={`#${idPrefix}${csSlug(h.text)}`} className="text-link" style={{ fontSize: 'var(--font-size-body-md)', color: 'var(--fg-secondary)' }}>{h.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
        {blocks.map((b, i) => {
          if (b.type === 'heading') {
            const Tag = `h${b.level}`; // level is normalized to 2, 3 or 4
            const size = b.level === 2 ? 'var(--font-size-case-heading)' : b.level === 3 ? 'var(--font-size-case-subheading)' : 'var(--font-size-body-xl)';
            return (
              <Tag key={i} id={b.level === 2 ? `${idPrefix}${csSlug(b.text)}` : undefined} style={{
                ...CS_TEXT_WIDTH, scrollMarginTop: 'var(--scroll-margin-heading)', fontSize: size,
                fontWeight: 'var(--font-weight-semibold)', lineHeight: 'var(--line-height-compact)',
                letterSpacing: 'var(--tracking-heading)', color: 'var(--fg-primary)',
                margin: b.level === 2 ? 'var(--space-6) 0 0' : 0,
              }}>{b.text}</Tag>
            );
          }
          if (b.type === 'paragraph') {
            return <p key={i} style={{ ...CS_TEXT_WIDTH, fontSize: 'var(--font-size-prose)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-secondary)', margin: 0 }}>{b.text}</p>;
          }
          if (b.type === 'list') {
            return (
              <ul key={i} style={{ ...CS_TEXT_WIDTH, margin: 0, paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-prose)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-secondary)' }}>
                {b.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            );
          }
          if (b.type === 'quote') {
            return (
              <blockquote key={i} style={{ ...CS_TEXT_WIDTH, margin: 0, paddingLeft: 'var(--space-5)', borderLeft: `2px solid ${accent}` }}>
                <p style={{ fontSize: 'var(--font-size-quote)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-primary)', margin: 0 }}>{`“${b.text}”`}</p>
                {b.attribution && (
                  <cite style={{ display: 'block', marginTop: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', fontStyle: 'normal', textTransform: 'uppercase', letterSpacing: 'var(--tracking-label-compact)' }}>{b.attribution}</cite>
                )}
              </blockquote>
            );
          }
          if (b.type === 'callout') {
            return (
              <aside key={i} style={{ ...CS_TEXT_WIDTH, padding: 'var(--space-5)', borderRadius: 'var(--radius-standard)', background: 'var(--bg-subtle)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: accent, textTransform: 'uppercase', letterSpacing: 'var(--tracking-label)', marginBottom: 'var(--space-3)' }}>{b.title}</div>
                <ul style={{ margin: 0, paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-prose)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-primary)' }}>
                  {b.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              </aside>
            );
          }
          if (b.type === 'gallery') {
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
                margin: 'var(--space-4) 0',
              }}>
                {b.images.map((img, j) => (
                  <figure key={j} style={{ margin: 0 }}>
                    <img src={img.src} alt={img.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '4 / 3', display: 'block', borderRadius: 'var(--radius-standard)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }} />
                    {img.caption && (
                      <figcaption style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-body-sm)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-tertiary)' }}>{img.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            );
          }
          if (b.type === 'image') {
            return (
              <figure key={i} style={{ width: '100%', margin: 'var(--space-4) 0' }}>
                <img src={b.src} alt={b.alt} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-standard)', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)' }} />
                {b.caption && (
                  <figcaption style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-body-sm)', lineHeight: 'var(--line-height-relaxed)', color: 'var(--fg-tertiary)' }}>{b.caption}</figcaption>
                )}
              </figure>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
