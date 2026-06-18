# Tenants por subdomínio — desenho aprovado (Fase 0)

Documento de arquitetura e produto para URLs públicas por cliente (`{slug}.telefarmed.com.br`), branding no cadastro e isolamento de sessão por host.

**Status:** Decidido · **Data:** 2026-06-18 · **Substitui/complementa** a decisão #26 em [`whitelabel-operacional.md`](whitelabel-operacional.md) para **produção** (subdomínio por tenant).

---

## 1. Objetivo

Ao cadastrar um **novo cliente** no admin, a operação deve poder:

1. Enviar **logo** e **cor primária** (marca no painel).
2. Definir o **slug** público da instituição.
3. Obter URL de **gestão**: `https://{slug-entidade}.telefarmed.com.br`.
4. Ao cadastrar cada **UBT**, definir slug e obter URL do terminal: `https://{slug-ubt}.telefarmed.com.br`.

O visitante vê logo e cor **na tela de login**, antes de autenticar. O host identifica o tenant; a sessão só é válida no host correto.

---

## 2. Modelo de URL (recomendado e adotado)

### 2.1 Produção

| Papel | Host | Portal interno (`PortalId`) | Exemplo |
|-------|------|----------------------------|---------|
| **Gestão do cliente** | `{slug-entidade}.telefarmed.com.br` | `prefeitura` | `https://santa-casa-sjc.telefarmed.com.br/login` |
| **Terminal UBT** | `{slug-ubt}.telefarmed.com.br` | `ubt` | `https://ubs-centro-sjc.telefarmed.com.br/login` |
| **Admin Telefarmed** | `admin.telefarmed.com.br` | `admin` | plataforma |
| **Profissional** | `profissional.telefarmed.com.br` | `profissional` | plataforma |
| **Acompanhamento ao vivo** | `seguranca.telefarmed.com.br` | — | já existente |

**Não** usamos subdomínio aninhado (`ubs.centro.cliente.telefarmed.com.br`) — exige wildcard de múltiplos níveis e complica TLS. Usamos **slug flat** globalmente único.

### 2.2 Desenvolvimento local

| Ambiente | Host de exemplo | Equivalente |
|----------|-----------------|-------------|
| Gestão | `http://santa-casa-sjc.localhost:5173/login` | tenant entidade |
| UBT | `http://ubs-centro-sjc.localhost:5173/login` | tenant UBT |
| Plataforma | `http://localhost:5173/admin/login` | sem tenant |
| Legado (até depreciar) | `http://localhost:5173/prefeitura/login` | path prefix |

Vite deve aceitar hosts customizados (`server.host: true`). Alternativa: `/etc/hosts` com `127.0.0.1 santa-casa-sjc.telefarmed.local`.

### 2.3 Paths na URL pública do tenant

No host dedicado do cliente **não há** prefixo `/prefeitura` nem `/gestao` na barra de endereços:

- Gestão: `https://{slug}/login`, `https://{slug}/dashboard`, …
- UBT: `https://{slug-ubt}/login`, `https://{slug-ubt}/agenda`, …

Internamente o código pode manter `PortalId: 'prefeitura'` e pastas `prefeitura-*`. Isso é **implementação**, não URL pública.

### 2.4 Comunicação vs técnico

| Contexto | Usar |
|----------|------|
| Materiais ao cliente, e-mail, credenciais | `https://{slug}.telefarmed.com.br` e termo **portal de gestão** |
| Código, APIs REST, módulos | `/api/v1/prefeitura/*`, `PortalId 'prefeitura'` até refatoração opcional |
| Path legado em dev | `/prefeitura/*` mantido até redirect/depreciação |

Decisão #26 (`/gestao` como alias de path) fica **subordinada** a este desenho: em produção o cliente **não memoriza path** — memoriza **subdomínio**.

---

## 3. Slugs

### 3.1 Namespace único

Um único espaço de nomes para **entidade** e **UBT**:

- Impede `santa-casa` (entidade) e outra entidade cadastrar UBT com o mesmo slug.
- Validação na criação/edição em ambas as tabelas.

### 3.2 Formato

| Regra | Valor |
|-------|--------|
| Regex | `^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$` |
| Comprimento | 3–50 caracteres |
| Caracteres | minúsculas, números, hífen; sem hífen no início/fim |
| Proibido | acentos, espaços, `_`, pontos |

### 3.3 Geração sugerida (admin)

