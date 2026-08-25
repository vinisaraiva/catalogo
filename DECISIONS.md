# DECISIONS.md — Architecture Decision Log

This file records approved technical and product decisions.

Do not rewrite historical decisions silently. If a decision changes, add a new entry referencing the previous one.

---

## ADR-001 — One Next.js application

**Status:** Accepted

### Decision

Use one Next.js application for:

- public storefront;
- private admin;
- server-side backend;
- API Route Handlers.

### Reason

The MVP does not require a separate backend service. A single codebase reduces deployment, maintenance, authentication, and observability complexity.

### Consequence

Do not add FastAPI, NestJS, Express, or another backend unless future requirements justify it.

---

## ADR-002 — Supabase for database, auth, and storage

**Status:** Accepted

### Decision

Use:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage

### Reason

These capabilities cover the MVP with one integrated platform and reduce infrastructure overhead.

---

## ADR-003 — Public storefront requires no login

**Status:** Accepted

### Decision

Customers access the catalog anonymously.

### Reason

The seller will send the catalog link directly to customers. Authentication would add unnecessary conversion friction.

### Consequence

Public access is read-only and limited by RLS to published catalog data.

---

## ADR-004 — Private admin requires authentication

**Status:** Accepted

### Decision

All administrative management requires an authenticated user associated with a store.

### Consequence

Frontend route guards are not sufficient. Server authorization and RLS are mandatory.

---

## ADR-005 — Multi-store-ready from first migration

**Status:** Accepted

### Decision

Create `stores` and use `store_id` on tenant-owned business entities from the beginning.

### Reason

The product initially serves one store but may become multi-store/SaaS later. Adding tenant ownership later would require a larger migration.

### Consequence

The MVP does not implement SaaS billing, plans, onboarding, or marketplace behavior.

---

## ADR-006 — Team is a first-class entity

**Status:** Accepted

### Decision

Model teams/selections as entities.

Do not create separate category entities such as:

- Flamengo
- Flamengo Retrô
- Flamengo Libertadores

### Correct classification

```text
team = Flamengo
collection = Retrô
competition = Libertadores
season = 1981
```

### Reason

Product classification is multidimensional. A rigid category tree would create duplication and poor filtering.

---

## ADR-007 — WhatsApp replaces checkout in MVP

**Status:** Accepted

### Decision

The catalog ends in WhatsApp conversation instead of native checkout.

### Reason

The seller already closes sales through WhatsApp, and a full commerce stack is outside validation scope.

### Consequence

No payment, order, freight, or customer-account subsystem in MVP.

---

## ADR-008 — Price visibility is configurable per product

**Status:** Accepted

### Decision

Support:

- `show_price`
- `consult`
- `hidden`

### Reason

The seller may want some products to display price while others require consultation.

---

## ADR-009 — AI is optional, not core availability

**Status:** Accepted

### Decision

Every product can be created and published with normal photos even if AI is unavailable or quota is exhausted.

### Reason

AI should improve presentation, not become a single point of failure for the catalog.

---

## ADR-010 — Preserve original photos

**Status:** Accepted

### Decision

AI-generated media never replaces the original product image.

### Reason

The real image is important for trust and product fidelity.

---

## ADR-011 — AI images require manual approval

**Status:** Accepted

### Decision

Virtual try-on results are candidates until an administrator approves them.

### Reason

Generative AI can alter garment details, logos, sponsor marks, anatomy, or visual fidelity.

### Consequence

No automatic publication of AI images.

---

## ADR-012 — AI providers are abstracted

**Status:** Accepted

### Decision

Use interfaces such as:

- `TryOnProvider`
- `TextAIProvider`

### Initial try-on provider

`GoogleVTOProvider`

### Future candidates

- FASHN
- fal.ai

### Reason

Quality, pricing, and availability may change. Provider replacement should not require rewriting business logic.

---

## ADR-013 — Google VTO is initial try-on implementation

**Status:** Accepted for MVP testing

### Decision

Use Google Virtual Try-On behind the provider abstraction as the initial implementation.

### Reason

It is specialized for the required workflow:

```text
model image + garment image -> model wearing garment
```

### Note

This is not a permanent lock-in. Real shirt fidelity must be evaluated during testing.

---

## ADR-014 — AI text is provider-replaceable

**Status:** Accepted

### Decision

Use an economical/free text model through a replaceable provider implementation.

### Allowed uses

- description
- caption
- hashtags
- promotional copy

### Not allowed as authoritative structured inputs

- team
- price
- stock
- size
- collection
- competition

---

## ADR-015 — Daily AI quota is application-controlled

**Status:** Accepted

### Decision

Track and enforce a per-store daily generation limit in application data.

### Reason

Do not rely solely on external provider quotas.

### Consequence

When quota ends, AI generation is disabled while normal catalog operations continue.

---

## ADR-016 — Approved models and poses

**Status:** Accepted

### Decision

Use a small library of pre-approved AI model references and poses.

Target initial design:

- approximately 5 models;
- approximately 4 poses per model.

### Reason

This improves visual consistency and reduces repeated poses and anatomy problems.

---

## ADR-017 — Feed and Story are deterministic derivatives

**Status:** Accepted

### Decision

Generate Feed and Story assets from one approved catalog image using code, not additional generative-AI calls.

### Outputs

- Feed 4:5, e.g. 1080×1350
- Story 9:16, e.g. 1080×1920

### Reason

Reduces cost and preserves garment fidelity.

