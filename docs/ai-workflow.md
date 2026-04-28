# AI-Assisted Build Workflow

This document explains how AI-assisted tools are used in this repo. It exists because "this site was built with AI" is meaningless on its own — the interesting question is **what the human did, what the model did, and how quality was controlled**.

The point of this artifact is to be honest about that boundary.

---

## Tools in the loop

| Tool | Used for |
|---|---|
| ChatGPT | Strategy framing, copy direction, case-study messaging, repo critique |
| Claude / Codex / similar | Implementation assistance — component scaffolding, refactors, regex transforms, postbuild route generation |
| Figma | Source of truth for visual design, component specs, and design tokens before they land in code |
| Sharp + Swift Core Graphics | Deterministic image and OG-card generation (`scripts/optimize-image.mjs`, `scripts/generate-social-images.swift`) |
| Vercel Analytics / Speed Insights / Sentry | Production feedback — what real users hit, what's slow, what errors fire |

---

## What AI generated vs. what I decided

| Layer | AI's role | My role |
|---|---|---|
| **Strategy / positioning** | Surfaced framing options, stress-tested phrasing | Picked the messaging, the audience, and what to omit |
| **Visual design** | None — design happens in Figma first | All visual decisions: hierarchy, type scale, motion, brand voice |
| **Tokens** | Suggested naming and migration patterns | Defined the actual values; reviewed every token rename in PRs (see `Phase 5/6` migration commits) |
| **Components** | Scaffolded initial component shells from prose specs | Reviewed structure, kept behavior idiomatic, kept inline styles consistent with token system |
| **Content / case studies** | Drafted candidate copy from raw notes | Edited every line; cut anything that read AI-flavored |
| **SEO / structured data** | Generated schema scaffolds (JSON-LD, OG, Twitter) | Verified every field against real site state and canonical URLs |
| **Build / postbuild** | Wrote the regex-driven [`postbuild.js`](../postbuild.js) static-route generator | Verified each output URL renders with correct meta in production |
| **Refactors** | Performed mechanical transforms | Reviewed diffs, kept changes small and reversible |

---

## How I keep quality up

1. **Small PRs, scoped commits.** Recent history (gradient tokens, typography migration, spacing migration, hero copy refresh) is split across many small commits so each change is reviewable.
2. **Token migrations done in phases.** Typography → motion → spacing → gradient — each phase is its own PR so I can verify visual diffs incrementally instead of one monster refactor.
3. **Visual review on every diff.** Every UI-affecting PR is checked against the live site before merge. No "looks right in code" merges.
4. **Production telemetry.** Sentry catches what made it through. Speed Insights flags performance regressions before they show up in Lighthouse.
5. **Postbuild SEO verification.** After each build, `dist/work/*/index.html` is spot-checked to confirm canonical, OG, and JSON-LD are correctly templated per case study.
6. **Reduced-motion + responsive checks.** The canvas / motion components honor `prefers-reduced-motion`; layout is reviewed at mobile, tablet, layout, and desktop breakpoints (see `LAYOUT` constants in [`src/constants.js`](../src/constants.js)).

---

## What I deliberately did not do

- **No automated test suite yet.** A portfolio site with eight static case studies and one design-system reference page does not earn its keep with unit tests. `npm test` runs the production build as a smoke test, which catches the failures that actually matter for this surface (broken imports, broken postbuild templates, type errors). When the surface area justifies it, I'll add Playwright over the built `dist/`.
- **No CI yet.** Planned. Will run `npm ci && npm run build` on PR + main. Lighthouse CI is the obvious next add.
- **No premature splitting of `main.jsx`.** The file is large because the site is a single, content-heavy SPA. Splitting it into 20 micro-components before the token migration finishes would create merge conflicts with in-flight work without making anything more correct. The split happens after the token migration lands.

---

## What this repo is meant to prove

That a senior product designer can:

1. Ship a real, fast, accessible production site without an engineering hand-holder.
2. Use AI tools to compress the boring parts of the loop without outsourcing taste, brand, or judgment.
3. Reason about the boundaries — security headers, SEO, error monitoring, build hygiene, deploy targets — that separate "designer who codes" from "designer who actually ships."

If that's what you need on a team, [let's talk](mailto:omar@designedbyomar.com).
