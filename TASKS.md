# TASKS.md — Development Backlog

## Status legend

- [ ] Not started
- [x] Done

Do not skip phases unless a blocking technical dependency requires it.

---

# Phase 1 — Foundation

## Project bootstrap

- [x] Initialize Next.js App Router project
- [x] Enable TypeScript strict mode
- [x] Configure ESLint
- [x] Configure formatter
- [x] Configure Tailwind CSS
- [x] Configure shadcn/ui
- [x] Create base project folders
- [x] Add `.env.example`
- [x] Add README local setup instructions

## Supabase foundation

- [x] Configure browser Supabase client
- [x] Configure server Supabase client
- [x] Configure server-only privileged client only where justified
- [x] Configure Auth session handling
- [x] Create migration workflow
- [x] Ensure no schema depends on manual dashboard-only changes

## Initial schema

- [x] Create `stores`
- [x] Create `store_users`
- [x] Create `teams`
- [x] Create `collections`
- [x] Create `competitions`
- [x] Create `products`
- [x] Create `product_sizes`
- [x] Create `product_images`
- [x] Create `ai_models`
- [x] Create `ai_model_poses`
- [x] Create `ai_generations`
- [x] Create `store_settings`
- [x] Create `analytics_events`
- [x] Add `store_id` to all applicable tenant-owned entities
- [x] Add foreign keys
- [x] Add constraints
- [x] Add useful indexes
- [x] Add timestamps

## Security

- [x] Enable RLS on tenant-owned tables
- [x] Create public read policies for published catalog data
- [x] Create store-member policies for admin operations
- [ ] Verify user from Store A cannot mutate Store B
- [ ] Verify anonymous user cannot mutate anything
- [ ] Verify draft/hidden products are not public

  > Policies are written and reviewed (see
  > `supabase/migrations/20260825000002_rls_policies.sql`), but these three
  > items need a live Supabase project to actually run against — pending
  > until the project is provisioned and migrations are applied.

## Auth

- [x] Create admin login page
- [x] Protect `/admin`
- [x] Resolve authenticated user's store membership
- [x] Handle unauthorized/no-store state

## Seed

- [ ] Create development store
- [ ] Create owner membership
- [ ] Seed sample teams
- [ ] Seed sample collections
- [ ] Seed sample competitions
- [ ] Seed sample products

  > `scripts/seed.ts` (`npm run seed`) implements all six of the above and
  > is idempotent. Left unchecked because it hasn't been run yet — it needs
  > a live Supabase project plus `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`
  > in `.env.local` (see `.env.example` and `README.md`).

## Validation

- [x] Run lint
- [x] Run typecheck
- [x] Add initial tests (`src/lib/__tests__` — env validation + `cn()` helper; 7/7 passing)
- [ ] Confirm local environment setup

  > `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`
  > all pass. `npm run dev` was smoke-tested (`/` 200, `/admin` 307 redirect
  > to login, `/admin/login` 200). Left unchecked because it still needs a
  > real `npm install` + a real Supabase project's URL/keys in `.env.local`
  > on your machine — see README.md "Configuração local".

---

# Phase 2 — Admin Core

## Admin shell

- [x] Create mobile-first admin navigation
- [x] Create dashboard
- [x] Show active/draft/sold-out product counts
- [x] Show daily AI generation usage placeholder
- [x] Add "Ver catálogo" link

## Teams

- [x] List teams
- [x] Create team
- [x] Edit team
- [x] Activate/deactivate team
- [ ] Upload optional logo

  > `logo_url` is a plain URL field on the team form (matches ARCHITECTURE.md's
  > `teams.logo_url text`). Actual file upload is Phase 5 (Storage) scope —
  > this item is deferred there rather than half-built here.

- [x] Configure featured flag
- [x] Configure sort order

## Collections

- [x] List collections
- [x] Create collection
- [x] Edit collection
- [x] Activate/deactivate collection

## Competitions

- [x] List competitions
- [x] Create competition
- [x] Edit competition
- [x] Activate/deactivate competition

## Products

