import type { z } from 'zod'
import type {
  createFunctionalTrainingSessaoBodySchema,
  listFunctionalTrainingSessoesQuerySchema,
} from './schemas.js'
import type {
  FunctionalTrainingMode,
  FunctionalTrainingSessaoRow,
  VdFunctionalTrainingPacienteScope,
} from './types.js'

export type CreateFunctionalTrainingSessaoInput = z.infer<
  typeof createFunctionalTrainingSessaoBodySchema
>
export type ListFunctionalTrainingSessoesQuery = z.infer<
  typeof listFunctionalTrainingSessoesQuerySchema
>

const APP_TIMEZONE = 'America/Sao_Paulo'

export type FunctionalTrainingSessaoDto = {
  id: string
  clientSessionId: string
  mode: FunctionalTrainingMode
  durationSec: number
  totalActiveSec: number
  exerciseIds: string[]
  completedAt: string
  createdAt: string
  updatedAt: string
}

export type FunctionalTrainingSessaoListResultDto = {
  sessions: FunctionalTrainingSessaoDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type WeeklyTrainingStatsDto = {
  sessionsCount: number
  totalActiveMinutes: number
  uniqueExercises: number
}

export type InsertSessaoRow = {
  paciente_id: string
  entidade_contratante_id: string
  client_session_id: string
  modo: FunctionalTrainingMode
  duration_sec: number
  total_active_sec: number
  exercise_ids: string[]
  completed_at: string
}

export function mapSessaoRow(row: FunctionalTrainingSessaoRow): FunctionalTrainingSessaoDto {
  return {
    id: row.id,
    clientSessionId: row.client_session_id,
    mode: row.modo,
    durationSec: row.duration_sec,
    totalActiveSec: row.total_active_sec,
    exerciseIds: [...row.exercise_ids],
    completedAt: row.completed_at,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }
}

export function mapCreateInputToInsertRow(
  scope: VdFunctionalTrainingPacienteScope,
  input: CreateFunctionalTrainingSessaoInput,
): InsertSessaoRow {
  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    client_session_id: input.clientSessionId.trim(),
    modo: input.mode,
    duration_sec: input.durationSec,
    total_active_sec: input.totalActiveSec,
    exercise_ids: input.exerciseIds,
    completed_at: input.completedAt,
  }
}

export function buildSessaoListResult(
  rows: FunctionalTrainingSessaoRow[],
  totalCount: number,
  page: number,
  pageSize: number,
): FunctionalTrainingSessaoListResultDto {
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

export function aggregateWeeklyTrainingStats(
  rows: Array<{ total_active_sec: number; exercise_ids: string[] }>,
): WeeklyTrainingStatsDto {
  const uniqueExercises = new Set<string>()
  let totalActiveSec = 0

  for (const row of rows) {
    totalActiveSec += row.total_active_sec
    for (const exerciseId of row.exercise_ids) {
      uniqueExercises.add(exerciseId)
    }
  }

  return {
    sessionsCount: rows.length,
    totalActiveMinutes: Math.round(totalActiveSec / 60),
    uniqueExercises: uniqueExercises.size,
  }
}
