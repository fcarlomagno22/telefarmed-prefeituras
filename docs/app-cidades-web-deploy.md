# Deploy web — app_cidades (VD)

App cidadão (Expo web). **Não** usa o portal de gestão/UBT (`{slug}.telefarmed.com.br`).

## URLs

| Ambiente | Host | Uso |
|----------|------|-----|
| **VD interno (Telefarmed)** | `https://vd.telefarmed.com.br` | App de testes / operação interna |
| **VD por cliente (futuro)** | `https://vd-{slug}.telefarmed.com.br` | White label por prefeitura |
| **Gestão do cliente** | `https://{slug}.telefarmed.com.br` | Portal gestor — **outro app** |

Exemplos:

- Gestão Santa Casa: `https://santa-casa-sjc.telefarmed.com.br`
- App cidadão Santa Casa (futuro): `https://vd-santa-casa-sjc.telefarmed.com.br`
- VD interno: `https://vd.telefarmed.com.br`

## Deploy na Vercel (monorepo)

O projeto **principal** na Vercel já publica o portal admin/gestão. O build `npm run build:vercel`:

1. Compila API + portal Vite → `dist/`
2. Compila `app_cidades` (Expo web) → `app_cidades/dist/`
3. Copia o app cidadão para `dist/vd-app/`
4. O **middleware** (`middleware.ts`) roteia hosts `vd` e `vd-*` para `dist/vd-app/`

### DNS

- `vd.telefarmed.com.br` → mesmo projeto Vercel do monorepo (CNAME Vercel)
- Não cadastre `vd` como slug de entidade/UBT no admin

### Variáveis de ambiente (Production)

Defina no projeto Vercel (build do `app_cidades` lê `EXPO_PUBLIC_*` no build):

- `EXPO_PUBLIC_LOGO_URL`
- `EXPO_PUBLIC_BACKGROUND_IMAGE_URL`
- `EXPO_PUBLIC_MUNICIPALITY_NAME`
- `EXPO_PUBLIC_RPM_SUBDOMAIN`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Opcional: `PUBLIC_ROOT_DOMAIN=telefarmed.com.br` (middleware)

## Build local

```bash
cd app_cidades
npm install
npm run build
npx serve dist
```

Ou build completo igual à Vercel:

```bash
npm run build:vercel
npx serve dist/vd-app
```

## Dev local (app cidadão)

```bash
cd app_cidades
npx expo start --web
```

Simular host VD: `http://vd.localhost:8081` (com `server.host: true`).

## PWA

Com HTTPS em `vd.telefarmed.com.br`, o drawer de instalação funciona no Chrome Android.