---

## ADR-018 — No AI video in MVP

**Status:** Accepted

### Decision

Do not implement Seedance, Higgsfield, Veo, or other AI video generation during MVP.

### Reason

Validate the catalog and photo-generation workflow first.

---

## ADR-019 — Mobile-first admin

**Status:** Accepted

### Decision

The seller should be able to operate the full admin from a phone.

### UX consequences

Prefer:

- cards;
- lists;
- step flows;
- drawers/sheets;
- large buttons;
- camera/gallery upload.

Avoid wide desktop-first data tables as the main interaction pattern.

---

## ADR-020 — PWA instead of native mobile app

**Status:** Accepted

### Decision

Build the product as a web application/PWA.

### Reason

Customers need only a link, and the seller can add the admin to the phone home screen without App Store/Play Store overhead.

---

## ADR-021 — Deterministic search for MVP

**Status:** Accepted

### Decision

Use normal database search/filtering.

### Search fields

- product
- team
- collection
- competition
- season

### Reason

AI/semantic search is unnecessary for initial catalog scale.

---

## ADR-022 — Vercel deployment

**Status:** Accepted

### Decision

Deploy Next.js on Vercel initially.

### Reason

Natural fit for the chosen framework and low MVP operations burden.

---

# Open validation items

These are not unresolved architectural blockers, but should be validated during development.

## V-001 — Try-on fidelity

Test real football shirts with:

- simple designs;
- stripes;
- sponsor text;
- small crests;
- retro designs;
- complex graphics.

Evaluate whether Google VTO preserves garment details well enough.

If not, benchmark FASHN and/or fal.ai without changing the application architecture.

## V-002 — Daily AI limit

Initial value can be configured rather than hardcoded.

Choose final default after observing real usage.

## V-003 — Public indication of AI image

Determine the final UI wording for indicating that a model image is digitally generated while keeping the original product photos accessible.

---

## ADR-023 — Phase 1 implementation notes (not architecture changes)

**Status:** Informational

These are implementation-level choices made while executing Phase 1
(Foundation) against ADR-001 through ADR-022. None of them change approved
architecture; recorded here so a future session understands why the code
looks this way.

### Dependency versions pinned below "latest"

At implementation time, `npm view` showed `typescript@7.0.2` and
`eslint@10.9.1` as latest. Both are incompatible with the current
`typescript-eslint` / `eslint-config-next` peer ranges
(`typescript-eslint` requires `typescript >=4.8.4 <6.1.0`; the
`eslint-plugin-*` packages `eslint-config-next` depends on cap at
`eslint@^9`). Installing "latest" caused pathological npm dependency
resolution (ERESOLVE backtracking across a ~1600-package tree). Pinned
instead to `typescript: ~6.0.3` and `eslint: ^9.39.5` — both current,
supported, and conflict-free with the Next.js 16 / React 19 toolchain.
Revisit these pins once `typescript-eslint` and `eslint-config-next`
publish versions that support newer majors.

### `eslint.config.mjs` uses `eslint-config-next`'s native flat config

`eslint-config-next@16.x` exports a flat `Linter.Config[]` directly, so
`eslint.config.mjs` imports it as-is rather than going through
`FlatCompat`/`@eslint/eslintrc` (the older pattern from Next.js docs for
ESLint 8). Using `FlatCompat` here crashed ESLint outright on this version.

### `tsconfig.json`: `jsx: "react-jsx"`, not `"preserve"`

Next.js 16's own build step auto-corrected this from `"preserve"` (the
generator's initial guess) to `"react-jsx"` on first `next build`, plus
added `.next/dev/types/**/*.ts` to `include`. Kept as Next.js set it.

### `store_users` / `stores` Row Level Security has no public write path

`analytics_events` (catalog_view, product_view, whatsapp_click,
selection_add) needs anonymous customers to write rows, but the MVP RLS
model otherwise denies all anon writes. Left `analytics_events` read/write
restricted to store members for now — the anonymous write path (a Route
Handler using the anon key with a narrow insert policy, vs. a service-role
endpoint) is an explicit decision for Phase 8 (Analytics), not made here.
See the migration file header comment in
`supabase/migrations/20260825000001_initial_schema.sql`.

### `supabase/config.toml`: `enable_signup = false`

PRD §4 has no self-service admin signup flow — admins are provisioned via
`scripts/seed.ts` / the service-role key, not a public sign-up form.
Disabled Supabase Auth's public signup accordingly. Revisit if a
multi-admin invite flow is ever added.

### Environment used to build this: a Windows folder over a remote dev
### bridge, not the target deploy environment

Development happened against `C:\Users\Vini\CATALOGO` through a remote
device bridge. `npm install` inside that specific bridged folder was
extremely slow (large native packages — e.g. `@next/swc-linux-x64-gnu`,
~92 MB — took many retries and one install left a truncated/corrupted
binary that crashed `next build`/`next dev` with a native "Bus error").
Validation (`lint`, `typecheck`, `test`, `build`, and a `next dev` smoke
test of `/`, `/admin`, `/admin/login`) was therefore run from a mirrored
copy of the same source on fast local storage, not by installing
`node_modules` inside the bridged folder itself. `node_modules` was left
out of `C:\Users\Vini\CATALOGO` (it's `.gitignore`d) — run `npm install`
there directly on a normal machine/terminal, which does not have this
bridge's I/O bottleneck and should complete in the usual 1-3 minutes.
