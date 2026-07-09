import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { getActiveMindGameById } from '../config/activeMindGames'
import type { ActiveMindSession } from '../types/activeMindSession'

export function formatActiveMindSessionDate(completedAt: string): string {
  const date = new Date(completedAt)
  if (!Number.isFinite(date.getTime())) return completedAt

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatActiveMindSessionDuration(durationSec?: number): string {
  if (durationSec == null || durationSec <= 0) return '—'

  if (durationSec < 60) {
    return `${durationSec}s`
  }

  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60
  if (seconds === 0) return `${minutes} min`
  return `${minutes}m ${seconds}s`
}

export function getActiveMindSessionGameTitle(session: ActiveMindSession): string {
  return getActiveMindGameById(session.gameId)?.title ?? session.gameId
}

export function getActiveMindSessionDifficultyLabel(session: ActiveMindSession): string {
  return getActiveMindDifficultyLabel(session.difficulty)
}
