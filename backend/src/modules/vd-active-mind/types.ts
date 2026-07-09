/** Tipos base do módulo Ativa Mente — alinhados à migration vd_active_mind_core. */

export { ACTIVE_MIND_GAME_IDS, type ActiveMindGameId } from './game-catalog.js'
import type { ActiveMindGameId } from './game-catalog.js'

export const ACTIVE_MIND_DIFFICULTIES = ['facil', 'medio', 'dificil'] as const

export type ActiveMindDifficulty = (typeof ACTIVE_MIND_DIFFICULTIES)[number]

export type VdActiveMindPacienteScope = {
  pacienteId: string
  entidadeContratanteId: string
  cpf: string
}

/**
 * Formato local do app — espelha `ActiveMindSession` em
 * app_cidades/src/types/activeMindSession.ts (futuro sync offline-first).
 */
export type AppActiveMindSession = {
  id: string
  gameId: ActiveMindGameId
  difficulty: ActiveMindDifficulty
  puzzleId?: string
  durationSec?: number
  stats: {
    attempts: number
    correct: number
    errors: number
    reveals: number
  }
  completedAt: string
  serverId?: string
  syncedAt?: string
}

export type ActiveMindSessaoRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  client_session_id: string
  game_id: ActiveMindGameId
  difficulty: ActiveMindDifficulty
  puzzle_id: string | null
  duration_sec: number | null
  attempts: number
  correct: number
  errors: number
  reveals: number
  completed_at: string
  deleted_at: string | null
  criado_em: string
  atualizado_em: string
}

/** Body de POST /sessoes */
export type CreateActiveMindSessaoInput = {
  clientSessionId: string
  gameId: ActiveMindGameId
  difficulty: ActiveMindDifficulty
  puzzleId?: string
  durationSec?: number
  attempts: number
  correct: number
  errors: number
  reveals: number
  completedAt: string
}

/** Query de GET /sessoes */
export type ListActiveMindSessoesQuery = {
  startIso?: string
  endIso?: string
  gameId?: ActiveMindGameId
  page: number
  pageSize: number
}

/** DTO de resposta de uma sessão */
export type ActiveMindSessaoDto = {
  id: string
  clientSessionId: string
  gameId: ActiveMindGameId
  difficulty: ActiveMindDifficulty
  puzzleId: string | null
  durationSec: number | null
  attempts: number
  correct: number
  errors: number
  reveals: number
  completedAt: string
  createdAt: string
  updatedAt: string
}

/** DTO de resposta paginada de GET /sessoes */
export type ActiveMindSessaoListResultDto = {
  sessions: ActiveMindSessaoDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

/** Payload de insert no repositório */
export type InsertActiveMindSessaoRow = {
  paciente_id: string
  entidade_contratante_id: string
  client_session_id: string
  game_id: ActiveMindGameId
  difficulty: ActiveMindDifficulty
  puzzle_id: string | null
  duration_sec: number | null
  attempts: number
  correct: number
  errors: number
  reveals: number
  completed_at: string
}
