# CLAUDE.md — Project Instructions

## Source of truth

- `PRD.md` is the functional source of truth.
- `ARCHITECTURE.md` is the architectural source of truth.
- `TASKS.md` defines the approved implementation sequence.
- `DECISIONS.md` records architectural decisions and deviations.
- Do not change approved architecture silently.
- If a task conflicts with the PRD or architecture, stop that change and document the conflict before proceeding.

---

## Product summary

This project is a **mobile-first public catalog + private admin panel** for sports shirts/jerseys.

The MVP has two experiences:

1. **Public storefront**
   - No login.
   - Customers receive a link and browse the catalog.
   - Customers can search, filter, select products/sizes, and open WhatsApp with a prefilled message.

2. **Private admin**
   - Requires authentication.
   - The seller manages products, teams, collections, prices, sizes, stock, photos, AI models/poses, and AI-generated images.

The MVP is **not** a full e-commerce system.

---

## Mandatory stack

Use:

- Next.js App Router
- React
- TypeScript in strict mode
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel
- Server-first architecture

Backend logic stays inside the Next.js application using:

- Route Handlers
- Server Components where appropriate
- Server Actions only where appropriate

Do **not** create FastAPI, NestJS, Express, or microservices for the MVP.

---

## Multi-store-ready architecture

The MVP initially has one store, but the data model must be multi-store-ready.

- Create a `stores` table.
- All store-owned business entities must include `store_id`.
- Tenant-owned data must be protected with Supabase RLS.
- Do not implement SaaS billing, plans, onboarding, or marketplace behavior yet.

Examples of store-owned entities:

- store_users
- teams
- collections
- competitions
- products
- product_images
- ai_models
- ai_model_poses
- ai_generations
- store_settings
- analytics_events

---

## Product classification rules

Do not model categories as rigid nested structures such as:

- Flamengo
- Flamengo Retrô
- Flamengo Libertadores

Instead use:

- `team = Flamengo`
- `collection = Retrô`
- `competition = Libertadores`
- `season = 1981`

A product may match multiple filters without duplication.

`Team` is a first-class entity, not merely a free-text category.

---

## Product status

Use:

- `draft`
- `active`
- `sold_out`
- `hidden`

Public storefront rules:

- `active` is public.
- `sold_out` may be public.
- `draft` must never be public.
- `hidden` must never be public.

---

## Price display

Support exactly:

- `show_price`
- `consult`
- `hidden`

Behavior:

- `show_price`: display the price.
- `consult`: display "Consultar valor" and WhatsApp CTA.
- `hidden`: do not render the price block.

---

## AI architecture

AI must be optional.

Never couple business logic directly to one provider.

Create provider abstractions.

Example:

```ts
interface TryOnProvider {
  generate(input: TryOnInput): Promise<TryOnResult>
}
```

Initial implementation:

- `GoogleVTOProvider`

Future-compatible providers:

- `FashnProvider`
- `FalProvider`

Do not implement future providers unless the PRD is explicitly updated.

Also create an abstraction:

- `TextAIProvider`

Text AI can generate:

- product description
- Instagram caption
- hashtags
- promotional copy
- WhatsApp copy

Text AI must **not** decide:

- team
- price
- stock
- size
- collection
- competition

These are structured admin inputs.

---

## AI image generation rules

- Always preserve the original product photo.
- AI-generated images are secondary assets.
- AI images must require explicit admin approval before publication.
- Never auto-publish an AI-generated image.
- Track generation status and usage.
- Enforce the configured daily AI generation limit.
- If quota is exhausted, the rest of the app must continue working normally.
- AI failures should be recorded distinctly from successful generations.

---

## AI model / pose rules

Support:

- multiple AI models
- multiple approved poses per model
- manual selection
- automatic selection

Automatic selection should:

- avoid repeating the same model consecutively
- avoid excessive reuse of one pose
- use `last_used_at` and `usage_count` when helpful

Do not build a complex recommendation engine for the MVP.

---

## Image generation for social media

Do not call generative AI again merely to create Feed and Story formats.

From one approved image, generate programmatically:

- Feed 4:5
- Story 9:16

Use deterministic server-side image processing.

One successful virtual try-on should be reusable for:

- catalog image
- Feed image
- Story image

---

## Public storefront rules

Public storefront:

- requires no login
- should load fast on mobile
- must not expose admin controls
- should support search
- should support team pages
- should support dynamic filters
- should show product gallery
- should show sizes/availability
- should provide WhatsApp CTA

