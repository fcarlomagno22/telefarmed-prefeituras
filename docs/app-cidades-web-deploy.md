# Deploy web — app_cidades (VD)

App cidadão (Expo web). **Não** é portal gestão/UBT (`{slug}.telefarmed.com.br`).

## URLs

| Ambiente | Host |
|----------|------|
| **VD interno (Telefarmed)** | `https://vd.telefarmed.com.br` |
| **VD por cliente (futuro)** | `https://vd-{slug}.telefarmed.com.br` |
| **Gestão prefeitura** | `https://{slug}.telefarmed.com.br` ← **outro app** |

---

## Deploy recomendado — projeto Vercel separado

O domínio **`vd.telefarmed.com.br` deve apontar para um projeto Vercel só do `app_cidades`**, não para o projeto do portal admin/gestão (raiz do monorepo).

### Passo a passo

1. **Vercel → Add New Project** → mesmo repositório GitHub.
2. **Root Directory:** `app_cidades`
3. **Framework:** Other
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Domínios:** adicione `vd.telefarmed.com.br` **neste projeto**.
7. **Remova** `vd.telefarmed.com.br` do projeto do portal (raiz), se estiver lá.
8. **Environment Variables** (Production): copie os `EXPO_PUBLIC_*` do `.env` local.

DNS: CNAME `vd` → target indicado pela Vercel.

Após o deploy, `https://vd.telefarmed.com.br` deve servir o login escuro do app cidadão (Expo), **não** a tela branca “instituição/UBT”.

---

## Alternativa — monorepo na raiz (branch `main`)

O build na raiz (`npm run build:vercel`) também gera `dist/vd-app/` e rewrites para hosts `vd*`. Isso **só funciona em produção depois de merge na `main`**, pois hoje a produção Vercel usa a `main` sem esse build.

---

## Build local

```bash
cd app_cidades
npm install
npm run build
npx serve dist
```

## Dev

```bash
cd app_cidades
npx expo start --web
```

Simular host VD: `http://vd.localhost:8081`
