# Changelog

All notable changes to designedbyomar.com are documented here.

## [1.1.0.0] - 2026-05-06

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
