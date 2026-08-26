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

## Store profile

> Added in the Phase 6 session — this checklist never existed before,
> even though PRD.md §7 defines `stores.name`/`logo_url`/
> `whatsapp_number`/`instagram_url` and the storefront already depended on
> them (the WhatsApp CTAs on `/`, `/produto/[slug]` and `SelectionBar` are
> all conditional on `whatsapp_number`; the logo renders in
> `(storefront)/layout.tsx`). Without this, the catalog had no logo and no
> working WhatsApp button. See DECISIONS.md ADR-029.

- [x] Edit store name
- [x] Upload/replace catalog logo
- [x] Edit WhatsApp number
- [x] Edit Instagram link
- [x] Show usage note explaining the WhatsApp buttons depend on this

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

- [ ] Public catalog requires no login
- [ ] Render store identity
- [ ] Add search
- [ ] Show featured teams
- [ ] Show new arrivals
- [ ] Show featured products
- [ ] Show national teams section when applicable
- [ ] Show retro section when applicable
- [ ] Show promotions when applicable

## Team page

- [ ] Implement `/time/[slug]`
- [ ] Show team identity
- [ ] Show published products
- [ ] Generate filters from available product attributes
- [ ] Support collection filter
- [ ] Support competition filter
- [ ] Support season where useful

## Search

- [ ] Search product name
- [ ] Search team
- [ ] Search collection
- [ ] Search competition
- [ ] Search season
- [ ] Ensure draft/hidden products never leak into results

## Product page

- [ ] Implement `/produto/[slug]`
- [ ] Product gallery
- [ ] Product name
- [ ] Team
- [ ] Price display mode
- [ ] Promotional price
- [ ] Sizes
- [ ] Availability
- [ ] Description
- [ ] Related products
- [ ] WhatsApp CTA placeholder

## Performance

- [ ] Optimize images
- [ ] Add lazy loading where useful
- [ ] Minimize client JS
- [ ] Check mobile loading performance

## Validation

- [ ] Integration test public visibility
- [ ] Run lint
- [ ] Run typecheck
- [ ] Run relevant tests

---

# Phase 4 — WhatsApp and Selection

## Single product

- [ ] Build WhatsApp URL helper
- [ ] Include product name
- [ ] Include selected size
- [ ] Include product URL where useful
- [ ] Respect `consult` wording

## Local selection

- [ ] Add product to temporary selection
- [ ] Remove product
- [ ] Change selected size
- [ ] Show selection count
- [ ] Generate multi-product WhatsApp message
- [ ] Do not persist as order

## Tests

- [ ] Unit test URL/message encoding
- [ ] Unit test one-product message
- [ ] Unit test multiple-product message
- [ ] Run lint
- [ ] Run typecheck

---

# Phase 5 — Product Images / Storage

## Upload

- [ ] Camera-friendly mobile upload
- [ ] Gallery upload
- [ ] Multiple images
- [ ] Validate mime type
- [ ] Validate file size
- [ ] Store under store/product path
- [ ] Select primary image
- [ ] Reorder images
- [ ] Delete image safely

## Image types

- [ ] original
- [ ] generated
- [ ] social_feed
- [ ] social_story
- [ ] detail

## Security

- [ ] Ensure store ownership before upload/delete
- [ ] Ensure original photo is never overwritten by AI flow
- [ ] Verify Storage policies

## Validation

- [ ] Run lint
- [ ] Run typecheck
- [ ] Run relevant tests

---

# Phase 6 — AI Foundation and Try-On

## Provider abstraction

- [x] Create `TryOnProvider` (`src/domain/try-on-provider.ts`)
- [x] Define input/output contracts (`TryOnInput`/`TryOnResult`)
- [x] Define provider error contract (`TryOnProviderError`)
- [x] Implement `GoogleVTOProvider` (`src/lib/ai/google-vto-provider.ts`)
- [x] Keep business layer provider-agnostic (`getTryOnProvider()` resolver;
      `src/lib/actions/ai-generations.ts` only depends on the interface)

## AI models

- [x] CRUD AI models (`src/lib/actions/ai-models.ts`, `/admin/ia/modelos`)
- [x] CRUD poses (`createAiModelPose`/`updateAiModelPose`)
- [x] Upload reference pose images (`uploadAiModelPoseImage`, new
      `ai-model-poses` Storage bucket)
