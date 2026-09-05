# Changelog

All notable changes to designedbyomar.com are documented here.

## [Unreleased] - 2026-09-04

### Added
- Case studies: Posting Assistant body restored from the Webflow archive — 563 words, the posting-journey blueprint, the assistive review screen, file intake with Open Dental posting, and claim-level check detail, each with written alt text and a caption tying it to the argument (the source had no captions)
- Case studies: non-rendered `todos` field for editorial notes, kept out of the published HTML rather than shipped as source comments
- Case studies: long-form body content restored from the Webflow archive, starting with Management Portal — 1,644 words, 8 screenshots with written alt text and captions, four Operations Leadership pull quotes with attribution, and the "Why LLM, not just rules" rationale promoted to a callout. Renders below the existing Challenge / Approach / Outcome summary, so the 15-second skim is unchanged
- Case studies: optional `body` block array rendered by React and serialized by `postbuild.js`, so images ship as real `<img>` tags in the server response rather than client-rendered only
- Case studies: automatic table of contents on bodies over 1,200 words
- Client carousel: WelcomeLend wordmark added, bringing the logo band to 10 companies. Alt text carries the company name, matching the existing pattern where marquee duplicates stay `aria-hidden` with empty alt
- Work: `/work` is now a real case-study index listing all 8 studies in a grid, with its own H1 and intro. It previously rendered the homepage and scrolled to the Selected Work section, so the primary nav item produced a byte-for-byte duplicate of the page the visitor was already on — two URLs competing for the same content, and a nav click that appeared to do nothing
- Navigation: `Design System` added to the desktop and mobile header nav. The documented system powering the site was linked only from the footer, while the site claims design-systems expertise in three separate places
- About: the "How I work" section now links to the live design system, putting the proof next to the claim
- Case studies: optional `relatedLink` field on a case study, used by Athena Design System 2.0 to point at the live system as the current version of that thinking
- SEO: Defensive 301 redirects added for `/work/athena-design-system` and `/work/athena-design-system/` → `/work/athena-ds/` to catch any old external links using the full slug
- Security: `Content-Security-Policy-Report-Only` header added to `vercel.json` — allowlists GA4, Google Fonts, Sentry, and Vercel Analytics; violations appear in browser DevTools console without blocking anything; rename to `Content-Security-Policy` once no violations are observed to enforce
- CI: `npm audit --audit-level=high` step added to CI workflow — blocks PRs on high and critical dependency vulnerabilities
- CI: ESLint flat config, React Hooks rules, `npm run lint`, and CI lint step added with `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, and `globals` dev dependencies.
- Analytics: deeper portfolio interaction events added for About drawer opens, Work drawer opens, case-study previous/next navigation, FAQ toggles, and email copy actions.
- SEO: `metaDescription` field added to all 8 case studies in `case-studies.json` — longer, keyword-rich descriptions (120–175 chars) used in `<meta name="description">` and OG/Twitter tags without changing the short on-page subtitles
- SEO: Visually-hidden static H1 injected into `<div id="root">` in `index.html` and all `postbuild.js`-generated pages (`/work`, `/work/[id]/`, `/privacy`, `/design-system`) — gives Ahrefs and non-JS crawlers an H1 signal; React replaces root content on mount so users never see the placeholder
- SEO/AEO: Case-study routes now ship their full prose in the static HTML — title, subtitle, client/year/role, tags, metrics, and the Challenge / Approach / Outcome sections are injected into `<div id="root">` by `postbuild.js` from `case-studies.json`. Previously every `/work/[id]/` URL returned a document containing no case-study writing at all, so AI assistants, ATS scrapers, link-preview bots, reader mode, and non-rendering crawlers saw an empty page. React replaces root content on mount, so the rendered site is unchanged

### Fixed
- Performance: hero portrait preload is now scoped to the homepage only. It previously also ran on `/work`, which was correct while `/work` rendered the homepage hero — now that `/work` is its own case-study index, preloading there fetched a 50 KB image at `fetchpriority="high"` that the page never paints
- Security: CSP `report-uri` directive removed — the value was single-quoted (`'/csp-report'`), which CSP reserves for keywords like `'self'`, so browsers POSTed violation reports to a literal quoted path that 404ed and no reports were ever collected
- Security: CSP `connect-src` Sentry host corrected from `https://*.ingest.sentry.io` to `https://*.ingest.us.sentry.io` — the wildcard did not match the regional DSN host `o4511277976649728.ingest.us.sentry.io`, so enforcing the policy would have silently blocked all Sentry error reporting
- Polish: Saved theme is now applied before first paint by an inline head script in `index.html` and `design-system.html` — both templates ship `data-theme="dark"`, so light-mode visitors saw a dark flash on every page load until React's `useEffect` corrected it after the bundle parsed
- Performance: Hero portrait preload no longer ships to routes that never render it — it was emitted into all 8 case-study routes and `/privacy` via the shared `postbuild.js` template, costing each a wasted 50 KB fetch at `fetchpriority="high"` that competed with those pages' real LCP content
- Performance: Hero portrait preload is now theme-aware — it hardcoded the dark-mode srcset while light mode renders `omar-light.webp`, so light-mode visitors fetched an unused 50 KB image alongside the real one and got no LCP benefit
- Accessibility/markup: `height="auto"` removed from the `AlienPixel` and `UFO` SVGs in `src/footer-alien.jsx` — `auto` is not a valid SVG length, so browsers discarded it and logged two console errors per page load; the same intent is now expressed in CSS, with rendered sizes unchanged
- Security: CSP `connect-src` now allows `https://www.google.com` — GA4 beacons engagement events to `/g/collect` on that origin regardless of signals configuration, and enforcing without it produced a console error per event

