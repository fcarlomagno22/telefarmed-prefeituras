/** Limites por rota de criação/append — complementam o global (200/min) do app. */

export const RUN_WALK_CREATE_ATIVIDADE_RATE_LIMIT = {
  rateLimit: { max: 30, timeWindow: '1 minute' },
} as const

export const RUN_WALK_CREATE_LOCAL_RATE_LIMIT = {
  rateLimit: { max: 10, timeWindow: '1 minute' },
} as const

export const RUN_WALK_APPEND_LIVE_POINTS_RATE_LIMIT = {
  rateLimit: { max: 120, timeWindow: '1 minute' },
} as const
