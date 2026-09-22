# Changelog

All notable changes to designedbyomar.com are documented here.

## [Unreleased]

### Fixed
- Ask: the grounding context sent to the model was mostly unrelated. Only the nearest answer was chosen by relevance; the remaining slots came from the start of the approved array, so a question about payments compliance was grounded in the fintech answer plus design systems and AI work. Ranked properly now, and a question sharing no vocabulary at all returns the written fallback rather than asking a model to speak from an empty context
- Ask: a reply could reappear after the visitor had moved on. Choosing a suggested answer while a draft was still streaming cleared the panel but did not cancel the reader, so later chunks rebuilt it — and the superseded request then ran its own fallback, replacing the answer just chosen with "no written answer". Each interaction now claims the answer region, aborting the request in flight and discarding anything that arrives for an older one
- Ask: "does he know kubernetes" returned a confident answer about measuring design success. `kubernetes` is outside the corpus vocabulary, so the whole match rested on `know` — a word that appears once in the answer set and therefore scored highly while meaning nothing. No rarity threshold separates it from `prototype` or `remote`, which are equally rare and genuinely topical; the signal that does is the unknown word itself. A question is now refused unless more than half its content words are in the vocabulary. Found while fixing the two issues above
- Ask: three answers contradicted the site after the case-study rewrites. `cs-disney-uap` and `enterprise-experience` still said "four brands" and described ESPN as running its own ad-sales platform — the framing corrected in #73/#74, since ESPN *was* AdVisor and seven brands were brought onto it. `design-systems` still said three, not four, after the Wisdom system was counted in #72. Twelve answers in total were rewritten against the current case studies; eleven of the twelve substantive topics in the rewritten Connect API study appeared in none of the 44 answers beforehand. A retired-claims test now fails if any of these framings return
- Case studies: Connect API Payments had a sentence that stopped mid-thought. The "Shaping Future Transactions" section ended "...respecting and incorporating the collective vision of the company and potential clients I was able to produce" — no object, no period — followed immediately by `Key KPI's`, a heading rendering with no content beneath it. Both were live. Resolved by the rewrite below rather than patched: the four KPI sections are now prose, so the empty heading is gone structurally
- Case studies: the attributed PayGround quote did not match its source. The site read "support from the team at Plastiq"; Plastiq's own published customer story reads "support from team Plastiq". Two words added to a verbatim quote from a named person, now corrected to the source wording
- Case studies: Unified Ad Platform rewritten from the source deck — 491 to 751 words, five headings to eleven, four images to nine. The published summary said ESPN, Freeform, FX and National Geographic each had their own ad-sales platform, which contradicted the case study's own Goals section ("previously only available to ESPN"). ESPN *was* AdVisor; the work was bringing the other brands onto it without regressing the baseline ESPN ran on daily — a harder problem than the one the copy described. Adds the discovery method (mapping the decision flow rather than the screens), the six complexity factors, the six design principles, team scale, and outcomes split across product, system and process. New images include the workflow-mapping whiteboard and the current-state workflow map, the first real process artifacts on the site. Metric changed from "1→4 Brands consolidated" to "8 Brand perspectives aligned"; subtitle, `metaDescription` and `llms.txt` updated to match. Static HTML for this route now serves 1,049 words to non-JS consumers, up from 660
- Copy: career length corrected from "15+ years" to "10+ years" in the hero stat card and the About drawer summary, matching the resume. The published resume states 10+ years in both its title line and summary while the site claimed 15+, and the resume is linked from the hero — so a visitor could see both figures in one session. Same class of correction as the claims-accuracy pass in #60/#61. The career-wide "500+ interviews" stat is unchanged and remains scoped in its label
- Copy: the hero stat now reads "4 design systems", not 3. Omar built the Wisdom design system from scratch as founding designer alongside Management Portal, Reporting, Insurance Verification and Posting Assistant; it was missing from the count. A case study for it is on the roadmap
- `llms.txt`: Athena Design System 2.0 was described as an "enterprise healthcare design system". It was built at Plastiq, a payments company — corrected to "enterprise design system behind Plastiq's IPO-era brand". This file exists for AI crawlers, so the error was being served to exactly the consumers most likely to repeat it verbatim

