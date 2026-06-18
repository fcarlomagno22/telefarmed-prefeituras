# Guia Vercel — subdomínios por cliente (`*.telefarmed.com.br`)

Passo a passo didático para configurar na Vercel o que **só você** pode fazer (DNS, domínio wildcard, variáveis de ambiente). O código da aplicação já está preparado para isso.

**Leia também:** [`tenant-hosts.md`](tenant-hosts.md) (arquitetura) · [`whitelabel-operacional.md`](whitelabel-operacional.md) (QA e whitelabel).

---

## O que você vai conseguir no final

| URL de exemplo | Quem usa |
|----------------|----------|
| `https://santa-casa-sjc.telefarmed.com.br/login` | Gestor do cliente (portal de gestão) |
| `https://ubs-centro-sjc.telefarmed.com.br/login` | Operador do terminal UBT |
| `https://admin.telefarmed.com.br` | Admin Telefarmed (inalterado) |
| `https://profissional.telefarmed.com.br` | Médicos (inalterado) |

Cada cliente tem **seu próprio subdomínio** com logo e cor na tela de login.

---

## Pré-requisitos

1. **Conta Vercel no plano Pro** (ou superior) — wildcard `*.seudominio.com` exige Pro.
2. **Acesso ao DNS** do domínio `telefarmed.com.br` (Registro.br, Cloudflare, etc.).
3. **Projeto já deployado** na Vercel (frontend + API serverless em `api/index.ts`).
4. **Migration `tenant_slug` aplicada** no Supabase (colunas `slug` em entidades e UBTs).

---

## Visão geral (3 blocos)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  DNS            │ ──► │  Vercel          │ ──► │  App (React + API)  │
│  *.telefarmed   │     │  wildcard + TLS  │     │  resolve slug/host  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

1. **DNS** aponta qualquer subdomínio para a Vercel.
2. **Vercel** emite certificado TLS e entrega o mesmo build do frontend.
3. **App** lê o host (`santa-casa-sjc.telefarmed.com.br`), chama `GET /api/v1/public/tenant?slug=...` e abre o portal certo.

---

## Parte 1 — Domínios na Vercel

### 1.1 Abrir o projeto

