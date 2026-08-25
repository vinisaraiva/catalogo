# PRD — Catálogo Inteligente de Camisas Esportivas

## 1. Visão do produto

Desenvolver uma aplicação web mobile-first para apresentação e venda assistida de camisas de times e seleções.

O produto terá duas experiências claramente separadas:

1. **Painel administrativo privado**, utilizado pelo vendedor para cadastrar e gerenciar produtos, times, coleções, estoque, preços, imagens e artes geradas por IA.
2. **Catálogo público**, sem login, destinado aos clientes que receberão um link, visualizarão os produtos e poderão iniciar uma conversa pelo WhatsApp.

O MVP não será um e-commerce completo. Seu objetivo é:

**cadastrar → apresentar → selecionar → conversar pelo WhatsApp → vender.**

---

## 2. Objetivos do MVP

### Objetivo principal

Permitir que o vendedor transforme rapidamente uma foto simples de uma camisa em um produto organizado e visualmente atraente dentro de um catálogo compartilhável.

### Objetivos secundários

- operação integral pelo celular;
- cadastro rápido;
- catálogo público sem login;
- organização por times e atributos;
- preço opcional;
- integração direta com WhatsApp;
- geração opcional de imagem com modelo humano usando IA;
- geração de legenda/descritivo por IA;
- base preparada para evolução futura sem reescrita estrutural.

---

## 3. Fora do escopo do MVP

Não implementar inicialmente:

- checkout;
- pagamento;
- PIX integrado;
- cartão;
- cálculo de frete;
- contas de clientes;
- histórico de compras;
- marketplace;
- aplicativo Android/iOS nativo;
- vídeo gerado por IA;
- assinatura/SaaS;
- cobrança de lojistas;
- integração avançada com WhatsApp Business API;
- recomendação por IA;
- chatbot de atendimento.

O fechamento da venda continuará sendo feito pelo WhatsApp.

---

## 4. Perfis de acesso

### 4.1 Administrador

Requer autenticação.

Pode:

- configurar a loja;
- cadastrar times e seleções;
- cadastrar atributos;
- cadastrar produtos;
- alterar preços;
- selecionar política de exibição do preço;
- gerenciar tamanhos;
- gerenciar estoque;
- adicionar fotos;
- gerar imagens por IA;
- gerenciar modelos e poses de IA;
- ativar/desativar produtos;
- marcar produto como esgotado;
- gerar textos;
- visualizar catálogo;
- acessar métricas básicas.

### 4.2 Cliente

Não possui conta.

Não faz login.

Não fornece dados para visualizar o catálogo.

Pode:

- acessar catálogo;
- pesquisar;
- navegar por times;
- filtrar produtos;
- abrir página de produto;
- visualizar fotos;
- selecionar tamanho;
- adicionar produtos à seleção;
- compartilhar produto;
- iniciar conversa no WhatsApp.

---

## 5. Arquitetura multi-store-ready

Embora o MVP tenha inicialmente apenas uma loja, a estrutura de dados deverá nascer preparada para múltiplas lojas.

Criar tabela:

`stores`

Campos mínimos:

- `id`
- `name`
- `slug`
- `logo_url`
- `whatsapp_number`
- `instagram_url`
- `currency`
- `active`
- `created_at`
- `updated_at`

Toda entidade pertencente a uma loja deverá possuir:

`store_id`

Exemplos:

- products
- teams
- product_images
- ai_models
- ai_model_poses
- ai_generations
- store_users
- settings
- analytics_events

O MVP não deverá implementar planos, billing ou onboarding multiempresa.

O `store_id` existe exclusivamente como preparação arquitetural.

---

## 6. Estrutura conceitual dos produtos

Evitar estrutura rígida de:

categoria → subcategoria → sub-subcategoria.

O time deve ser uma entidade própria.

### Exemplo

**Time:** Flamengo

Um produto pode ter:

- coleção: Retrô;
- competição: Libertadores;
- temporada: 1981;
- modelo: Home;
- tipo: Torcedor.

Assim o mesmo produto pode aparecer em diferentes filtros sem duplicação.

---

## 7. Entidades principais

### Store

Representa a loja.

### Store User

Relaciona usuário autenticado à loja.

Campos:

- user_id
- store_id
- role

Inicialmente:

`owner`

Preparar enum para:

- owner
- admin
- editor

sem necessidade de interface para isso no MVP.

### Team

Representa clube ou seleção.

Campos:

- id
- store_id
- name
- slug
- type
- country
- logo_url
- featured
- active
- sort_order

`type`:

- club
- national_team

### Collection

Vocabulário reutilizável.

Exemplos:

- Atual
- Retrô
- Especial
- Treino
- Comemorativa

Pode ser global do sistema ou por loja.