### Removed
- Work: the all-case-studies drawer and its `work_drawer_open` GA4 event, made redundant by the `/work` index. Its focus trap, scroll lock, and overlay are gone with it

### Changed
- Case studies: header text now spans the full section width — the subtitle was capped at 640 px while the title beside it ran full-bleed. The reading column keeps its 640 px measure but is centred in the container rather than pinned left, with images still spanning full width
- SEO/AEO: machine-readable identity now says `Principal Product Designer` instead of `Product Designer` — the hidden static H1, both `jobTitle` fields (runtime and build-time JSON-LD), the meta/OG/Twitter descriptions, and `llms.txt`. Every field a crawler, ATS, or AI assistant reads for seniority was a rung below the title About already states, and the homepage JSON-LD block in `index.html` was a separate copy that `postbuild.js` never touched
- Case studies: metrics can carry a `qualifier`. All three Management Portal stats are now labelled `Projected` — the body states the portal is in development with Q1–Q2 2026 rollout, and its own impact lists frame all three as targets rather than achieved results
- Work: "See all 8 case studies" is now an `<a href="/work">` instead of a button that opened an overlay — it is keyboard reachable, middle-clickable, openable in a new tab, and followable by a crawler. Three case studies including both Disney credits were previously reachable only through that overlay
- Navigation: the Work nav item and hero CTA now navigate to `/work` rather than scrolling to a homepage section
- Key facts: design-systems stat raised from 2 to 3, matching the three case studies tagged `Design System` (Simplero Page Builder, Plastiq Athena, Disney Unified Ad Platform)
- Dependencies: upgraded Sharp to 0.35.4 and refreshed vulnerable transitive packages so the high-severity CI audit gate passes.
- Security: `Content-Security-Policy` promoted from report-only to enforcing in `vercel.json` after validating every route and interactive surface under the real policy — nothing is blocked
- Analytics: GA4 `config` now sets `allow_google_signals: false` and `allow_ad_personalization_signals: false` — disables Google signals and ads personalization, matching the privacy policy claim that analytics are not used for advertising, profiling, or cross-site tracking
- Resume: replaced the public downloadable PDF with Omar Tavarez Resume v3.0.
- Workflow: documented automatic task-scoped commits and pull-request creation after validated changes.
- Docs: README, deployment runbook, AI workflow notes, and roadmap now reflect `src/content/case-studies.json` as the canonical case-study source and `postbuild.js` as the generated sitemap source.
- Homepage: hid the "Currently looking for my next role" hero status while preserving the copy behind a source flag for future reuse.
- SEO: Case-study `metaDescription` copy tightened for cleaner search snippets while preserving the same public claims.
- SEO: Static placeholder H1 visually-hidden CSS now uses the stronger clipping pattern shared by `index.html` and generated routes.
- Build: `sitemap.xml` is now generated by `postbuild.js` from `CASE_STUDIES` data instead of maintained as a static file in `public/` — prevents URL drift when case studies are added or removed
- SEO: Privacy page meta description extended to 143 chars — describes consent model and contact process rather than just restating the page title
- Performance: Hero portrait now uses responsive `srcset` — `omar-mobile.webp` (640 px wide, 49 KB) served to mobile viewports instead of the 193 KB desktop image; `imagesrcset`/`imagesizes` on the `<head>` preload ensures the correct variant is fetched before React executes
- Performance: Google Fonts stylesheet loaded asynchronously (`rel="preload" as="style"` + `onload` swap) across `index.html`, `design-system.html`, and `404.html` — eliminates render-blocking font CSS fetch, improving FCP
- Performance: Vite code splitting via `manualChunks` — React/ReactDOM, Sentry, and Vercel analytics now build as separate cached chunks (`vendor-react`, `vendor-sentry`, `vendor-vercel`), reducing main bundle parse time and improving caching on return visits
- Performance: Hero portrait `<img>` gets `fetchPriority="high"` so the browser fetches the LCP image at maximum priority, overlapping with JS execution