Do not add customer accounts in the MVP.

---

## WhatsApp rules

Use simple WhatsApp click-to-chat / prefilled-message links initially.

Do not implement WhatsApp Business API in the MVP.

For one product, message should include:

- product name
- selected size
- optional product URL

For multiple selected products, include all selected items.

Do not create an `orders` workflow unless the PRD changes.

---

## Security

Supabase RLS is mandatory.

Never expose in browser/client code:

- `SUPABASE_SERVICE_ROLE_KEY`
- Google credentials
- OpenRouter credentials
- provider tokens
- secret webhook tokens

Public users may only read published catalog data.

Authenticated users may mutate only data belonging to stores to which they are authorized.

Verify store membership server-side for admin mutations.

Never trust a `store_id` supplied by the browser without authorization checks.

---

## Coding standards

- TypeScript strict mode.
- Avoid `any`.
- Prefer explicit types at boundaries.
- Validate all external input.
- Validate server mutations.
- Keep server/client boundaries explicit.
- Prefer Server Components unless interactivity requires Client Components.
- Use semantic HTML.
- Build mobile-first.
- Avoid large desktop tables as the primary admin UI.
- Prefer cards, lists, sheets/drawers, and large touch targets on mobile.
- Keep functions focused.
- Keep domain logic outside UI components.
- Avoid unnecessary abstractions.
- Avoid premature optimization.
- Avoid unnecessary dependencies.

---

## Database standards

- Use versioned migrations.
- Do not rely on manual production schema edits.
- Use foreign keys.
- Create useful indexes.
- Use appropriate constraints.
- Include timestamps where relevant.
- Use UUID primary keys unless there is a documented reason not to.
- Apply RLS policies to tenant-owned tables.

---

## Storage conventions

Use paths conceptually similar to:

```text
stores/{store_id}/products/{product_id}/original/
stores/{store_id}/products/{product_id}/generated/
stores/{store_id}/products/{product_id}/social/
stores/{store_id}/ai-models/
```

Avoid filename collisions.

Do not overwrite original product photos when generating derived assets.

---

## Development workflow

Before implementing each approved task:

1. Read `PRD.md`.
2. Read the relevant parts of `ARCHITECTURE.md`.
3. Read the current section of `TASKS.md`.
4. Inspect the existing code before changing it.
5. Briefly state what will change.
6. Identify whether a migration is required.
7. Implement the smallest complete scope.
8. Run lint.
9. Run typecheck.
10. Run relevant tests.
11. Fix failures before moving on.
12. Update `TASKS.md`.
13. Update `DECISIONS.md` only when an architectural decision changes or a meaningful new one is introduced.

Do not skip validation merely because a change appears small.

---

## Change-control rules

Do not perform broad refactors unless required for the current task.

Do not change approved architecture merely because another pattern appears more elegant.

Before adding any of the following, verify that the requirement exists in the PRD:

- new table
- global state manager
- queue
- background worker
- microservice
- provider
- large dependency
- new infrastructure service
- new authentication mechanism

When ambiguity does not block development:

- choose the simplest solution compatible with the PRD
- document important assumptions
- continue without unnecessary interruption

When ambiguity can materially affect security, data model, billing, or irreversible architecture:

- stop and surface the issue before implementing it.

---

## MVP restrictions

Do not implement unless the PRD is explicitly updated:

- checkout
- payment processing
- PIX integration
- card payments
- freight/shipping engine
- customer accounts
- native Android app
- native iOS app
- marketplace
- SaaS billing
- subscription plans
- AI video
- WhatsApp Business API
- recommendation engine
- chatbot
- microservices

---

## Testing expectations

At minimum include tests for:

### Unit
- `price_display_mode`
- automatic model/pose selection
- AI daily quota
- WhatsApp message generation

### Integration
- draft product is not public
- active product is public
- unauthenticated user cannot mutate products
- user from another store cannot mutate products
- AI quota blocks generation

### E2E critical path
- login
- create team
- create product
- upload image
- publish
- open public catalog
- open product
- trigger WhatsApp link

---

## Definition of done for a task

A task is not complete until:

- implementation is finished
- relevant migration exists
- input validation is in place
- security implications are checked
- lint passes
- typecheck passes
- relevant tests pass
- no secrets were added
- `TASKS.md` is updated
- architecture changes, if any, are recorded in `DECISIONS.md`
