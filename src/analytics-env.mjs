// Google Analytics must only ever touch the production GA4 property from the real
// production deployment. Two independent signals are required:
//   1. a production *build* — `import.meta.env.PROD`, which excludes `npm run dev`
//      and non-production builds.
//   2. the production *host* at runtime — which excludes Vercel preview
//      deployments (*.vercel.app) and localhost. Previews run the same
//      `npm run build` command as production, so build mode alone is not enough
//      to tell them apart; the hostname is.
// The host allowlist is overridable at build time via `VITE_GA_ALLOWED_HOSTS`
// (comma-separated) so the e2e suite can exercise the real GA path on 127.0.0.1.
// Isolated here so the guard can be unit-tested without a DOM or a Vite build.
export const PRODUCTION_HOSTS = ['designedbyomar.com', 'www.designedbyomar.com'];

const parseHosts = (value) => String(value || '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

export const isProductionHost = (hostname, allowedHosts = PRODUCTION_HOSTS) =>
  allowedHosts
    .map((host) => host.toLowerCase())
    .includes(String(hostname || '').toLowerCase());

export const isGaEnabled = (env, hostname) => {
  if (!env || !env.PROD) return false;
  const overrides = parseHosts(env.VITE_GA_ALLOWED_HOSTS);
  return isProductionHost(hostname, overrides.length ? overrides : PRODUCTION_HOSTS);
};
