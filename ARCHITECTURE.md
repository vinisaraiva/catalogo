# ARCHITECTURE.md — Catálogo Inteligente de Camisas

## 1. Architecture goals

The MVP architecture prioritizes:

1. mobile-first usability;
2. low operational complexity;
3. secure public/admin separation;
4. low infrastructure cost;
5. replaceable AI providers;
6. future multi-store support without implementing SaaS features now;
7. easy deployment and maintenance.

---

## 2. High-level architecture

```text
                         Internet
                            │
             ┌──────────────┴──────────────┐
             │                             │
      Public customer                 Admin seller
       No authentication               Authentication
             │                             │
             └──────────────┬──────────────┘
                            ▼
                    Next.js Application
                    ┌───────────────┐
                    │ Storefront    │
                    │ Admin UI      │
                    │ Server logic  │
                    │ Route handlers│
                    └───────┬───────┘
                            │
             ┌──────────────┼─────────────────┐
             │              │                 │
             ▼              ▼                 ▼
       Supabase DB     Supabase Storage    AI Providers
       PostgreSQL           │                 │
       Auth + RLS           │          ┌──────┴──────┐
                            │          │             │
                            │     TextAIProvider  TryOnProvider
                            │                        │
                            │                  GoogleVTOProvider
                            │
                            ▼
                      Product media
```

The application is a single Next.js codebase.

There is no separate backend service in the MVP.

---

## 3. Deployment

### Application
- Vercel

### Database / Auth / Storage
- Supabase

### External AI
- Try-on provider: Google VTO initially
- Text provider: configurable economical/free provider

---

## 4. Application areas

### 4.1 Public storefront

Suggested routes:

```text
/
/time/[slug]
/produto/[slug]
```

Properties:

- no authentication;
- read-only;
- fast mobile rendering;
- public product discovery;
- WhatsApp conversion.

### 4.2 Private admin

Suggested routes:

```text
/admin
/admin/produtos
/admin/produtos/novo
/admin/produtos/[id]
/admin/times
/admin/colecoes
/admin/modelos
/admin/artes
/admin/configuracoes
```

Requires authenticated and authorized store membership.

---

## 5. Multi-store-ready data model

The MVP operates with one store in the user experience, but tenant ownership is modeled from day one.

Core:

```text
stores
store_users
```

Tenant-owned entities carry:

```text
store_id
```

This design intentionally avoids a future migration from:

```text
product
```

to:

```text
store -> product
```

when multi-store support is eventually added.

It does **not** mean the MVP should implement SaaS behavior.

---

## 6. Recommended core tables

```text
stores
store_users
teams
collections
competitions
products
product_sizes
product_images
ai_models
ai_model_poses
ai_generations
store_settings
analytics_events
```

---

## 7. Entity relationships

Conceptually:

```text
stores
 ├── store_users
 ├── teams
 ├── collections
 ├── competitions
 ├── products
 │    ├── product_sizes
 │    └── product_images
 ├── ai_models
 │    └── ai_model_poses
 ├── ai_generations
 ├── store_settings
 └── analytics_events
```

Products reference:

```text
team_id
collection_id nullable
competition_id nullable
```

Season/model/type may initially be fields on the product unless future requirements justify separate tables.

---

## 8. Product classification

Avoid nested category trees for multidimensional properties.

Correct model:

```text
team = Flamengo
collection = Retrô
competition = Libertadores
season = 1981
model = Home
product_type = Torcedor
```

This product can match multiple storefront filters without duplication.

---

## 9. Authentication and authorization

### Public
No authentication.

### Admin
Supabase Auth.

Authorization is based on:

```text
auth user
      +
store_users
      +
store_id
```

Every admin mutation must confirm that the authenticated user is authorized for the target store.

---

## 10. RLS model

RLS is mandatory.

General intent:

### Public read
Allow anonymous reads only for data required by active public catalogs.

Examples:

- active store
- active team
- published product
- public media
- required product attributes

### Admin mutation
Only authenticated members of the same `store_id`.

Never rely only on frontend route protection.

---

## 11. Product lifecycle

```text
draft
  │
  ├── edit
  ├── upload images
  ├── generate AI
  └── approve AI
  │
  ▼
active
  │
  ├── sold_out
  └── hidden
```

Public visibility:

```text
draft     -> no
active    -> yes
sold_out  -> yes, if desired by storefront logic
hidden    -> no
```

---

## 12. Product image lifecycle

```text
Original photo
      │
      ├─────────────┐
      │             │
      ▼             ▼
Public original   TryOnProvider
                    │
                    ▼
              Generated candidate
                    │
              Admin review
              ┌─────┴─────┐
              │           │
           approve      discard
              │
              ▼
         Approved image
              │
       ┌──────┴───────┐
       ▼              ▼
   Feed 4:5        Story 9:16
```

