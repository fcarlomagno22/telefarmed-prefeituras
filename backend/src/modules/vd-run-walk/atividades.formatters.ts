import type { z } from 'zod'
import type {
  createRunWalkAtividadeBodySchema,
  listRunWalkAtividadesQuerySchema,
  patchAtividadeCheckinBodySchema,
} from './schemas.js'
import { VdRunWalkError } from './errors.js'
import type { RunWalkAtividadeRow, RunWalkModality } from './types.js'

export type CreateRunWalkAtividadeInput = z.infer<typeof createRunWalkAtividadeBodySchema>
export type PatchRunWalkAtividadeCheckinInput = z.infer<typeof patchAtividadeCheckinBodySchema>
export type ListRunWalkAtividadesQuery = z.infer<typeof listRunWalkAtividadesQuerySchema>

const APP_TIMEZONE = 'America/Sao_Paulo'

export type RunWalkTrailPointDto = {
  latitude: number
  longitude: number
  recordedAt: number
}

export type RunWalkActivityCheckInDto = {
  intensity: string
  wellbeing: string
  discomfort: string
  note: string | null
  answeredAt: string
}

/** DTO alinhado a RunWalkActivitySummary do app (runWalkActivitySummaryStorage.ts). */
export type RunWalkAtividadeDto = {
  id: string
  clientActivityId: string
  modality: RunWalkModality
  activityName: string
  elapsedSeconds: number
  distanceKm: number
  averageSpeedKmh: number | null
  paceMinPerKm: number | null
  stepCount: number
  heartRateBpm: number
  estimatedCalories: number
  activeMinutes: number
  completedAt: string
  trail: RunWalkTrailPointDto[]
  trailPointCount: number
  locationCity: string | null
  locationState: string | null
  checkIn: RunWalkActivityCheckInDto | null
  checkInSkipped: boolean
  createdAt: string
  updatedAt: string
}

/** Listagem sem trail — alinhado ao feed de histórico do app. */
export type RunWalkAtividadeSummaryDto = Omit<RunWalkAtividadeDto, 'trail'>

export type RunWalkAtividadeListResultDto = {
  activities: RunWalkAtividadeSummaryDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

/** Detalhe com trail — alinhado a RunWalkHistoryActivityDrawer / computeKmSplits. */
export type RunWalkAtividadeDetailDto = RunWalkAtividadeSummaryDto & {
  trailSimplified: RunWalkTrailPointDto[]
}

function toNullableNumber(value: number | null | undefined): number | null {
  if (value == null) return null
  return Number.isFinite(value) ? value : null
}

function formatDistanceKm(value: number): number {
  return Number(Math.max(0, value).toFixed(3))
}

function formatPaceOrSpeed(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Number(value.toFixed(3))
}

export function normalizeTrailPoints(
  trail: CreateRunWalkAtividadeInput['trail'],
): RunWalkTrailPointDto[] {
  return trail.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    recordedAt: point.recordedAt,
  }))
}

export function resolveTrailPointCount(
  trail: CreateRunWalkAtividadeInput['trail'],
  trailPointCount?: number,
): number {
  if (trailPointCount != null && trailPointCount >= trail.length) {
    return trailPointCount
  }
  return trail.length
}

export function mapCreateInputToInsertRow(
  scope: { pacienteId: string; entidadeContratanteId: string },
  input: CreateRunWalkAtividadeInput,
) {
  const trailSimplified = normalizeTrailPoints(input.trail)

  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    client_activity_id: input.clientActivityId,
    modality: input.modality,
    activity_name: input.activityName.trim(),
    elapsed_seconds: input.elapsedSeconds,
    distance_km: formatDistanceKm(input.distanceKm),
    average_speed_kmh: formatPaceOrSpeed(input.averageSpeedKmh),
    pace_min_per_km: formatPaceOrSpeed(input.paceMinPerKm),
    step_count: input.stepCount,
    heart_rate_bpm: input.heartRateBpm,
    estimated_calories: input.estimatedCalories,
    active_minutes: input.activeMinutes,
    completed_at: input.completedAt,
    trail_simplified: trailSimplified,
    trail_point_count: resolveTrailPointCount(input.trail, input.trailPointCount),
    location_city: input.locationCity?.trim() || null,
    location_state: input.locationState?.trim() || null,
    check_in: input.checkIn ?? null,
    check_in_skipped: input.checkInSkipped ?? false,
  }
}

export function mapPatchCheckinInputToUpdateRow(input: PatchRunWalkAtividadeCheckinInput) {
  if ('checkInSkipped' in input) {
    return {
      check_in: null,
      check_in_skipped: true,
    }
  }

  return {
    check_in: input.checkIn,
    check_in_skipped: false,
  }
}

function parseTrailFromRow(value: unknown): RunWalkTrailPointDto[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((point) => {
    if (!point || typeof point !== 'object') return []

    const latitude = Number((point as { latitude?: unknown }).latitude)
    const longitude = Number((point as { longitude?: unknown }).longitude)
    const recordedAt = Number((point as { recordedAt?: unknown }).recordedAt)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(recordedAt)) {
      return []
    }

    return [{ latitude, longitude, recordedAt }]
  })
}

function parseCheckInFromRow(value: unknown): RunWalkActivityCheckInDto | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const intensity = record.intensity
  const wellbeing = record.wellbeing
  const discomfort = record.discomfort
  const answeredAt = record.answeredAt

  if (
    typeof intensity !== 'string' ||
    typeof wellbeing !== 'string' ||
    typeof discomfort !== 'string' ||
    typeof answeredAt !== 'string'
  ) {
    return null
  }

  const note = record.note
  return {
    intensity,
    wellbeing,
    discomfort,
    note: typeof note === 'string' ? note : note == null ? null : String(note),
    answeredAt,
  }
}