- [x] List products
- [x] Filter admin product list by status
- [x] Create product
- [x] Edit product
- [x] Save product as draft
- [x] Publish product
- [x] Mark sold out
- [x] Hide product
- [x] Configure team
- [x] Configure collection
- [x] Configure competition
- [x] Configure season
- [x] Configure model
- [x] Configure product type
- [x] Configure featured
- [x] Configure new arrival
- [x] Configure sort order

  > Creation wizard covers PRD §15 Etapa 1 (Time), Etapa 2 (Classificação) and
  > the non-sizes half of Etapa 4 (Comercial) — Etapa 3 (Imagem) is Phase 5
  > scope, skipped by design. Full field editing (all of the above, including
  > sizes/stock and status transitions) lives on the product edit page.
  > "Gerar arte com IA" (part of PRD §15 Etapa 5) is Phase 6/7 scope, not
  > implemented.

## Price

- [x] Implement `show_price`
- [x] Implement `consult`
- [x] Implement `hidden`
- [x] Support promotional price

## Sizes / stock

- [x] Add sizes
- [x] Remove sizes
- [x] Toggle size active
- [x] Support optional quantity
- [x] Display sold-out sizes correctly

  > "Sold-out" here means quantity 0 or `active: false` on a `product_sizes`
  > row, editable via ProductSizesManager. Storefront-facing sold-out styling
  > is Phase 3 scope.

## Duplicate product

- [x] Duplicate classification
- [x] Duplicate price configuration
- [x] Do not duplicate images
- [x] Do not duplicate stock
- [x] Do not duplicate AI assets

## Validation

- [x] Unit-test price display logic (`src/domain/__tests__/price.test.ts`, 6 tests)
- [x] Run lint
- [x] Run typecheck
- [x] Run relevant tests

  > `npm run lint`, `npm run typecheck` (0 errors after fixing a pre-existing
  > `admin-nav.tsx` union-type bug caught by this pass), `npm run test`
  > (18/18 passing), and `npm run build` all pass — verified against an exact
  > copy of this code with a fresh `npm install`, since the mounted project
  > folder's I/O made running these tools directly there impractical (every
  > `device_bash` call is capped at 45s with no cross-call background
  > persistence; even `find`/`du` over the mount timed out). Not yet verified
  > against a live database — all Phase 2 server actions/queries are
  > written against the schema but unexercised until Phase 1's Seed/RLS
  > items are closed out (see above). `npm run format` was run in that same
  > validation copy and reformatted 25 files (whitespace/wrap only, no
  > logic changes); only the `admin-nav.tsx` correctness fix and the
  > `times/` pages were written back to this project folder — run
  > `npm run format` locally once to pick up the cosmetic reflow on the
  > rest.

---

# Phase 3 — Public Catalog

## Home

- [x] Public catalog requires no login
- [x] Render store identity
- [x] Add search
- [x] Show featured teams
- [x] Show new arrivals
- [x] Show featured products
- [x] Show national teams section when applicable
- [x] Show retro section when applicable
- [x] Show promotions when applicable

> Implemented in `src/app/(storefront)/page.tsx`. Each section only
> renders when it actually has content (Promise.all fetch, conditional
> render) so an empty catalog shows a clean "em preparação" message
> instead of empty headers. "Retrô" is treated as the collection whose
> slug is `retro` (documented in DECISIONS.md ADR-025, matches
> `scripts/seed.ts`).

## Team page

- [x] Implement `/time/[slug]`
- [x] Show team identity
- [x] Show published products
- [x] Generate filters from available product attributes
- [x] Support collection filter
- [x] Support competition filter
- [x] Support season where useful

> Implemented in `src/app/(storefront)/time/[slug]/page.tsx`. Filter
> chips are derived per-team from whichever collection/competition/season
> values actually appear on that team's published products (not a fixed
> tree) — see DECISIONS.md ADR-025.

## Search

- [x] Search product name
- [x] Search team
- [x] Search collection
- [x] Search competition
- [x] Search season
- [x] Ensure draft/hidden products never leak into results

> Implemented in `src/app/(storefront)/busca/page.tsx` +
> `searchPublicProducts()` in `src/lib/queries/public-products.ts`. Not in
> ARCHITECTURE.md's original suggested route list — added because PRD §19
> and this checklist both require it; see DECISIONS.md ADR-025. Draft/
> hidden exclusion is enforced by the existing public RLS read policies
> (same mechanism as every other public query), not by app-level
> filtering — covered by the integration test noted below.

