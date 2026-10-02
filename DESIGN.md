# Design System Guide

This file is the agent-readable entrypoint for visual and interaction work on `designedbyomar`. It explains how to approach design changes without duplicating the full token catalog or implementation details.

For exact values, rendered examples, and component behavior, inspect:

- `src/design-system.jsx` for the implementation reference page and current token usage.
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

The homepage hero, About page arrangement, and individual case-study compositions remain page-specific because they express editorial hierarchy and project-specific storytelling. They assemble shared navigation, controls, cards, body blocks, media, and footer. Documentation navigation, token cards, shortcut cards, and the demonstration accordion are explicitly documentation utilities. See the reference-page coverage inventory for component-to-specimen links and callback contracts.

Existing exact dimensions that do not fit the scale use semantic tokens in `src/design-tokens.css`, including fluid About/body typography, control hit areas, content widths, component layering, and Ask response height. SVG geometry, image dimensions, aspect ratios, and calculated animation geometry remain implementation data.

## Portrait delivery

The portrait image occupies 88% of its square wrapper. Below 639px its slot is `0.88 × (viewport − 48px)`; through 820px it is capped at 519.2px. Above 820px the hero's second grid column gives `0.88 × (viewport − 96px) / 2.1`, capped at approximately 482.743px when the content reaches 1200px. The intrinsic transparent artwork stays contained within that slot. `src/portrait-media.mjs` specifies matching responsive candidates and sizes; regression assertions keep the homepage-only head preload in sync. Light candidates stop at the original 557px width; dark candidates stop at 1230px.
