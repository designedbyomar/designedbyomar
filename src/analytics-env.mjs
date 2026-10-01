// Google Analytics only runs in production builds, so development (`npm run dev`),
// test, and preview-of-dev traffic never reaches the production GA4 property.
// Isolated here so the guard can be unit-tested without a DOM or a Vite build.
// `env` is Vite's `import.meta.env`; `PROD` is true only for production builds.
export const isGaEnabled = (env) => Boolean(env && env.PROD);