### Changed
- FAQ: the accordion is gone and the section is now the Ask assistant. Its ten questions were folded into the answer set rather than dropped — four became new answers (what kind of designer he is, what companies suit him, what problems to bring him, what outcomes he has influenced) and six contributed aliases to answers that already existed, since duplicating them would have failed the alias-uniqueness rule. 44 answers to 48. Six suggested prompts now carry the section, up from four, covering the breadth the accordion used to show. Section copy, eyebrow and nav label change to Ask; the `#faq` anchor and section id are kept so existing links still land
- The homepage now serves all 48 answers as hidden markup for consumers that never run the bundle — crawlers, ATS scrapers, assistants reading the page. The accordion was client-rendered, so none of its text ever reached them; this is 4,658 words where there were none. It costs 10.4KB gzipped on the homepage (6.9KB to 17.3KB), which is the honest trade: the visible section shrank and the machine-readable one grew. Injected last in `postbuild.js`, because `index.html` is the template every other route is built from
- Removed the `FAQPage` structured data with the accordion. It was emitted client-side, and Google's current documentation limits FAQ rich results to "well-known, authoritative government and health websites" — a portfolio has not been eligible for some time. `WebSite` and `Person` are untouched
- Privacy policy: the Ask Box section said "Nothing you type is sent to a language model". That was true when it was written this morning and is no longer, so it is corrected rather than left to age. The copy now separates the two cases plainly — a matched question is answered in the browser and leaves nothing, an unmatched one is sent with excerpts of published answers to Groq, who are named as a processor — and says what is not done with it: not stored, not used to identify anyone, not used for training. Anyone who would rather send nothing is pointed at email
- Case studies: Connect API Payments rewritten from the Figma source files, Plastiq's own published material and the PayGround customer story — 693 to 3,001 words, 12 headings to 15, 7 images to 13. The previous copy was the site's clearest case of agency voice ("a meticulous design solution", "a labor of love", "a harmonious blend of collaboration, innovation, and user-centric design"), with six marketing headlines for headings and three paragraphs repeating the same point about collaborating with the PM. PCI was named in a section heading but never explained. Now covers what compliance actually constrained on screen (masked stored card data, the encryption notice placed at the card-block boundary, no separate "secure zone"), the six-step payer flow and why delivery method is asked before payment method, the two-layer token architecture that made white-labelling structural rather than a skin, the partner portal as a second product with its own user, the accounts-receivable onboarding and underwriting flow, and the wallet, Plaid, Freshbooks and internationalisation workstreams — named as design and discovery, not as shipped. Adds a research section — the interviews ran with prospective partners’ engineering and product teams and with Plastiq’s own sales, operations and compliance staff, not with payers, which is stated rather than glossed — and records what the Stripe Connect benchmark settled: the product competed on letting a partner outsource PCI scope and risk operations, not on feature breadth. The eight-week onboarding figure is reframed as a design target rather than a sales number, since the portal, sandbox, key lifecycle and inline docs exist to compress signed-to-live — the one headline metric design can properly claim. Adds a specification section carrying two redline artifacts from the source files — spacing called out per breakpoint with a mobile button block annotated as pinned, and a fee popover specified separately for desktop hover and mobile tap with its overlay colour and opacity recorded — the first process rather than output imagery on this case study. Also adds the beneficial-owner and recipient-classification fields as examples of compliance surfacing in the payer form, the fee shown as an itemised breakdown with an offsetting recipient subsidy rather than a single number, the card statement descriptor as dispute prevention, and the Billfire hosted registration link. The partner token layer is described at its real scope — opacity steps, three type roles, effects, gradients and strokes, not just colour and type. Image 08 replaced with a landscape composite of the payment step running inside a partner’s checkout, taken from a sibling frame whose panel fits its frame bounds — the frame first used held a panel 240px taller than the frame itself, so it rendered with a dead band beneath the checkout. The replacement is the empty state, which carries no placeholder data and shows the disabled Continue gate. Adds a thirteenth image: the Texas step, triggered only when the payer’s billing address is in Texas, which states the statutory reason for asking and lists the acceptable identification alternatives in the interface rather than leaving them to be guessed at Two new images from the source files: the payment-method modal over a partner checkout, and the expired-invitation state. `year` corrected from 2021 to 2021–22; `approach`, `outcome`, `metaDescription` and the `llms.txt` line updated to match. The three shipped metrics are unchanged
- Case studies: Unified Ad Platform second pass — 751 to 1,068 words, eleven headings to twelve. The rewrite in #73 worked from the Marp deck but missed two sources: the deck's separate presenter-notes file, and Omar's own copy from the previous version of the site. Adds the seven functions a single decision crossed (sales, traffic, promo, legal, operations, research, accounting), the named research methods, the full audit scope beyond the icon audit, mentoring of designers outside the two he led, the first-wave rollout scope, and pre-release adoption on the migrated brands. The ad-sales design system is now described as started with documentation and React components rather than only as groundwork for Adapt. Brand list in the overview aligned to the consolidation funnel image, legacy tooling named in prose, and DTCI expanded on first use. The orphaned icon-audit image moved from the patterns section into a new `What the audit covered` section where it belongs. Static HTML for this route now serves 1,366 words to non-JS consumers, up from 1,049

