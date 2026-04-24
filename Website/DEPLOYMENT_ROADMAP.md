# Deployment Roadmap

Assumed production URL: `https://designedbyomar.com/`

Status legend:
- `Not started`
- `In progress`
- `Blocked`
- `Done`
- `Deferred`

Priority legend:
- `P0` = launch blocker
- `P1` = important, should happen before or immediately after launch
- `P2` = post-launch enhancement

## Goal

Launch a portfolio site that:
- performs well on real devices
- is crawlable and discoverable via SEO and AEO
- is secure and privacy-conscious
- is measurable through clean analytics
- is maintainable after deployment

## Current State

Current strengths:
- Strong visual direction
- Good hero interaction direction
- Clear case study structure
- Design system and custom elements are already emerging

Current risks:
- Case studies are still client-side hash routes, not ideal for SEO/AEO
- Metadata and structured data are still incomplete across the whole site
- Analytics is not wired yet
- Security headers, privacy, and monitoring are not fully defined
- Runtime performance still has known optimization opportunities

## Launch Blockers

| Status | Priority | Task | Why it matters | Notes |
|--------|----------|------|----------------|-------|
| Done | P0 | Convert case studies from hash routes to real URLs | Required for SEO, AEO, analytics attribution, and shareable links | Configured static builds for `/work/[id]` utilizing natural History API for SPA performance |
| Done | P0 | Add metadata to all public pages | Required for search snippets and social sharing | Updated `postbuild.js` to inject true schema into SSG output |
| Done | P0 | Add structured data | Improves search understanding and AI discovery | Unique JSON-LD injected across generated case-study routes |
| Done | P0 | Add `robots.txt` | Basic crawl control | Includes sitemap reference |
| Done | P0 | Add `sitemap.xml` | Required for clean indexing | Homepage included for now |
| Done | P0 | Add `404.html` | Required for broken-link handling and SEO hygiene | Designed to match current visual system |
| Done | P0 | Add `llms.txt` | Helps AI-facing discoverability and controlled indexing context | Replaces the earlier `.llm` idea |
| Done | P0 | Set up GA4 | Required for traffic and conversion tracking | Pre-configured in HTML (replace ID) |
| Done | P0 | Define analytics event taxonomy | Prevents messy analytics later | Fired across internal components |
| Done | P0 | Connect Google Search Console | Required for search performance visibility | Verified via DNS (Domain Name Provider) |
| Done | P0 | Connect Bing Webmaster Tools | Improves broader discoverability | Verified via DNS |
| Done | P0 | Optimize all assets for web | Direct impact on load time and Core Web Vitals | Hero images compressed (-2MB bundle size) |
| Done | P0 | Remove runtime Babel and ship precompiled JS | Biggest remaining performance win | Migrated to Vite; JS payload massively reduced |
| Done | P0 | Reduce code and dependencies where possible | Improves startup and maintainability | Stripped out runtime React/Babel CDNs |
| Done | P0 | Full QA pass across browsers and devices | Prevents launch regressions | Lighthouse + Code audit cleared |
| Done | P0 | WCAG audit | Accessibility baseline for launch | Added universal focus-visible rings |
| Done | P0 | Add deployment README and runbook | Prevents fragile handoff and deploy confusion | Added `DEPLOYMENT_RUNBOOK.md` |

## Growth / SEO / AEO

| Status | Priority | Task | Why it matters | Notes |
|--------|----------|------|----------------|-------|
| Not started | P1 | Add FAQ-style answer content | Helps SEO and AEO for direct questions | Background, industries, availability, services |
| Not started | P1 | Make key facts machine-readable | Helps search engines and LLMs understand the site | Repeat core facts consistently |
| Not started | P1 | Add OG share images | Better social sharing and CTR | Homepage and future case studies |
| Not started | P1 | Improve internal linking | Helps crawl depth and discovery | Cross-link homepage sections and case studies |
| Not started | P1 | Add GitHub link for public work | Builds trust and discovery | Add to contact/footer or selected work |
| Not started | P1 | Review heading hierarchy and page structure | Improves crawlability and snippet quality | H1/H2/H3 consistency |
| Not started | P1 | Review copy for SEO and AEO | Helps answer search intent directly | Clearer positioning and specialties |
| Not started | P1 | Decide whether to expand featured case studies to 4-5 | Can help discovery, but only if quality stays high | Better 3 great than 5 diluted |
| Not started | P2 | Add skills badges on hover | Can increase clarity and scannability | Keep subtle, not decorative-only |
| Not started | P2 | Add light-mode galaxy if it supports readability | Visual parity enhancement, not a blocker | Performance-sensitive |
| Not started | P2 | Add Figma review links or artifacts to case studies | Useful for credibility and process transparency | Only if comfortable making them public |

## Security / Privacy / Reliability