- [x] Activate/deactivate model (`setAiModelActive`)
- [x] Activate/deactivate pose (`setAiModelPoseActive`)
- [x] Track `usage_count` (incremented on successful generation)
- [x] Track `last_used_at` (set on successful generation)

## Selection logic

- [x] Manual model selection (validated in `triggerTryOnGeneration`)
- [x] Manual pose selection (validated in `triggerTryOnGeneration`)
- [x] Automatic model selection (`selectModelAutomatically`)
- [x] Automatic pose selection (`selectPoseAutomatically`)
- [x] Avoid immediate repetition (`deriveLastUsedModelId` + exclusion)
- [x] Unit tests for selection (`src/domain/__tests__/ai-selection.test.ts`)

## AI generations

- [x] Create generation record (`triggerTryOnGeneration`)
- [x] `pending` status
- [x] `processing` status
- [x] `succeeded` status
- [x] `failed` status
- [x] `approved` state/metadata (`approveAiGeneration`, `product_image_id`)
- [x] `discarded` state/metadata (`discardAiGeneration`)
- [x] Save provider/model metadata (`provider`/`model` columns)
- [x] Save cost estimate if available (`cost_estimate`)

## Daily quota

- [x] Add store daily limit setting (`updateDailyAiGenerationLimit`,
      `/admin/configuracoes`)
- [x] Count daily eligible generations (`getDailyAiUsage`)
- [x] Block generation when quota is exhausted (`isQuotaAvailable` check
      before any provider call)
- [x] Show usage in admin (`/admin/configuracoes` and the product page's
      `AiTryOnPanel`)
- [x] Ensure normal photo workflow still works (quota check is scoped to
      `triggerTryOnGeneration` only; product/photo CRUD is untouched)
- [x] Unit/integration tests (`src/domain/__tests__/ai-quota.test.ts`;
      full live-quota integration test needs a real Supabase project —
      not available in this session, see DECISIONS.md ADR-025)

## Approval

- [x] Preview generated candidate (`AiTryOnPanel` shows `result_image_url`
      for `succeeded` generations)
- [x] Approve (`approveAiGeneration` — inserts the `product_images` row)
- [x] Reject/discard (`discardAiGeneration`)
- [x] Never auto-publish (only `approveAiGeneration` ever creates a
      `product_images` row from a generation)

## Validation

- [x] Run lint — clean
- [x] Run typecheck — clean
- [x] Run tests — 79 passed / 4 skipped (up from 57/4; skipped tests need
      a live Supabase project, unavailable in this session)

**Not verified live** (no Google Cloud / Supabase credentials available in
any environment this session can reach): an actual Vertex AI Virtual
Try-On API call end-to-end, RLS behavior against a real database, and the
skipped integration tests. See DECISIONS.md ADR-028 and V-001.

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

- [x] Manifest
- [x] App metadata
- [x] Icons
- [ ] Verify add-to-home-screen behavior
- [x] No complex offline sync

> Pulled forward from Phase 8 at the user's request (turning the store logo
> into the app/PWA icon and the WhatsApp share preview). See ADR-030.
> Favicon, apple-touch-icon, PWA manifest icons and the Open Graph share
> card are all generated from `stores.logo_url`/`stores.name` — no static
> icon files, no new dependency, no migration. "Verify add-to-home-screen
> behavior" stays unchecked: it needs a real device test, not something
> checkable from this environment.

## Accessibility

- [ ] Proper labels
- [ ] Alt text
- [ ] Visible focus
- [ ] Keyboard navigation
- [x] Contrast
- [x] Touch target sizes

> Storefront-only pass (ADR-031): verified `.storefront-theme`'s WCAG
> contrast computationally (OKLCH → luminance → ratio) and fixed 4 real
> AA failures (`--whatsapp`, `--accent`, `--destructive`, `--border`/
> `--input`), and bumped every under-44px storefront touch target (size
> chips, selection-bar remove button, team-page filter chips, selection
> bar's toggle/Limpar/Finalizar row) to the 44px mobile minimum. Also
> fixed two build-breaking bugs found along the way (missing `whatsapp`
> button variant, missing `@fontsource` dependency) and 3 UX issues
> (floating CTA overlapping content, team page missing a WhatsApp CTA,
> the touch targets above). Admin panel and "Proper labels"/"Alt
> text"/"Keyboard navigation" are unchanged — still open.

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