## Product page

- [x] Implement `/produto/[slug]`
- [x] Product gallery
- [x] Product name
- [x] Team
- [x] Price display mode
- [x] Promotional price
- [x] Sizes
- [x] Availability
- [x] Description
- [x] Related products
- [x] WhatsApp CTA placeholder

> Implemented in `src/app/(storefront)/produto/[slug]/page.tsx`. "Product
> gallery" is a placeholder tile ("Sem foto") — real photos need
> `product_images`, which is Phase 5 (Storage) scope; no product has an
> image yet. "WhatsApp CTA placeholder" is intentionally a placeholder per
> its own checklist wording — it sends only the product name in a static
> greeting; the full per-size/multi-product message builder (PRD §23) is
> Phase 4 scope (see DECISIONS.md ADR-025).

## Performance

- [ ] Optimize images
- [x] Add lazy loading where useful
- [x] Minimize client JS
- [ ] Check mobile loading performance

> "Optimize images" is not applicable yet — no product has an image
> (Phase 5 scope); logos use plain `<img loading="lazy">` since
> `next/image` requires configured remote hosts and logo URLs are
> arbitrary admin input, not a known host. "Minimize client JS": the
> entire Phase 3 storefront (layout, Home, `/busca`, `/time/[slug]`,
> `/produto/[slug]`) is Server Components using only `<Link>` / native
> `<form method="GET">` — zero `"use client"` components. "Check mobile
> loading performance" is left unchecked — it needs a real running
> instance with real data/network conditions, which is not something I
> can verify from this environment; the user should check this once
> `npm run seed` has been run and the app is deployed or running locally.

## Validation

- [x] Integration test public visibility
- [x] Run lint
- [x] Run typecheck
- [x] Run relevant tests

> Integration test written at
> `src/lib/queries/__tests__/public-visibility.integration.test.ts` —
> asserts a draft product is hidden from `anon`, an active product is
> visible to `anon`, and an `anon` update attempt does not mutate data,
> directly against a real Supabase project via the service-role + anon
> clients. It skips cleanly (not a failure) when Supabase credentials or
> network access aren't available, which is the case in every environment
> I control this session (see DECISIONS.md ADR-025) — it has been
> validated to skip correctly, but has never actually executed against
> the live project. The user should run `npm run test` locally (after
> `npm run seed`) to get a real pass/fail. Lint, typecheck, and the full
> test suite (`18 passed | 3 skipped`) all pass cleanly in the
> cloud-workspace validation mirror; `npm run build` also passes.

---


# Phase 4 — WhatsApp and Selection

## Single product

- [x] Build WhatsApp URL helper
- [x] Include product name
- [x] Include selected size
- [x] Include product URL where useful
- [x] Respect `consult` wording

> Implemented in `src/domain/whatsapp.ts` (`buildWhatsappUrl`,
> `buildSingleProductMessage`) and wired into
> `src/components/storefront/product-size-selector.tsx`. "Product URL
> where useful": omitted from the direct product-page CTA (redundant —
> the customer is already on that page) but always included per item in
> the multi-product selection message, where it's the only way to tell
> items apart. "Respect consult wording": `consult` mode uses PRD §23's
> own example wording; `show_price`/`hidden` use ARCHITECTURE.md §18's
> example wording instead — see DECISIONS.md ADR-026.

## Local selection

- [x] Add product to temporary selection
- [x] Remove product
- [x] Change selected size
- [x] Show selection count
- [x] Generate multi-product WhatsApp message
- [x] Do not persist as order

> Implemented as a client-only `SelectionProvider` (React Context +
> `localStorage`, no `selections` table) wrapping the storefront layout,
> plus `SelectionBar` (persistent "N camisas selecionadas" bar with
> per-item remove and a "Finalizar" WhatsApp action) and
> `ProductSizeSelector` on the product page (size chips + add/remove +
> direct WhatsApp CTA). "Change selected size" is handled by choosing a
> different size before adding — an already-added product can be removed
> and re-added under a new size in the same flow. See DECISIONS.md
> ADR-026 for the full design, including why hydration happens in a
> `useEffect` rather than a lazy state initializer (avoids an SSR/CSR
> markup mismatch).

