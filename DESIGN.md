# Design System Guide

This file is the agent-readable entrypoint for visual and interaction work on `designedbyomar`. It explains how to approach design changes without duplicating the full token catalog or implementation details.

For exact values, rendered examples, and component behavior, inspect:

- `src/design-system.jsx` for the implementation reference page and current token usage.
- `design-system.html` for the built design-system entry.
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
