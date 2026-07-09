# vd-active-mind

API VD (app cidades) para **Ativa Mente**: sessões de jogos cognitivos concluídas com sync offline-first.

Prefixo HTTP: `/api/v1/vd/active-mind`

Puzzles, sons, Lotties e catálogo de jogos permanecem no app (bundle local). O backend persiste apenas **sessões concluídas** com estatísticas da partida.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/sessoes` | Registra sessão concluída (idempotente por `clientSessionId`) |
| `GET` | `/sessoes` | Histórico paginado |
| `DELETE` | `/sessoes/:id` | Soft delete de sessão |
| `GET` | `/estatisticas-semanais` | Resumo da semana (`totalSessions`, `totalDurationSec`, `byGame`) |

Todas as rotas exigem JWT VD (`requireVdAuth`). Respostas autenticadas usam `Cache-Control: private, no-store`.

## Rate limits

Além do limite global do app (200 req/min):

| Rota | Constante | Limite |
|------|-----------|--------|
| `POST /sessoes` | `ACTIVE_MIND_CREATE_SESSAO_RATE_LIMIT` | 30/min |

Definições em `rate-limits.ts`. Resposta ao exceder: HTTP 429.

## Persistência

Migration: `backend/supabase/migrations/20260709160000_vd_active_mind_core.sql`

- Enums: `active_mind_game_id`, `active_mind_difficulty`
- `active_mind_sessoes` — sessões com soft delete (`deleted_at`)
- Idempotência offline: `UNIQUE (paciente_id, client_session_id)`
- Índice de histórico: `(paciente_id, completed_at DESC) WHERE deleted_at IS NULL`

Acesso exclusivo via `service_role` no backend (sem RLS para cliente).

## Validação e segurança

- `gameId` validado contra allowlist em `game-catalog.ts` (6 jogos do app)
- `difficulty`: `facil` \| `medio` \| `dificil`
- `clientSessionId`: 1–128 caracteres (trim)
- `puzzleId` opcional: 1–128 caracteres
- `durationSec` opcional: 1–86400
- `attempts`, `correct`, `errors`, `reveals`: inteiros ≥ 0
- `completedAt`: ISO válido, não futuro, máximo 7 dias no passado
- Schema POST **strict**: rejeita campos extras do client
- Escopo duplo em todas as queries: `paciente_id` + `entidade_contratante_id`

## Estratégia offline-first

1. No app, ao concluir uma partida, gera-se `ActiveMindSession.id` (UUID local).
2. Esse valor é enviado como `clientSessionId` no `POST /sessoes`.
3. A fila de sync (`activeMindSessionSyncQueue`) reenvia o mesmo payload em caso de falha de rede.
4. O backend garante idempotência com `UNIQUE (paciente_id, client_session_id)`:
   - Primeiro envio → **201** + `{ session }`
   - Reenvio com mesmo `clientSessionId` → **200** + mesma sessão (sem duplicar)
   - Reenvio após soft delete → **409 CONFLICT**
5. Race condition no insert → código Postgres `23505` → re-fetch → **200**

**Regra:** `clientSessionId` (API) = `session.id` (app). Nunca reutilizar o mesmo ID para partidas diferentes.

## Mapeamento app ↔ API

Referência futura: `app_cidades/src/types/activeMindSession.ts` ↔ helpers em `sessoes.formatters.ts`.

| App (`ActiveMindSession`) | Request POST | Response DTO |
|---------------------------|--------------|--------------|
| `id` | `clientSessionId` | `clientSessionId` |
| `gameId` | `gameId` | `gameId` |
| `difficulty` | `difficulty` | `difficulty` |
| `puzzleId` | `puzzleId` (opcional) | `puzzleId` |
| `durationSec` | `durationSec` (opcional) | `durationSec` |
| `stats.attempts` | `attempts` | `attempts` |
| `stats.correct` | `correct` | `correct` |
| `stats.errors` | `errors` | `errors` |
| `stats.reveals` | `reveals` | `reveals` |
| `completedAt` | `completedAt` (ISO) | `completedAt` (ISO) |
| — | — | `id` (UUID servidor) |
| `serverId` | — | mapeado de `id` |
| `syncedAt` | — | preenchido no app após sync |
| — | — | `createdAt` / `updatedAt` |

Helpers de conversão (backend):

- `mapAppSessionToCreateInput(session)` — app → POST body
- `mapSessaoDtoToAppSession(dto)` — response → `ActiveMindSession`
- `mapCreateInputToInsertRow(scope, input)` — POST validado → row Supabase
- `mapSessaoRow(row)` — row → DTO de resposta

### `gameId` permitidos

Espelham `ACTIVE_MIND_GAMES` em `app_cidades/src/config/activeMindGames.ts`:

| `gameId` | Jogo no app |
|----------|-------------|
| `form-the-word` | Forme a palavra |
| `calculations` | Cálculos |
| `logic-sequence` | Sequência lógica |
| `sudoku` | Sudoku |
| `crosswords` | Palavras cruzadas |
| `word-search` | Caça-palavras |

## App (app_cidades) — integração planejada

Ainda não implementada na Fase 2. Arquivos previstos:

| Arquivo | Função |
|---------|--------|
| `src/lib/api/vd/activeMind.ts` | Cliente HTTP |
| `src/config/activeMindApi.ts` | Flag `EXPO_PUBLIC_ACTIVE_MIND_API` |
| `src/data/activeMindSessionStorage.ts` | Cache AsyncStorage |
| `src/data/activeMindSessionSyncQueue.ts` | Fila `@telefarmed/active-mind-sync-queue` |

| Variável | Padrão | Efeito |
|----------|--------|--------|
| `EXPO_PUBLIC_ACTIVE_MIND_API` | `true` | `true` → sync com API; `false` → apenas local |

### Comportamento de sync (planejado)

1. **Vitória / Encerrar** — salva local + `POST /sessoes` (ou enfileira se offline).
2. **Login / restore** — `processActiveMindSessionSyncQueue`.
3. **Pull** — `GET /sessoes` merge com cache local.
4. **Card "Esta semana"** — `GET /estatisticas-semanais` (fallback: agregar cache local).

## Testes automatizados

### Smoke (`routes.test.ts`)

Verifica registro de rotas e resposta 401 sem JWT.

### E2E in-memory (`routes.test.ts`)

Fluxo completo sem banco:

1. `registerVdActiveMindRoutes(app, { skipAuth: true })` injeta `ACTIVE_MIND_E2E_TEST_VD_USER`.
2. `__setActiveMindServiceDepsForTests` com `createInMemoryActiveMindDeps()`.
3. `POST /sessoes` → `GET /sessoes` → `GET /estatisticas-semanais` → reenvio idempotente (200, sem duplicar) → `DELETE /sessoes/:id`.
4. Rate limit: 31º `POST /sessoes` retorna 429.
5. Validação: `gameId` inválido → 400; delete inexistente → 404.

Helpers: `testing/inMemoryActiveMindDeps.ts`, `testing/e2eTestVdUser.ts`.

Rodar:

```bash
cd backend && node --import tsx --test src/modules/vd-active-mind/*.test.ts
```

## Exemplos curl

Substitua `$TOKEN` pelo access token VD e `$HOST` pelo host do tenant (ex. `localhost`).

`completedAt` deve ser recente (não futuro, máximo 7 dias atrás).

```bash
# Registrar sessão concluída (Sudoku)
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "http://localhost:3001/api/v1/vd/active-mind/sessoes?host=$HOST" \
  -d '{
    "clientSessionId": "am-session-20260709-001",
    "gameId": "sudoku",
    "difficulty": "facil",
    "puzzleId": "sudoku-facil-42",
    "durationSec": 300,
    "attempts": 12,
    "correct": 8,
    "errors": 2,
    "reveals": 1,
    "completedAt": "2026-07-09T14:30:00.000-03:00"
  }'

# Reenvio idempotente (mesmo clientSessionId → 200, sem duplicar)
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "http://localhost:3001/api/v1/vd/active-mind/sessoes?host=$HOST" \
  -d '{
    "clientSessionId": "am-session-20260709-001",
    "gameId": "sudoku",
    "difficulty": "facil",
    "attempts": 12,
    "correct": 8,
    "errors": 2,
    "reveals": 1,
    "completedAt": "2026-07-09T14:30:00.000-03:00"
  }'

# Listar histórico
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/active-mind/sessoes?host=$HOST&page=1&pageSize=20"

# Filtrar por jogo e intervalo
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/active-mind/sessoes?host=$HOST&gameId=sudoku&startIso=2026-07-01T00:00:00.000Z&endIso=2026-07-31T23:59:59.999Z"

# Estatísticas da semana (segunda a domingo, America/Sao_Paulo)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/active-mind/estatisticas-semanais?host=$HOST"

# Semana específica (opcional)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/active-mind/estatisticas-semanais?host=$HOST&weekStartIso=2026-07-07T03:00:00.000Z"

# Remover sessão (soft delete)
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/active-mind/sessoes/SESSAO_UUID?host=$HOST"
```

### Resposta `GET /estatisticas-semanais`

```json
{
  "totalSessions": 5,
  "totalDurationSec": 1420,
  "byGame": [
    {
      "gameId": "sudoku",
      "count": 3,
      "totalAttempts": 36,
      "totalCorrect": 28,
      "totalErrors": 6
    },
    {
      "gameId": "crosswords",
      "count": 2,
      "totalAttempts": 20,
      "totalCorrect": 16,
      "totalErrors": 4
    }
  ],
  "weekStartIso": "2026-07-07T03:00:00.000Z",
  "weekEndIso": "2026-07-14T02:59:59.999Z"
}
```

## Estrutura relevante

- `routes.ts` — HTTP + rate limit + Cache-Control
- `service.ts` — sessões e stats (deps injetáveis para testes)
- `estatisticas-semanais.service.ts` — agregação semanal
- `sessoes.repository.ts` — Supabase
- `sessoes.formatters.ts` — DTOs, semana SP, mapeamento app
- `game-catalog.ts` — allowlist dos 6 jogos
- `schemas.ts` — validação Zod
- `scope.ts` / `errors.ts` / `types.ts` — auth scope e tipos

## Sync com Minhas Métricas

**Decisão v1: não sincronizar.**

O Ativa Mente registra sessões de jogos cognitivos (tentativas, acertos, erros), sem passos, distância ou calorias. Estatísticas semanais usam endpoint próprio (`/estatisticas-semanais`).
