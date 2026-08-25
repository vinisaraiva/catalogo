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

---

## ADR-024 — Phase 2 implementation notes (not architecture changes)

### Product creation is a 3-step wizard; sizes/status live on the edit page

PRD §15 "Cadastro de produto" lists 5 steps: Time, Classificação, Imagem,
Comercial, Publicação. Etapa 3 (Imagem — "Tirar foto" / "Galeria") is
Phase 5 (Storage) scope and is skipped entirely in the Phase 2 wizard.
Etapa 4's "tamanhos" and "estoque opcional" cannot be collected during
creation either: `product_sizes.product_id` is a required foreign key, so
a size cannot exist before its product does. The wizard
(`ProductWizard`) therefore covers only Etapa 1 (Time), Etapa 2
(Classificação) and the non-sizes half of Etapa 4 (nome, preço, preço
promocional, modo de exibição), and always saves as `draft`. Sizes/stock
(`ProductSizesManager`) and the Etapa 5 publish actions
(`ProductStatusActions`: rascunho/publicar/esgotado/ocultar, plus
duplicar) live on the product edit page instead, which also has full,
non-stepped editing of every field. "Gerar arte com IA" (also Etapa 5) is
Phase 6/7 scope and was not implemented.

### "+ Novo time sem sair do fluxo" is a name-only inline create

PRD §15 Etapa 1 requires creating a team without leaving the product
flow. `ProductWizard` implements this as an inline mini-form (team name
only, auto-slugged) that calls the existing `createTeam` action and
appends the result to the in-memory team list. The team's other fields
(country, logo, sort order, featured) default to their `teamInputSchema`
defaults and can be edited afterward from Times — building the full
`TeamForm` inline was judged unnecessary complexity for a creation-flow
shortcut.

### Admin product list status filter is a query-string, not client state

`/admin/produtos?status=draft|active|sold_out|hidden` is read server-side
in the page component and passed straight to `listProducts`'s existing
`filter` param — no new client component/state needed, and the filter is
shareable/bookmarkable and survives a refresh, consistent with
`ADR-019`'s preference for simple mobile-first controls.

### Validation run against a mirrored copy, not the bridged folder directly

Same constraint as ADR-023's environment note, sharper in Phase 2: every
`device_bash` call on the bridged Windows folder is hard-capped at 45
seconds with no state or background-process persistence across calls
(confirmed by testing — a `nohup`/`setsid`-detached background job
launched in one call was gone by the next), and even non-install
commands (`find`, `du`) over the mount timed out at 45s on this project's
file count. `npm run lint` alone exceeded 45s directly on the mount.
Every Phase 2 file was therefore staged into a separate fast-storage
environment (`npm install` there: ~32s), and `lint` / `typecheck` / `test`
/ `build` / `format:check` were run there instead — all pass. This is a
tooling-speed workaround, not a change to where the project actually
lives; the validated code is byte-identical to what's in
`C:\Users\Vini\CATALOGO` except for cosmetic Prettier reflow (see next
note) and the `admin-nav.tsx` fix below.

### Bug caught by this validation pass: `admin-nav.tsx` `NAV_ITEMS` typing

`NAV_ITEMS` mixed one object literal with an `exact: true` key against
four without it, inside an `as const` array. TypeScript inferred each
entry as its own distinct literal-object type rather than a shared shape,
so `item.exact` failed to typecheck (`tsc --noEmit` error TS2339) on the
four entries missing the key. Fixed by adding `exact: false` explicitly
to those four entries. This was a pre-existing bug from before this
validation pass, not something introduced by the Phase 2 pages added in
this session — a concrete example of why `TASKS.md`'s "run typecheck
before moving on" step matters even for changes that look unrelated.

### Prettier formatting: applied in the validation copy, not fully mirrored back

`npm run format:check` flagged 25 files (all whitespace/line-wrap only,
no logic changes) in the validation copy; `npm run format` fixed all of
them there, and `lint`/`typecheck`/`test`/`format:check` were re-run
clean afterward. Given the mount's severe I/O constraints (see above),
only the real bugfix (`admin-nav.tsx`) and the newly-created `times/`
pages were written back to `C:\Users\Vini\CATALOGO` from that pass — the
other 24 files there still have their original (valid, just differently
wrapped) formatting. Run `npm run format` once locally (fast on native
disk) to pick up the cosmetic reflow; nothing depends on it functionally.

