/**
 * Subscribe to a media query, and return the unsubscribe.
 *
 * `MediaQueryList.addEventListener` only arrived in Safari 14. Before it, the
 * only option was `addListener`, and the two cannot be used interchangeably
 * without a check.
 *
 * Every call site in this codebase got this wrong in one of two ways. Most
 * guarded with `?.`, which turns an unsupported browser into one that silently
 * stops noticing the preference — and the preference is usually reduced motion,
 * so the visitor who asked most explicitly is the one quietly ignored. Two
 * called it outright and threw; one of those runs inside the hero canvas, so it
 * took the whole page down rather than one animation.
 */
export const onMediaChange = (mq, handler) => {
  if (typeof mq?.addEventListener === 'function') {
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }
  // Deprecated, and the only option before Safari 14.
  mq?.addListener?.(handler);
  return () => mq?.removeListener?.(handler);
};
