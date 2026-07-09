import { useCallback, useRef } from 'react'
import { isActiveMindApiEnabled } from '../config/activeMindApi'
import { saveSession } from '../data/activeMindSessionStorage'
import {
  enqueueActiveMindSessionSync,
  startActiveMindSessionBackgroundSync,
} from '../data/activeMindSessionSyncQueue'
import { useAuth } from '../contexts/AuthContext'
import type { ActiveMindGameId, ActiveMindPlayDifficulty } from '../types/activeMind'
import {
  buildSessionFromVictory,
  type ActiveMindSessionStats,
} from '../types/activeMindSession'

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

/**
 * Persiste sessão Ativa Mente no momento da vitória / Encerrar.
 * Relógio da partida começa no mount; use `resetSessionClock` em Novo jogo.
 */
export function useActiveMindSessionCompletion(gameId: ActiveMindGameId) {
  const { user } = useAuth()
  const sessionStartRef = useRef(new Date().toISOString())
  const lastPersistedKeyRef = useRef<string | null>(null)

  const resetSessionClock = useCallback(() => {
    sessionStartRef.current = new Date().toISOString()
    lastPersistedKeyRef.current = null
  }, [])

  const completeSession = useCallback(
    (
      difficulty: ActiveMindPlayDifficulty,
      puzzleId: string | undefined,
      stats: ActiveMindSessionStats,
    ) => {
      const patientCpf = user?.cpf ?? 'guest'
      const startedAt = sessionStartRef.current
      const dedupeKey = `${difficulty}:${puzzleId ?? ''}:${startedAt}:${stats.attempts}:${stats.correct}:${stats.errors}:${stats.reveals}`

      if (lastPersistedKeyRef.current === dedupeKey) return
      lastPersistedKeyRef.current = dedupeKey

      const session = buildSessionFromVictory(gameId, difficulty, puzzleId, stats, startedAt)

      void (async () => {
        try {
          await saveSession(patientCpf, session)

          if (!isActiveMindApiEnabled() || isGuestPatient(patientCpf) || !user) {
            return
          }

          await enqueueActiveMindSessionSync(patientCpf, session)
          startActiveMindSessionBackgroundSync(patientCpf)
        } catch {
          // Offline ou erro transitório — cache local permanece válido.
        }
      })()
    },
    [gameId, user],
  )

  return {
    completeSession,
    resetSessionClock,
  }
}
