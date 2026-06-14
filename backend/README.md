# Backend Telefarmed

Toda a API, scripts de banco e configuração de servidor ficam **nesta pasta** (`backend/`). O frontend (`src/`) só consome a API via HTTP.

## Estrutura

```
backend/
├── src/                    # API Node (Fastify)
│   ├── index.ts            # Entrada do servidor
│   ├── app.ts              # Rotas e middlewares
│   ├── config/env.ts       # Variáveis de ambiente (backend/.env)
│   ├── db/supabase.ts      # Cliente Supabase (service_role)
│   ├── lib/                # JWT, senha Argon2, CPF, RBAC
│   └── modules/
│       ├── admin-auth/     # Login, refresh, logout, PIN
│       ├── admin-credenciais/
│       ├── admin-configuracoes/
│       └── public-atendimento/  # API pública do paciente (codigo_atendimento)
├── scripts/                # Seed e setup Supabase
├── supabase/migrations/    # DDL do Postgres (português)
├── package.json
└── .env                    # Segredos do backend (não commitar)
```

## Configuração

1. Copie `backend/.env.example` → `backend/.env`
2. Preencha JWT e rode `npm run setup:supabase-env` (token em [Supabase account tokens](https://supabase.com/dashboard/account/tokens))
3. Instale dependências:

```bash
cd backend && npm install
```

Ou na raiz do monorepo:

```bash
npm install
```

## Desenvolvimento

Na **raiz do projeto**:

```bash
npm run dev:api    # API em http://localhost:3001
npm run dev        # frontend Vite (:5173) — proxy /api → backend
```

Só o backend:

```bash
cd backend && npm run dev
```

## API admin (exemplos)

| Método | Rota |
|--------|------|
| POST | `/api/v1/admin/auth/login` |
| POST | `/api/v1/admin/auth/refresh` |
| GET | `/api/v1/admin/credenciais/internos` |
| POST | `/api/v1/admin/credenciais/internos` |

## API pública — atendimento do paciente

Rotas em `/api/v1/atendimento`. **Sem autenticação JWT** — o `codigo` (16–64 caracteres alfanuméricos) identifica a consulta.

Módulo: `src/modules/public-atendimento/`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/:codigo/sessao` | Dados da consulta: paciente, médico, status, fila, documentos emitidos |
| GET | `/:codigo/fila` | Posição na fila, estimativa de espera, `readyForConsultation` |
| GET | `/:codigo/mensagens` | Chat da consulta (leitura em qualquer status legível) |
| POST | `/:codigo/mensagens` | Enviar texto (`{ conteudo }`) — só com consulta `em_andamento` |
| POST | `/:codigo/mensagens/upload` | Enviar anexo (PDF/imagem, multipart `file`) — só `em_andamento` |
| GET | `/:codigo/documentos` | PDFs emitidos pelo médico (receita, exame, atestado…) |
| GET | `/:codigo/documentos/:documentId/download` | URL assinada para download (`documentId` = `anexo-{uuid}`) |
| GET | `/:codigo/avaliacao` | Sessão da tela de avaliação pós-consulta |
| POST | `/:codigo/avaliacao` | Registrar avaliação (notas 1–5 profissional + teleconsulta) |
| GET | `/verificar/:codigo` | Verificação pública de autenticidade de documento (QR) |

### Fluxo de status

| `consultaStatus` | Fila (`readyForConsultation`) | Chat envio | Documentos |
|------------------|-------------------------------|------------|--------------|
| `aguardando_medico` | `false` — sala de espera | bloqueado | lista vazia ou parcial |
| `em_andamento` | `true` — entra na teleconsulta | permitido | atualiza conforme médico emite |
| `concluida` / `interrompida` | `false` | bloqueado | download disponível |
| `cancelada` | 410 — indisponível | — | — |

### Exemplo — carregar sessão

```http
GET /api/v1/atendimento/AbCdEf1234567890/sessao
```

Resposta (resumida):

```json
{
  "token": "AbCdEf1234567890",
  "consultaId": "uuid",
  "consultaStatus": "em_andamento",
  "patientName": "Maria Silva",
  "doctorName": "Dr. João Santos",
  "readyForConsultation": true,
  "fila": { "position": 1, "total": 1, "status": "em_atendimento", "estimatedMinutes": 0, "readyForConsultation": true },
  "consultationDocuments": []
}
```

### Frontend

Com `VITE_USE_MOCK_API` **não** definido como `true`, o front em `src/lib/services/public/atendimento.ts` já consome estas rotas. Polling: sessão/fila ~4s, documentos ~8s, chat ~4s.

## API profissional — atendimento médico

Rotas em `/api/v1/profissional/atendimentos`. Requer JWT profissional + permissão `agenda`/`atendimentos`.

Módulo: `src/modules/profissional-atendimentos/`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/fila-ativa` | Pacientes aguardando no plantão do médico |
| POST | `/iniciar` | Inicia consulta a partir da fila/agenda |
| GET | `/catalogo/exames` | Catálogo para pedido de exames |
| GET | `/sessao/:codigo` | Sessão completa da teleconsulta |
| POST | `/sessao/:codigo/iniciar` | `aguardando_medico` → `em_andamento` |
| GET | `/:consultaId/mensagens` | Chat |
| POST | `/:consultaId/mensagens` | Enviar texto |
| POST | `/:consultaId/mensagens/upload` | Anexo no chat (multipart) |
| PATCH | `/:consultaId/notas` | Anotação no prontuário (`modo: adicionar` \| `substituir`) |
| POST | `/:consultaId/prescricoes/emitir` | **Receita PDF timbrado** + QR de verificação |
| POST | `/:consultaId/solicitacoes-exame/emitir` | **Pedido de exames PDF** + QR |
| POST | `/:consultaId/atestados/emitir` | **Atestado PDF** + QR |
| GET | `/:consultaId/documentos/:documentId/download` | URL assinada do PDF emitido |
| POST | `/:consultaId/anexos/upload` | Upload de anexo avulso (PDF/imagem) |
| DELETE | `/:consultaId/anexos/:anexoId` | Remove documento/anexo emitido |
| POST | `/:consultaId/finalizar` | Encerra consulta (`notasClinicas`, `interrompido?`) |
| GET | `/` | Histórico paginado de atendimentos |
| GET | `/:consultaId` | Detalhe de atendimento concluído |

### PDFs timbrados

Gerados em `src/lib/documentos-clinicos/pdf-generator.ts` (PDFKit + QRCode):

- Cabeçalho com nome da entidade contratante e **logo** (quando cadastrado)
- Dados do paciente, profissional (CRM/RQE), unidade e especialidade
- Conteúdo clínico (medicamentos, exames ou atestado)
- Rodapé com QR Code apontando para `/verificar/:codigoVerificacao`
- Arquivo salvo em `consultas-anexos` + registro em `consulta_anexos.codigo_verificacao`

Variável `PUBLIC_APP_URL` em `backend/.env` define a URL base do QR.

### Exemplo — emitir receita

```http
POST /api/v1/profissional/atendimentos/{consultaId}/prescricoes/emitir
Authorization: Bearer …
Content-Type: application/json

{
  "medicamentos": [
    {
      "medicamentoNome": "Paracetamol 500mg",
      "dosagem": "1 comprimido",
      "frequencia": "8/8h",
      "duracao": "5 dias"
    }
  ],
  "observacoesGerais": "Retorno se piora."
}
```

Resposta: `{ "documento": { "id": "anexo-…", "kind": "receita", "downloadUrl": "…", "codigoVerificacao": "…" } }`

## Segurança e desempenho (teleconsulta)

### Controle de acesso

- **Paciente:** token `codigo_atendimento` (24 chars aleatórios, índice único); escrita só em `em_andamento`
- **Médico:** JWT + ownership (`ownership.ts`); plantão pode ler consulta `aguardando_medico` da sua agenda
- **Download de PDF:** valida `consulta_id` + `origem=profissional` antes de gerar URL assinada (anti-IDOR)

### Storage privado

- Bucket `consultas-anexos` (10 MB, PDF/imagem)
- URLs assinadas TTL **1 hora**; cache em memória ~50 min para reduzir chamadas no polling do chat
- Sem fallback para `arquivo_url` persistido — só `storage_path`

### Auditoria

- Portal `atendimento` em `auditoria_eventos` (migration `20260613180000`)
- Mutations públicas (`POST` chat/upload/avaliação) logadas via middleware
- Ações sensíveis explícitas: emitir PDF, finalizar consulta, download de documento, avaliação

### Rate limits

| Rota | Limite |
|------|--------|
| Global | 200/min |
| Chat paciente/profissional | 60/min |
| Avaliação paciente | 10/min |
| Verificação QR | 30/min |

### Cache HTTP

- Sessão, fila, mensagens, documentos: `Cache-Control: private, no-cache`
- Download URL / avaliação: `private, no-store`
- Verificação pública: `public, max-age=60`

### Índices (migration `20260613180000`)

- `consultas (profissional_id, status, criado_em)` — fila ativa do médico
- `consultas (fila_espera_id)` — lookup de fila
- `consulta_anexos (consulta_id, origem, criado_em)` — listagem de documentos

## Banco de dados

Migrations em `backend/supabase/migrations/`. Aplicar via Supabase MCP ou CLI apontando a esta pasta.

Seed do usuário master:

```bash
cd backend
ADMIN_MASTER_PASSWORD='sua-senha' npm run seed:admin-master
```

## Build

```bash
cd backend && npm run build && npm start
```
