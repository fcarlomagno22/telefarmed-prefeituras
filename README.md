# Telefarmed — Prefeituras

Frontend do sistema web com página de login configurável por variáveis de ambiente.

## Configuração

Copie `.env.example` para `.env` e ajuste os valores:

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
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```
