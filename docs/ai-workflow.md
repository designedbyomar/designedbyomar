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
| CodeRabbit / Greptile | External PR review passes for code quality, repo-specific risks, and missed regressions |
| Sharp | Image optimization (`scripts/optimize-image.mjs`) |
| Ask rundown | Local authoring aid (`scripts/ask-rundown.mjs`, `npm run ask:rundown`) — ranks visitor questions with no written answer, from the GA4 events the site already sends, so recurring gaps get written up as reviewed answers |
| Google Analytics 4 / Vercel Analytics / Speed Insights / Sentry | Production feedback — what real users hit, what's useful, what's slow, what errors fire |

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
| **Build / postbuild** | Wrote the regex-driven [`postbuild.js`](../postbuild.js) static-route generator and helped unify case-study content around [`src/content/case-studies.json`](../src/content/case-studies.json) | Verified each output URL renders with correct meta in production |
| **Refactors** | Performed mechanical transforms | Reviewed diffs, kept changes small and reversible |

---

## How I keep quality up

1. **Small PRs, scoped commits.** Recent history (gradient tokens, typography migration, spacing migration, hero copy refresh) is split across many small commits so each change is reviewable. Branches use explicit prefixes (`fix/...`, `feature/...`, `content/...`, `design/...`, `chore/...`) so the intent is clear before review.
2. **Token migrations done in phases.** Typography → motion → spacing → gradient — each phase is its own PR so I can verify visual diffs incrementally instead of one monster refactor.
3. **Visual review on every diff.** Every UI-affecting PR is checked against the live site before merge. No "looks right in code" merges.
4. **External review passes.** CodeRabbit and Greptile review PRs for issues I may have missed, while human review still owns taste, scope, and final judgment.
5. **Production telemetry.** GA4 and Vercel Analytics show which pages and interactions are useful. Speed Insights flags real-user performance regressions before they show up in Lighthouse. Sentry catches what made it through.
6. **Postbuild SEO verification.** After each build, `dist/work/*/index.html` is spot-checked to confirm canonical, OG, and JSON-LD are correctly templated per case study.
7. **Reduced-motion + responsive checks.** The canvas / motion components honor `prefers-reduced-motion`; layout is reviewed at mobile, tablet, layout, and desktop breakpoints (see `LAYOUT` constants in [`src/constants.js`](../src/constants.js)).
8. **Ask answers written from real gaps.** `npm run ask:rundown` pulls the `ask_no_match` questions GA4 already records and ranks the ones with no written answer, so the reviewed set grows toward what visitors actually ask — and every answer written this way is one fewer a model has to draft. Requires one-time GA4 setup (event-scoped custom dimensions for the `question`, `reason`, `nearest_id` and `answered_by` params, a read-only service account, and the numeric property id). Run it with:

   ```sh
   GA4_PROPERTY_ID=348007935 \
   GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/your-service-account-key.json \
   npm run ask:rundown -- --days 30
   ```

   The property id above is this site's; the key path is your own local file, which must stay out of git. Custom dimensions only populate from the moment they are registered, so early runs are sparse. See the script header for flags and caveats.

### Automatic commit and PR handoff

After completing and validating a requested change, the AI assistant should finish the Git workflow without waiting for a separate prompt:

1. Review the diff and stage only files that belong to the current task. Preserve unrelated user changes and never commit secrets, generated builds, ignored files, or local tooling state.
2. Create a small, descriptive commit on a short-lived branch. If work started on `main` or on a branch whose pull request is already merged or closed, create a fresh branch from current `origin/main` first.
3. Push the branch and check GitHub for an open pull request from that branch.
4. If an open pull request exists, update it with the new commit. If none exists, create one targeting `main` with a concise summary and verification notes.

The requester can explicitly opt out when they want changes left uncommitted or do not want a pull request created.

---

## What I deliberately did not do

- **No broad unit suite yet.** A portfolio site with static case studies and route-specific metadata earns more from regression checks than component-level unit tests right now. `npm test` runs the production build, generated SEO/static assertions, and Chromium Playwright checks over the built preview.
- **Focused CI.** `.github/workflows/ci.yml` runs `npm ci`, audits dependencies (`npm audit --audit-level=high`), lints with zero tolerance for warnings (`npm run lint`), installs Chromium for Playwright, and runs `npm test` on every PR and push to main. Lighthouse CI is the obvious next add.
- **Incremental extraction only where it removes drift.** The app is still a content-heavy SPA, but shared case-study content, route helpers/constants, and design-system documentation primitives have been pulled into focused modules where that makes metadata, tests, and future edits easier to reason about.

---

## What this repo is meant to prove

That a senior product designer can:

1. Ship a real, fast, accessible production site without an engineering hand-holder.
2. Use AI tools to compress the boring parts of the loop without outsourcing taste, brand, or judgment.
3. Reason about the boundaries — security headers, SEO, error monitoring, build hygiene, deploy targets — that separate "designer who codes" from "designer who actually ships."

If that's what you need on a team, [let's talk](mailto:omar@designedbyomar.com).