Para simplificação do MVP, recomenda-se `store_id`.

### Competition

Exemplos:

- Libertadores
- Champions League
- Copa do Mundo
- Brasileirão

### Product

Campos mínimos:

- id
- store_id
- team_id
- collection_id nullable
- competition_id nullable
- name
- slug
- season nullable
- model nullable
- product_type nullable
- description nullable
- price nullable
- promotional_price nullable
- price_display_mode
- status
- featured
- new_arrival
- sort_order
- created_at
- updated_at

#### price_display_mode

Valores:

- `show_price`
- `consult`
- `hidden`

#### status

Valores:

- `draft`
- `active`
- `sold_out`
- `hidden`

Nenhum produto em `draft` ou `hidden` deve ser mostrado publicamente.

### Product Size

- id
- product_id
- size
- quantity
- active

Exemplos:

- P
- M
- G
- GG

Estoque será opcional.

### Product Image

- id
- store_id
- product_id
- image_type
- url
- sort_order
- ai_generated
- created_at

#### image_type

- original
- generated
- social_feed
- social_story
- detail

---

## 8. Imagens e IA

### 8.1 Upload tradicional

Administrador poderá:

- fotografar com celular;
- selecionar imagem da galeria;
- enviar múltiplas fotos;
- selecionar foto principal;
- reordenar fotos.

A foto original nunca deverá ser substituída pela imagem IA.

---

## 9. Virtual Try-On

Estruturar integração através de abstração:

`TryOnProvider`

Implementação inicial prevista:

`GoogleVTOProvider`

Modelo inicialmente previsto:

`virtual-try-on-001`

Não acoplar regras de negócio diretamente ao Google.

Arquitetura deverá permitir futuramente:

- FashnProvider;
- FalProvider;
- outro fornecedor.

Fluxo:

1. administrador seleciona produto;
2. escolhe gerar arte;
3. sistema seleciona ou recebe modelo/pose;
4. backend verifica cota;
5. backend obtém imagem original;
6. backend envia modelo + camisa ao provider;
7. provider retorna imagem;
8. resultado é armazenado;
9. administrador revisa;
10. administrador aprova ou descarta.

Nenhuma imagem IA deve ser publicada automaticamente.

---

## 10. Modelos de IA

Criar entidade:

`ai_models`

Campos:

- id
- store_id
- name
- active
- sort_order

Criar:

`ai_model_poses`

Campos:

- id
- store_id
- ai_model_id
- name
- reference_image_url
- active
- usage_count
- last_used_at

Objetivo inicial:

aproximadamente 5 modelos.

Cada modelo poderá possuir aproximadamente 4 poses previamente aprovadas.

O sistema deverá permitir:

- escolha manual;
- modo automático.

No automático:

- evitar repetição consecutiva do mesmo modelo;
- evitar repetição excessiva da mesma pose;
- priorizar combinações usadas menos recentemente.

---

## 11. Limite de IA

Criar:

`ai_generations`

Campos:

- id
- store_id
- user_id
- product_id
- provider
- model
- generation_type
- status
- cost_estimate nullable
- created_at

Configuração por loja:

`daily_ai_generation_limit`

Antes da chamada:

1. contar gerações válidas daquele dia;
2. comparar com limite;
3. bloquear nova chamada se atingido.

Interface deverá mostrar:

**7 de 10 gerações utilizadas hoje**

Quando atingir o limite:

**Limite diário de IA atingido. Você ainda pode cadastrar e publicar produtos usando suas fotos normalmente.**

O uso de IA nunca deverá impedir o funcionamento do catálogo.

---

## 12. IA de texto

Criar abstração:

`TextAIProvider`

Não vincular o sistema a um único LLM.

Usos permitidos:

- descrição;
- legenda de Instagram;
- chamada promocional;
- hashtags;
- texto curto para WhatsApp.

O sistema não dependerá de IA para identificar:

- time;
- coleção;
- competição;
- preço;
- tamanho.

Essas informações serão estruturadas manualmente.

---

## 13. Criação de Feed e Story

Não usar IA generativa novamente para redimensionar artes.

A partir da imagem principal aprovada, gerar programaticamente:

### Feed

4:5

Exemplo:

1080 × 1350.

### Story

9:16

Exemplo:

1080 × 1920.

Utilizar processamento server-side de imagem.

Pode conter:

- imagem;
- logo;
- nome do produto;
- preço, quando habilitado;
- chamada;
- identificação da loja.

Uma geração de Virtual Try-On deverá poder produzir:

- imagem de catálogo;
- Feed;
- Story;

sem três chamadas à IA.

---

## 14. Painel administrativo

URL:

`/admin`

Exige autenticação.

### Dashboard

Exibir inicialmente:

