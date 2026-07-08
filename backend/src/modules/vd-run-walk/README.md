# vd-run-walk

API VD (app cidades) para corrida/caminhada: atividades, metas, locais, sessões ao vivo, integrações e preparação.

Prefixo HTTP: `/api/v1/vd/run-walk`

## Rate limits

Além do limite global do app (200 req/min), rotas de criação têm limites por rota (`@fastify/rate-limit` via `route.config`):

| Rota | Constante | Limite |
|------|-----------|--------|
| `POST /atividades` | `RUN_WALK_CREATE_ATIVIDADE_RATE_LIMIT` | 30/min |
| `POST /locais` | `RUN_WALK_CREATE_LOCAL_RATE_LIMIT` | 10/min |
| `POST /live-sessoes/:id/pontos` | `RUN_WALK_APPEND_LIVE_POINTS_RATE_LIMIT` | 120/min |

Definições em `rate-limits.ts`. Resposta ao exceder: HTTP 429.

## Auditoria

O middleware global de auditoria **não** cobre `request.vdUser` (apenas portais admin/prefeitura/ubt/profissional). Eventos VD de run-walk são registrados explicitamente após operações bem-sucedidas, seguindo o padrão de `backend/src/lib/auditoria`:

| Helper | Quando | `recursoTipo` |
|--------|--------|---------------|
| `auditRunWalkAtividadeRegistered` | `POST /atividades` (criação ou reenvio idempotente) | `run_walk_atividade` |
| `auditRunWalkLocalCreated` | `POST /locais` | `running_route_spot` |
| `auditRunWalkLivePointsAppended` | `POST /live-sessoes/:id/pontos` | `run_walk_live_session` |

Implementação: `backend/src/lib/auditoria/vd-run-walk-events.ts` (portal `vd`, ator `paciente_app`). Falhas de gravação não interrompem a requisição (`logAuditoriaEventoSafe`).

## Sync com Minhas Métricas

Ao registrar atividade (`registerRunWalkAtividade`), o serviço chama `syncRunWalkAtividadeToMetricas` de forma best-effort (erro só em log). A leitura de passos é idempotente por `runWalkActivityId` nos metadados da leitura.

## Testes

### Smoke (`routes.test.ts`)

Verifica registro de rotas e resposta 401 sem JWT em endpoints protegidos.

### E2E (`routes.test.ts`)

Fluxo completo sem banco:

1. `registerVdRunWalkRoutes(app, { skipAuth: true })` injeta `RUN_WALK_E2E_TEST_VD_USER`.
2. `__setRunWalkCoreServiceDepsForTests` com `createInMemoryRunWalkCoreDeps()` (atividades + sync de métricas em memória).
3. `POST /atividades` → `GET /atividades` → `GET /atividades/resumo` → assert em `metricasInserts`.
4. Reenvio idempotente do mesmo `clientActivityId` retorna 200 sem duplicar métricas.
5. Rate limit: 31º `POST /atividades` retorna 429 (plugin `@fastify/rate-limit` com `global: false`).

Helpers de teste: `testing/inMemoryRunWalkCoreDeps.ts`, `testing/e2eTestVdUser.ts`.

Rodar:

```bash
cd backend && node --import tsx --test src/modules/vd-run-walk/*.test.ts
```

## Estrutura relevante

- `routes.ts` — HTTP + rate limit + auditoria
- `service.ts` — atividades (deps injetáveis para testes)
- `run-walk-metricas-sync.service.ts` — espelho em `vd-metricas`
- `atividades.repository.ts` — persistência Supabase
