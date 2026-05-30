# Backend Telefarmed

API Node (Fastify) com autenticação admin própria. **Não usa senha do Postgres** — acessa o Supabase pela **API REST** (mesmo projeto do MCP), com `service_role`.

## Configuração local

1. Confira `backend/.env` com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (já pode vir do Vercel/Supabase CLI).
2. Na **raiz do projeto**:

```bash
npm install          # instala frontend + dependências do backend (postinstall)
npm run dev          # sobe Vite (:5173) e API (:3001) juntos
```

Só a API, em outro terminal:

```bash
npm run dev:api
```

Só o frontend:

```bash
npm run dev:web
```

Se aparecer `ECONNREFUSED` no login, a API **não está rodando** na porta 3001 — use `npm run dev` na raiz ou `npm run dev:api`.

## Por que não é o MCP direto?

O MCP do Cursor roda **dentro do editor**, não dentro do processo `node` do backend. O equivalente correto é a **API do Supabase** com a chave `service_role` (mesmo acesso privilegiado ao banco, sem connection string).
