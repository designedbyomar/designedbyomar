import React from 'react';
import { onMediaChange } from '../media-query.js';
export const useViewportWidth = () => {
  const [viewportWidth, setViewportWidth] = React.useState(() => (
    typeof window === 'undefined' ? 1280 : window.innerWidth
  ));

  React.useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return viewportWidth;
};

export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = React.useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    return onMediaChange(mq, sync);
  }, []);
  return reduced;
};
