# Catálogo Inteligente de Camisas Esportivas

MVP: catálogo público (sem login) + admin privado, para venda assistida de
camisas esportivas via WhatsApp. Ver `PRD.md`, `ARCHITECTURE.md`,
`DECISIONS.md` e `TASKS.md` para as fontes de verdade do projeto —
`CLAUDE.md` contém as instruções obrigatórias de desenvolvimento.

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS ·
shadcn/ui · Supabase (Postgres + Auth + Storage) · Vercel.

## Pré-requisitos

- Node.js 22+
- Uma conta/projeto Supabase (gratuito é suficiente para desenvolvimento)

## Configuração local

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Copiar as variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

   Preencher pelo menos:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (nunca expor no client)

   Essas três vêm do painel do seu projeto Supabase, em
   **Project Settings → API**.

3. Aplicar as migrations no projeto Supabase:

   ```bash
   npx supabase login
   npx supabase link --project-ref <seu-project-ref>
   npm run db:migrate
   ```

4. (Opcional, mas recomendado) Popular dados de desenvolvimento:

   Preencher também em `.env.local`:
   - `SEED_OWNER_EMAIL` — e-mail da conta de administrador de teste
   - `SEED_OWNER_PASSWORD` — senha dessa conta

   ```bash
   npm run seed
   ```

   Isso cria uma loja de desenvolvimento, um usuário owner, times,
   coleções, competições e um produto de exemplo. É idempotente — pode
   rodar de novo sem duplicar dados.

5. Rodar o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   - Catálogo público: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin` (login com o `SEED_OWNER_EMAIL`)

## Scripts

| Script               | Descrição                                     |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento                   |
| `npm run build`      | Build de produção                             |
| `npm run start`      | Servidor de produção (após build)             |
| `npm run lint`       | ESLint                                        |
| `npm run typecheck`  | Verificação de tipos (`tsc --noEmit`)         |
| `npm run test`       | Testes unitários (Vitest)                     |
| `npm run format`     | Formata o código com Prettier                 |
| `npm run db:migrate` | Aplica migrations no projeto Supabase linkado |
| `npm run seed`       | Popula dados de desenvolvimento               |

## Estrutura

Ver `ARCHITECTURE.md` §26 para a estrutura de pastas completa e as
fronteiras arquiteturais que devem ser respeitadas.