### Added
- Design system page: `PixelOrbitIcons` canvas component — five section icons (Palette, Box, Search, Zap, ShieldCheck) orbit a shared center on distinct speed rings, rendered with the same galaxy.jsx elliptical math, respects `prefers-reduced-motion`
- Design system page: two-canvas depth compositing for pixel orbit — back-layer canvas (z-index 0) passes behind the "ar" letterforms; front-layer canvas (z-index 2) renders above them; `ds-hero-title__text` at z-index 1 acts as the letter mask
- Design system page: desktop sidebar collapse — hamburger menu now collapses/expands the 292 px sidebar column at all viewport widths; sidebar defaults open on desktop, closed on mobile; nav links keep sidebar open on desktop, close panel on mobile

### Changed
- Design system header: hamburger `☰` moved to the far-left of the brand group (left of the logo), always visible at all breakpoints; "Get in touch" CTA removed from the header
- Design system hero h1: "designedbyomar Design System" now renders as two lines — "designedbyomar" on line 1, "Design System" on line 2; pixel orbit is positioned at the right edge of line 1, threading visually through the "ar" letterforms
- Design system hero h1: font-size at tablet (≤1054 px) increased to `clamp(48px, 12vw, 128px)` so the title spans ~93% of the full-width content area when the sidebar is hidden
- Pixel orbit: field tilted −135° counter-clockwise (was −110°) for a more dramatic threading angle through the "ar" letterforms
- Pixel orbit: orbit container scaled up at smaller breakpoints — `1.5em × 1.5em` at tablet (≤1054 px) and `1.6em × 1.6em` at mobile (≤640 px), up from `1em × 1em`; larger size increases visual presence where the font is smallest
- Homepage: footer horizontal padding corrected to `var(--space-6)` (24 px) to match nav and section padding (was `var(--layout-1)` / 48 px)
- Homepage logo strip: animation speed normalized for mobile — `animation-duration: 28s` in the ≤820 px breakpoint (was 44 s regardless of viewport); added `transform: translateZ(0)` to `.logo-carousel` for iOS compositing stability