1. Acesse [vercel.com](https://vercel.com) e faça login.
2. Abra o projeto **Telefarmed** (o que faz deploy deste repositório).

### 1.2 Ir em Domains

1. Clique em **Settings** (Configurações).
2. No menu lateral, clique em **Domains**.

### 1.3 Adicionar domínio raiz (se ainda não tiver)

1. Em **Add**, digite: `telefarmed.com.br`
2. Siga as instruções da Vercel para validar (registro TXT ou nameservers).
3. Aguarde status **Valid** (pode levar de minutos a algumas horas).

### 1.4 Adicionar wildcard (o mais importante)

1. Em **Add**, digite exatamente:

   ```
   *.telefarmed.com.br
   ```

2. A Vercel vai mostrar o que configurar no DNS (geralmente um **CNAME**).

   > Se pedir plano Pro, faça upgrade antes — sem isso o wildcard não funciona.

3. **Não remova** os subdomínios fixos que já existem:
   - `admin.telefarmed.com.br`
   - `prefeitura.telefarmed.com.br` (legado; pode manter até depreciar)
   - `profissional.telefarmed.com.br`
   - `ubt.telefarmed.com.br`
   - `seguranca.telefarmed.com.br`

   Eles continuam funcionando; o wildcard cobre **todos os outros** slugs de clientes.

### 1.5 Conferir status

Na lista de domínios, cada entrada deve estar **Valid** (verde). Se estiver **Pending**:

- Confira se o registro DNS foi salvo no provedor correto.
- Use `dig` ou ferramentas online para ver se o CNAME já propagou.

---

## Parte 2 — DNS no provedor do domínio

O passo exato depende se você usa **nameservers da Vercel** ou **DNS externo**.

### Opção A — Nameservers da Vercel (mais simples)

1. No Registro.br (ou onde comprou o domínio), altere os nameservers para os que a Vercel indicar em **Domains**.
2. A Vercel passa a gerenciar **todos** os registros (`@`, `www`, `*`, `admin`, etc.).
3. Aguarde propagação (até 48 h, em geral bem menos).

### Opção B — DNS externo (Cloudflare, Registro.br DNS, etc.)

1. Mantenha os registros atuais de `admin`, `profissional`, etc.
2. Adicione o registro que a Vercel pediu para o wildcard, em geral:

   | Tipo | Nome / Host | Valor / Aponta para |
   |------|-------------|---------------------|
   | CNAME | `*` | `cname.vercel-dns.com` |

   (O valor exato aparece na tela da Vercel — use **sempre** o que ela mostrar.)

3. Para o domínio raiz `@`, se necessário, use o registro A/ALIAS que a Vercel indicar.

### Teste rápido de DNS

No terminal (Mac/Linux):

```bash
dig +short teste-slug.telefarmed.com.br CNAME
```

Se retornar algo apontando para a Vercel, o wildcard está no caminho certo.

---

## Parte 3 — Variáveis de ambiente na Vercel

### 3.1 Onde configurar

1. No projeto Vercel: **Settings** → **Environment Variables**.

### 3.2 Variáveis do backend (API)

Adicione ou confira para **Production** (e Preview se quiser testar em PR):

| Variável | Valor sugerido | Para quê |
|----------|----------------|----------|
| `PUBLIC_ROOT_DOMAIN` | `telefarmed.com.br` | Extrair slug do host |
| `CORS_ALLOW_TENANT_ORIGINS` | `true` | Permitir login/API de `*.telefarmed.com.br` |

As demais variáveis do backend (Supabase, secrets, etc.) permanecem como já estão.

### 3.3 Variáveis do frontend (build)

| Variável | Valor sugerido | Para quê |
|----------|----------------|----------|
| `VITE_PUBLIC_ROOT_DOMAIN` | `telefarmed.com.br` | Mesmo domínio raiz no browser |
| `VITE_API_BASE_URL` | `/api/v1` | API no mesmo host (já padrão) |

### 3.4 Redeploy

Depois de alterar variáveis:

1. Vá em **Deployments**.
2. No último deploy, menu **⋯** → **Redeploy**.
3. Marque **Use existing Build Cache** desligado se mudou só env de build.

---

## Parte 4 — Cadastrar slug no admin (dados)

A Vercel só entrega o site; o **slug** vem do banco.

1. No admin, abra o cliente (entidade contratante).
2. Defina o **slug** (ex.: `santa-casa-sjc`) — letras minúsculas, hífens, sem acento.
3. Para cada UBT, defina outro slug único (ex.: `ubs-centro-sjc`).
4. Salve e anote a URL pública: `https://{slug}.telefarmed.com.br/login`.

> Enquanto o campo slug não estiver na UI do admin, um desenvolvedor pode preencher direto no Supabase na coluna `slug` de `entidades_contratantes` ou `unidades_ubt`.

---

## Parte 5 — Testar em produção

### Checklist

- [ ] `https://admin.telefarmed.com.br` abre o admin.
- [ ] `https://{slug-cliente}.telefarmed.com.br/login` mostra logo/cor e tela de login da gestão.
- [ ] `https://{slug-ubt}.telefarmed.com.br/login` abre o terminal UBT.
- [ ] `https://slug-inexistente.telefarmed.com.br` mostra página “Endereço não encontrado”.
- [ ] Login no slug do cliente **não** funciona em outro slug (sessão isolada por host — evolução futura reforça isso).

### Testar a API diretamente

```bash
curl -s "https://admin.telefarmed.com.br/api/v1/public/tenant?slug=SEU-SLUG" | jq
```

Resposta esperada (200): `kind`, `slug`, `branding`, `loginPath`, `publicUrl`.  
404 = slug não cadastrado ou entidade sem branding.

---

## Parte 6 — Desenvolvimento local (opcional)

Sem configurar Vercel, você pode simular tenant no Mac:

1. Suba o projeto: `npm run dev` (frontend) + backend na porta 3001.
2. Acesse no navegador:

   ```
   http://santa-casa-sjc.localhost:5173/login
   ```

   (troque `santa-casa-sjc` pelo slug cadastrado no banco)

3. O Vite já aceita hosts `.localhost` (`vite.config.ts` → `allowedHosts`).

---

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---------|----------------|-------------|
| `DNS_PROBE_FINISHED_NXDOMAIN` | Wildcard não configurado | Revise CNAME `*` na Parte 2 |
| Certificado SSL inválido | DNS ainda propagando | Aguarde; confira domínio **Valid** na Vercel |
| Página em branco / 404 Vercel | Projeto errado ou deploy falhou | Veja **Deployments** e logs de build |
| “Endereço não encontrado” no app | Slug vazio no banco | Preencha `slug` na entidade/UBT |
| CORS no login do subdomínio | `CORS_ALLOW_TENANT_ORIGINS` false | Parte 3.2 + redeploy |
| API 404 em `/public/tenant` | Backend antigo deployado | Redeploy com código novo |

---

## O que a Vercel **não** faz sozinha

- Não cria slugs — isso é cadastro no admin/Supabase.
- Não substitui e-mails ao cliente com a URL correta — sua operação envia o link `https://{slug}.telefarmed.com.br`.
- Não exige projeto separado por cliente: **um** projeto Vercel + wildcard atende todos.

---

## Resumo em 5 passos

1. **Pro** na Vercel + domínio `telefarmed.com.br` validado.
2. Adicionar **`*.telefarmed.com.br`** em Domains.
3. Configurar **CNAME `*`** (ou nameservers Vercel) no DNS.
4. Variáveis `PUBLIC_ROOT_DOMAIN`, `CORS_ALLOW_TENANT_ORIGINS`, `VITE_PUBLIC_ROOT_DOMAIN` + **redeploy**.
5. Cadastrar **slug** no cliente/UBT e testar `https://{slug}.telefarmed.com.br/login`.

Dúvidas sobre arquitetura: [`tenant-hosts.md`](tenant-hosts.md).