### Added
- Ask: a grounded LLM fallback for questions the written set does not cover. Reviewed answers still serve everything they can, in the browser, with no request leaving the site — that is the common path and it is unchanged. Only a miss reaches `/api/ask`, which passes the two or three nearest reviewed answers to Groq and asks for a reply drawn from those alone. Computed against the real answer set (mean 90 words), a drafted reply costs roughly 720–870 tokens, so Groq's free tier covers about 230–280 misses a day; tokens per day binds well before the 1,000-request cap. Exhausting it is not a failure — the endpoint returns the fallback the site already shipped
- Ask: drafted replies are labelled `Drafted, not reviewed` wherever they appear, carry a line saying they have not been through review, and show the published answers they were drawn from plus an email route. The distinction between a sentence Omar approved and a sentence a model wrote has to be legible on a hiring artifact
- Ask: six endpoint tests with the provider injected rather than module-mocked. The one that matters asserts a covered question calls no model at all; the rest pin that a missing key, a provider failure, a malformed body and a visitor exceeding six questions an hour all degrade to the written fallback instead of erroring. Three more Playwright cases cover the labelling and the degradation path
- Ask: switched on. All 44 answers are approved and live, so the panel now renders in the FAQ section. Before flipping them, every answer was checked mechanically against the 19,445-word corpus for claims absent from it — 43 came back clean, and the one flag (the availability answer offering fractional engagements, a commercial claim published nowhere on the site) was confirmed accurate by Omar before shipping
- Ask: five analytics events through the existing consent gate — `ask_suggested_click`, `ask_submit`, `ask_no_match`, `ask_citation_click`, `ask_contact_click`. Success is defined as citation and contact clicks rather than volume: heavy use with flat case-study views would mean the feature entertained people and lost them. Retires the three deferred `voice_chat_*` events, and the voice-clone roadmap rows with them — a cloned voice invites "is this really him" doubt on an artifact whose job is trust
- Privacy policy: a new `The Ask Box` section. It states that nothing typed is sent to a language model and no answer is generated on request, and discloses that a question with no written answer has its wording recorded in an analytics event so the missing answers can be written. Nothing is sent if analytics was declined, and the feature still works either way. The typed question is also named in the collected-information list. The original plan claimed no privacy change was needed because nothing left the browser; that stopped being true the moment the no-match event carried the question
- Ask: nine Playwright cases covering the behaviour that matters — the answer set is not fetched until the FAQ section is reached, a suggested prompt answers, a citation resolves to its real route, a typed question matches, an out-of-corpus question is refused with an email route, the answer region is `aria-live`, a declined visitor sends no `ask_*` event at all, a miss reports the question, and the privacy policy says so. Plus one asserting the design system documents the component
- Design system: an `Ask` entry under Components covering suggested prompts, the answer panel with citations, and the four rules that govern it — refuse rather than guess, approved answers only, off the critical path, and the accessibility contract
- Ask: an assistant in the FAQ section that answers questions from pre-written, hand-reviewed copy — no runtime model, no backend, no API key, no recurring cost. Matching is client-side IDF-weighted token overlap over each answer's question and aliases, so a rare term like "PCI" outweighs "what"; below threshold it refuses rather than guesses, offering the nearest published case study and email instead. Suggested prompts bypass matching entirely. The answer file is fetched when the FAQ section scrolls into view rather than imported into the bundle, so it never touches LCP, and `postbuild.js` writes a filtered copy containing only `status: "approved"` entries — draft text cannot reach production even by accident. Built inside the existing FAQ component with existing tokens; no new visual language
- Ask: a staleness guard. Each answer stores a fingerprint of the claim-bearing fields of the case studies it cites, and an approved answer whose sources have changed fails the content tests. Only approved answers ship, so a case-study edit makes the affected answer's approval lapse and drops it from the build instead of leaving it contradicting the site. This closes a real gap: the previous tests checked that a cited id *resolved*, not that the answer still described it
- Ask: matcher tests covering routing for distinctive terms, exact alias hits, and refusal of out-of-corpus questions — a wrong match is worse than no match, because it answers confidently off-topic
- Docs: a `Releases` section in `README.md` and a `Cutting A Release` procedure in the deployment runbook. Versions are recorded in `VERSION`, `package.json`, and the changelog heading, and all three have to agree — they drifted four patches apart between May and September 2026 because nothing read `VERSION` and no procedure existed. Covers semver choice, the verify-before-commit gate, tagging, and publishing a GitHub release