### Fixed
- Homepage Open Graph and Twitter descriptions now match the principal-product-designer identity in the canonical description.
- Static SEO coverage now protects the principal title across homepage metadata, JSON-LD, static H1, runtime source, route generation, and `llms.txt`.
- Static route generation now replaces the complete `#root` subtree when template markup contains nested divs, preventing stale or malformed generated HTML.
- Static SEO coverage now verifies case-study subtitles, client/year/role metadata, tags, and metrics in generated HTML.
- Privacy: GA4 on the 404 page is now gated behind analytics consent — `404.html` loaded `gtag.js` and configured two measurement IDs at parse time regardless of consent, so a visitor who declined analytics was still served Google's tag if they hit a 404. The page now mirrors the app's consent check inline before loading anything. No analytics data is lost: both configs already set `send_page_view: false` and nothing sent a manual page view, so the 404 page reported nothing to GA4 either way
- Build: H1 injection in `postbuild.js` now fails loudly if the expected `#root` element is missing, preventing silent SEO placeholder drift.
- Design system hero h1 on mobile: `overflow-wrap: break-word` prevents "designedbyomar" from clipping at narrow viewports
- Accessibility: Drawer dialogs now use valid `role="dialog"` host markup and stay hidden from assistive tech until open, clearing the PageSpeed agent accessibility failure while preserving focus management.
- SEO: `llms.txt` now uses linked Markdown discovery content for AI agents and has regression coverage in the static SEO test suite.

## [1.1.5] - 2026-05-12

### Added
- Portrait desktop affordance: "HOVER FOR HIGHLIGHTS" hint appears below the portrait on non-touch layout, pulses between 28–50% opacity, fades out permanently on first hover or keyboard focus
- Behance profile added to Contact section card, footer Social group, and JSON-LD `Person.sameAs` array

### Changed
- Portrait cursor corrected to `pointer` on desktop (was `default`; portrait is keyboard-focusable and interactive on all layouts)
- Portrait hints now respect `prefers-reduced-motion` — transition and pulse animation disabled when motion is reduced (both touch and desktop hints)
- Hero "Recent impact" line: removed `marginTop: -8` so spacing above and below the CTA button row is consistent
- Footer Design System link corrected from relative `design-system.html` to routed `/design-system`

## [1.1.4] - 2026-05-11

### Added
- Hero CTA row: Resume link surfaced as tertiary action alongside "View case studies" and "Say hello"; fires `resume_download` GA4 event
- Tertiary button variant added to design system demo — transparent background, `fg-secondary` text, `fg-primary` hover, no border; documented in Buttons section
- Portrait touch affordance: "TAP FOR HIGHLIGHTS" hint appears below the portrait on touch layout, fades out once stat cards are revealed

### Changed
- Hero copy flow: CTA buttons now come immediately after the tagline; "Recent impact" metric line demoted to footnote position below the CTA row
- Footer group labels ("Site Links", "Social") changed from `<span>` to `<h3>` — no visual change, now reachable via screen reader heading navigation

## [1.1.3] - 2026-05-11

### Fixed
- FAQ accordion uses `grid-template-rows` transition instead of `max-height` — eliminates per-frame layout recalculation during expand/collapse (both home page and design system demo)
- CaseCard cover images now include `loading="lazy"` to defer off-screen image loads
- Accent tag color uses `var(--color-white)` instead of hardcoded `'#fff'` on CaseCard and CaseStudyPage

### Changed
- Both drawers (About, Work) transition easing changed from `--easing-ease-out-bouncy` (overshoot, y=1.56) to `--easing-ease-out` — panels now feel grounded rather than playful
- Body copy containers constrained to `maxWidth: 640` (from 760) in About section, Work header, case study subtitle, and case study body — reduces line length from ~95–100ch to ~80ch
- Added `PRODUCT.md` — brand register, users, purpose, and design principles documentation

## [1.1.2] - 2026-05-09

