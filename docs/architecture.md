# Architecture

How the Copper State Labs app fits together. Each module adds a section at the
end (see [Adding a module](#adding-a-module)) when it changes how the app
works: new pages, tables or AI calls.

_Fictional — for educational use._

## The starter app (Module 0)

A Next.js app that builds, runs and deploys with **no environment variables**.
Supabase and the AI gateway are optional until a module needs them.

| Piece | Where | What it does |
|---|---|---|
| Pages | `app/` | `layout.tsx` sets the fonts and theme; `page.tsx` is the placeholder home page |
| Brand components | `components/copper/` | `Logo`, `SiteHeader`, `SiteFooter`, `ModeToggle` |
| UI kit | `components/ui/` (shadcn), `components/ai-elements/` (AI Elements) | The only UI libraries the app uses |
| Setup card | `components/setup-required.tsx` | `<SetupRequired service="supabase" \| "ai" />`, shown instead of a page whose service isn't configured |
| Company catalog | `lib/copper/catalog.ts`, `lib/copper/data/catalog.json` | Product, plan and privacy facts from the Product Bible (Sections 3, 4, 8 and 10). Pages read prices and plan details from here instead of typing them (added in the Module 1 starter) |
| Database helpers | `lib/supabase/` | `createClient()` for the server and the browser; returns `null` when Supabase isn't set up |
| AI wrapper | `lib/ai/call.ts` | `callText` and `callObject`: every model call goes through these and is logged to `ai_calls` |
| Models and prices | `lib/ai/models.ts`, `lib/ai/pricing.ts` | The approved models (Claude Haiku, Sonnet, Opus through the Vercel AI Gateway) and their token prices |
| Database | `supabase/migrations/`, `supabase/seed.sql` | Company tables from the Product Bible (Section 10) plus `ai_calls` |
| Module checks | `specs/module-N/`, `scripts/check.mjs` | Each module's spec, instructions, rubric and acceptance tests; `npm run check` runs them |

## Data flow

1. A user opens a page in `app/`.
2. Server code checks what's configured (`isSupabaseConfigured()`,
   `isAiConfigured()`). If something is missing, the page renders
   `<SetupRequired />` instead of crashing.
3. Data comes from Supabase through `lib/supabase/server.ts`.
4. AI requests go through `callText` / `callObject` in `lib/ai/call.ts`, which
   calls the model through the AI Gateway and then writes one row to `ai_calls`:
   `module`, `feature`, `model`, tokens, `cost_usd`, `latency_ms`, `ok`. Without
   Supabase, the row is logged to the console instead.

```ts
const { text } = await callText(
  { module: 2, feature: "review-radar" },
  { prompt },
);
```

## Two kinds of "AI tiers"

Don't mix these up:

- **Copper State Labs' product tiers** (On-device, Raw Ore, Refined, the
  Copper Cloud) are part of the fictional company. They are facts in the
  [Product Bible](copper-state-labs/product-bible.md) and rows in the `ai_tiers`
  table.
- **The models this app calls** are real Claude models listed in
  `lib/ai/models.ts`. Their cost is logged in `ai_calls`.

## Decisions

- **No environment variables required.** Every service is optional, so a fresh
  clone builds and deploys before any accounts are set up.
- **One AI wrapper.** Routing every call through `lib/ai/call.ts` gives one
  place to log cost and latency per module and feature.
- **No authentication or row-level security yet.** They arrive in a later
  module.

## Module 1: Landing page

**Summary:** replaces the placeholder home page with a one-page landing page
(hero, products, showcase, Copper Plus pricing, privacy) built from the
catalog, so prices and policy text can't drift from the Product Bible.

| Piece | Where | What it does |
|---|---|---|
| Page / route | `app/page.tsx` | Still the only route; composes the header, five sections and the footer |
| Components | `components/copper/landing/` | `Hero`, `Products`, `Showcase`, `PlusPricing`, `PrivacySummary`; `images.ts` holds alt text, captions and color swatches keyed by catalog image paths and color names |
| Brand components | `components/copper/site-header.tsx`, `site-footer.tsx` | Sticky header with links to `#products`, `#plus`, `#privacy`; Night Sky footer with the logo |
| Images | `public/assets/{cutouts,lifestyle,brand}/` | Moved from `specs/module-1/assets/` with `git mv`; served through `next/image` |
| Data | `lib/copper/catalog.ts` | Read-only: `getProducts()`, `getPlans()`, `getPrivacySummary()` and the `format…()` helpers |
| AI calls | None | |

**Data flow:** request for `/` → server components call the catalog → static
HTML (the page is prerendered at build time).

**Decisions and trade-offs:** sections are server components with no client
JavaScript beyond the theme toggle. The footer uses the `dark` class so it's
Night Sky in both themes. On phones the hero shows the products above the
headline so they're the first thing you see.

**Risks and open questions:** the privacy text comes straight from the 2026
policy in the catalog; the old "never records" claim must stay off the page
(AC-3.3).

### Extension: plan picker (copper-m1-ext)

**Summary:** the Copper Plus section becomes interactive. Shoppers switch
between Monthly, Yearly and Compare views of the prices, choose a plan, and see
a "Your plan" summary of what they picked.

| Piece | Where | What it does |
|---|---|---|
| Server section | `components/copper/landing/plus-pricing.tsx` | Reads `getPlans()` on the server and passes the plans down |
| Client picker | `components/copper/landing/plan-picker.tsx` | `"use client"`; holds the billing view and picked plan in React state. `yearlyMath()` works out a year of monthly billing, the monthly equivalent of yearly billing, and the saving |
| Tests | `tests/plan-picker.test.tsx` | Switching views, choosing a plan, the summary, and the yearly math |

**Data flow:** catalog → `PlusPricing` (server) → `PlanPicker` props → clicks
update state → cards and summary re-render. Nothing is saved or sent anywhere.

**Decisions and trade-offs:** the catalog stays on the server and only the
plans are passed to the client. The monthly view shows both prices in text, so
the page still lists `$7.99` and `$79` together (AC-3.1). There's no checkout:
the summary links back to the products instead (Module 1 non-goal).

## Adding a module

When a module changes how the app fits together, add a section here:

```md
## Module N: <feature name>

**Summary:** one or two sentences: what this adds and why.

| Piece | Where | What it does |
|---|---|---|
| Page / route | `app/...` | |
| Components | `components/...` | |
| Data | `supabase/migrations/...` | Tables and columns added |
| AI calls | `lib/ai/call.ts` (module, feature) | Model, prompt purpose, expected cost per call |

**Data flow:** user action → page → server code → database / model → response.

**Decisions and trade-offs:** what you chose, the alternatives, and why.

**Risks and open questions:** cost, privacy, accuracy or safety risks, and how
you handle them.
```