---

## ADR-025 — Phase 3 implementation notes (not architecture changes)

**Status:** Informational

Backfilled during the Phase 6 session after `/improve`'s audit flagged
that source comments across the codebase already cited ADR-025/026/027 as
if they existed, but this file jumped straight from ADR-024 to "Open
validation items". Reconstructed from those citation sites (see
`src/app/(storefront)/busca/page.tsx` and
`src/lib/queries/__tests__/public-visibility.integration.test.ts`) rather
than rewritten from scratch, so the numbering now matches what the code
has been pointing at all along.

### `/busca` is a real route despite not being in ARCHITECTURE.md's list

ARCHITECTURE.md's route sketch only names `/`, `/time/[slug]`,
`/produto/[slug]`. PRD §19 ("Busca") and TASKS.md Phase 3 both require
search as a first-class feature, so `/busca` was added as a fourth public
route. Not a deviation from approved architecture — the route list there
was illustrative, not exhaustive — but recorded since a future session
diffing routes against that list would otherwise flag it as unapproved.

### Integration tests against a real Supabase project skip, not fail, without live credentials

`src/lib/queries/__tests__/*.integration.test.ts` need
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` plus a reachable project already seeded via
`npm run seed`. Sandboxed/CI environments without real Supabase network
access (this session's cloud workspace included — see the audit's
`plans/README.md`) can't provide that. `describe.skipIf(!hasCreds ||
!reachable)` treats the absent-credentials/unreachable-project case as
"skipped", not "failed", so `npm run test` stays green in every
environment while still running for real wherever live credentials are
actually present (a developer's machine, or CI once it's provisioned with
them).

---

## ADR-026 — Phase 4 implementation notes (not architecture changes)

**Status:** Informational

Backfilled alongside ADR-025 — see that entry's note on why.

### One component owns size selection, "add to selection", and the WhatsApp CTA

TASKS.md Phase 4 ("WhatsApp and Selection") groups three PRD behaviors
that all happen on the same product-page interaction: picking a size,
adding the product to a local multi-product selection, and reaching
WhatsApp with a prefilled message. Rather than three separate components
coordinating shared state, `ProductSizeSelector` implements all three —
it owns the selected size, calls into the local-selection store
(`src/lib/store`) on "add", and renders the direct single-product
WhatsApp CTA. `SelectionBar` is the separate, page-level component for
the multi-product WhatsApp flow (PRD §22).

### The floating WhatsApp CTA sits at `bottom-20`, not `bottom-4`

The storefront home's general "talk to us" WhatsApp button
(`WhatsappCta`) is fixed-position. `SelectionBar` (Phase 4, `z-20`) is
also fixed-position, at the bottom, whenever the local selection is
non-empty. `bottom-20` leaves enough clearance that the two never
overlap when both are visible at once — a plain `bottom-4` would stack
them.

---

## ADR-027 — Phase 5 implementation notes (not architecture changes)

**Status:** Informational

Backfilled alongside ADR-025 — see that entry's note on why.

### "Select primary image" and "reorder" are one action: primary = index 0

`product_images.sort_order` has no separate "is primary" flag. Instead,
the image at `sort_order = 0` (ascending) is always the primary/cover
image everywhere it's read (`public-products.ts`'s `.order("sort_order",
{ foreignTable: "product_images" })`, the admin `ProductImagesManager`).
"Set as primary" is implemented client-side as "move this image to the
front, then persist the resulting order" through the same
`reorderProductImages` action Phase 5 already needed for manual
reordering — no second action, no second column.

### `product-images` Storage bucket is public

Reads of product photos are served directly from the public object
endpoint, bypassing `storage.objects` RLS entirely for GETs. Accepted for
the MVP because object paths are UUID-based (never guessable/listable)
and a draft/hidden product's image URLs are never exposed through the
already-RLS'd `product_images` table read in the first place — the real
enforcement point for "customers can't see unpublished products" is that
table's `product_images_public_read_published` policy, not the Storage
layer. Write access (insert/update/delete) is still restricted to store
members via `storage.objects` policies scoped by the path's `store_id`
segment.

### `image_type` folder mapping: `detail` shares `original/`, `social_feed`/`social_story` share `social/`

`product_images.image_type` has five values but Storage only needs three
conceptual folders (per ARCHITECTURE.md §15): `detail` is a traditional
admin upload just like `original` (both come through the same upload
action, `productImageUploadTypeSchema` — `generated` never does), so it
shares `original/`; `social_feed`/`social_story` are both deterministic,
programmatically-derived crops of one approved image (CLAUDE.md "Image
generation for social media"), so they share `social/`. See
`IMAGE_TYPE_FOLDER` in `src/domain/product-image.ts`.

### No richer public product gallery in Phase 5

The public product page shows the primary image plus whatever the admin
uploaded, in the admin-controlled order — no lightbox, no thumbnail
strip, no zoom. Not asked for by PRD.md §20 or any TASKS.md phase yet;
revisit only if a future phase's PRD update asks for it.

---

## ADR-028 — Phase 6 implementation notes (AI Foundation and Try-On)

**Status:** Informational / small schema addition

### `ai_generations` gets three columns beyond PRD.md §11's list

PRD.md §11 lists `ai_generations` as: id, store_id, user_id, product_id,
provider, model, generation_type, status, cost_estimate, created_at. That
set has no field to hold the actual generated-candidate image while it
awaits admin review (ARCHITECTURE.md §12's "Generated candidate -> Admin
review -> approve/discard"), and no way to record why a generation
failed. Migration `20260825000004_ai_generation_fields.sql` adds three
nullable columns instead of a new table:

- `result_image_url` — the candidate image, set when status becomes
  `succeeded`; what the admin review screen previews.
- `product_image_id` — set on approval, pointing at the `product_images`
  row created from `result_image_url`. Traces a generation forward to the
  catalog image it became.
- `error_message` — set when status becomes `failed` (CLAUDE.md "AI
  failures should be recorded distinctly from successful generations").

Deliberately *not* added: `ai_model_id` / `ai_model_pose_id` on
`ai_generations`. Automatic selection (`src/domain/ai-selection.ts`)
only needs `ai_model_poses.usage_count` / `last_used_at` (which PRD.md
§10 already specifies) — "last used model" is derived as the model
owning whichever pose has the latest `last_used_at`
(`deriveLastUsedModelId`), so no additional generation-level linkage is
needed for the selection algorithm to work. `provider`/`model` (the
already-approved fields) are enough to know which provider/model produced
a given generation.

### "Eligible" quota generations = anything that reached the provider

ARCHITECTURE.md §14 says "count eligible successful/charged generations"
without defining "eligible" precisely. Implemented as any generation with
status `succeeded`, `failed`, `approved`, or `discarded` — i.e. one that
actually consumed a provider call, win or lose — created since the start
of the current UTC day (`src/domain/ai-quota.ts`,
`src/lib/queries/ai-usage.ts`). `pending`/`processing` rows aren't
counted, but in this codebase's synchronous, worker-free request model
(CLAUDE.md MVP restriction on background workers/queues) a row only
occupies those states for the duration of the single Server Action call
that created it, so there's no window for a slow request to dodge the
count. UTC day boundary is a documented simplification — the schema has
no store-timezone field to compute a local-day boundary from instead;
revisit if a store outside UTC actually notices its daily counter
resetting at the wrong local hour.

### `ai-model-poses` Storage bucket is public, same tradeoff as `product-images` (ADR-027)

Reference pose photos are generic AI-model stock images, not customer or
draft-product data — there's nothing sensitive to gate behind a
signed-URL flow. Public read, membership-scoped write via
`storage.objects` policies keyed on the path's `store_id` segment, same
pattern as the Phase 5 bucket.

### Pose `usage_count`/`last_used_at` updates are read-then-write, not atomic

`src/lib/actions/ai-generations.ts` reads a pose's current `usage_count`
before the provider call and writes `usage_count + 1` after a successful
one, rather than an atomic SQL increment (the Supabase JS client's
`.update()` has no increment helper, and adding a Postgres function for
one counter felt like more infrastructure than the MVP warrants — CLAUDE.md
"avoid unnecessary abstractions"). A lost update under concurrent
generations against the same pose would only make automatic selection's
rotation slightly less even, never incorrect or unsafe, and this app's
expected concurrency (a handful of store admins, not bulk parallel
generation) makes that an acceptable MVP tradeoff, consistent with the
similar `sort_order` race already accepted for image uploads (see
`plans/README.md`'s "Other findings" section from the `/improve` audit).

### `GoogleVTOProvider`'s request/response shape

`src/lib/ai/google-vto-provider.ts` implements the Vertex AI Virtual
Try-On `predict` REST contract (endpoint, `instances[].personImage` /
`productImages[]`, `parameters.sampleCount`, `predictions[].bytesBase64Encoded`)
as documented at
https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-virtual-try-on-images
— confirmed via that page rather than assumed, since no live Google Cloud
project/credentials exist in any environment available this session to
test the call end-to-end. Flagged per CLAUDE.md's "when ambiguity can
materially affect ... irreversible architecture, stop and surface" —
surfaced here rather than blocking, since the shape comes from Google's
own current documentation, not a guess; still worth a real smoke test
against a live project before this ships (see V-001, already open).

### AI providers are only constructed when a generation is triggered

`getTryOnProvider()` (`src/lib/ai/get-try-on-provider.ts`) throws a plain
`TryOnProviderNotConfiguredError` — caught and surfaced as a normal
`ActionResult` error — if `GOOGLE_CLOUD_PROJECT`/`GOOGLE_CLOUD_LOCATION`
aren't set, rather than the app failing to boot or the whole admin
section breaking. Reaffirms ADR-009 ("AI is optional, not core
availability") at the implementation level: a store with no AI configured
can fully use products/teams/collections/images, and only "Gerar arte com
IA" is unavailable, with a clear message instead of a crash.

### `ai_models`/`ai_model_poses` CRUD has no delete action

Same pattern as `teams`/`collections`/`competitions` (ADR from Phase
2/existing code, not new here): only create/update/`setActive`. A
model/pose that's been used in past generations must stay resolvable for
`ai_generations`'s history and for `product_images.ai_generated` rows
that reference it indirectly, so soft-deactivation (`active = false`,
already excluded from selection everywhere) is the only removal path.

---

## ADR-029 — Store profile admin page (closing a Phase 2 backlog gap)

**Status:** Accepted / small addition

Found while answering the user's question "what's left before the app is
actually usable" right after Phase 6: TASKS.md's Phase 2 ("Admin Core")
checklist never had a "store profile" section, even though PRD.md §7
defines `stores.name` / `logo_url` / `whatsapp_number` / `instagram_url`,
ARCHITECTURE.md §6/§7 lists `stores` as a core table, and the storefront
already reads all three non-`name` fields:
`src/app/(storefront)/layout.tsx` renders `store.logo_url` in the header,
and the WhatsApp CTAs on `/` (`WhatsappCta`), `/produto/[slug]`
(`ProductSizeSelector`) and `SelectionBar` are all conditional on
`store.whatsapp_number` being set. `scripts/seed.ts` never wrote any of
the three either — only `name`/`slug`/`currency`/`active`. So before this
change, a freshly seeded store had no logo and every WhatsApp button in
the storefront silently failed to render, with nothing in the admin UI to
fix that. This wasn't a task anyone skipped; it was never written down as
a task.

### What was added

`/admin/configuracoes` (already the home for the Phase 6 AI daily-limit
setting) gained a "Minha loja" section above it:
`updateStoreProfile`/`uploadStoreLogo` (`src/lib/actions/store.ts`),
`StoreProfileForm`. No RLS change was needed —
`stores_member_update_own` (Phase 1) already allows a store member to
update their own store row; this only needed a UI and, for the logo, a
new Storage bucket (`store-assets`, same
`stores/{store_id}/...`-prefixed path convention and public-read
tradeoff as `product-images`/`ai-model-poses` — see those buckets' own
migration comments and ADR-027/ADR-028).

### Deliberately not included

- `slug` — changing it would break any catalog link already shared with
  a customer; no PRD requirement to make it editable.
- `currency` — PRD.md never asks for an admin control for it; `BRL` stays
  the seed default.
- `active` — an operational kill-switch (same class of field as
  `store_users` membership management), not a self-service setting.
- Team logo *upload* (as opposed to the plain URL field the team form
  already has) — TASKS.md Phase 2 explicitly deferred that to "Phase 5
  (Storage) scope" and Phase 5, as executed, only built product-image
  upload, not team-logo upload. Still an open gap, but a smaller one (a
  URL field works as a manual workaround; the store logo/WhatsApp had no
  workaround at all), so it wasn't pulled into this fix. Worth a small
  follow-up plan if the seller doesn't want to host team logos
  externally.

---

## ADR-030 — App/PWA icon and WhatsApp share card generated from the store logo (Phase 8 pulled forward)

**Status:** Accepted / small addition

The user asked, right after the ADR-029 store-logo-upload fix landed, for
the uploaded logo to also become "the icon of the application", and for
the app's name and icon to show up when the catalog link is shared on
WhatsApp. Both are literally ARCHITECTURE.md §22 "PWA — manifest,
installable metadata, icons when available" and TASKS.md Phase 8's "PWA"
checklist (manifest / app metadata / icons) — not new scope, just that
checklist pulled forward, the same way Phase 6 (AI) and the ADR-029 fix
were pulled forward ahead of their nominal order at explicit user request.
No PRD/architecture conflict, so no need to stop and flag it first
(CLAUDE.md "when ambiguity does not block development... continue without
unnecessary interruption").

### What was added

- `src/domain/branding.ts` — two pure helpers
  (`resolveStoreIconInitial`/`buildManifestShortName`), unit tested.
- `src/lib/branding/store-icon-visual.tsx` — the shared `next/og`
  `ImageResponse` JSX: the store logo on a white square if
  `stores.logo_url` is set, otherwise a plain initial-letter badge. Also
  `loadBrandingStoreOrFallback`, which turns any store-lookup failure
  (misconfigured `DEFAULT_STORE_SLUG`, DB not seeded yet, network egress
  blocked, ...) into that same generic fallback instead of a broken
  favicon/manifest/share-card — verified locally via `next start` against
  the still-unseeded live Supabase project (see the Supabase-sync work
  earlier this session): `/icon`, `/apple-icon`, `/icon-512`,
  `/manifest.webmanifest` and the Open Graph image all returned `200` with
  a generic "Catálogo" fallback while `/` itself correctly failed (no
  store row to render yet).
- `src/app/icon.tsx` (32×32 favicon), `apple-icon.tsx` (180×180, Apple's
  own home-screen-icon convention), `icon-512/route.tsx` (512×512, a plain
  Route Handler rather than a third file-convention name — Next only
  recognizes one `icon.tsx` per route segment — referenced only from the
  manifest, satisfying Chrome's ≥512px PWA-installability requirement).
- `src/app/manifest.ts` — name/short_name from `stores.name`, the three
  icons above.
- `src/app/(storefront)/opengraph-image.tsx` — the 1200×630 card a
  WhatsApp/iMessage/Telegram link preview shows: store icon + store name.
  Scoped to the `(storefront)` route group only (not the admin section),
  since that's the link customers actually share. Next.js auto-injects it
  into every storefront page's `og:image`/`twitter:image` — no manual
  `metadata.openGraph.images` needed.
- `(storefront)/layout.tsx` gained a `generateMetadata` (title/description
  templated on the store name, `openGraph.title`/`description`),
  overriding the root layout's generic "Catálogo" default for every
  storefront route.

### Key decision: `objectFit: "contain"`, not `"cover"`

There's exactly one logo field (`stores.logo_url`, ADR-029) — no separate
"square icon mark" upload. Many store logos are wide wordmarks, not
square marks, so cropping to fill a square (`cover`) would cut off most of
the name. Every generated icon instead pads the logo to fit
(`contain`) on a white background. A seller who wants a true square mark
can just upload a square image as their logo; nothing stops that.

### Deliberately not included

- No new dependency (e.g. `sharp`) and no new migration/column — the
  square-ification happens at render time via `next/og`'s Satori renderer
  (already a built-in Next.js feature), reusing `stores.logo_url`/`name`
  as-is. A precomputed, upload-time-generated square asset was considered
  and rejected for MVP scope: it would need a new dependency and a new
  `stores.icon_url` column for a cosmetic quality gain (crisper edges)
  that `next/og` already delivers well enough.
- `revalidate = 3600` on every generated route — regenerates at most
  hourly, so a logo change shows up within the hour rather than never
  being cached at all; avoids a DB read on every single favicon request.
- No `maskable` icon variant, no offline service worker — ARCHITECTURE.md
  §22 explicitly says not to add complex offline/service-worker behavior
  unless later required.
- "Verify add-to-home-screen behavior" (TASKS.md) stays unchecked — needs
  a real phone, not something this environment can confirm.
