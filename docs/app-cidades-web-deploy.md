# Deploy web — app_cidades (VD)

App cidadão (Expo web) para ambiente interno Telefarmed, **sem** white label de cliente.

## URL de produção (VD)

**https://vd.telefarmed.com.br**

## Vercel — projeto separado

O monorepo já usa a raiz para o portal admin/gestão. O `app_cidades` precisa de **um segundo projeto** na Vercel:

| Campo | Valor |
|-------|--------|
| **Root Directory** | `app_cidades` |
| **Framework Preset** | Other |
| **Build Command** | `npm run build` (ou `npm run vercel-build`) |
| **Output Directory** | `dist` |
| **Node.js** | 20.x |

### Domínio

1. No projeto Vercel do `app_cidades`, em **Settings → Domains**, adicione `vd.telefarmed.com.br`.
2. No DNS de `telefarmed.com.br`, crie **CNAME** `vd` → `cname.vercel-dns.com` (ou o alvo indicado pela Vercel).

### Variáveis de ambiente (Production)

Copie do `.env` local (mesmos `EXPO_PUBLIC_*`):

- `EXPO_PUBLIC_LOGO_URL`
- `EXPO_PUBLIC_BACKGROUND_IMAGE_URL`
- `EXPO_PUBLIC_MUNICIPALITY_NAME`
- `EXPO_PUBLIC_RPM_SUBDOMAIN`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- (opcional) `EXPO_PUBLIC_OPENAI_API_KEY`, `EXPO_PUBLIC_OPENAI_MODEL`

Opcional: `EXPO_PUBLIC_APP_WEB_URL=https://vd.telefarmed.com.br`

## Build local

```bash
cd app_cidades
npm install
npm run build
npx serve dist
```

## PWA

Com HTTPS em `vd.telefarmed.com.br`, o drawer de instalação e o botão **Instalar** funcionam no Chrome Android.