- produtos ativos;
- produtos em rascunho;
- produtos esgotados;
- gerações IA usadas no dia;
- atalhos.

CTA principal:

**+ Novo produto**

### Menu

- Início
- Produtos
- Times
- Coleções
- Modelos IA
- Artes
- Configurações
- Ver catálogo

---

## 15. Cadastro de produto

Fluxo mobile-first.

### Etapa 1 — Time

Selecionar time existente.

Permitir:

**+ Novo time**

sem sair do fluxo.

### Etapa 2 — Classificação

Campos:

- coleção;
- competição;
- temporada;
- modelo;
- tipo.

Somente time será obrigatório.

### Etapa 3 — Imagem

Opções:

- Tirar foto
- Galeria

### Etapa 4 — Comercial

Campos:

- nome;
- preço;
- preço promocional;
- modo de exibição do preço;
- tamanhos;
- estoque opcional.

### Etapa 5 — Publicação

Ações:

- Salvar rascunho
- Publicar
- Gerar arte com IA

---

## 16. Duplicação de produto

Administrador poderá duplicar um produto.

Duplicar:

- time;
- coleção;
- competição;
- tipo;
- preço;
- configurações.

Não duplicar automaticamente:

- imagens;
- estoque;
- arte IA.

---

## 17. Catálogo público

URL inicial:

`/`

Sem autenticação.

O catálogo deverá priorizar performance mobile.

### Home

Elementos:

- identidade da loja;
- busca;
- times populares;
- novidades;
- destaques;
- seleções;
- retrô;
- promoções, se existirem;
- botão WhatsApp.

---

## 18. Página de time

Exemplo:

`/time/flamengo`

Mostrar:

- nome;
- logo opcional;
- quantidade de produtos;
- filtros disponíveis.

Filtros dinâmicos:

- Todos
- Atual
- Retrô
- Libertadores
- Treino
- outros existentes

Esses filtros representam atributos, não subcategorias rígidas.

---

## 19. Busca

Pesquisar inicialmente por:

- nome do produto;
- time;
- coleção;
- competição;
- temporada.

Não usar IA no MVP para busca.

---

## 20. Página de produto

URL:

`/produto/[slug]`

Mostrar:

- galeria;
- nome;
- time;
- preço ou consulta;
- tamanhos;
- disponibilidade;
- descrição;
- CTA WhatsApp;
- produtos relacionados.

Se imagem com IA existir, manter fotos reais também disponíveis.

Imagem gerada por IA deverá poder receber indicação discreta de que é uma representação digital.

---

## 21. Preço

Cada produto pode utilizar um dos três modos.

### Mostrar preço

Exemplo:

**R$ 149,90**

### Consultar

Exemplo:

**Consultar valor**

CTA:

**Consultar pelo WhatsApp**

### Ocultar

Não mostrar bloco de preço.

---

## 22. Seleção de produtos

Não implementar carrinho comercial.

Implementar opcionalmente uma seleção local temporária.

Cliente poderá adicionar produtos.

Exemplo:

**2 camisas selecionadas**

Ao finalizar:

abrir WhatsApp com mensagem contendo:

- produtos;
- tamanhos selecionados;
- links.

Sem criar pedido no banco inicialmente.

---

## 23. WhatsApp

Configurar número por `store`.

CTA deve gerar mensagem pré-preenchida.

Exemplo:

“Olá! Vi a Camisa Flamengo Retrô 1981 no catálogo e gostaria de consultar o tamanho G.”

Para múltiplos produtos:

listar cada item selecionado.

---

## 24. Segurança

Aplicar Row Level Security no Supabase.

### Público

Pode ler somente:

- loja ativa;
- times ativos;
- produtos ativos ou sold_out;
- imagens públicas necessárias;
- atributos dos produtos publicados.

### Administrador

Somente usuário associado ao `store_id` pode:

- criar;
- editar;
- excluir;
- gerar IA;
- alterar configurações.

Nunca expor no navegador:

- service-role key;
- Google API credentials;
- OpenRouter secrets;
- qualquer chave de provider.

---

## 25. Stack técnica

### Frontend

- Next.js com App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

Backend server-side dentro do Next.js.

Utilizar:

- Route Handlers;
- Server Components quando apropriado;
- Server Actions apenas onde fizer sentido.

Não implementar FastAPI no MVP.

### Banco

Supabase PostgreSQL.

### Autenticação

Supabase Auth.

Somente admin.

### Storage

Supabase Storage.

### IA Visual

Abstração `TryOnProvider`.

Provider inicial:

Google Virtual Try-On.

Modelo inicial:

`virtual-try-on-001`.

### IA Texto

Provider substituível.

