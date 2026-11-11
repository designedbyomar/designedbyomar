# Design System Guide

This file is the agent-readable entrypoint for visual and interaction work on `designedbyomar`. It explains how to approach design changes without duplicating the full token catalog or implementation details.

For exact values, rendered examples, and component behavior, inspect:

- `src/design-system.jsx` for the implementation reference page and current token usage.
- `src/content/design-system.mjs` for the section registry shared by the page, its navigation, and static summary.
- `src/design-system-foundations.jsx` and `src/design-system-navigation.jsx` for token references and documentation navigation.
- `/design-system` for the public design-system reference, generated from `design-system.html`.
- `src/design-tokens.css` for the shared token source used by the portfolio and design-system entries.
- `src/main.jsx` for how the design language is applied across the portfolio.

## Purpose

The site is a public portfolio and hiring artifact for Omar Tavarez. The visual system should make the work feel senior, editorial, precise, and production-ready. It should support clarity and trust before novelty.

Design changes should preserve:

- restrained editorial polish
- strong hierarchy and legibility
- accessible contrast and focus states
- responsive layouts that hold up on mobile, tablet, and desktop
- performance-conscious motion and media
- human, specific content presentation

## Principles

- Use the existing visual language before inventing a new pattern.
- Prefer existing CSS variables, token names, spacing rhythms, and type scale.
- Keep composition calm and intentional; avoid generic SaaS dashboard styling unless the pattern already exists in the product surface.
- Treat animation as support for orientation, not decoration.
- Respect `prefers-reduced-motion` for canvas, motion, animation, and scroll behavior.
- Make interactive states visible and accessible: hover, focus-visible, active, disabled, and loading where relevant.
- Keep text readable and contained at all supported viewport sizes.

## Visual Change Rules

Before making visual, token, typography, spacing, motion, icon, or theme changes:

1. Read this file.
2. Inspect `src/design-system.jsx`.
3. Check the affected implementation in `src/main.jsx` or the relevant component file.
4. Reuse existing tokens and patterns where possible.
5. Verify mobile, tablet, and desktop impact.

Do not copy the token catalog into this file. If a token value, component example, or behavior changes, the source should stay in code so docs do not drift.

## Assets

- Production assets belong in `public/`.
- Images should be optimized before use with `scripts/optimize-image.mjs`.
- Raw/private working files should stay outside git or in ignored `source-assets/`.
- Avoid adding unused icons, duplicate image files, generated builds, or local tooling state.

Use real product, work, or portfolio-relevant imagery when imagery is needed. Avoid generic stock-like visuals that weaken the site as a hiring artifact.

## Motion And Performance

- Prefer cheap properties such as `transform` and `opacity`.
- Avoid motion that blocks comprehension or creates layout shift.
- Keep canvas and interactive effects performance-conscious.
- Test reduced-motion behavior when changing animation or scroll-driven interactions.

## Review Expectations

For design-facing work, review the result as an experience, not only as code:

- Does the change still feel like the existing portfolio?
- Does it preserve hierarchy and readability?
- Does it work across mobile, tablet, and desktop?
- Does it preserve accessibility and reduced-motion behavior?
- Does it avoid adding visual clutter or unneeded dependencies?

## Shared production components

`src/ui/` contains the presentation modules imported by both application entries. `src/design-system-specimens.jsx` renders these components with labelled, deterministic fixtures. The reference entry never imports `main.jsx`. Production adapters retain routing, analytics, consent storage, and Ask/GitHub requests; presentation modules receive content, state, and callbacks.

Navigation uses standalone `/work` and `/about` pages. Its mobile menu closes on Escape and on selection. Contact links and copy buttons are sibling controls; copying reports success only after the clipboard operation succeeds. Icon buttons require accessible labels. Ask distinguishes reviewed answers, model drafts, loading, and unavailable states.

About tiles and stacks share their layout and open callback. The lightbox uses Escape, a focus trap, and restores focus to the opening tile. Stacks respond to viewport width; reduced-motion preference disables their motion. Page controllers retain scroll choreography.

The homepage hero, About page arrangement, and individual case-study compositions remain page-specific because they express editorial hierarchy and project-specific storytelling. They assemble shared navigation, controls, cards, body blocks, media, and footer. Documentation navigation, token cards, shortcut cards are explicitly documentation utilities. See the reference-page coverage inventory for component-to-specimen links and callback contracts.

Existing exact dimensions that do not fit the scale use semantic tokens in `src/design-tokens.css`, including fluid About/body typography, control hit areas, content widths, component layering, and Ask response height. SVG geometry, image dimensions, aspect ratios, and calculated animation geometry remain implementation data.

## Portrait delivery