## [1.2.0] - 2026-09-16

### Fixed
- `package.json` version synced to `1.1.5`, matching the `VERSION` file. It had been left at `1.1.1` since the 1.1.2 release, so the published package metadata understated the shipped version by four patches
- Docs: CI description corrected in `README.md`, `docs/ai-workflow.md`, and `DEPLOYMENT_RUNBOOK.md`. All three described CI as `npm ci` → Chromium → `npm test`, omitting the `npm audit --audit-level=high` and `npm run lint` steps that have gated every build since the ESLint flat config landed. The pipeline was stronger than its own documentation claimed

### Added
- Contact: a booking card now leads the contact grid, linking to a 20-minute intro call. Closes audit finding F-14 without adding a form — the site is static with an enforcing CSP, so a hosted form service would be blocked and would need a new processor named in the privacy policy, while a scheduler is a plain outbound link. Also listed in `llms.txt` so an assistant asked how to reach Omar can offer both routes
- Case studies: `gallery` block type renders a run of related images as a responsive row — three columns on desktop, two on tablet, stacked on mobile. Used for the three live-broadcast photos closing Critical Communication Tool, which illustrate the sentence naming the NBA Finals, Presidential Debate and Emmys rather than sitting stacked below it
- Case studies: Critical Communication Tool body restored from the Webflow archive — 3,793 words and 27 images, the deepest case study on the site. Covers the interviews and affinity mapping, journey maps, MoSCoW prioritisation, two scrapped and rebuilt versions of the subscription manager, the responsive breakpoint specifications, skeleton loading states and usability findings, with all three user quotes attributed
- Case studies: Plastiq Marketing Site body restored from the Webflow archive — 1,540 words and 11 images spanning the wireframes and module library, creative strategy, the colour and type systems, brand logo lockups, competitive analysis and the launched site
- Case studies: Unified Ad Platform body restored from the Webflow archive — 491 words and 4 images covering the fragmented per-brand ad platforms, the AdVisor icon audit, the consolidation funnel and the proposal view
- Case studies: Athena Design System 2.0 body restored from the Webflow archive — 982 words and 9 images covering the device and resolution research, annotated inconsistencies, layout anatomy, the pitch deck, the governance model, the colour system, the Connect payment widget and feedback indicators. Five source captions preserved verbatim
- Case studies: Page Builder 2.0 body restored from the Webflow archive — 693 words and 5 screenshots covering the style system, the previous builder's limits, real customer pages in the new editor, input field configuration and named colour styles, with the KPI section intact
- Case studies: Connect API Payments body restored from the Webflow archive — 693 words, 7 screenshots with written alt text and captions, and the PayGround customer quote with attribution. Covers the Nearside white-label flows, card payment method, review and confirm, the Connect Teal token documentation, the partner portal, the V2 concept and the mobile portal
- Case studies: Posting Assistant body restored from the Webflow archive — 563 words, the posting-journey blueprint, the assistive review screen, file intake with Open Dental posting, and claim-level check detail, each with written alt text and a caption tying it to the argument (the source had no captions)
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
- Content: Critical Communication Tool review fixes — dropped a 112-word paragraph the Webflow source repeated verbatim either side of the interview-notes image, corrected the second image from `affinity mapping` to the initial journey map its own caption describes, and corrected the thirteenth image from `popover` to `modal`, which is what the screenshot shows and what the prose says was chosen
- Case studies: Page Builder 2.0 no longer renders an empty `Results` section. Its source nests Key Performance Indicators beneath Results, but the heading map put both at `h2`, so a heading was followed straight by a sibling heading with nothing in between — a dead entry for anyone navigating by headings. KPIs is now `h3` with its four measures at `h4`
- Content: Posting Assistant cover re-exported with real posting notes, clearing the placeholder `Lorem ipsum` text that shipped in the case-study cover and in its `ogImage`, so it also appeared in every LinkedIn, Slack and iMessage link preview for that page (audit finding F-05). The duplicate body image showing the same review screen was removed rather than re-exported — the cover already carries that screen
- Case studies: block model is now normalized by one shared module used by both renderers. The React renderer called `b.items.map()` directly and interpolated `b.level` straight into a tag name, while `postbuild.js` coerced missing items to an empty list and clamped invalid heading levels — so a malformed block was silently dropped from the static HTML, kept the build and its tests green, and then crashed the client
- Privacy: case-study editorial notes no longer ship to the public. `src/content/case-studies.json` is bundled into the client JS, and `src/case-studies.js` spread every field into the published objects, so internal notes were downloadable in `dist/assets/main-*.js`. Notes moved to the gitignored roadmap, and the client module now filters through an explicit `PUBLIC_FIELDS` allowlist so a future internal field cannot leak by default
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
- Design system: the page header now mirrors the site header — Work, Design System, About, FAQ, Contact, the theme toggle and Get in touch — with the sidebar open/close control kept to the left of the logo. The "Back to site" link is gone, since every nav item returns to the site. Below 1054px, where the header nav hides, the hamburger panel carries the site links too, matching how the homepage mobile menu behaves
- Navigation: the homepage mobile menu trigger moved from the right of the header to the left of the logo, matching where the design-system page has always put its sidebar control. Both mobile headers now open from the same corner
- Copy accuracy: projected Management Portal outcomes no longer read as achieved ones. The homepage ticker swaps the projected "3x growth" for shipped "1,600+ enterprise users"; the FAQ recasts the spreadsheet and office-scale figures as design intent and surfaces the LLM-plus-rules watchlist decision behind them; the outcomes list drops "200+ spreadsheets replaced"; the case-study card and stat labels move from "replacing"/"replaced"/"supported" to "built to retire"/"to retire"/"designed for"; and the homepage interview stat is scoped career-wide
- Copy: interview counts are now explicitly scoped — the FAQ reads "200+ interviews and discovery sessions across Wisdom products" and Posting Assistant reads "40+ user interviews for Posting Assistant", so the two figures no longer read as contradicting each other when quoted apart
- Work index: the two leading case studies now sit in a featured tier, side by side, with the remaining six in the grid below. Making `/work` a real index had flattened every card to equal weight, so the flagship rendered at 373 px on the page most likely to be sent to a hiring manager, against 1200 px on the homepage
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