Prioridade para modelo gratuito ou econômico, podendo usar OpenCode/OpenRouter ou outro provedor compatível.

### Hospedagem

Vercel.

---

## 26. Estrutura recomendada

```text
src/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx
│   │   ├── time/
│   │   └── produto/
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── produtos/
│   │   ├── times/
│   │   ├── colecoes/
│   │   ├── modelos/
│   │   ├── artes/
│   │   └── configuracoes/
│   │
│   └── api/
│       ├── products/
│       ├── upload/
│       ├── ai/
│       │   ├── text/
│       │   └── try-on/
│       └── whatsapp/
│
├── components/
├── lib/
│   ├── supabase/
│   ├── ai/
│   │   ├── text-provider.ts
│   │   ├── tryon-provider.ts
│   │   └── google-vto-provider.ts
│   ├── images/
│   └── whatsapp/
│
├── types/
└── validations/
```

---

## 27. Requisitos UX

A aplicação deverá ser:

- mobile-first;
- utilizável com uma mão;
- rápida;
- visual;
- com poucos campos por etapa;
- sem tabelas administrativas largas no celular;
- com botões grandes;
- com upload direto de câmera;
- com feedback claro de processamento;
- com skeleton/loading;
- com confirmação antes de exclusões destrutivas.

---

## 28. Performance

Catálogo público deve:

- utilizar imagens otimizadas;
- usar lazy loading;
- evitar JavaScript desnecessário;
- priorizar Server Components;
- usar cache onde adequado;
- carregar rapidamente em conexão móvel.

---

## 29. Acessibilidade

Mínimos:

- contraste adequado;
- labels em inputs;
- texto alternativo em imagens;
- navegação por teclado;
- foco visível;
- botões sem depender somente de ícones.

---

## 30. Analytics MVP

Registrar de forma simples:

- visualização de catálogo;
- visualização de produto;
- clique no WhatsApp;
- produto adicionado à seleção.

Associar `store_id`.

Não registrar informações pessoais desnecessárias.

---

## 31. Critérios de aceite do MVP

O MVP será considerado funcional quando:

1. administrador conseguir fazer login;
2. administrador conseguir cadastrar time;
3. administrador conseguir cadastrar produto pelo celular;
4. produto puder ser salvo em draft;
5. produto puder ser publicado;
6. cliente conseguir acessar catálogo sem login;
7. produtos draft não aparecerem publicamente;
8. cliente conseguir pesquisar produtos;
9. cliente conseguir filtrar por time;
10. produto puder mostrar preço, consultar ou ocultar;
11. cliente conseguir selecionar tamanho;
12. botão WhatsApp abrir mensagem correta;
13. administrador conseguir gerar imagem por IA;
14. imagem IA exigir aprovação;
15. foto real continuar armazenada;
16. cota diária de IA funcionar;
17. sistema continuar funcional quando cota terminar;
18. RLS impedir alterações públicas;
19. todas as entidades de negócio necessárias estiverem associadas a `store_id`;
20. layout estiver confortável em telas móveis.

---

## 32. Ordem recomendada de implementação

### Sprint 1
Infraestrutura, Supabase, autenticação, schema, `store_id`, RLS.

### Sprint 2
Times, coleções e CRUD de produtos.

### Sprint 3
Catálogo público, busca, filtros e página de produto.

### Sprint 4
WhatsApp, seleção de produtos e preço/consultar.

### Sprint 5
Upload/Storage e melhoria do fluxo mobile.

### Sprint 6
Abstrações de IA + Google VTO.

### Sprint 7
Modelos, poses, cota de IA e aprovação.

### Sprint 8
Feed/Story, analytics básicos, refinamento, testes e deploy.

---

## 33. Princípios que não devem ser violados

1. Catálogo público não exige login.
2. IA é opcional.
3. Produto sempre pode usar foto real.
4. IA não determina dados comerciais.
5. Imagem IA nunca publica automaticamente.
6. Chaves secretas nunca chegam ao frontend.
7. Toda entidade de negócio relevante carrega `store_id`.
8. Não adicionar complexidade de SaaS antes de validar o catálogo.
9. Não criar backend separado sem necessidade real.
10. Priorizar experiência mobile acima da experiência desktop.

---

## 34. Estado final da decisão arquitetural

**Frontend e backend:** Next.js  
**Banco/Auth/Storage:** Supabase  
**Deploy:** Vercel  
**Try-On:** provider abstraction, inicialmente Google VTO  
**Texto IA:** provider substituível e econômico  
**Catálogo:** público e sem login  
**Admin:** privado  
**Venda:** WhatsApp  
**Multiempresa:** preparada via `store_id`, mas não implementada comercialmente no MVP  
**Vídeo IA:** fase futura

Esta é a arquitetura oficial do MVP.