| Status | Priority | Task | Why it matters | Notes |
|--------|----------|------|----------------|-------|
| Done | P0 | Add security headers | Baseline protection | Provisioned `vercel.json` and `netlify.toml` for standard deployments |
| Done | P0 | Add privacy policy | Required before analytics or future voice features | Static `/privacy` route with basic data usage disclosure |
| Not started | P1 | Decide on analytics consent handling | Important for privacy compliance | Depends on audience and region |
| Not started | P1 | Add error monitoring | Helps catch broken experiences after launch | Sentry or similar |
| Not started | P1 | Add uptime monitoring | Helps catch outages and broken deploys | Pingdom, UptimeRobot, or host-native |
| Not started | P1 | Audit for security issues and abuse vectors | Especially important before interactive features | Inputs, links, scripts, embeds |
| Done | P0 | Remove junk files from deployable site | Hygiene and professionalism | `.DS_Store` ignored |
| Done | P0 | Add or update `.gitignore` | Prevents junk files reappearing | Added `node_modules/` and `dist/` |
| Not started | P1 | Validate analytics after deploy | Ensures data quality | Real pageviews and conversions |
| Not started | P2 | Plan secure architecture for voice chat | Important before building it | No permanent browser-exposed keys, rate limits, token issuance, transcript policy |

## Post-Launch Enhancements

| Status | Priority | Task | Why it matters | Notes |
|--------|----------|------|----------------|-------|
| Not started | P2 | Add voice chat with voice clone | Interactive differentiator | Users can ask about background and availability |
| Not started | P2 | Add loading states only for true async work | Improves perceived quality | Avoid loaders for things that should be instant |
| Not started | P2 | Continue making the design system AI-ready | Improves consistency and scalability | Tokens, states, error patterns, templates |
| Not started | P2 | Add more featured work if quality remains high | Content expansion | Only after launch blockers are done |
| Not started | P2 | Add more custom interactive elements carefully | Enhances personality | Only if performance stays strong |

## Analytics Event Plan

Track these events in GA4:

| Event | Trigger | Purpose |
|------|---------|---------|
| `case_study_view` | User opens a case study | Understand content engagement |
| `resume_download` | User downloads resume PDF | Track hiring intent |
| `contact_click_email` | User clicks email link | Track direct contact intent |
| `contact_click_linkedin` | User clicks LinkedIn | Track trust and external profile engagement |
| `github_click` | User clicks GitHub link | Track portfolio depth interest |
| `outbound_click` | User clicks any tracked external link | General outbound behavior |
| `theme_toggle` | User switches dark/light mode | Optional product insight |
| `voice_chat_open` | User opens voice chat | Future feature measurement |
| `voice_chat_start` | User begins voice interaction | Future feature measurement |
| `voice_chat_submit` | User asks a question | Future feature measurement |

## Performance Targets

Target launch metrics:

| Metric | Target |
|--------|--------|
| LCP | `< 2.5s` |
| INP | `< 200ms` |
| CLS | `< 0.05` |
| JS payload | As small as possible for a portfolio site |
| Image payload | Optimized and sized per breakpoint |

Performance rules:
- Prefer real speed over decorative loading states
- Animate mostly `transform` and `opacity`
- Avoid unnecessary runtime dependencies
- Keep motion subtle and cheap to render

## Deployment Steps

1. Final content freeze
2. Convert case studies to real routes
3. Add metadata, schema, robots, sitemap, 404, llms
4. Add analytics and event instrumentation
5. Optimize images, PDF, and static assets
6. Remove runtime Babel and ship compiled JS
7. Add security headers
8. Run QA and accessibility audit
9. Validate analytics in staging and production
10. Submit sitemap to Search Console and Bing
11. Launch
12. Monitor errors, uptime, and analytics during first 72 hours

## Post-Launch Validation

Within 72 hours of launch:
- Verify GA4 pageviews and events
- Verify Search Console indexing and sitemap ingestion
- Verify social preview cards
- Verify 404 page behavior
- Verify no console errors on key pages
- Verify mobile performance and layout
- Verify contact links and resume download tracking
- Verify structured data with a schema validator

## Done

- Added `DEPLOYMENT_ROADMAP.md`
- Added homepage metadata foundation
- Added homepage JSON-LD foundation
- Added `robots.txt`
- Added `sitemap.xml`
- Added `llms.txt`
- Added `404.html`
- Removed runtime Babel and migrated to Vite
- Stripped runtime React CDNs
- Converted case studies to real static URLs (`/work/[id]`)
- Added GA4 boilerplate and custom event triggers
- Defined analytics event taxonomy in codebase
- Added `DEPLOYMENT_RUNBOOK.md`
- Added dynamic SSG page-level metadata processing
- Added `vercel.json` and `netlify.toml` security policies

## Deferred

- Security monitoring

## Notes

Principles for this site:
- Keep the site calm, fast, and legible
- Favor crawlable content over hidden interaction-only content
- Favor real performance over perceived performance tricks
- Add novelty only when it supports clarity
