# Changelog

All notable changes to designedbyomar.com are documented here.

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