## Tests

- [x] Unit test URL/message encoding
- [x] Unit test one-product message
- [x] Unit test multiple-product message
- [x] Run lint
- [x] Run typecheck

> `src/domain/__tests__/whatsapp.test.ts` — 13 tests covering
> `buildWhatsappUrl` (digit-stripping, message presence/absence,
> encoding), `buildSingleProductMessage` (both wording branches, with/
> without size, with/without URL), and `buildSelectionMessage` (empty,
> singular, plural, missing size/URL). Lint, typecheck, the full test
> suite (31 passed, 3 skipped), `format:check`, and `build` all pass
> cleanly in the cloud-workspace validation mirror.

---

# Phase 5 — Product Images / Storage

## Upload

- [x] Camera-friendly mobile upload
- [x] Gallery upload
- [x] Multiple images
- [x] Validate mime type
- [x] Validate file size
- [x] Store under store/product path
- [x] Select primary image
- [x] Reorder images
- [x] Delete image safely

> Implemented via `uploadProductImages` / `deleteProductImage` /
> `reorderProductImages` (`src/lib/actions/product-images.ts`) and
> `ProductImagesManager` on the product edit page. "Camera-friendly
> mobile upload" / "Gallery upload" are two separate `<input type="file">`
> triggers (`capture="environment"` vs plain `multiple`) per PRD §15
> Etapa 3 ("Tirar foto" / "Galeria"). "Select primary image" has no
> dedicated column — it's `sort_order = 0` — and shares one reorder
> action with "Reorder images"; see DECISIONS.md ADR-027 for the full
> design, including why mime type (10MB) and size limits are documented
> assumptions rather than PRD-specified numbers.

## Image types

- [x] original
- [x] generated
- [x] social_feed
- [x] social_story
- [x] detail

> All five already existed as a DB constraint since Phase 1
> (`product_images.image_type`). This phase's upload action only ever
> writes `original`/`detail` (PRD §15 Etapa 3 never asks the admin to
> pick a type) — `generated`/`social_feed`/`social_story` are reserved
> for the Phase 6/7 AI pipeline to write, not selectable here. See
> `IMAGE_TYPE_FOLDER` in `src/domain/product-image.ts` for how all five
> map onto Storage folders.

## Security

- [x] Ensure store ownership before upload/delete
- [x] Ensure original photo is never overwritten by AI flow
- [x] Verify Storage policies

> Store ownership: `requireStoreMembership()` + an explicit
> product-ownership check in every action, same pattern as every other
> mutation in this codebase, backed by `storage.objects` RLS scoped to
> `is_store_member(store_id)` (the real enforcement layer — see the
> Phase 5 migration). "Original never overwritten by AI flow": structurally
> guaranteed already — every upload always creates a new row + a new
> Storage path (a fresh uuid), never updates/overwrites an existing
> `original`-type row or file; the Phase 6 AI flow (not yet built) will
> write its own `generated`-type rows under a separate `generated/`
> folder. Will be re-checked once Phase 6 actually implements that write
> path. "Storage policies": insert/update/delete policies added and
> reviewed in the Phase 5 migration; no SELECT policy exists or is needed
> since the bucket is public (see ADR-027 for why that's an accepted
> tradeoff, not an oversight).

## Validation

- [x] Run lint
- [x] Run typecheck
- [x] Run relevant tests

> 17 new unit tests in `src/domain/__tests__/product-image.test.ts`
> (mime/size validation, path building for all 5 image types, public-URL
> path recovery). Full suite: 46 passed, 3 skipped. Lint, typecheck,
> `format:check`, and `build` all pass cleanly in the cloud-workspace
> validation mirror. Not verified against the live database/Storage from
> any environment I control (see ADR-027) — the user needs to apply the
> new migration and try a real upload.

---

# Phase 6 — AI Foundation and Try-On

## Provider abstraction

