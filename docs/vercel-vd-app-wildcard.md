# Vercel — app cidadão (`vd` e `vd-{slug}`)

Guia de infraestrutura para o **Telefarmed Sua Cidade** (Expo web em `app_cidades/`) em produção na Vercel.

**Relacionados:** [`vercel-wildcard-setup.md`](vercel-wildcard-setup.md) (wildcard geral `*.telefarmed.com.br`) · [`tenant-hosts.md`](tenant-hosts.md) (arquitetura de hosts).

---

## URLs públicas

| Host | Uso |
|------|-----|
| `https://vd.telefarmed.com.br` | App cidadão interno / demo Telefarmed |
| `https://vd-{slug}.telefarmed.com.br` | App cidadão whitelabel por entidade (ex.: `vd-santa-casa-sjc`) |

O `{slug}` é o mesmo slug da entidade contratante cadastrado no admin/Supabase.

---

## DNS wildcard (não precisa registro por cliente)

O app cidadão **não** exige CNAME separado para cada `vd-{slug}`.

Com o wildcard já configurado para a plataforma:

| Tipo | Nome | Valor (exemplo) |
|------|------|-----------------|
| CNAME | `*` | `cname.vercel-dns.com` |

…todos estes hosts passam a resolver na Vercel automaticamente:

- `vd.telefarmed.com.br`
- `vd-santa-casa-sjc.telefarmed.com.br`
- `vd-minha-cidade.telefarmed.com.br`

**Requisitos:**

1. Plano **Vercel Pro** (wildcard TLS).
2. Domínio `*.telefarmed.com.br` **Valid** em **Settings → Domains**.
3. Slug da entidade preenchido no banco (senão a API retorna tenant inexistente).

Teste DNS:

```bash
dig +short vd-minha-cidade.telefarmed.com.br CNAME
dig +short vd.telefarmed.com.br CNAME
```

---

## Roteamento na Vercel (dois mecanismos)

### 1. Edge Middleware (`middleware.js`) — principal

O middleware detecta hosts `vd` e `vd-*` (incluindo `vd-*.localhost` em dev) e faz rewrite interno para o bundle estático em `/vd-app/`:

```
vd-santacasa.telefarmed.com.br/login
  → /vd-app/index.html   (SPA Expo)
vd-santacasa.telefarmed.com.br/assets/...
  → /vd-app/assets/...
```

### 2. `vercel.json` — fallback explícito

Rewrites com condição de host por regex (PCRE):

```text
^vd(-[^.]+)?\.telefarmed\.com\.br$
```

Cobre **`vd.telefarmed.com.br`** e **`vd-{slug}.telefarmed.com.br`**, sem listar cada slug.

Ordem importante: regras do app cidadão ficam **antes** do catch-all `"/((?!api/).*)"` → `/index.html` (portal gestão/admin).

---

## Build: único vs por slug

### Recomendado — build único + tenant em runtime ✅

**Como funciona hoje** (`npm run build:vercel` na raiz do monorepo):

1. Build API (`backend/`) + portal web (`vite`) + app cidadão (`app_cidades/`).
2. Cópia do export Expo para `dist/vd-app/` (`scripts/copyAppCidadesToDist.mjs`).
3. **Um** deploy Vercel serve **todos** os clientes.

No browser, o app resolve o tenant pelo **hostname**:

1. `TenantContext` extrai slug de `vd-{slug}.telefarmed.com.br` (`app_cidades/src/config/tenantHost.ts`).
2. Chama `GET /api/v1/vd/tenant?slug=…` (+ header `X-Forwarded-Host`).
3. Aplica branding dinâmico (logo, cor, fundo de login).

**Variáveis de ambiente no build (Production):**

| Variável | Valor | Observação |
|----------|-------|------------|
| `EXPO_PUBLIC_API_URL` | *(omitir ou `/api/v1`)* | Web usa same-origin `/api/v1` |
| `EXPO_PUBLIC_ENTIDADE_SLUG` | *(omitir em produção)* | Só dev/native sem host `vd-{slug}` |
| `EXPO_PUBLIC_PUBLIC_ROOT_DOMAIN` | `telefarmed.com.br` | Parse de hostname |

**Vantagens:** um deploy, TLS automático para qualquer slug novo, operação simples.

### Alternativa — build por slug (não recomendado)

Seria fazer um deploy (ou preview) **por cliente** com `EXPO_PUBLIC_ENTIDADE_SLUG=santa-casa-sjc` baked no bundle.

