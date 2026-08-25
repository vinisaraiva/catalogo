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

## ADR-025 — Phase 3 implementation notes

**Status:** Accepted

### Context

Phase 3 (Public Catalog) builds the storefront: Home, team pages, search,
and product pages, relying entirely on the public RLS read policies
(`*_public_read_active` / `*_public_read_published`) already in place
from Phase 1 — no separate "public client" is needed, since the standard
`createClient()` server client (anon key) behaves as the `anon` Postgres
role for unauthenticated requests.

### `/busca` route addition

ARCHITECTURE.md's suggested route list only names `/`, `/time/[slug]`,
and `/produto/[slug]`. PRD §19 ("Busca") and TASKS.md's Phase 3 checklist
both require search as a first-class public feature, so `/busca` was
added as a fourth storefront route. This is additive (no existing route
changed) and directly implements an explicit PRD requirement, so it does
not need a separate ADR beyond this note — flagged here per CLAUDE.md's
"document important assumptions" guidance since it wasn't in
ARCHITECTURE.md's original list.

### Search implementation

`searchPublicProducts(storeId, query)` resolves team/collection/
competition name matches to IDs first via three parallel queries, then
builds one `.or()` clause combining `name.ilike`, `season.ilike`, and the
resolved `*_id.in.(...)` parts. This keeps search a single additional
round-trip beyond the ID-resolution queries, without adding a search
index/extension not justified by MVP scale (see CLAUDE.md "avoid
premature optimization").

### Team page filters are derived, not a fixed category tree

Per CLAUDE.md's "Product classification rules," the team page does not
hardcode a fixed filter/category tree. Instead, filter chips (collection,
competition, season) are derived from whatever combinations actually
appear on that team's own published products, and encoded as one
`?f=kind:value` query param. A product with no distinguishing attributes
still shows correctly; a team with no variety simply shows no filter
chips.

### Zero client components in the entire storefront

All of Phase 3 (layout, Home, `/busca`, `/time/[slug]`, `/produto/[slug]`)
is Server Components with plain `<Link>` / `<form method="GET">`
navigation — no `"use client"` anywhere in the storefront tree. This
satisfies TASKS.md's "minimize client JS" performance goal natively,
without a deliberate optimization pass.

### Gallery and full WhatsApp message builder are placeholders

Product photo galleries need `product_images` (Phase 5 / Storage scope);
until then the product page renders a "Sem foto" placeholder tile. The
WhatsApp CTA on the product page interpolates only the product name into
a static greeting — the full per-size, multi-product URL/message builder
(PRD §23) is Phase 4 scope. Both are explicitly commented as placeholders
in the code so they aren't mistaken for finished Phase 4/5 work.

### Device-bridge constraints confirmed this session (validation-workflow note, not a product decision)

Two additional constraints were confirmed while validating Phase 3, on
top of the mount I/O slowness already documented in ADR-024:

1. `device_bash` calls do not persist background/detached processes
   across calls (tested with `nohup`/`setsid`-launched `lint`/`typecheck`
   jobs — gone by the next call, no output written). Each `device_bash`
   call is also hard-capped at ~45s, so any command that can't finish in
   that window (including non-install commands like `find`/`du` over the
   full mount, or `npm run lint` alone) must run in the cloud-workspace
   mirror instead (see ADR-024's validation-workaround pattern).
2. The `device_bash` Linux VM bridge has no general network egress at
   all — confirmed via `curl` to google.com and to the Supabase project
   URL both returning "403 from proxy after CONNECT," and Node's
   `fetch`/DNS resolution failing with `EAI_AGAIN`. This means neither
   the cloud sandbox nor the device bridge can reach Supabase's network
   from any environment under this session's control — `npm run seed`
   and the live-Supabase integration test
   (`public-visibility.integration.test.ts`) can only be run by the user,
   in their own local terminal, where real network access exists. The
   test is written to skip cleanly (not fail) when credentials or network
   access aren't available, specifically so it behaves correctly both in
   this sandboxed validation environment and once run for real locally.

These are workflow constraints of this session's tooling, not product or
architecture decisions — recorded here (rather than as a new top-level
ADR) because the integration test file and `/busca` page both reference
"see DECISIONS.md ADR-025" in their code comments.

### Consequences

- Phase 3 code has passed lint, typecheck, unit/integration-skip test
  run, and build cleanly in the cloud-workspace mirror. It has NOT been
  run against the live database from any environment I control — the
  user should run `npm run dev` and click through the storefront (and
  `npm run test` for the live-Supabase integration test) locally to get
  real-environment confirmation, whenever `npm run seed` has been run.
- No new tables, RLS policies, or dependencies were introduced in Phase
  3 — it is purely a new set of read-only Server Component routes atop
  existing Phase 1 schema/policies and Phase 2 query helpers.

---

## ADR-026 — Phase 4 implementation notes

**Status:** Accepted

### Context

Phase 4 adds the WhatsApp URL/message builder and the local, temporary
product selection basket described in PRD §22–23 and CLAUDE.md's
"WhatsApp rules" — the first storefront feature that genuinely needs
client-side interactivity (ARCHITECTURE.md §17 explicitly lists "size
selection" and "local WhatsApp selection basket" as Client Component
responsibilities), so this is the first `"use client"` code in the
public storefront.

### Domain layer: `src/domain/whatsapp.ts`

Per CLAUDE.md "keep domain logic outside UI components," the URL/message
building is pure and unit-tested independent of React, matching the
existing `domain/price.ts` / `domain/product.ts` pattern:

- `buildWhatsappUrl(phoneNumber, message?)` — digits-only phone + a
  `wa.me` URL with the message URL-encoded. `whatsapp-cta.tsx` (Phase 3)
  was refactored to call this instead of duplicating the same two lines,
  so there is exactly one implementation to keep correct.
- `buildSingleProductMessage(...)` — respects `price_display_mode`
  ("Respect `consult` wording," TASKS.md Phase 4): `consult` mode uses
  PRD §23's own example wording ("...e gostaria de consultar o tamanho
  G."); `show_price`/`hidden` use ARCHITECTURE.md §18's example wording
  ("...e tenho interesse no tamanho G.") instead — the customer already
  has enough information in those modes, so the message reads as
  interest rather than a price question. `productUrl` is optional and
  omitted from the direct product-page CTA (the customer is already on
  that page, so "include product URL where useful" reads as *not*
  useful there).
- `buildSelectionMessage(items)` — the multi-product message per PRD
  §22 ("produtos; tamanhos selecionados; links"): a numbered list, one
  block per item, each with its own link when it has one. Always
  includes links (unlike the single-product message) since a link is
  how the seller tells items apart in a combined message.

### Local selection: `SelectionProvider` / `useSelection`

Client Context + `useState`, persisted to `localStorage` under
`catalogo:selection`, hydrated from storage only after mount (in a
`useEffect`, not a lazy `useState` initializer) — reading `localStorage`
during the initial render would make the server-rendered markup (which
never has access to it) mismatch the client's first render. This is
purely a convenience so the selection survives a refresh or closed tab;
per PRD §22 ("Sem criar pedido no banco inicialmente") there is no
`selections` table and nothing here is ever sent to the server. Adding
an already-selected `{productId, size}` pair is a no-op (idempotent add)
rather than creating a duplicate entry, since PRD §22 doesn't call for
per-item quantities.

`SelectionProvider` wraps the entire storefront layout
(`(storefront)/layout.tsx`) so the selection persists across
client-side navigation between pages, not just within one page.

### UI: `ProductSizeSelector` and `SelectionBar`

- `ProductSizeSelector` (product page): replaces Phase 3's static size
  list with selectable chips, an "Adicionar/Remover da seleção" button,
  and the direct WhatsApp CTA — combined into one component because all
  three need the same chosen size. Available sizes are toggleable;
  unavailable ones (`!active || quantity === 0`) keep Phase 3's
  disabled/strikethrough treatment.
- `SelectionBar` (storefront layout): a fixed bottom bar showing "N
  camisas selecionadas" that renders nothing while the selection is
  empty; tapping the count expands a short list with a per-item remove
  button and a "Limpar" action; "Finalizar" opens WhatsApp with
  `buildSelectionMessage`.
- The Home page's existing floating "Fale conosco" CTA (Phase 3, ADR-025
  context) was moved from `bottom-4` to `bottom-20` so it doesn't overlap
  `SelectionBar` (`z-20`) when a selection is active — a one-line,
  purely cosmetic reconciliation between the two features, not a scope
  change to Phase 3's own checklist.

### Consequences

- No new tables or migrations — the selection is intentionally
  client-only, matching the PRD explicitly.
- Lint required one documented `eslint-disable-next-line
  react-hooks/set-state-in-effect` in `selection-provider.tsx` for the
  one-time post-mount localStorage hydration described above; this is
  the correct pattern for that case, not a workaround for a bug.
- Unit tests cover URL encoding, both wording branches of the
  single-product message (with/without size, with/without URL), and the
  multi-product message (empty/singular/plural, with size+link
  formatting) — satisfying TASKS.md Phase 4's three "Unit test" items and
  CLAUDE.md's "WhatsApp message generation" testing requirement. Lint,
  typecheck, the full test suite, `format:check`, and `build` all pass
  cleanly in the cloud-workspace validation mirror.

---

## ADR-027 — Phase 5 implementation notes

**Status:** Accepted

### Context

Phase 5 adds real product photos: admin upload/reorder/delete (PRD §7
"Product Image" / §15 Etapa 3 / TASKS.md Phase 5) backed by Supabase
Storage, plus wiring the already-built Phase 3 storefront (which has
shown "Sem foto" placeholders since it was written) to actually display
them. `public.product_images` and its RLS already existed from Phase 1 —
this phase adds the Storage bucket itself and the admin-side code around
it.

### Storage bucket and path convention

New migration `20260825000003_product_images_storage.sql` creates a
public `product-images` bucket (10MB/file limit, JPG/PNG/WEBP only —
mirrored from `MAX_IMAGE_SIZE_BYTES`/`ALLOWED_IMAGE_MIME_TYPES` in
`src/domain/product-image.ts`, the single source of truth) plus
`storage.objects` write policies scoped to `is_store_member(store_id)`,
where `store_id` is read out of the object path itself via
`storage.foldername(name)`.

Objects are public-read (no SELECT policy needed — Supabase serves a
public bucket's objects directly, bypassing `storage.objects` RLS
entirely). This is an accepted MVP tradeoff: it means anyone who guesses
or otherwise obtains a photo's exact UUID-based path can fetch it even
for a draft/hidden product, but `product_images_public_read_published`
(the existing table-level RLS policy) already keeps that URL from ever
being returned by any query an anonymous storefront visitor can make —
in practice it's unreachable, not just unlisted. Same tradeoff every
admin-entered `logo_url` already makes today.

Paths follow ARCHITECTURE.md §15's conceptual layout —
`stores/{store_id}/products/{product_id}/{folder}/{uuid}.{ext}` — with
the five `product_images.image_type` values mapped onto the three
folders that document actually names: `original` and `detail` (both
traditional admin uploads) share `original/`; `social_feed` and
`social_story` (both deterministic derivatives of one approved image,
per CLAUDE.md "Image generation for social media") share `social/`;
`generated` gets its own folder. See `IMAGE_TYPE_FOLDER` in
`src/domain/product-image.ts`.

### Upload only ever writes `original`/`detail`

PRD §15 Etapa 3 only ever asks the admin to pick "Tirar foto" or
"Galeria" — it never asks them to choose an image type. So
`uploadProductImages` accepts only `original`/`detail` via
`productImageUploadTypeSchema`, and `ProductImagesManager`'s two upload
buttons don't expose a type picker at all — every traditional upload is
tagged `original`. `generated`/`social_feed`/`social_story` remain valid
`image_type` values in the schema and are written exclusively by the
Phase 6/7 AI pipeline.

### "Select primary image" + "Reorder images" share one action

Rather than a separate `is_primary` column, "primary" is simply
`sort_order = 0` — the lowest sort_order is always the cover image,
everywhere it's read (`ProductImagesManager`, and every storefront query
in `public-products.ts`, which now embeds `product_images(url,
sort_order)` ordered ascending). One Server Action,
`reorderProductImages(productId, orderedIds)`, rewrites `sort_order` to
match whatever full order the client sends; `ProductImagesManager`
computes that order two ways — swap-with-neighbor for the up/down
buttons, move-to-front for "set as primary" — and both call the same
action. Avoids a redundant column and a second code path for what is,
underneath, the same write.

