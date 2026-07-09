import type { z } from 'zod'
import type {
  createActiveMindSessaoBodySchema,
  listActiveMindSessoesQuerySchema,
} from './schemas.js'
import type {
  ActiveMindGameId,
  ActiveMindSessaoDto,
  ActiveMindSessaoListResultDto,
  ActiveMindSessaoRow,
  AppActiveMindSession,
  VdActiveMindPacienteScope,
} from './types.js'

export type CreateActiveMindSessaoInput = z.infer<typeof createActiveMindSessaoBodySchema>
export type ListActiveMindSessoesQuery = z.infer<typeof listActiveMindSessoesQuerySchema>

const APP_TIMEZONE = 'America/Sao_Paulo'

export type InsertSessaoRow = {
  paciente_id: string
  entidade_contratante_id: string
  client_session_id: string
  game_id: ActiveMindSessaoRow['game_id']
  difficulty: ActiveMindSessaoRow['difficulty']
  puzzle_id: string | null
  duration_sec: number | null
  attempts: number
  correct: number
  errors: number
  reveals: number
  completed_at: string
}

export function mapSessaoRow(row: ActiveMindSessaoRow): ActiveMindSessaoDto {
  return {
    id: row.id,
    clientSessionId: row.client_session_id,
    gameId: row.game_id,
    difficulty: row.difficulty,
    puzzleId: row.puzzle_id,
    durationSec: row.duration_sec,
    attempts: row.attempts,
    correct: row.correct,
    errors: row.errors,
    reveals: row.reveals,
    completedAt: row.completed_at,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }
}

export function mapCreateInputToInsertRow(
  scope: VdActiveMindPacienteScope,
  input: CreateActiveMindSessaoInput,
): InsertSessaoRow {
  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    client_session_id: input.clientSessionId.trim(),
    game_id: input.gameId,
    difficulty: input.difficulty,
    puzzle_id: input.puzzleId?.trim() ?? null,
    duration_sec: input.durationSec ?? null,
    attempts: input.attempts,
    correct: input.correct,
    errors: input.errors,
    reveals: input.reveals,
    completed_at: input.completedAt,
  }
}

export function mapAppSessionToCreateInput(session: AppActiveMindSession): CreateActiveMindSessaoInput {
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

export function mapSessaoDtoToAppSession(dto: ActiveMindSessaoDto): AppActiveMindSession {
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
  }
}

export function buildSessaoListResult(
  rows: ActiveMindSessaoRow[],
  totalCount: number,
  page: number,
  pageSize: number,
): ActiveMindSessaoListResultDto {
  return {
    sessions: rows.map(mapSessaoRow),
    totalCount,
    hasMore: page * pageSize < totalCount,
    page,
    pageSize,
  }
}

function getDateKeyInAppTz(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Data inválida.')
  }

  return `${year}-${month}-${day}`
}

function weekdayIndexInAppTz(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0))
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(utcDate)

  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  }

  return map[weekday] ?? 0
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year!, month! - 1, day!))
  utcDate.setUTCDate(utcDate.getUTCDate() + days)

  const shiftedYear = utcDate.getUTCFullYear()
  const shiftedMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
  const shiftedDay = String(utcDate.getUTCDate()).padStart(2, '0')
  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`
}

function dateKeyToStartIso(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year!, month! - 1, day!, 3, 0, 0))
  return utcDate.toISOString()
}

function dateKeyToEndIso(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year!, month! - 1, day!, 26, 59, 59, 999))
  return utcDate.toISOString()
}

export function resolveCurrentWeekStartIso(now = new Date(), weekStartIso?: string): string {
  if (weekStartIso) {
    return weekStartIso
  }

  const dateKey = getDateKeyInAppTz(now)
  const dayIndex = weekdayIndexInAppTz(dateKey)
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex
  const weekStartDateKey = shiftDateKey(dateKey, mondayOffset)
  return dateKeyToStartIso(weekStartDateKey)
}

export function resolveWeekBounds(weekStartIso: string): { startIso: string; endIso: string } {
  const weekStartDateKey = getDateKeyInAppTz(new Date(weekStartIso))
  return {
    startIso: dateKeyToStartIso(weekStartDateKey),
    endIso: dateKeyToEndIso(shiftDateKey(weekStartDateKey, 6)),
  }
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

type WeeklyActiveMindStatsRow = Pick<
  ActiveMindSessaoRow,
  'game_id' | 'duration_sec' | 'attempts' | 'correct' | 'errors'
>

export function aggregateWeeklyActiveMindStats(
  rows: WeeklyActiveMindStatsRow[],
  bounds: { startIso: string; endIso: string },
): WeeklyActiveMindStatsDto {
  const byGameMap = new Map<ActiveMindGameId, WeeklyActiveMindStatsByGameDto>()
  let totalDurationSec = 0

  for (const row of rows) {
    totalDurationSec += row.duration_sec ?? 0

    const existing = byGameMap.get(row.game_id) ?? {
      gameId: row.game_id,
      count: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      totalErrors: 0,
    }

    existing.count += 1
    existing.totalAttempts += row.attempts
    existing.totalCorrect += row.correct
    existing.totalErrors += row.errors
    byGameMap.set(row.game_id, existing)
  }

  const byGame = [...byGameMap.values()].sort((left, right) => right.count - left.count)

  return {
    totalSessions: rows.length,
    totalDurationSec,
    byGame,
    weekStartIso: bounds.startIso,
    weekEndIso: bounds.endIso,
  }
}
