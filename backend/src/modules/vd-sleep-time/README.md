# vd-sleep-time

API VD (app cidades) para **Hora de Dormir**: registros de sono com sync offline-first.

Prefixo HTTP: `/api/v1/vd/sleep-time`

Sons, respiração guiada e histórias permanecem no app (bundle local). O backend persiste apenas os **registros de sono** (`SleepLogEntry`).

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/registros` | Registra sono (idempotente por `clientLogId`) |
| `GET` | `/registros` | Histórico paginado |
| `DELETE` | `/registros/:id` | Soft delete de registro |

Todas as rotas exigem JWT VD (`requireVdAuth`). Respostas autenticadas usam `Cache-Control: private, no-store`.

## Rate limits

Além do limite global do app (200 req/min):

| Rota | Constante | Limite |
|------|-----------|--------|
| `POST /registros` | `SLEEP_TIME_CREATE_REGISTRO_RATE_LIMIT` | 30/min |

Definições em `rate-limits.ts`. Resposta ao exceder: HTTP 429.

## Persistência

Migration: `backend/supabase/migrations/20260709140000_vd_sleep_time_core.sql`

- `sleep_time_registros` — registros com soft delete (`deleted_at`)
- Idempotência offline: `UNIQUE (paciente_id, client_log_id)`
- `duration_minutes` recalculado no backend a partir de `bed_at` / `wake_at`
- Índice de histórico: `(paciente_id, wake_at DESC) WHERE deleted_at IS NULL`

Acesso exclusivo via `service_role` no backend (sem RLS para cliente).

## Validação e segurança

- `wake_at` deve ser posterior a `bed_at`
- Duração máxima: 24 horas
- `wake_at` não pode estar no futuro
- `notes`: caracteres de controle removidos, trim, máximo 500 caracteres (`notes.ts` + Zod)
- Schema POST **strict**: rejeita `durationMinutes` e campos extras do client

## Mapeamento app ↔ API

Referência: `app_cidades/src/types/sleepLog.ts` ↔ helpers em `registros.formatters.ts`.

| App (`SleepLogEntry`) | Request POST | Response DTO |
|-----------------------|--------------|--------------|
| `id` | `clientLogId` | `clientLogId` |
| `bedDateIso` + `bedTimeMinutes` | `bedAt` (ISO) | `bedAt` (ISO) |
| `wakeDateIso` + `wakeTimeMinutes` | `wakeAt` (ISO) | `wakeAt` (ISO) |
| `durationMinutes` | **não enviar** (recalculado no servidor) | `durationMinutes` |
| `quality` | `quality` (1–5) | `quality` |
| `wakeCount` | `wakeCount` (0–20) | `wakeCount` |
| `notes` | `notes` (opcional) | `notes` |
| `createdAt` | — | `createdAt` |
| — | — | `id` (UUID servidor) |
| — | — | `updatedAt` |

Helpers de conversão (para sync no app):

- `mapAppSleepLogEntryToCreateInput(entry)` — app → POST body
- `mapRegistroDtoToAppSleepLogEntry(dto)` — response → `SleepLogEntry`
- `buildSleepAtIsoFromParts(dateIso, timeMinutes)` / `extractSleepDatePartsFromIso(iso)`

Estatísticas semanais/mensais (gráficos do Histórico) continuam computadas no client (`sleepHistoryStats.ts`) — sem endpoint v1.

## App (app_cidades)

Integração offline-first em `src/data/sleepLogStorage.ts`.

| Variável | Padrão | Efeito |
|----------|--------|--------|
| `EXPO_PUBLIC_SLEEP_TIME_API` | `true` | `true` → sync com API; `false` → apenas AsyncStorage (só para dev isolado) |

Arquivos principais:

- `src/lib/api/vd/sleepTime.ts` — cliente HTTP
- `src/config/sleepTimeApi.ts` — flag de API
- `src/data/sleepLogStorage.ts` — cache, fila offline, pull paginado
- `src/data/sleepLogSyncQueue.ts` — fila `@telefarmed/sleep-log-sync-queue`

### Comportamento de sync

1. **Save** — write-through no cache + `POST /registros` (ou enfileira se offline).
2. **Mount / login** — `startSleepLogsBackgroundSync` (debounce 60s).
3. **Pull-to-refresh** — `syncSleepLogs({ force: true })`.
4. **Pull inicial** — últimos 90 dias; meses antigos carregados sob demanda ao navegar no calendário.
5. **`loadSleepLogData`** — só lê cache local; não dispara sync.

## Testes automatizados

### Smoke (`routes.test.ts`)

Verifica registro de rotas e resposta 401 sem JWT.

### E2E in-memory (`routes.test.ts`)

Fluxo completo sem banco:

1. `registerVdSleepTimeRoutes(app, { skipAuth: true })` injeta `SLEEP_TIME_E2E_TEST_VD_USER`.
2. `__setSleepTimeServiceDepsForTests` com `createInMemorySleepTimeDeps()`.
3. `POST /registros` → `GET /registros` → reenvio idempotente (200, sem duplicar) → `DELETE /registros/:id`.
4. Rate limit: 31º `POST /registros` retorna 429.
5. Validação Zod via HTTP: datas futuras, quality/wakeCount fora do intervalo.
6. Idempotência: mesmo `clientLogId` retorna mesmo `id`; pacientes diferentes podem compartilhar `clientLogId`.
7. Isolamento: paciente B não lista nem deleta registro do paciente A.
8. Paginação (`page`, `pageSize`, `hasMore`) e filtro `startIso`/`endIso`.

Helpers: `testing/inMemorySleepTimeDeps.ts`, `testing/e2eTestVdUser.ts`.

Rodar:

```bash
cd backend && node --import tsx --test src/modules/vd-sleep-time/*.test.ts
```

## Testes manuais (app)

Pré-requisitos: backend rodando, migration aplicada, usuário VD autenticado (não guest).

### 1. Offline → online → sync

1. Abrir **Hora de Dormir** com rede ativa; aguardar sync inicial.
2. Desativar rede (modo avião ou DevTools offline).
3. Registrar uma noite via botão **+** e salvar.
4. Verificar que o registro aparece no histórico local (aba Histórico).
5. Reativar a rede.
6. Fazer pull-to-refresh na aba Histórico **ou** sair e reentrar na tela.
7. **Esperado:** registro permanece visível; no backend (`GET /registros` ou Supabase) o registro existe com o mesmo `client_log_id` do app.

### 2. Trocar de device → dados aparecem

1. No **device A**, registrar pelo menos uma noite com usuário VD logado (rede ativa).
2. Confirmar sync (refresh ou reabrir tela).
3. No **device B**, fazer login com o **mesmo** usuário/paciente.
4. Abrir **Hora de Dormir** → aba Histórico.
5. **Esperado:** registros do device A aparecem após sync inicial (últimos 90 dias). Registros em meses mais antigos exigem navegar no calendário para o mês correspondente (lazy load).

### 3. Idempotência (opcional)

1. Registrar a mesma noite duas vezes (mesmo horário) — o app gera `clientLogId` único por save; reenvio da fila offline não deve duplicar no servidor.
2. Simular falha de rede no save, depois sync — **esperado:** um único registro no backend por `client_log_id`.

## Exemplos curl

Substitua `$TOKEN` pelo access token VD e `$HOST` pelo host do tenant (ex. `localhost`).

```bash
# Registrar sono
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "http://localhost:3001/api/v1/vd/sleep-time/registros?host=$HOST" \
  -d '{
    "clientLogId": "1734567890-abc123",
    "bedAt": "2026-07-08T22:30:00.000-03:00",
    "wakeAt": "2026-07-09T07:00:00.000-03:00",
    "quality": 4,
    "wakeCount": 1,
    "notes": "Dormi bem."
  }'

# Listar histórico (últimos 90 dias)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/sleep-time/registros?host=$HOST&startIso=2026-04-09T00:00:00.000Z&page=1&pageSize=50"

# Remover registro (soft delete)
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/sleep-time/registros/REGISTRO_UUID?host=$HOST"
```

## Estrutura relevante

- `routes.ts` — HTTP + rate limit + Cache-Control
- `service.ts` — registros (deps injetáveis para testes)
- `registros.repository.ts` — Supabase
- `registros.formatters.ts` — DTOs e cálculo de duração
- `schemas.ts` — validação Zod alinhada a `app_cidades/src/types/sleepLog.ts`
- `notes.ts` — sanitização de notas
