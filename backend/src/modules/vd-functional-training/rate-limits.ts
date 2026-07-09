/** Limites por rota de criação — complementam o global (200/min) do app. */

export const FUNCTIONAL_TRAINING_CREATE_SESSAO_RATE_LIMIT = {
  rateLimit: { max: 30, timeWindow: '1 minute' },
} as const
