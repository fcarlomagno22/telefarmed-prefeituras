# vd-functional-training

API VD (app cidades) para Treino Funcional: favoritos, sessões concluídas e estatísticas semanais.

Prefixo HTTP: `/api/v1/vd/functional-training`

Catálogo de exercícios (20 slugs + Lottie) permanece no app (`app_cidades/src/data/functionalExercises.ts`). O backend valida `exercise_id` contra allowlist em `exercise-catalog.ts`.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/favoritos` | Lista IDs favoritos do paciente |
| `PUT` | `/favoritos/:exerciseId` | Favorita exercício |
| `DELETE` | `/favoritos/:exerciseId` | Remove favorito |
| `POST` | `/sessoes` | Registra sessão concluída (idempotente por `clientSessionId`) |
| `GET` | `/sessoes` | Histórico paginado |
| `GET` | `/estatisticas-semanais` | Card "Sua semana" (`sessionsCount`, `totalActiveMinutes`, `uniqueExercises`) |

Todas as rotas exigem JWT VD (`requireVdAuth`). Respostas autenticadas usam `Cache-Control: private, no-store`.

## Rate limits

Além do limite global do app (200 req/min):

| Rota | Constante | Limite |
|------|-----------|--------|
| `POST /sessoes` | `FUNCTIONAL_TRAINING_CREATE_SESSAO_RATE_LIMIT` | 30/min |

Definições em `rate-limits.ts`. Resposta ao exceder: HTTP 429.

## Persistência

Migration: `backend/supabase/migrations/20260709120000_vd_functional_training_core.sql`

- `functional_training_favoritos` — favoritos por paciente
- `functional_training_sessoes` — sessões com soft delete (`deleted_at`)
- Idempotência offline: `UNIQUE (paciente_id, client_session_id)`

Acesso exclusivo via `service_role` no backend (sem RLS para cliente).

## Sync com Minhas Métricas

**Decisão v1: não sincronizar.**

Motivos:

- Run-walk sincroniza passos/distância/calorias (`syncRunWalkAtividadeToMetricas`) porque a atividade gera leituras mensuráveis em `paciente_metricas_leituras` (`tipo: passos`).
- Treino funcional registra tempo ativo e slugs de exercícios, sem passos, distância ou calorias estimadas no modelo atual.
- O card "Sua semana" do Treino Funcional usa endpoint próprio (`/estatisticas-semanais`), independente de Minhas Métricas.

**Futuro (se necessário):** criar leitura dedicada (ex. `tipo: atividade_fisica` ou metadados `functionalTrainingSessionId`) com minutos ativos e contagem de sessões, espelhando o padrão de `run-walk-metricas-sync.service.ts`. Só implementar quando o produto exigir consolidar treino funcional no resumo de Minhas Métricas.

## Testes

### Smoke (`routes.test.ts`)

Verifica registro de rotas e resposta 401 sem JWT.

### E2E in-memory (`routes.test.ts`)

Fluxo completo sem banco:

1. `registerVdFunctionalTrainingRoutes(app, { skipAuth: true })` injeta `FUNCTIONAL_TRAINING_E2E_TEST_VD_USER`.
2. `__setFunctionalTrainingServiceDepsForTests` com `createInMemoryFunctionalTrainingDeps()`.
3. `PUT /favoritos/:id` → `GET /favoritos` → `DELETE /favoritos/:id`.
4. `POST /sessoes` → `GET /sessoes` → `GET /estatisticas-semanais` → reenvio idempotente (200, sem duplicar).
5. Rate limit: 31º `POST /sessoes` retorna 429.

Helpers: `testing/inMemoryFunctionalTrainingDeps.ts`, `testing/e2eTestVdUser.ts`.

Rodar:

```bash
cd backend && node --import tsx --test src/modules/vd-functional-training/*.test.ts
```

## Exemplos curl

Substitua `$TOKEN` pelo access token VD e `$HOST` pelo host do tenant (ex. `localhost`).

```bash
# Favoritos
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/functional-training/favoritos?host=$HOST"

curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/functional-training/favoritos/afundo?host=$HOST"

# Registrar sessão
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "http://localhost:3001/api/v1/vd/functional-training/sessoes?host=$HOST" \
  -d '{
    "clientSessionId": "client-session-12345678",
    "mode": "single",
    "durationSec": 30,
    "totalActiveSec": 28,
    "exerciseIds": ["abdominal-reverso"],
    "completedAt": "2026-07-08T10:30:00.000-03:00"
  }'

# Estatísticas da semana
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/vd/functional-training/estatisticas-semanais?host=$HOST"
```

## Estrutura relevante

- `routes.ts` — HTTP + rate limit
- `service.ts` — favoritos e sessões (deps injetáveis para testes)
- `estatisticas-semanais.service.ts` — agregação semanal
- `favoritos.repository.ts` / `sessoes.repository.ts` — Supabase
- `exercise-catalog.ts` — allowlist dos 20 exercícios do app

## App (app_cidades)

Integração offline-first em `src/data/functionalTrainingStorage.ts`. Flag `EXPO_PUBLIC_FUNCTIONAL_TRAINING_API` (padrão `true`).