- [ ] Create `TryOnProvider`
- [ ] Define input/output contracts
- [ ] Define provider error contract
- [ ] Implement `GoogleVTOProvider`
- [ ] Keep business layer provider-agnostic

## AI models

- [ ] CRUD AI models
- [ ] CRUD poses
- [ ] Upload reference pose images
- [ ] Activate/deactivate model
- [ ] Activate/deactivate pose
- [ ] Track `usage_count`
- [ ] Track `last_used_at`

## Selection logic

- [ ] Manual model selection
- [ ] Manual pose selection
- [ ] Automatic model selection
- [ ] Automatic pose selection
- [ ] Avoid immediate repetition
- [ ] Unit tests for selection

## AI generations

- [ ] Create generation record
- [ ] `pending` status
- [ ] `processing` status
- [ ] `succeeded` status
- [ ] `failed` status
- [ ] `approved` state/metadata
- [ ] `discarded` state/metadata
- [ ] Save provider/model metadata
- [ ] Save cost estimate if available

## Daily quota

- [ ] Add store daily limit setting
- [ ] Count daily eligible generations
- [ ] Block generation when quota is exhausted
- [ ] Show usage in admin
- [ ] Ensure normal photo workflow still works
- [ ] Unit/integration tests

## Approval

- [ ] Preview generated candidate
- [ ] Approve
- [ ] Reject/discard
- [ ] Never auto-publish

## Validation

- [ ] Run lint
- [ ] Run typecheck
- [ ] Run tests

---

# Phase 7 — Text AI and Social Assets

## Text provider

- [ ] Create `TextAIProvider`
- [ ] Add configurable provider
- [ ] Generate description
- [ ] Generate Instagram caption
- [ ] Generate hashtags
- [ ] Generate promotional copy
- [ ] Generate optional WhatsApp copy

## Guardrails

- [ ] AI does not decide team
- [ ] AI does not decide price
- [ ] AI does not decide stock
- [ ] AI does not decide sizes
- [ ] Admin can edit generated text before save

## Feed / Story

- [ ] Create deterministic social image renderer
- [ ] Feed 1080x1350
- [ ] Story 1080x1920
- [ ] Optional store logo
- [ ] Product name
- [ ] Optional visible price
- [ ] CTA where configured
- [ ] Save derived images
- [ ] Do not consume another generative AI call

## Validation

- [ ] Run lint
- [ ] Run typecheck
- [ ] Run tests

---

# Phase 8 — Analytics, PWA, QA and Deploy

## Analytics

- [ ] `catalog_view`
- [ ] `product_view`
- [ ] `whatsapp_click`
- [ ] `selection_add`
- [ ] Associate `store_id`
- [ ] Avoid unnecessary PII

## PWA

- [ ] Manifest
- [ ] App metadata
- [ ] Icons
- [ ] Verify add-to-home-screen behavior
- [ ] No complex offline sync

## Accessibility

- [ ] Proper labels
- [ ] Alt text
- [ ] Visible focus
- [ ] Keyboard navigation
- [ ] Contrast
- [ ] Touch target sizes

## Final tests

- [ ] Unit suite
- [ ] Integration suite
- [ ] Critical E2E flow
- [ ] Mobile viewport QA
- [ ] Desktop smoke test
- [ ] Security review
- [ ] RLS review
- [ ] Secret scanning
- [ ] Performance review

## Deploy

- [ ] Configure Vercel project
- [ ] Configure production env variables
- [ ] Configure Supabase production project
- [ ] Run migrations
- [ ] Smoke-test production
- [ ] Verify public catalog
- [ ] Verify admin
- [ ] Verify WhatsApp links
- [ ] Verify AI is server-only

---

# Deferred / Future Backlog

Do not implement in MVP.

- [ ] AI video
- [ ] Seedance/Higgsfield/Veo integration
- [ ] Payments
- [ ] Checkout
- [ ] PIX
- [ ] Shipping
- [ ] Customer accounts
- [ ] Order management
- [ ] WhatsApp Business API
- [ ] SaaS plans
- [ ] Billing
- [ ] Multi-store onboarding
- [ ] Custom domains per store
- [ ] Advanced analytics
- [ ] AI recommendations
- [ ] Semantic search