- Entidade: slugify(`razao_social` + sufixo município se colidir), ex. `santa-casa-sao-jose-dos-campos`.
- UBT: slugify(`nome-ubt` + sufixo curto entidade), ex. `ubs-centro-santa-casa-sjc`.
- Admin pode editar antes de salvar; API valida disponibilidade.

### 3.4 Slugs reservados (bloqueio total)

```
admin, api, app, www, mail, smtp, ftp, cdn, static, assets,
gestao, prefeitura, ubt, profissional, medico, seguranca,
login, auth, oauth, webhook, hooks, internal, cron, status,
health, docs, blog, suporte, help, telefarmed, platform,
staging, dev, test, demo, sandbox, null, undefined
```

Lista mantida em código (`RESERVED_TENANT_SLUGS`) e revisável sem migration.

### 3.5 Alteração e histórico

| Regra | Decisão |
|-------|---------|
| Slug após go-live | **Não editável** pelo cliente; só admin master com confirmação |
| Troca excepcional | Registrar em `tenant_slug_redirects` (slug_antigo → entidade_id \| ubt_id) + redirect HTTP 301 por 12 meses |
| Exclusão de entidade | Liberar slug após período de quarentena (90 dias) ou nunca reutilizar (decisão: **nunca reutilizar** no primeiro ano) |

---

## 4. Branding

### 4.1 Fonte dos dados

| Campo | Tabela | Uso |
|-------|--------|-----|
| `slug` | `entidades_contratantes` / `unidades_ubt` | Host DNS |
| `logo_storage_path` | `entidades_contratantes` | Login + shell (via URL assinada) |
| `cor_primaria` | `entidades_contratantes` | CSS `--brand-primary` |
| `nome_marca` | `entidades_contratantes` | Título, PDFs, e-mail |
| `terminologia`, `tipo_entidade` | `entidades_contratantes` | Copy whitelabel |

**UBT:** herda branding da **entidade contratante** (sem logo/cor própria na v1). Tela de login da UBT mostra marca da instituição.

### 4.2 Momento de aplicação

1. **Antes do login:** `GET /api/v1/public/tenant` (por `Host`) → logo, cor, nome, `portalKind`.
2. **Após o login:** sessão reforça `entidadeId` / `ubtId`; branding pode ser revalidado do JWT + entidade.

### 4.3 Cadastro admin (UX alvo)

Fluxo **Nova entidade** em um wizard:

1. Identificação (razão social, CNPJ, tipo, município).
2. Marca (upload logo, cor, nome de exibição).
3. **Endereço público** (slug + preview `https://{slug}.telefarmed.com.br`).
4. Contrato e contatos.
5. Revisão com URL + miniatura da marca.

Fluxo **Nova UBT** (portal gestão):

1. Dados operacionais (como hoje).
2. **Slug da UBT** + preview `https://{slug-ubt}.telefarmed.com.br`.
3. Revisão.

---

## 5. Resolução de tenant (runtime)

### 5.1 Algoritmo `resolveTenantByHost(hostname)`

```
1. Normalizar hostname (lowercase, sem porta)
2. Se hostname ∈ PLATFORM_HOSTS → { kind: 'platform', portalId }
3. Extrair slug = primeiro label (*.telefarmed.com.br) ou host em localhost
4. Buscar entidades_contratantes WHERE slug = :slug
   → encontrou: { kind: 'gestao', entidadeId, branding }
5. Buscar unidades_ubt WHERE slug = :slug
   → encontrou: { kind: 'ubt', entidadeId, ubtId, branding da entidade }
6. Senão → 404 tenant (página “endereço não encontrado”)
```

### 5.2 Prioridade em colisão

Com namespace único, passo 4 e 5 não colidem. Na migration inicial, backfill valida unicidade cruzada.

### 5.3 API pública

```
GET /api/v1/public/tenant
Header: Host: santa-casa-sjc.telefarmed.com.br

200 {
  "kind": "gestao" | "ubt" | "platform",
  "slug": "santa-casa-sjc",
  "entidadeId": "uuid",
  "ubtId": "uuid | null",
  "branding": { ...EntidadeBrandingPublic },
  "loginPath": "/login"
}
```

- Sem autenticação; rate limit; cache CDN 60s.
- Não expõe dados contratuais sensíveis.

---

## 6. Autenticação e sessão

### 6.1 Regras

| Portal | Usuário | Validação no login |
|--------|---------|-------------------|
| Gestão | Gestor (`usuarios_prefeitura`) | `user.entidadeContratanteId === tenant.entidadeId` |
| UBT | Operador (`usuarios_ubt`) | `user.unidadeUbtId === tenant.ubtId` (e mesma entidade) |

