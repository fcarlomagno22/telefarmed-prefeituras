/** Limites por rota de criação — complementam o global (200/min) do app. */

export const SLEEP_TIME_CREATE_REGISTRO_RATE_LIMIT = {
  rateLimit: { max: 30, timeWindow: '1 minute' },
} as const