export function mapAtividadeRow(row: RunWalkAtividadeRow): RunWalkAtividadeDto {
  return {
    id: row.id,
    clientActivityId: row.client_activity_id,
    modality: row.modality,
    activityName: row.activity_name,
    elapsedSeconds: row.elapsed_seconds,
    distanceKm: formatDistanceKm(Number(row.distance_km)),
    averageSpeedKmh: toNullableNumber(
      row.average_speed_kmh == null ? null : Number(row.average_speed_kmh),
    ),
    paceMinPerKm: toNullableNumber(
      row.pace_min_per_km == null ? null : Number(row.pace_min_per_km),
    ),
    stepCount: row.step_count,
    heartRateBpm: row.heart_rate_bpm,
    estimatedCalories: row.estimated_calories,
    activeMinutes: row.active_minutes,
    completedAt: row.completed_at,
    trail: parseTrailFromRow(row.trail_simplified),
    trailPointCount: row.trail_point_count,
    locationCity: row.location_city,
    locationState: row.location_state,
    checkIn: parseCheckInFromRow(row.check_in),
    checkInSkipped: row.check_in_skipped,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }
}

export function mapAtividadeSummaryRow(row: RunWalkAtividadeRow): RunWalkAtividadeSummaryDto {
  const { trail: _trail, ...summary } = mapAtividadeRow(row)
  return summary
}

export function mapAtividadeDetailRow(row: RunWalkAtividadeRow): RunWalkAtividadeDetailDto {
  return {
    ...mapAtividadeSummaryRow(row),
    trailSimplified: parseTrailFromRow(row.trail_simplified),
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
    throw new VdRunWalkError('Período inválido.', 'INVALID_DATA')
  }

  return `${year}-${month}-${day}`
}

function dateKeyToStartIso(dateKey: string): string {
  return `${dateKey}T00:00:00.000-03:00`
}

function dateKeyToEndIso(dateKey: string): string {
  return `${dateKey}T23:59:59.999-03:00`
}

export function toBoundsStartIso(dateKey: string): string {
  return dateKeyToStartIso(dateKey)
}

export function toBoundsEndIso(dateKey: string): string {
  return dateKeyToEndIso(dateKey)
}

function shiftDateKey(dateKey: string, days: number): string {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-')
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw))
  date.setDate(date.getDate() + days)
  return getDateKeyInAppTz(date)
}

export function resolveAtividadeListBounds(
  query: Pick<ListRunWalkAtividadesQuery, 'period' | 'startIso' | 'endIso'>,
  now = new Date(),
): { startIso: string | null; endIso: string | null } {
  if (query.startIso || query.endIso) {
    if (!query.startIso || !query.endIso) {
      throw new VdRunWalkError('Informe startIso e endIso juntos.', 'INVALID_DATA')
    }

    const start = new Date(query.startIso)
    const end = new Date(query.endIso)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new VdRunWalkError('Período inválido.', 'INVALID_DATA')
    }

    if (start.getTime() > end.getTime()) {
      throw new VdRunWalkError('Período inválido.', 'INVALID_DATA')
    }

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    }
  }

  const period = query.period ?? 'all'
  if (period === 'all') {
    return { startIso: null, endIso: null }
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const endKey = getDateKeyInAppTz(now)
  const startKey = shiftDateKey(endKey, -(days - 1))

  return {
    startIso: dateKeyToStartIso(startKey),
    endIso: dateKeyToEndIso(endKey),
  }
}

export function resolveAtividadeListPagination(query: Pick<ListRunWalkAtividadesQuery, 'page' | 'pageSize'>) {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20
  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}

export function resolveAtividadeListHasMore(
  totalCount: number,
  page: number,
  pageSize: number,
): boolean {
  return page * pageSize < totalCount
}

export function buildAtividadeListResult(
  rows: RunWalkAtividadeRow[],
  totalCount: number,
  page: number,
  pageSize: number,
): RunWalkAtividadeListResultDto {
  return {
    activities: rows.map((row) => mapAtividadeSummaryRow(row)),
    totalCount,
    hasMore: resolveAtividadeListHasMore(totalCount, page, pageSize),
    page,
    pageSize,
  }
}

export function getDateKeyFromIsoInAppTz(iso: string): string {
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) {
    throw new VdRunWalkError('Data de atividade inválida.', 'INVALID_DATA')
  }
  return getDateKeyInAppTz(instant)
}

function weekdayIndexInAppTzForDateKey(dateKey: string): number {
  const instant = new Date(`${dateKey}T12:00:00.000-03:00`)
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(instant)
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

export function resolveWeekStartDateKeyFromCompletedAt(completedAtIso: string): string {
  const dateKey = getDateKeyFromIsoInAppTz(completedAtIso)
  const dayIndex = weekdayIndexInAppTzForDateKey(dateKey)
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex
  return shiftDateKey(dateKey, mondayOffset)
}

export function resolveWeekBoundsFromStartDateKey(semanaInicio: string): {
  startIso: string
  endIso: string
} {
  return {
    startIso: dateKeyToStartIso(semanaInicio),
    endIso: dateKeyToEndIso(shiftDateKey(semanaInicio, 6)),
  }
}

export function aggregateWeeklyProgressFromActivities(
  activities: Array<{ active_minutes: number; completed_at: string }>,
): {
  completedActivities: number
  activeMinutes: number
  movementDays: number
} {
  const daysWithActivity = new Set<string>()
  let activeMinutes = 0

  for (const activity of activities) {
    activeMinutes += activity.active_minutes
    daysWithActivity.add(getDateKeyFromIsoInAppTz(activity.completed_at))
  }

  return {
    completedActivities: activities.length,
    activeMinutes,
    movementDays: daysWithActivity.size,
  }
}
