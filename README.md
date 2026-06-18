# Telefarmed — Prefeituras

Monorepo: **frontend** na raiz (`src/`) e **backend** em [`backend/`](backend/README.md) (API Fastify + migrations Supabase).

Documentação operacional do whitelabel (decisões de produto, QA): [`docs/whitelabel-operacional.md`](docs/whitelabel-operacional.md).

Arquitetura de tenants por subdomínio (Fase 0): [`docs/tenant-hosts.md`](docs/tenant-hosts.md).

## Configuração do frontend

Copie `.env.example` para `.env` na raiz e ajuste os valores:

| Variável | Descrição |
|----------|-----------|
| `VITE_BRAND_COLOR` | Cor primária da marca (hex) |
| `VITE_LOGO_URL` | URL ou caminho do logo (ex: `/logo.svg`) |
| `VITE_BACKGROUND_IMAGE_URL` | Imagem de fundo do painel esquerdo |
| `VITE_HEADLINE` | Título principal à direita |
| `VITE_SUBHEADLINE` | Subtítulo |
| `VITE_WELCOME_TITLE` | Título do card de login |
| `VITE_WELCOME_SUBTITLE` | Texto auxiliar do card |
| `VITE_COPYRIGHT` | Rodapé |

Para imagens locais, coloque os arquivos em `public/` e referencie com caminho absoluto (ex: `/login-bg.jpg`).

## Desenvolvimento

```bash
npm install          # instala frontend + backend (postinstall)
npm run dev:api      # API :3001 (terminal 1)
npm run dev          # frontend :5173 (terminal 2)
```

Configure o backend em `backend/.env` (veja `backend/.env.example`). Acesse [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```
