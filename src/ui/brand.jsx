import { Button } from './controls.jsx';
import React from 'react';
import { AppIcon, Moon, Sun } from '../ui-icons.jsx';
export const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <Button variant="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 'var(--control-hit-area)', height: 'var(--control-hit-area)', minWidth: 'var(--control-hit-area)', minHeight: 'var(--control-hit-area)', borderRadius: 'var(--radius-circle)', background: 'transparent',
      color: 'var(--fg-primary)', border: 'none',
      boxShadow: 'inset 0 0 0 1px var(--color-gray-100)', cursor: 'pointer', transition: 'background var(--duration-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {isDark
        ? <AppIcon icon={Moon} size={16} />
        : <AppIcon icon={Sun} size={16} />
      }
    </Button>
  );
};

export const NavLogo = ({ onClick, style, href = '#', className }) => {
  const [key, setKey] = React.useState(0);
  const shapeStyle = (delay) => ({
    transformBox: 'fill-box',
    transformOrigin: 'bottom center',
    animation: key > 0 ? `navShapeBounce var(--duration-nav) var(--easing-ease-out-bouncy) ${delay}ms both` : 'none',
    fill: 'var(--fg-primary)',
  });
  return (
    <a href={href} className={className} onClick={onClick}
      onMouseEnter={() => setKey(k => k + 1)}
      style={{ display: 'flex', alignItems: 'center', minHeight: 'var(--control-hit-area)', textDecoration: 'none', cursor: 'pointer', ...style }}
      aria-label="designedbyomar"
    >
      <svg key={key} width="86" height="18" viewBox="0 0 86 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.21429 18C14.3032 18 18.4286 13.9706 18.4286 9C18.4286 4.02944 14.3032 0 9.21429 0C4.12538 0 0 4.02944 0 9C0 13.9706 4.12538 18 9.21429 18Z" style={shapeStyle(0)} />
        <path d="M39.9286 0H21.5V18H39.9286V0Z" style={shapeStyle(55)} />
        <path d="M53.75 0L64.5 18H43L53.75 0Z" style={shapeStyle(110)} />
        <path d="M66.0357 0H72.4643C79.0917 0 84.4643 5.37258 84.4643 12V18H72.0357C68.722 18 66.0357 15.3137 66.0357 12V0Z" style={shapeStyle(165)} />
      </svg>
    </a>
  );
};