The portrait image occupies 88% of its square wrapper. Below 639px its slot is `0.88 × (viewport − 48px)`; through 820px it is capped at 519.2px. Above 820px the hero's second grid column gives `0.88 × (viewport − 96px) / 2.1`, capped at approximately 482.743px when the content reaches 1200px. The intrinsic transparent artwork stays contained within that slot. `src/portrait-media.mjs` specifies matching responsive candidates and sizes; regression assertions keep the homepage-only head preload in sync. Light candidates stop at the original 557px width; dark candidates stop at 1230px.

## Select-only dropdowns

`SelectField` is the shared controlled dropdown used by production inquiry fields and their reference specimens. It accepts an ID with an associated `<id>-label`, name, value, option strings, placeholder, required/disabled state, error associations, and a value callback. It owns popup visibility and active-option navigation only. Arrow keys, Home/End, and typeahead navigate; Enter/Space select; Escape cancels; Tab commits and continues navigation. Outside dismissal leaves the previous value intact. The popup fits above or below the trigger and scrolls its active option into view without moving the page. Menus and chevrons use theme and spacing tokens and introduce no motion or service requests. Placeholders supplement permanent labels; essential format hints remain visible.

## Service lists

`ServiceRateCard` and `ServiceRateGroup` render full-strength category-gradient headers with solid contrast-tested titles, regular-weight translucent category badges, 32px prices, DS-green inclusion checks, timing, inclusion checklists, and visible best-fit and scope details. Fixed and starting prices use the same treatment. Three desktop columns become two below 1054px and one below 640px. Ongoing support has stacked Fractional Design and Website Support subsections with two cards occupying the first two tracks of the same responsive grid, matching card widths across categories. Shared grid tracks align headers, pricing dividers, and description starts within each row. Dividers reuse the category gradient. The services page aligns with the homepage’s 1200px content width. Optional inquiry callbacks stay in production adapters, which select a service and focus contact without losing other form fields. The content also feeds static HTML; reference specimens use labelled fixtures and local actions. `/design-system#service-gradients` documents the three reusable gradients and accessible header treatment.

## Disclosure

`Disclosure` is shared by engagement terms and the design-system reference. It accepts heading, children, heading level, optional ID, and defaultExpanded. Its button exposes expanded state and controls a labelled region; collapsed content is hidden from navigation and accessibility. Engagement terms open by default and use two columns above 640px. Its pricing-page heading uses the same responsive section-heading token as the service categories. The terms and contact sections use spacing without horizontal separators; contact is centered at its existing 720px maximum width. Toggling introduces no motion.

## Inquiry form

The inquiry form is an elevated card (`--shadow-card-full`, `--radius-xl`) with a `--gradient-inquiry-form` top edge, a full-width submit button, and a privacy link that opens in a new tab with an accessible hint.

## Ask recovery and contact hierarchy

Ask keeps the full question editable and validates the shared 400-character limit before submission. Initial loading, failed downloads, unavailable replies, unsupported questions, and usage limits have distinct states. Manual retries preserve input; suggested questions and direct email remain available. Only reviewed answers are shareable. Analytics contain catalogue IDs and outcome categories, never question text. The design-system specimens demonstrate loading and recovery locally.

Contact places booking, email, resume, and profile links in one responsive grid with equal-width cards and consistent gaps: three columns on wide screens, two on tablet, and one on mobile. All controls retain their existing tokens and analytics events.

## Reference organization

`src/content/design-system.mjs` defines the ordered groups, anchors, labels, summaries, and renderer keys for the single-page reference. The sidebar, page, shortcuts, and generated group summaries follow that registry. Preserve existing anchors when moving or renaming material; `quick-links` remains an overview utility rather than a separate navigation destination.

Foundations explain the visual language; Components demonstrate individual building blocks; Patterns show their assembled behavior. Badges, fields, dropdowns, disclosures, and contact cards have dedicated destinations. Service specimens appear once. Technical usage notes and the complete token reference use default-collapsed disclosures. Token values are read from the shared CSS source, with current-theme overrides, rather than maintained as a duplicate literal catalogue.

The reference has one responsive section-navigation instance. Its active link exposes `aria-current="location"`; section selection focuses the destination heading. On narrow screens Escape restores trigger focus, outside interaction dismisses the nonmodal menu, and hidden links leave the Tab order. Group expansion remains independently controllable. Anchor navigation is immediate and reduced motion also disables CSS smooth scrolling.

Component examples use local fixtures for validation, disabled fields, verification unavailability, Ask recovery, and GitHub loading. They never send inquiries or modify analytics consent. Component usage notes belong beneath examples; backend endpoint documentation remains in the repository.

Documentation cards, example frames, token swatches, and usage disclosures share the image-radius token and a complete border inside their bounds. Avoid outer shadow rings for these containers: the reference column clips horizontal overflow. Radius and elevation examples use consistent two-column outer cards (one column on mobile), with each actual token treatment demonstrated on an inset sample. Production specimens retain their own component styling.
