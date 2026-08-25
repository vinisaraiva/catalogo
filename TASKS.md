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

- [ ] Create mobile-first admin navigation
- [ ] Create dashboard
- [ ] Show active/draft/sold-out product counts
- [ ] Show daily AI generation usage placeholder
- [ ] Add "Ver catálogo" link

## Teams

- [ ] List teams
- [ ] Create team
- [ ] Edit team
- [ ] Activate/deactivate team
- [ ] Upload optional logo
- [ ] Configure featured flag
- [ ] Configure sort order

## Collections

- [ ] List collections
- [ ] Create collection
- [ ] Edit collection
- [ ] Activate/deactivate collection

## Competitions

- [ ] List competitions
- [ ] Create competition
- [ ] Edit competition
- [ ] Activate/deactivate competition

## Products

- [ ] List products
- [ ] Filter admin product list by status
- [ ] Create product
- [ ] Edit product
- [ ] Save product as draft
- [ ] Publish product
- [ ] Mark sold out
- [ ] Hide product
- [ ] Configure team
- [ ] Configure collection
- [ ] Configure competition
- [ ] Configure season
- [ ] Configure model
- [ ] Configure product type
- [ ] Configure featured
- [ ] Configure new arrival
- [ ] Configure sort order

## Price

- [ ] Implement `show_price`
- [ ] Implement `consult`
- [ ] Implement `hidden`
- [ ] Support promotional price

## Sizes / stock

- [ ] Add sizes
- [ ] Remove sizes
- [ ] Toggle size active
- [ ] Support optional quantity
- [ ] Display sold-out sizes correctly

## Duplicate product

- [ ] Duplicate classification
- [ ] Duplicate price configuration
- [ ] Do not duplicate images
- [ ] Do not duplicate stock
- [ ] Do not duplicate AI assets

## Validation

- [ ] Unit-test price display logic
- [ ] Run lint
- [ ] Run typecheck
- [ ] Run relevant tests

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
