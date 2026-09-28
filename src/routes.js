export const parsePortfolioRoute = (path) => {
  if (path.match(/^\/privacy\/?$/)) return { type: 'privacy' };
  if (path.match(/^\/ask\/?$/)) return { type: 'ask' };
  if (path.match(/^\/work\/?$/)) return { type: 'work' };
  const match = path.match(/^\/work\/(.+?)(\/)?$/);
  return match ? { type: 'case', id: match[1] } : { type: 'home' };
};

export const isPortfolioRoutePath = (path) => (
  path === '/'
  || path === '/privacy'
  || path === '/ask'
  || path === '/work'
  || path.startsWith('/work/')
);