### Fixed
- Sentry now consent-gated — `Sentry.init()` deferred until analytics accepted, matching the GA4 pattern
- Removed duplicate GA4 measurement ID `GT-T56BGFG`; single constant `GA_MEASUREMENT_ID` used throughout
- `postbuild.js` OG tag validation now throws instead of `console.warn`, failing the build loudly on missing tags
- `aria-live` region in `LogoLoader` uses visually-hidden CSS instead of `display:none` so screen readers can read it
- Focus restored to trigger element when `AboutDrawer` and `WorkDrawer` close (WCAG 2.1 focus management)
- Duplicate `<svg>` defs block (second `fact-icon-gradient` linearGradient) removed from `KeyFacts`
- React `key={i}` on static facts list changed to `key={f.label}` for stable identity

### Changed
- `--color-status-online: #22c55e` added as a CSS variable in `index.html`; `Dot` component references it via `var()` and `color-mix()` instead of hardcoded hex
- Vercel `/assets/(.*)` now served with `Cache-Control: public, max-age=31536000, immutable` for long-lived hashed asset caching
- Privacy policy updated to reflect Sentry consent-gating; date bumped to May 8, 2026

## [1.1.1] - 2026-05-06

### Fixed
- Footer social links (LinkedIn, GitHub, Substack) now fire named GA4 events instead of generic `click`
- At-a-glance section inline links (LinkedIn, Substack) now fire named GA4 events
- Theme toggle `aria-label` and `title` updated to `Switch to light/dark mode` — communicates the action and improves accessibility

### Changed
- FAQ section header block gets extra bottom padding on mobile (`var(--space-4)`) for more breathing room above the CTA button when stacked
- README and `docs/ai-workflow.md` updated to reflect full analytics stack (GA4 + Vercel Analytics + Speed Insights) and external code review tooling (CodeRabbit, Greptile)

## [1.1.0] - 2026-05-06

### Added
- **FAQ section** — collapsible accordion at the bottom of the page with 10 hiring-context Q&As; default view shows 6, "View all" reveals the rest; two-column layout on desktop, stacked on mobile
- **FAQPage JSON-LD structured data** — dynamically injected by `syncStructuredData()` for Google rich-result eligibility
- **Per-case-study OG images** — each case study now gets its own `og:image` rather than defaulting to the global PNG
- **Consent-gated analytics** — GA4 now loads lazily only after the user accepts via the cookie banner; users can accept or decline; preference persists in `localStorage`
- **Cookie banner decline action** — previously only accept was wired; decline now correctly prevents GA4 from loading
- `ChevronDown` icon added to the icon library

### Changed
- **SEO pipeline overhaul** (`postbuild.js`) — extracted `personSchema`, added `caseStudyStructuredData()`, `privacyStructuredData()`, `setMeta()`, `setStructuredData()` helpers; `og:image:width`/`og:image:height` stripped from case study pages where WebP dimensions differ from the home PNG
- **Structured data** — FAQPage moved out of hardcoded `index.html` into runtime injection, eliminating drift risk between the static file and `FAQ_ITEMS`; email format fixed (removed erroneous `mailto:` prefix from JSON-LD)
- **Touch targets** raised to 44×44 px minimum (WCAG 2.1): theme toggle, hamburger menu, nav logo, nav links, hero CTA, work CTA, FAQ CTA, mobile nav CTA
- **`prefers-reduced-motion`** — FAQ accordion transitions now disabled reactively (subscribes to `change` events) when the user has motion reduction enabled; consistent with the cookie banner and root app behavior
- **Copy refresh** — Hero, About, Work, FAQ, and logo carousel copy updated; logo band label spacing increased; redundant quantifiers removed from About copy
- **Privacy policy** updated to accurately describe consent-based GA4, Vercel Analytics, Vercel Speed Insights, and Sentry

### Fixed
- FAQ toggle was an `<a role="button">` — replaced with a native `<button>` element (WCAG 2.1 SC 2.1.1)
- Eager GA4 `<script async src="gtag/js">` removed from `index.html`; analytics no longer loads before consent
