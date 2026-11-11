import React from 'react';
import { DESIGN_SYSTEM_BY_ID, DESIGN_SYSTEM_SECTIONS } from './content/design-system.mjs';

export const sectionFromHash = () => {
  let id;
  try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return null; }
  if (id === 'quick-links') return 'overview';
  return DESIGN_SYSTEM_BY_ID[id] ? id : null;
};

// Scroll position, rather than the visible fraction of a section, also works for
// examples taller than the viewport. ResizeObserver covers fonts and lazy fixtures.
export const useDocumentationNavigation = () => {
  const [activeId, setActiveId] = React.useState(() => sectionFromHash() || 'overview');
  const [request, setRequest] = React.useState(() => ({ id: sectionFromHash() || 'overview', sequence: 0 }));
  const navigateRef = React.useRef(null);

  React.useEffect(() => {
    let frame = 0;
    let anchorPending = Boolean(sectionFromHash());
    const measure = () => {
      frame = 0;
      let current = 'overview';
      for (const { id } of DESIGN_SYSTEM_SECTIONS) {
        if (document.getElementById(id)?.getBoundingClientRect().top <= 100) current = id;
      }
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = DESIGN_SYSTEM_SECTIONS.at(-1).id;
      }
      setActiveId(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const align = (id, focus = true) => {
      const target = document.getElementById(id);
      if (!target) return;
      const heading = target.querySelector('h1, h2') || target;
      if (focus) heading.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      setActiveId(id === 'quick-links' ? 'overview' : id);
      schedule();
    };
    const syncHash = () => {
      const id = sectionFromHash();
      if (!id) return;
      anchorPending = true;
      setRequest(previous => ({ id, sequence: previous.sequence + 1 }));
      align(window.location.hash === '#quick-links' ? 'quick-links' : id);
    };
    navigateRef.current = syncHash;
    const stopAnchoring = () => { anchorPending = false; };
    const observer = new ResizeObserver(() => {
      if (anchorPending) align(window.location.hash === '#quick-links' ? 'quick-links' : sectionFromHash(), false);
      schedule();
    });
    document.querySelectorAll('main > section').forEach(section => observer.observe(section));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    window.addEventListener('wheel', stopAnchoring, { passive: true });
    window.addEventListener('touchstart', stopAnchoring, { passive: true });
    window.addEventListener('pointerdown', stopAnchoring);
    window.addEventListener('keydown', stopAnchoring);
    if (sectionFromHash()) syncHash();
    else schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      navigateRef.current = null;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
      window.removeEventListener('wheel', stopAnchoring);
      window.removeEventListener('touchstart', stopAnchoring);
      window.removeEventListener('pointerdown', stopAnchoring);
      window.removeEventListener('keydown', stopAnchoring);
    };
  }, []);

  const navigate = (id) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    navigateRef.current?.();
  };
  return { activeId, request, navigate };
};