| Prós | Contras |
|------|---------|
| App funciona mesmo sem DNS `vd-{slug}` apontando corretamente | N deploys para N clientes |
| | Branding fixo no build — mudança exige redeploy |
| | Não escala operacionalmente |

Use **somente** para POC ou preview manual. Produção whitelabel = **build único + runtime**.

---

## Pipeline de deploy (resumo)

```bash
# Local (validar bundle VD)
npm run build:vercel
# Saída: dist/vd-app/index.html + dist/index.html (portais)
```

Na Vercel:

- **Build Command:** `npm run build:vercel` (já em `vercel.json`)
- **Output Directory:** `dist`
- **Functions:** `api/index.ts` (API serverless)

Checklist pós-deploy:

- [ ] `https://vd.telefarmed.com.br` abre o app cidadão (não o portal gestão).
- [ ] `https://vd-{slug-cadastrado}.telefarmed.com.br` mostra logo/cor da entidade.
- [ ] `https://vd-slug-inexistente.telefarmed.com.br` exibe erro de tenant (não 404 Vercel).
- [ ] `GET /api/v1/vd/tenant?slug=…` responde 200 com branding.

```bash
curl -s "https://vd-SLUG.telefarmed.com.br/api/v1/vd/tenant?slug=SLUG" \
  -H "X-Forwarded-Host: vd-SLUG.telefarmed.com.br" | jq
```

---

## Desenvolvimento local

Simular produção por host:

```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — app cidadão web
cd app_cidades && npm run web
# Acesse: http://vd-minha-cidade.localhost:8081
```

Ou defina `EXPO_PUBLIC_ENTIDADE_SLUG=minha-cidade` quando rodar em Expo Go / native.

---

## Problemas comuns

| Sintoma | Causa | Ação |
|---------|-------|------|
| `vd-{slug}` abre portal gestão (admin) | Rewrite/middleware não aplicado | Redeploy; confira `middleware.js` + `vercel.json` |
| 404 Vercel no host VD | `dist/vd-app` ausente no build | Ver logs de `build:app-cidades` e `copyAppCidadesToDist` |
| Branding genérico | Slug não extraído do host | Cadastre slug; confira `EXPO_PUBLIC_PUBLIC_ROOT_DOMAIN` |
| CORS / tenant 403 | Host não bate com entidade | Use URL `vd-{slug}` correspondente ao slug no banco |

---

## Resumo

1. DNS **`*.telefarmed.com.br`** cobre `vd` e todos os `vd-{slug}`.
2. **`middleware.js`** + **`vercel.json`** (regex `^vd(-[^.]+)?\.telefarmed\.com\.br$`) servem o bundle `/vd-app/`.
3. **Build único** na Vercel; tenant e branding vêm de **`GET /vd/tenant`** em runtime.
4. Novo cliente = cadastrar slug + divulgar `https://vd-{slug}.telefarmed.com.br` — **sem** novo deploy.

---

## CORS e cookies de sessão (VD auth)

### Produção (same-origin)

Em `https://vd-{slug}.telefarmed.com.br`, o frontend e a API compartilham o mesmo host (`/api/v1/...`). O cookie `token_refresh_vd` é:

| Atributo | Valor |
|----------|-------|
| `Path` | `/api/v1/vd/auth` |
| `HttpOnly` | sim |
| `SameSite` | `Lax` |
| `Domain` | *(omitido — restrito ao subdomínio atual)* |
| `Max-Age` | 7 dias |

Cada tenant (`vd-santa-casa`, `vd-outra-cidade`) tem cookie **isolado** — sessão não vaza entre prefeituras.

### Dev cross-origin (Expo web + API local)

Quando o app roda em `http://vd-{slug}.localhost:8081` e a API em `http://localhost:3001`:

1. Backend deve ter `CORS_ALLOW_TENANT_ORIGINS=true`.
2. Inclua `http://localhost:8081` em `CORS_ORIGIN` se usar Expo sem subdomínio `vd-*`.
3. Cookie de refresh usa `SameSite=None` em dev para credenciais cross-origin.
4. Cliente (`vdRequest`) envia `credentials: 'include'` em login, cadastro, refresh e logout.

Testes:

```bash
cd backend
npm run test:cors
# Com API rodando (npm run dev):
bash scripts/test-vd-cors-cookies.sh
```

Variáveis na Vercel (Production):

| Variável | Valor |
|----------|-------|
| `CORS_ALLOW_TENANT_ORIGINS` | `true` |
| `PUBLIC_ROOT_DOMAIN` | `telefarmed.com.br` |
