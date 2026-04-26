# designedbyomar

Portfolio site for Omar Tavarez, focused on AI workflows, enterprise systems, fintech, and healthcare SaaS.

## Stack

- React
- Vite
- Static hosting via Netlify or Vercel
- Post-build route generation in `postbuild.js`

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

## Production Build

Build the site and generate static routes:

```bash
npm run build
```

Preview the built output locally:

```bash
npm run preview
```

## Smoke Test

There is no dedicated unit test suite yet. For now, `npm test` runs the production build as a smoke test:

```bash
npm test
```

## Key Files

- `src/main.jsx` — main site app, routes, content, and UI
- `src/design-system.jsx` — design system reference page app
- `index.html` — main app entry and shared SEO shell
- `design-system.html` — design system entry point
- `404.html` — static 404 page
- `postbuild.js` — generates static route output after Vite build

## Assets

- Images live in `public/Images/`
- Resume lives at `public/Omar Tavarez Resume.pdf`

## Deploy

- Build command: `npm run build`
- Output directory: `dist`

## Error Monitoring

- Minimal browser error monitoring is available via Sentry.
- Set `VITE_SENTRY_DSN` in your production hosting environment to enable it.
- If `VITE_SENTRY_DSN` is not set, Sentry stays disabled and the site still builds normally.