### Upload validated as an all-or-nothing batch, deleted "safely"

`uploadProductImages` validates every file's mime type and size before
uploading any of them, so a batch either fully succeeds or fails with
nothing written — no half-uploaded product. If a Storage upload fails
partway through a batch, whatever that batch already uploaded is rolled
back (`storage.remove`) before returning the error; if the DB insert
itself fails after all uploads succeeded, the same rollback runs so no
orphaned file is left with no `product_images` row pointing at it.

`deleteProductImage` ("Delete image safely") deletes the Storage object
first, the DB row second — see the function's own doc comment for why
that ordering, not the reverse, is the safer failure mode.

### Wiring the storefront to actually show photos

TASKS.md Phase 5's checklist is entirely admin-side (Upload / Image
types / Security / Validation) — it has no "show photos on the
storefront" item. This was done anyway, deliberately: `product-card.tsx`
and `produto/[slug]/page.tsx` both carried a Phase 3 comment reading
"Swap in the primary image here once Phase 5 lands, without changing
this component's public shape" — an explicit forward-reference written
in this same codebase — and shipping upload/storage with no visible
effect on the actual public catalog would leave the PRD's core loop
("cadastrar → apresentar → ... → vender") incomplete. `ProductCard` and
the product page now render `product_images[0]` via `next/image`
(Storage URLs are on `*.supabase.co`, already whitelisted in
`next.config.ts` — unlike `logo_url`, which stays a plain `<img>` since
it's an arbitrary admin-entered URL), falling back to the existing "Sem
foto" placeholder for a product with none yet. The product page's
gallery is intentionally view-only — a large primary image plus a
static thumbnail strip, no click-to-swap lightbox — since no phase has
asked for richer gallery interaction yet; that stays a candidate for a
future task, not assumed here.

### `next.config.ts`: Server Action body size limit

Next.js defaults Server Actions to a 1MB request body limit, which a
multi-photo upload (`MAX_FILES_PER_UPLOAD × MAX_IMAGE_SIZE_BYTES` = 5 ×
10MB worst case) would hit immediately. Raised to `55mb` in
`experimental.serverActions.bodySizeLimit` as a server-side backstop;
`src/domain/product-image.ts`'s constants remain the actual,
single-source-of-truth limits enforced per file.

### Consequences

- No changes to `product_images`' existing schema or RLS — this phase is
  additive (Storage bucket + policies + admin/storefront code) on top of
  what Phase 1 already built.
- Lint, typecheck, the full test suite (46 passed, 3 skipped — 17 new
  tests for `src/domain/product-image.ts`), `format:check`, and `build`
  all pass cleanly in the cloud-workspace validation mirror.
- Not verified against the live project from any environment I control,
  for the same reason noted in ADR-025/026: no network path to Supabase
  from this session. The user should run the new migration
  (`supabase db push` or paste it into the Dashboard SQL Editor, same as
  the Phase 1 setup), then verify upload/reorder/delete against a real
  product from the admin UI, and confirm the storefront picks up an
  uploaded photo.