Falha → `403` com mensagem: *“Use o endereço da sua instituição: https://….telefarmed.com.br”*.

### 6.2 Cookies

| Decisão | Valor |
|---------|--------|
| Escopo | **Por subdomínio** (sem `Domain=.telefarmed.com.br`) |
| Motivo | Evitar sessão válida ao trocar de cliente digitando outro slug |
| Refresh | Mesmo host que emitiu o token |

### 6.3 Middleware API

Requests autenticados em rotas `/prefeitura/*` e `/ubt/*` revalidam que o tenant do `Host` (header `X-Forwarded-Host` em produção) bate com a sessão.

---

## 7. Infraestrutura (checklist ops)

| Item | Ação |
|------|------|
| DNS | `*.telefarmed.com.br` → frontend (Vercel/Cloudflare) |
| TLS | Certificado wildcard |
| SPA | Rewrite todas as rotas → `index.html` em qualquer subdomínio |
| API | `CORS`: origens `https://*.telefarmed.com.br` |
| Env | `PUBLIC_ROOT_DOMAIN=telefarmed.com.br` |
| Staging | `*.staging.telefarmed.com.br` ou prefixo slug `-staging` (decisão: **subdomínio staging separado** no mesmo padrão) |

---

## 8. Banco de dados (visão Fase 1+)

```sql
-- entidades_contratantes
slug TEXT UNIQUE,
slug_locked_at TIMESTAMPTZ,  -- após go-live

-- unidades_ubt
slug TEXT UNIQUE,
slug_locked_at TIMESTAMPTZ,

-- opcional fase 2
CREATE TABLE tenant_slug_redirects (
  slug TEXT PRIMARY KEY,
  target_kind TEXT NOT NULL, -- 'gestao' | 'ubt'
  target_id UUID NOT NULL,
  expires_at TIMESTAMPTZ
);
```

Backfill: gerar slugs para entidades/UBTs existentes antes de exigir NOT NULL em cadastros novos.

---

## 9. Links transacionais

Toda URL enviada ao usuário deve usar helper:

```ts
gestaoPublicUrl(entidadeSlug, path = '/login')
  → `https://${entidadeSlug}.${PUBLIC_ROOT_DOMAIN}${path}`

ubtPublicUrl(ubtSlug, path = '/login')
  → `https://${ubtSlug}.${PUBLIC_ROOT_DOMAIN}${path}`
```

Substituir usos de `prefeitura.telefarmed.com.br`, `PUBLIC_APP_URL/prefeitura`, etc.

---

## 10. Legado e migração

| Fase | Comportamento |
|------|----------------|
| **Atual** | `prefeitura.telefarmed.com.br` + `/prefeitura/*` em dev |
| **Transição** | Hosts fixos redirecionam para página “Informe o endereço da sua instituição” ou login genérico com campo slug |
| **Alvo** | Cada cliente só divulga seu `{slug}.telefarmed.com.br` |
| **Depreciação** | `prefeitura.telefarmed.com.br` → 301 para marketing ou busca de instituição (prazo: 6 meses após último cliente migrado) |

---

## 11. Fora do escopo (v1)

- Logo/cor **por UBT** (só herança da entidade).
- Domínio customizado do cliente (`painel.santacasa.org.br`).
- Multi-idioma por tenant.
- App mobile com deep link por slug (futuro).

---

## 12. Plano de implementação (referência)

| Fase | Entrega |
|------|---------|
| **0** | Este documento ✓ |
| **1** | Migration `slug` entidade + admin cadastro (logo, cor, slug) + API availability |
| **2** | `/public/tenant` + bootstrap front + login gestão por host |
| **3** | Auth amarrada ao host (gestão) |
| **4** | Migration `slug` UBT + cadastro UBT + login UBT por host |
| **5** | E-mails, PDFs, credenciais com URL pública |
| **6** | DNS wildcard produção + redirects legado |

---

## 13. Critérios de aceite (Fase 0 → pronto para Fase 1)

- [x] Modelo de URL gestão + UBT definido
- [x] Namespace único de slugs
- [x] Formato e lista de reservados
- [x] Branding: entidade no login; UBT herda entidade
- [x] Auth e cookies decididos
- [x] Legado `/prefeitura` documentado
- [ ] Aprovação explícita produto/ops (preencher nome/data abaixo)

**Aprovado por:** ___________________ **Data:** ___________
