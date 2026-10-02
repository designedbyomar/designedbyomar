import { Button, LinkButton } from './controls.jsx';
import { AppIcon, Menu, X } from '../ui-icons.jsx';
import { LAYOUT } from '../constants.js';
import { NavLogo, ThemeToggle } from './brand.jsx';
export const SiteNavigation = ({ theme, setTheme, scrolled = false, isMobile = false, isMobileMenuOpen = false, closeMobileMenu, onToggleMenu, handleLogoClick, goSection, onEvent = () => {} }) => {
  const navLink = {
    display: 'inline-flex', alignItems: 'center', minHeight: 'var(--control-hit-area)',
    fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--fg-secondary)',
    textDecoration: 'none', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-standard)',
    transition: 'color var(--duration-fast), background var(--duration-fast)', cursor: 'pointer',
    background: 'transparent', border: 'none', fontFamily: 'inherit',
  };
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 'var(--z-fixed)',
      background: scrolled ? 'color-mix(in oklab, var(--bg-page) 82%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'var(--blur-strong)' : 'none',
      WebkitBackdropFilter: scrolled ? 'var(--blur-strong)' : 'none',
      boxShadow: scrolled ? 'rgba(127, 127, 127, var(--opacity-18)) 0px -1px 0px 0px inset' : 'none',
      transition: 'background var(--duration-base-short), box-shadow var(--duration-base-short)',
      padding: '0 var(--space-6)',
    }}>
      {/* Padding lives on the full-width header, not the max-width row, so the row
          aligns with the content sections' inner containers at every width. */}
      <div style={{ maxWidth: LAYOUT.MAX_WIDTH, margin: '0 auto', minHeight: 'var(--layout-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Menu trigger sits left of the logo, matching the design-system header. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {isMobile && (
            <Button variant="navigation"
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={onToggleMenu}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 'var(--control-hit-area)', height: 'var(--control-hit-area)', minWidth: 'var(--control-hit-area)', minHeight: 'var(--control-hit-area)', borderRadius: 'var(--radius-circle)', background: 'transparent',
                color: 'var(--fg-primary)', border: 'none', boxShadow: 'inset 0 0 0 1px var(--color-gray-100)',
                cursor: 'pointer', transition: 'background var(--duration-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <AppIcon icon={isMobileMenuOpen ? X : Menu} size={17} />
            </Button>
          )}
          <NavLogo
            onClick={handleLogoClick}
            style={isMobile ? { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } : undefined}
          />
        </div>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 'var(--space-micro)' }}>
            <LinkButton variant="navigation" href="/work" onClick={goSection('work')} style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >Work</LinkButton>
            <LinkButton variant="navigation" href="/design-system" style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >Design System</LinkButton>
            <LinkButton variant="navigation" href="/about" onClick={() => onEvent('about_page_open', { ui_location: 'nav' })} style={{ ...navLink, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >About</LinkButton>
            <LinkButton variant="navigation" href="#faq" onClick={goSection('faq')} style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >Ask</LinkButton>
            <LinkButton variant="navigation" href="#contact" onClick={goSection('contact')} style={navLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >Contact</LinkButton>
          </nav>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          {!isMobile && (
            <LinkButton variant="navigation" href="#contact" onClick={goSection('contact')} style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 'var(--control-hit-area)',
              fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--bg-page)', padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-standard)', background: 'var(--fg-primary)', textDecoration: 'none', transition: 'opacity var(--duration-fast)',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 'var(--opacity-control-hover)'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >Get in touch</LinkButton>
          )}
        </div>
        {isMobile && isMobileMenuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 'var(--space-6)', right: 'var(--space-6)', zIndex: 'var(--z-site-menu)',
            padding: 'var(--space-3)', borderRadius: 'var(--radius-large)', background: 'color-mix(in oklab, var(--bg-page) 94%, transparent)',
            boxShadow: 'var(--shadow-card-full)', border: '1px solid var(--color-gray-100)',
            backdropFilter: 'var(--blur-heavy)', WebkitBackdropFilter: 'var(--blur-heavy)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <LinkButton variant="navigation" href="/work" onClick={goSection('work')} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>Work</LinkButton>
              <LinkButton variant="navigation" href="/design-system" onClick={closeMobileMenu} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>Design System</LinkButton>
              <LinkButton variant="navigation" href="/about" onClick={() => { closeMobileMenu(); onEvent('about_page_open', { ui_location: 'mobile_nav' }); }} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)', textDecoration: 'none' }}>About</LinkButton>
              <LinkButton variant="navigation" href="#faq" onClick={goSection('faq')} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>Ask</LinkButton>
              <LinkButton variant="navigation" href="#contact" onClick={goSection('contact')} style={{ ...navLink, width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-3)', color: 'var(--fg-primary)' }}>Contact</LinkButton>
              <LinkButton variant="navigation" href="#contact" onClick={goSection('contact')} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 'var(--control-hit-area)',
                fontSize: 'var(--font-size-body-md)', fontWeight: 'var(--font-weight-medium)', color: 'var(--bg-page)', padding: 'var(--space-3) var(--space-4)', marginTop: 'var(--space-compact)',
                borderRadius: 'var(--radius-comfort)', background: 'var(--fg-primary)', textDecoration: 'none', transition: 'opacity var(--duration-fast)',
              }} onMouseEnter={e => e.currentTarget.style.opacity = 'var(--opacity-control-hover)'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Get in touch</LinkButton>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
