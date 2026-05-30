# designedbyomar

Portfolio site for **Omar Tavarez** — product design for AI workflows, design systems, fintech, healthcare SaaS, and enterprise product strategy.

🌐 **Live:** [designedbyomar.com](https://www.designedbyomar.com)
✉️ **Contact:** [omar@designedbyomar.com](mailto:omar@designedbyomar.com)
🧑‍💼 **Hiring:** open to Head of Design, Principal Product Designer, and senior / staff / fractional product design and design-engineering roles.

---

## Why this repo is public

This site is both my portfolio and a public artifact showing how I work today: using AI-assisted tools to move from strategy → design system → production UI, while keeping product judgment, brand, and UX decisions human-led.

If you're a hiring manager or founder, the things to look at are:

1. The site itself — [designedbyomar.com](https://www.designedbyomar.com)
2. The case studies in [`src/content/case-studies.json`](./src/content/case-studies.json) — shared by the app and static route generator so each gets its own crawlable, SEO-tagged route.
3. The design-system guide in [`DESIGN.md`](./DESIGN.md) and the public reference page at [`/design-system`](https://www.designedbyomar.com/design-system).
4. The AI-assisted workflow notes in [`docs/ai-workflow.md`](./docs/ai-workflow.md).

## Screenshots

| Homepage | Case study | Design system |
|---|---|---|
| ![Homepage](./docs/screenshots/homepage.png) | ![Case study](./docs/screenshots/case-study.png) | ![Design system](./docs/screenshots/design-system.png) |

## What's in here

- **Custom React 19 + Vite 8 single-page app** with multi-entry build (homepage, design-system page, 404).
- **Shared case-study content** in [`src/content/case-studies.json`](./src/content/case-studies.json), consumed by [`src/case-studies.js`](./src/case-studies.js) and [`postbuild.js`](./postbuild.js) so UI content, route metadata, and generated sitemap entries stay aligned.
- **Static route generation** in [`postbuild.js`](./postbuild.js) — each case study gets its own URL with unique title, description, OG, Twitter card, canonical, and JSON-LD.
- **Design system guide** in [`DESIGN.md`](./DESIGN.md), plus a public reference page at `/design-system` documenting tokens, components, patterns, motion, content, accessibility, and theming.
- **SEO + sharing**: canonical, Open Graph, Twitter card, JSON-LD (`WebSite` + `Person` + `FAQPage`), robots directives, generated `sitemap.xml`, and an [`llms.txt`](./public/llms.txt) for AI crawlers.
- **Analytics + monitoring**: Vercel Analytics, Vercel Speed Insights, Google Analytics 4 (consent-gated — loaded only after explicit user acceptance), Sentry (gated on `VITE_SENTRY_DSN`).
- **Security headers** via [`vercel.json`](./vercel.json): `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Referrer-Policy`.
- **Image pipeline**: `sharp`-based [`scripts/optimize-image.mjs`](./scripts/optimize-image.mjs) for image optimization.

## Stack

| Concern | Tool |
|---|---|
| Framework | React 19 |
| Build | Vite 8 (multi-entry) |
| Hosting | Vercel (canonical) |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights`, Google Analytics 4 (consent-gated) |
| Error monitoring | `@sentry/react` (optional) |
| Code review | CodeRabbit, Greptile, human review |
| Icons | `lucide-react` |
| Image optimization | `sharp` |

## Local development

```bash
nvm use            # uses .nvmrc → Node 20+
npm install
npm run dev
```

## Production build

```bash
npm run build      # vite build → dist/, then postbuild.js generates routes and sitemap.xml
npm run preview    # preview the built dist/ locally
```

## Automated tests

`npm test` runs the production build, SEO/static assertions, and Chromium Playwright E2E tests:

```bash
npm test            # full automated suite
npm run test:build  # production build smoke test only
npm run test:seo    # generated metadata, sitemap, and discovery checks
npm run test:e2e    # build, preview, and Playwright browser checks
npm run test:e2e:ui # optional interactive Playwright UI
```

GitHub Actions runs the full suite automatically on every pull request and every push to `main`. Playwright's UI mode is local-only and requires user interaction.

Future unit tests should be added when route parsing, metadata generation, or analytics helpers are extracted from `src/main.jsx` / `postbuild.js`.

If Playwright browsers are not installed locally yet, run:

```bash
npx playwright install chromium
```

## Deploy

Canonical deploy target is **Vercel**. The repo is wired up via [`vercel.json`](./vercel.json) with security headers and a single rewrite to the SPA shell.

- Build command: `npm run build`
- Output directory: `dist`
- Env: set `VITE_SENTRY_DSN` to enable Sentry. Without it, the site builds and ships normally.

## Branch workflow

Keep `main` protected and deployable. Use short-lived feature branches for one focused change at a time, then merge through a pull request.

**Rules:**
- Always branch from `main` — never from another feature branch unless explicitly stacking work.
- One branch per logical unit of work. If you find unrelated cleanup while working on a feature, open a separate branch for it.
- Merge and delete promptly. Stale branches add noise; GitHub can auto-delete on merge (repo Settings → General → "Automatically delete head branches").

**Prefixes:**

- `feat/` — new sections or new functionality
- `fix/` — broken behavior, SEO cleanup, redirects, bugs
- `design/` — visual, theme, typography, spacing, or design-system changes
- `content/` — copy, case studies, resume/about edits
- `chore/` — tooling, docs, dependency maintenance

**Example:**

```bash
git switch main
git pull
git switch -c fix/canonical-host
# ... make changes ...
git push -u origin fix/canonical-host
# open PR → merge → branch auto-deleted
```

## Quality checklist

- [x] Production build passes
- [x] Responsive layout reviewed across mobile / tablet / desktop breakpoints
- [x] Reduced-motion respected for the canvas / motion components
- [x] SEO metadata: canonical, OG, Twitter, JSON-LD, sitemap, robots, llms.txt
- [x] Analytics wired: GA4, Vercel Analytics, and Vercel Speed Insights
- [x] Error monitoring wired (optional via env)
- [x] External code review wired through CodeRabbit and Greptile
- [x] Security headers configured
- [x] Automated E2E + SEO regression tests
- [x] CI workflow — full automated suite runs on every PR and push to main

## Project layout

```
.
├── index.html                      # main app entry
├── DESIGN.md                       # agent-readable design system guide
├── design-system.html              # design system source entry, served publicly at /design-system
├── 404.html                        # static 404
├── postbuild.js                    # per-case-study route generation
├── vite.config.js                  # multi-entry rollup config
├── vercel.json                     # security headers + SPA rewrite
├── public/
│   ├── Images/                     # portrait, OG, share assets
│   ├── Videos/                     # case study cover videos
│   ├── Omar Tavarez Resume.pdf
│   ├── llms.txt                    # AI crawler directive
│   └── robots.txt                  # references generated /sitemap.xml
├── scripts/
│   └── optimize-image.mjs          # sharp-based image optimizer
├── src/
│   ├── main.jsx                    # main site app shell and homepage experience
│   ├── case-studies.js             # normalized case-study content exports
│   ├── routes.js                   # route parsing and route metadata helpers
│   ├── content/
│   │   └── case-studies.json       # canonical case-study content source
│   ├── design-system.jsx           # design system reference page
│   ├── design-system-primitives.jsx # extracted design system documentation primitives
│   ├── design-system-page.css      # design system page layout and responsive behavior
│   ├── design-tokens.css           # shared token source for app entries
│   ├── footer-alien.jsx
│   ├── ui-icons.jsx
│   └── constants.js                # nav / route / breakpoint constants
└── docs/
    └── ai-workflow.md              # how AI is used in this repo
```

## License

MIT — see [LICENSE](./LICENSE).
