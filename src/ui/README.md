# Shared presentation contracts

Both app entries import these modules. `main.jsx` contains production adapters;
`design-system-specimens.jsx` supplies labelled fixtures and local callbacks.
Presentation never owns routing orchestration, consent persistence, analytics,
Ask model requests, or GitHub requests.

| Component | Contract and variants | Reference section |
| --- | --- | --- |
| Button / LinkButton | `variant`, children, native attributes and callbacks. Primary, secondary and quiet are standard visual treatments; navigation, icon, photo, consent, Ask, contact-copy, text and portfolio preserve existing contextual styles. Links require a destination; icon-only actions require an accessible label. | `#buttons` |
| IconButton | Icon, required label, native button attributes and callbacks. Standard circular visual treatment; unstyled permits an existing contextual treatment. | `#buttons` |
| CopyButton / CopyControl | CopyButton accepts value and label, with confirmed success after clipboard completion and a legacy fallback. Controlled CopyControl accepts copied state and callback. Production ContactCard disables the fallback to preserve its clipboard policy. Failures never show success. | `#buttons`, `#cards-accordions` |
| NavLogo / ThemeToggle | Logo destination, click callback and optional layout style; toggle current theme and setTheme callback. | `#navigation-drawers` |
| SiteNavigation | Controlled menu/theme/scroll state, logo/menu/close callbacks, section-handler factory and event callback. Desktop and mobile variants share labels and destinations. App adapter handles Escape, routing and analytics. | `#navigation-drawers` |
| ContactCard | Label, value, destination, optional copy value and event names; `onEvent` receives link or successful-copy event and payload. Full-card link and copy button remain sibling keyboard targets. | `#cards-accordions` |
| SiteFooter | Home/logo/section callbacks, optional root prefix for cross-page fragment links, event callback. Responsive three/two/one-column layout. | `#footer-system` |
| ConsentBanner | Accept/decline/privacy callbacks, controlled visibility, narrow-layout and reduced-motion flags. Embedded variant is used only for specimens. | `#cookie-banner` |
| CaseCard | Study record, featured/wide-media variants, optional video enablement. Media scheduling is local UI behavior; specimens disable video. | `#case-study-covers` |
| CaseStudyMetadata / CaseStudyTag / CaseStudyBody | Authored content; metadata role variant and optional style; normalized body blocks, accent and optional heading-ID prefix. Renderer supports headings, paragraphs, lists, images, galleries, quotes and callouts. | `#case-study-blocks` |
| AskPanel | Controlled query, submit eligibility, result, link-copy state, lookup/draft phase, drafted/missed states and suggestions; setters, submit/show/copy callbacks, focus refs, studies and event callback. Optional ID prefix isolates specimen anchors. Controller retains cancellation, history, matching and requests. | `#ask` |
| GitHubActivity | Loading/ready/error state, contribution data, profile destination and optional profile callback. Controller retains fetch and tracking. | `#github-activity` |
| AboutTile / AboutStack / AboutLightbox | Photo records with alt text and dimensions; open/close callbacks, optional eager loading/parallax. Stacks flatten below 640px. Lightbox traps Tab, closes with Escape/backdrop and restores opening focus. Reduced motion disables photo transitions; page adapter owns scroll choreography. | `#about-media` |

The hero, About editorial arrangement and individual case-study layouts remain
page-specific compositions. Documentation shell/navigation, token swatches,
DocCard, SectionHeader, shortcut cards, accordion and composition sketches are
reference utilities, explicitly separate from production specimens.
