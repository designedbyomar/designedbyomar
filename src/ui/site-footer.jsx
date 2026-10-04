import { LinkButton } from './controls.jsx';
import React from 'react';
import { NavLogo } from './brand.jsx';
import { footerAlienStyles, FooterArrival } from '../footer-alien.jsx';
import { LAYOUT, LINKEDIN_URL, GITHUB_URL, SUBSTACK_URL, BEHANCE_URL } from '../constants.js';
const FooterAlien = () => {
  const ref = React.useRef(null);
  const [played, setPlayed] = React.useState(false);

  React.useEffect(() => {
    if (played) return;
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setPlayed(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setPlayed(true);
        obs.disconnect();
      }
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [played]);

  return <div ref={ref} style={{ display: 'inline-block' }}><FooterArrival played={played} /></div>;
};

export const SiteFooter = ({ onHome, scrollToSection, onEvent = () => {}, onLogoClick, rootPrefix = '' }) => {
  const footerLabelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-body-sm)',
    color: 'var(--fg-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-label)',
  };

  const goSection = (id) => (event) => {
    if (!scrollToSection) return;
    event.preventDefault();
    scrollToSection(id, 'footer');
  };

  return (
    <footer style={{ borderTop: '1px solid var(--color-gray-100)', padding: 'var(--layout-2) var(--space-6)' }}>
      <style>{footerAlienStyles}</style>
      <div style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto' }}>
        <div className="site-footer-grid">
          <div className="site-footer-block site-footer-brand" style={{ gap: 'var(--space-8)' }}>
            <div style={{ display: 'inline-flex', width: 'fit-content' }}>
              <NavLogo onClick={(event) => { event.preventDefault(); onLogoClick?.(); onHome?.(); }} />
            </div>
            <p style={{ maxWidth: 'var(--content-footer-summary)', margin: 0, fontSize: 'var(--font-size-body-lg)', lineHeight: 'var(--line-height-loose)', color: 'var(--fg-tertiary)' }}>
              Product design for AI workflows, enterprise systems, fintech, and healthcare SaaS.
            </p>
            <span className="footer-signoff" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              width: 'fit-content',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-body-sm)',
              lineHeight: 'var(--line-height-relaxed-plus)',
              color: 'var(--fg-tertiary)',
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
            }}>
              <span>Designed by Omar. Built with AI-native coding tools.</span>
              <FooterAlien />
            </span>
          </div>

          <div className="site-footer-block">
            <h3 style={{ ...footerLabelStyle, margin: 0 }}>Site Links</h3>
            <LinkButton variant="text"
              href="/work"
              className="text-link site-footer-link"
              onClick={goSection('work')}
            >
              Work
            </LinkButton>
            <LinkButton variant="text"
              href="/about"
              className="text-link site-footer-link"
              onClick={() => onEvent('about_page_open', { ui_location: 'footer' })}
            >
              About
            </LinkButton>
            <LinkButton variant="text"
              href={`${rootPrefix}#faq`}
              className="text-link site-footer-link"
              onClick={goSection('faq')}
            >
              FAQ
            </LinkButton>
            <LinkButton variant="text"
              href={`${rootPrefix}#contact`}
              className="text-link site-footer-link"
              onClick={goSection('contact')}
            >
              Contact
            </LinkButton>
            <LinkButton variant="text"
              href="/privacy"
              className="text-link site-footer-link"
            >
              Privacy Policy
            </LinkButton>
            <LinkButton variant="text"
              href="/design-system"
              className="text-link site-footer-link"
              aria-label="See Design System"
            >
              Design System
            </LinkButton>
          </div>

          <div className="site-footer-block">
            <h3 style={{ ...footerLabelStyle, margin: 0 }}>Social</h3>
            <LinkButton variant="text"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link site-footer-link"
              onClick={() => { onEvent('contact_click_linkedin', { link_url: LINKEDIN_URL, section: 'footer' }); }}
            >
              LinkedIn
            </LinkButton>
            <LinkButton variant="text"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link site-footer-link"
              onClick={() => { onEvent('contact_click_github', { link_url: GITHUB_URL, section: 'footer' }); }}
            >
              GitHub
            </LinkButton>
            <LinkButton variant="text"
              href={SUBSTACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link site-footer-link"
              onClick={() => { onEvent('contact_click_substack', { link_url: SUBSTACK_URL, section: 'footer' }); }}
            >
              Substack
            </LinkButton>
            <LinkButton variant="text"
              href={BEHANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link site-footer-link"
              onClick={() => { onEvent('contact_click_behance', { link_url: BEHANCE_URL, section: 'footer' }); }}
            >
              Behance
            </LinkButton>
            <span style={{ paddingTop: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)', color: 'var(--fg-tertiary)', letterSpacing: 'var(--tracking-label-compact)', textTransform: 'uppercase' }}>
              © 2026 Omar Tavarez
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};