Social derivatives are deterministic and should not consume another generative-AI call.

---

## 13. AI provider abstraction

### Try-on

```ts
interface TryOnProvider {
  generate(input: TryOnInput): Promise<TryOnResult>
}
```

Initial:

```text
GoogleVTOProvider
```

Potential future:

```text
FashnProvider
FalProvider
```

Business services call the interface, not the provider implementation directly.

### Text

```ts
interface TextAIProvider {
  generateProductCopy(input: ProductCopyInput): Promise<ProductCopyResult>
}
```

Provider must be replaceable.

---

## 14. AI quota architecture

`ai_generations` is the source of truth for generation usage.

Before generation:

```text
authenticate
   ↓
authorize store
   ↓
read store daily limit
   ↓
count eligible successful/charged generations
   ↓
quota available?
   ├── no -> reject without provider call
   └── yes
         ↓
      provider call
         ↓
      persist result/status
```

Do not depend on provider-side quota alone.

---

## 15. Storage structure

Conceptual paths:

```text
stores/{store_id}/products/{product_id}/original/
stores/{store_id}/products/{product_id}/generated/
stores/{store_id}/products/{product_id}/social/
stores/{store_id}/ai-models/{ai_model_id}/
```

Original images should be immutable from the perspective of derived-image generation.

---

## 16. Backend responsibilities

Next.js server-side code handles:

- authentication checks;
- store authorization;
- validation;
- product mutations;
- AI provider calls;
- AI quota;
- secure Storage operations;
- social image generation;
- analytics event writes when server-side appropriate;
- WhatsApp message construction helpers.

Do not expose provider secrets to Client Components.

---

## 17. Client responsibilities

Client Components are used only where interaction requires them.

Examples:

- multi-step product form;
- product selection;
- filters;
- image ordering;
- size selection;
- local WhatsApp selection basket.

Public data fetching should prefer server rendering when practical.

---

## 18. WhatsApp architecture

No WhatsApp Business API in the MVP.

Generate a normal click-to-chat URL containing a properly encoded message.

Single product example:

```text
Olá! Vi a Camisa Flamengo Retrô 1981 no catálogo e tenho interesse no tamanho G.
```

Multiple-product selection remains temporary/client-side and generates one final message.

---

## 19. Social image generation

Use server-side deterministic image processing.

Input:

- approved image
- store logo
- product name
- optional price
- optional CTA

Outputs:

```text
feed 1080x1350
story 1080x1920
```

Do not consume extra AI calls just for resizing/layout.

---

## 20. Search

MVP search is deterministic.

Search against:

- product name
- team name
- collection
- competition
- season

Do not use semantic/LLM search in the MVP.

---

## 21. Analytics

MVP events:

```text
catalog_view
product_view
whatsapp_click
selection_add
```

Each event includes:

```text
store_id
event_type
created_at
```

Avoid unnecessary personal data.

---

## 22. PWA

Prepare:

- manifest;
- installable metadata;
- icons when available.

Do not add offline synchronization or complex service-worker behavior unless later required.

---

## 23. Error handling

Use consistent domain errors.

Separate:

- validation error;
- unauthorized;
- forbidden;
- not found;
- quota exceeded;
- provider unavailable;
- provider generation failed;
- storage failure.

Do not expose provider internals or secrets to public users.

---

## 24. Environment boundaries

### Browser-safe
Only variables intentionally prefixed for client use.

### Server-only
Examples:

- service role key
- AI provider credentials
- Google Cloud credentials

Never import server-only secrets into client bundles.

---

## 25. Architecture constraints

Do not add in MVP:

- Redis
- queues
- dedicated workers
- microservices
- Kubernetes
- native apps
- payments
- customer auth
- background video pipeline

If a future requirement genuinely demands one, record the decision in `DECISIONS.md` first.

---

## 26. Recommended source layout

```text
src/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx
│   │   ├── time/
│   │   └── produto/
│   ├── admin/
│   └── api/
├── components/
├── lib/
│   ├── supabase/
│   ├── ai/
│   ├── images/
│   ├── whatsapp/
│   ├── auth/
│   └── validation/
├── domain/
├── types/
└── validations/
```

Exact layout may evolve slightly, but the architectural boundaries must remain.

---

## 27. Current approved architecture

- One Next.js application.
- Public catalog without authentication.
- Private authenticated admin.
- Backend inside Next.js.
- Supabase PostgreSQL + Auth + Storage.
- RLS mandatory.
- `store_id` from first migration.
- Google VTO behind provider abstraction.
- Replaceable text AI.
- Vercel deploy.
- WhatsApp click-to-chat.
- No checkout.
- No native application.
- No AI video in MVP.
