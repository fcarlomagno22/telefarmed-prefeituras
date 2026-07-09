import type { ActiveMindGameId, ActiveMindPlayDifficulty } from '../../../types/activeMind'
import type { ActiveMindSession } from '../../../types/activeMindSession'
import { vdRequest } from './client'

export type ActiveMindSessaoDto = {
  id: string
  clientSessionId: string
  gameId: ActiveMindGameId
  difficulty: ActiveMindPlayDifficulty
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

export type RegisterActiveMindSessionResult = {
  session: ActiveMindSessaoDto
}

export type CreateActiveMindSessionInput = {
  clientSessionId: string
  gameId: ActiveMindGameId
  difficulty: ActiveMindPlayDifficulty
  puzzleId?: string
  durationSec?: number
  attempts: number
  correct: number
  errors: number
  reveals: number
  completedAt: string
}

export type ActiveMindSessionListResultDto = {
  sessions: ActiveMindSessaoDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type ListActiveMindSessionsQuery = {
  startIso?: string
  endIso?: string
  gameId?: ActiveMindGameId
  page?: number
  pageSize?: number
}

export type WeeklyActiveMindStatsByGameDto = {
  gameId: ActiveMindGameId
  count: number
  totalAttempts: number
  totalCorrect: number
  totalErrors: number
}

export type WeeklyActiveMindStatsDto = {
  totalSessions: number
  totalDurationSec: number
  byGame: WeeklyActiveMindStatsByGameDto[]
  weekStartIso: string
  weekEndIso: string
}

export function mapActiveMindSessionToCreateInput(
  session: ActiveMindSession,
): CreateActiveMindSessionInput {
  return {
    clientSessionId: session.id,
    gameId: session.gameId,
    difficulty: session.difficulty,
    puzzleId: session.puzzleId,
    durationSec: session.durationSec,
    attempts: session.stats.attempts,
    correct: session.stats.correct,
    errors: session.stats.errors,
    reveals: session.stats.reveals,
    completedAt: session.completedAt,
  }
}

export function mapActiveMindSessaoDtoToSession(
  dto: ActiveMindSessaoDto,
  syncedAt?: string,
): ActiveMindSession {
  return {
    id: dto.clientSessionId,
    gameId: dto.gameId,
    difficulty: dto.difficulty,
    puzzleId: dto.puzzleId ?? undefined,
    durationSec: dto.durationSec ?? undefined,
    stats: {
      attempts: dto.attempts,
      correct: dto.correct,
      errors: dto.errors,
      reveals: dto.reveals,
    },
    completedAt: dto.completedAt,
    serverId: dto.id,
    syncedAt,
  }
}

export async function createActiveMindSession(
  input: CreateActiveMindSessionInput,
): Promise<RegisterActiveMindSessionResult> {
  return vdRequest<RegisterActiveMindSessionResult>({
    method: 'POST',
    path: '/vd/active-mind/sessoes',
    body: input,
    credentials: 'include',
  })
}

export async function listActiveMindSessions(
  query: ListActiveMindSessionsQuery = {},
): Promise<ActiveMindSessionListResultDto> {
  return vdRequest<ActiveMindSessionListResultDto>({
    method: 'GET',
    path: '/vd/active-mind/sessoes',
    query: {
      startIso: query.startIso,
      endIso: query.endIso,
      gameId: query.gameId,
      page: query.page != null ? String(query.page) : undefined,
      pageSize: query.pageSize != null ? String(query.pageSize) : undefined,
    },
    credentials: 'include',
  })
}

export async function deleteActiveMindSession(
  serverId: string,
): Promise<RegisterActiveMindSessionResult> {
  return vdRequest<RegisterActiveMindSessionResult>({
    method: 'DELETE',
    path: `/vd/active-mind/sessoes/${encodeURIComponent(serverId)}`,
    credentials: 'include',
  })
}

export async function getActiveMindWeeklyStats(
  weekStartIso?: string,
): Promise<WeeklyActiveMindStatsDto> {
  return vdRequest<WeeklyActiveMindStatsDto>({
    method: 'GET',
    path: '/vd/active-mind/estatisticas-semanais',
    query: {
      weekStartIso,
    },
    credentials: 'include',
  })
}
