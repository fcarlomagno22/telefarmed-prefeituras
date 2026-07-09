import type { ActiveMindGameId, ActiveMindPlayDifficulty } from './activeMind'

export type ActiveMindSessionStats = {
  attempts: number
  correct: number
  errors: number
  reveals: number
}

export type ActiveMindSession = {
  /** UUID local — enviado como `clientSessionId` na API. */
  id: string
  gameId: ActiveMindGameId
  difficulty: ActiveMindPlayDifficulty
  puzzleId?: string
  durationSec?: number
  stats: ActiveMindSessionStats
  /** ISO datetime de conclusão da partida. */
  completedAt: string
  /** UUID do servidor após sync bem-sucedido. */
  serverId?: string
  /** ISO datetime do último sync com a API. */
  syncedAt?: string
}

export function createActiveMindSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function computeDurationSec(startedAt?: string): number | undefined {
  if (!startedAt) {
    return undefined
  }

  const startedMs = Date.parse(startedAt)
  if (!Number.isFinite(startedMs)) {
    return undefined
  }

  const elapsedSec = Math.round((Date.now() - startedMs) / 1000)
  if (elapsedSec < 1) {
    return 1
  }

  if (elapsedSec > 86_400) {
    return 86_400
  }

  return elapsedSec
}

export function buildSessionFromVictory(
  gameId: ActiveMindGameId,
  difficulty: ActiveMindPlayDifficulty,
  puzzleId: string | undefined,
  stats: ActiveMindSessionStats,
  startedAt?: string,
): ActiveMindSession {
  return {
    id: createActiveMindSessionId(),
    gameId,
    difficulty,
    puzzleId,
    durationSec: computeDurationSec(startedAt),
    stats: {
      attempts: stats.attempts,
      correct: stats.correct,
      errors: stats.errors,
      reveals: stats.reveals,
    },
    completedAt: new Date().toISOString(),
  }
}
