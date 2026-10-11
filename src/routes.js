export const parsePortfolioRoute = (path) => {
  if (path.match(/^\/ratecard\/?$/)) return { type: 'ratecard' };
  if (path.match(/^\/privacy\/?$/)) return { type: 'privacy' };
  if (path.match(/^\/about\/?$/)) return { type: 'about' };
  if (path.match(/^\/ask\/?$/)) return { type: 'ask' };
  if (path.match(/^\/work\/?$/)) return { type: 'work' };
  const match = path.match(/^\/work\/(.+?)(\/)?$/);
  return match ? { type: 'case', id: match[1] } : { type: 'home' };
};

export const isPortfolioRoutePath = (path) => (
  path === '/'
  || /^\/ratecard\/?$/.test(path)
  || path === '/privacy'
  || path === '/about'
  || path === '/ask'
  || path === '/work'
  || path.startsWith('/work/')
);
