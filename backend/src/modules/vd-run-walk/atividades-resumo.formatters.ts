import type { z } from 'zod'
import type { resumoRunWalkAtividadesQuerySchema } from './schemas.js'
import {
  getDateKeyFromIsoInAppTz,
  resolveAtividadeListBounds,
  resolveWeekStartDateKeyFromCompletedAt,
  toBoundsEndIso,
  toBoundsStartIso,
} from './atividades.formatters.js'
import type { RunWalkModality } from './types.js'

export type ResumoRunWalkAtividadesQuery = z.infer<typeof resumoRunWalkAtividadesQuerySchema>

export type ResumoRunWalkAtividadesQueryInput = {
  period?: ResumoRunWalkAtividadesQuery['period']
  startIso?: string
  endIso?: string
  minDistanceKm?: number
  chartMetric?: ResumoRunWalkAtividadesQuery['chartMetric']
}

function resolveResumoQueryDefaults(
  query: ResumoRunWalkAtividadesQueryInput,
): ResumoRunWalkAtividadesQuery {
  return {
    period: query.period,
    startIso: query.startIso,
    endIso: query.endIso,
    minDistanceKm: query.minDistanceKm ?? 0,
    chartMetric: query.chartMetric ?? 'minutes',
  }
}

export type ResumoAtividadeRecord = {
  id: string
  activityName: string
  modality: RunWalkModality
  distanceKm: number
  activeMinutes: number
  estimatedCalories: number
  elapsedSeconds: number
  paceMinPerKm: number | null
  completedAt: string
  dateIso: string
}

export type RunWalkResumoPeriodSummaryDto = {
  totalDistanceKm: number
  totalActiveMinutes: number
  totalWorkouts: number
  totalCalories: number
  distanceDeltaPct: number | null
  minutesDeltaPct: number | null
  workoutsDeltaPct: number | null
  caloriesDeltaPct: number | null
}

export type RunWalkResumoTrendPointDto = {
  id: string
  label: string
  value: number
  dateIso: string
  activityName: string
}

export type RunWalkResumoHeatmapCellDto = {
  dateIso: string
  day: number
  intensity: number
  activeMinutes: number
  distanceKm: number
  hasActivity: boolean
}

export type RunWalkResumoHighlightDto = {
  id: string
  title: string
  value: string
  subtitle: string
  accent: string
  activityId?: string
}

export type RunWalkResumoChartDayDto = {
  dateIso: string
  dayLabel: string
  weekdayShort: string
  dateShort: string
  isToday: boolean
  isFuture: boolean
  activeMinutes: number
  distanceKm: number
}

export type RunWalkAtividadesResumoDto = {
  periodSummary: RunWalkResumoPeriodSummaryDto
  trendPoints: RunWalkResumoTrendPointDto[]
  heatmapCells: RunWalkResumoHeatmapCellDto[]
  highlights: RunWalkResumoHighlightDto[]
  chartDays: RunWalkResumoChartDayDto[]
}

const APP_TIMEZONE = 'America/Sao_Paulo'
const PT_BR = 'pt-BR'

export function mapRowToResumoAtividade(row: {
  id: string
  activity_name: string
  modality: RunWalkModality
  distance_km: number
  active_minutes: number
  estimated_calories: number
  elapsed_seconds: number
  pace_min_per_km: number | null
  completed_at: string
}): ResumoAtividadeRecord {
  return {
    id: row.id,
    activityName: row.activity_name,
    modality: row.modality,
    distanceKm: Number(Number(row.distance_km).toFixed(3)),
    activeMinutes: row.active_minutes,
    estimatedCalories: row.estimated_calories,
    elapsedSeconds: row.elapsed_seconds,
    paceMinPerKm: row.pace_min_per_km == null ? null : Number(row.pace_min_per_km),
    completedAt: row.completed_at,
    dateIso: getDateKeyFromIsoInAppTz(row.completed_at),
  }
}

function getDateKeyInAppTzFromDate(date: Date): string {
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

function shiftDateKey(dateKey: string, days: number): string {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-')
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw))
  date.setDate(date.getDate() + days)
  return getDateKeyInAppTzFromDate(date)
}

function parseDateKey(dateKey: string): Date {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-').map(Number)
  return new Date(yearRaw, monthRaw - 1, dayRaw, 12, 0, 0, 0)
}

function daysBetweenInclusive(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey)
  const end = parseDateKey(endKey)
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
}

function formatWeeklyChartDate(dateKey: string): string {
  const date = parseDateKey(dateKey)
  const day = date.getDate()
  const month = date
    .toLocaleDateString(PT_BR, { month: 'short', timeZone: APP_TIMEZONE })
    .replace('.', '')
    .toLowerCase()
  return `${day}/${month}`
}

function formatPaceMinPerKm(pace: number | null): string {
  if (pace == null || !Number.isFinite(pace)) return '—'
  const minutes = Math.floor(pace)
  const seconds = Math.round((pace - minutes) * 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function computeDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function aggregateSummary(
  activities: ResumoAtividadeRecord[],
): Omit<
  RunWalkResumoPeriodSummaryDto,
  'distanceDeltaPct' | 'minutesDeltaPct' | 'workoutsDeltaPct' | 'caloriesDeltaPct'
> {
  return activities.reduce(
    (acc, activity) => ({
      totalDistanceKm: Number((acc.totalDistanceKm + activity.distanceKm).toFixed(3)),
      totalActiveMinutes: acc.totalActiveMinutes + activity.activeMinutes,
      totalWorkouts: acc.totalWorkouts + 1,
      totalCalories: acc.totalCalories + activity.estimatedCalories,
    }),
    {
      totalDistanceKm: 0,
      totalActiveMinutes: 0,
      totalWorkouts: 0,
      totalCalories: 0,
    },
  )
}

function isWithinIsoRange(iso: string, startIso: string | null, endIso: string | null): boolean {
  const time = new Date(iso).getTime()
  if (startIso && time < new Date(startIso).getTime()) return false
  if (endIso && time > new Date(endIso).getTime()) return false
  return true
}

export function resolvePreviousMonthBoundsInAppTz(now = new Date()): {
  startIso: string
  endIso: string
  startKey: string
  endKey: string
} {
  const currentKey = getDateKeyInAppTzFromDate(now)
  const [yearRaw, monthRaw] = currentKey.split('-').map(Number)
  const previousMonthDate = new Date(yearRaw, monthRaw - 2, 1)
  const previousYear = previousMonthDate.getFullYear()
  const previousMonth = previousMonthDate.getMonth() + 1
  const startKey = `${previousYear}-${String(previousMonth).padStart(2, '0')}-01`
  const lastDay = new Date(previousYear, previousMonth, 0).getDate()
  const endKey = `${previousYear}-${String(previousMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return {
    startKey,
    endKey,
    startIso: toBoundsStartIso(startKey),
    endIso: toBoundsEndIso(endKey),
  }
}

export function resolveCurrentMonthBoundsInAppTz(now = new Date()): {
  startIso: string
  endIso: string
  startKey: string
  endKey: string
  year: number
  month: number
} {
  const currentKey = getDateKeyInAppTzFromDate(now)
  const [yearRaw, monthRaw] = currentKey.split('-').map(Number)
  const lastDay = new Date(yearRaw, monthRaw, 0).getDate()
  const startKey = `${yearRaw}-${String(monthRaw).padStart(2, '0')}-01`
  const endKey = `${yearRaw}-${String(monthRaw).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return {
    year: yearRaw,
    month: monthRaw,
    startKey,
    endKey,
    startIso: toBoundsStartIso(startKey),
    endIso: toBoundsEndIso(endKey),
  }
}

export function resolveResumoFetchBounds(
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): { startIso: string | null; endIso: string | null; fetchAll: boolean } {
  const resolved = resolveResumoQueryDefaults(query)
  const period = resolved.period ?? '30d'
  const periodBounds = resolveAtividadeListBounds(
    {
      period: resolved.startIso && resolved.endIso ? undefined : period,
      startIso: resolved.startIso,
      endIso: resolved.endIso,
    },
    now,
  )
  const previousMonth = resolvePreviousMonthBoundsInAppTz(now)
  const currentMonth = resolveCurrentMonthBoundsInAppTz(now)

  if (period === 'all' && !resolved.startIso && !resolved.endIso) {
    return { startIso: null, endIso: periodBounds.endIso, fetchAll: true }
  }

  const startKeys = [previousMonth.startKey, currentMonth.startKey]
  if (periodBounds.startIso) {
    startKeys.push(getDateKeyFromIsoInAppTz(periodBounds.startIso))
  }

  const earliestKey = startKeys.sort()[0] ?? previousMonth.startKey

  return {
    startIso: toBoundsStartIso(earliestKey),
    endIso: periodBounds.endIso,
    fetchAll: false,
  }
}

export function filterResumoActivities(
  activities: ResumoAtividadeRecord[],
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): ResumoAtividadeRecord[] {
  const resolved = resolveResumoQueryDefaults(query)
  const bounds = resolveAtividadeListBounds(
    {
      period: resolved.startIso && resolved.endIso ? undefined : (resolved.period ?? '30d'),
      startIso: resolved.startIso,
      endIso: resolved.endIso,
    },
    now,
  )
  const minDistanceKm = resolved.minDistanceKm

  return activities.filter((activity) => {
    if (!isWithinIsoRange(activity.completedAt, bounds.startIso, bounds.endIso)) return false
    if (activity.distanceKm < minDistanceKm) return false
    return true
  })
}

export function computeResumoPeriodSummary(
  activities: ResumoAtividadeRecord[],
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): RunWalkResumoPeriodSummaryDto {
  const current = filterResumoActivities(activities, query, now)
  const previousMonth = resolvePreviousMonthBoundsInAppTz(now)
  const previous = activities.filter((activity) =>
    isWithinIsoRange(activity.completedAt, previousMonth.startIso, previousMonth.endIso),
  )

  const currentSummary = aggregateSummary(current)
  const previousSummary = aggregateSummary(previous)

  return {
    ...currentSummary,
    distanceDeltaPct: computeDeltaPct(
      currentSummary.totalDistanceKm,
      previousSummary.totalDistanceKm,
    ),
    minutesDeltaPct: computeDeltaPct(
      currentSummary.totalActiveMinutes,
      previousSummary.totalActiveMinutes,
    ),
    workoutsDeltaPct: computeDeltaPct(
      currentSummary.totalWorkouts,
      previousSummary.totalWorkouts,
    ),
    caloriesDeltaPct: computeDeltaPct(
      currentSummary.totalCalories,
      previousSummary.totalCalories,
    ),
  }
}

function mapModalityToChartType(
  modality: RunWalkModality,
): 'walk' | 'run-walk' | 'run' {
  if (modality === 'run') return 'run'
  if (modality === 'run-walk') return 'run-walk'
  return 'walk'
}

function buildChartDaysForRange(
  activities: ResumoAtividadeRecord[],
  startKey: string,
  endKey: string,
  now = new Date(),
): RunWalkResumoChartDayDto[] {
  const todayKey = getDateKeyInAppTzFromDate(now)
  const daysCount = daysBetweenInclusive(startKey, endKey)

  return Array.from({ length: daysCount }, (_, index) => {
    const dateKey = shiftDateKey(startKey, index)
    const dayActivities = activities.filter((activity) => activity.dateIso === dateKey)
    const activeMinutes = dayActivities.reduce((sum, activity) => sum + activity.activeMinutes, 0)
    const distanceKm = dayActivities.reduce((sum, activity) => sum + activity.distanceKm, 0)
    const date = parseDateKey(dateKey)

    const weekdayShort = date
      .toLocaleDateString(PT_BR, { weekday: 'short', timeZone: APP_TIMEZONE })
      .replace('.', '')
      .toLowerCase()

    return {
      dateIso: dateKey,
      dayLabel: date.toLocaleDateString(PT_BR, {
        day: 'numeric',
        month: 'short',
        timeZone: APP_TIMEZONE,
      }),
      weekdayShort,
      dateShort: formatWeeklyChartDate(dateKey),
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
      activeMinutes,
      distanceKm: Number(distanceKm.toFixed(3)),
    }
  })
}

export function buildResumoChartDays(
  activities: ResumoAtividadeRecord[],
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): RunWalkResumoChartDayDto[] {
  const resolved = resolveResumoQueryDefaults(query)
  const filtered = filterResumoActivities(activities, query, now)
  const bounds = resolveAtividadeListBounds(
    {
      period: resolved.startIso && resolved.endIso ? undefined : (resolved.period ?? '30d'),
      startIso: resolved.startIso,
      endIso: resolved.endIso,
    },
    now,
  )
  const todayKey = getDateKeyInAppTzFromDate(now)

  if (resolved.startIso && resolved.endIso) {
    const startKey = getDateKeyFromIsoInAppTz(resolved.startIso)
    const endKey = getDateKeyFromIsoInAppTz(resolved.endIso)
    const [rangeStart, rangeEnd] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey]
    return buildChartDaysForRange(filtered, rangeStart, rangeEnd, now)
  }

  const period = resolved.period ?? '30d'
  if (period === 'all') {
    if (filtered.length === 0) {
      return buildChartDaysForRange(filtered, shiftDateKey(todayKey, -6), todayKey, now)
    }

    const earliestKey = [...filtered].map((activity) => activity.dateIso).sort()[0] ?? todayKey
    return buildChartDaysForRange(filtered, earliestKey, todayKey, now)
  }

  const endKey = bounds.endIso ? getDateKeyFromIsoInAppTz(bounds.endIso) : todayKey
  const startKey = bounds.startIso
    ? getDateKeyFromIsoInAppTz(bounds.startIso)
    : shiftDateKey(endKey, period === '7d' ? -6 : period === '30d' ? -29 : -89)

  return buildChartDaysForRange(filtered, startKey, endKey, now)
}

export function buildResumoTrendPoints(
  activities: ResumoAtividadeRecord[],
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): RunWalkResumoTrendPointDto[] {
  return filterResumoActivities(activities, query, now)
    .sort(
      (left, right) =>
        new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime(),
    )
    .slice(-12)
    .map((activity) => ({
      id: activity.id,
      label: new Date(activity.completedAt).toLocaleDateString(PT_BR, {
        day: '2-digit',
        month: 'short',
        timeZone: APP_TIMEZONE,
      }),
      value: activity.distanceKm,
      dateIso: activity.dateIso,
      activityName: activity.activityName,
    }))
}

function computeLongestStreak(activities: ResumoAtividadeRecord[]) {
  const uniqueDays = [...new Set(activities.map((activity) => activity.dateIso))].sort()

  if (uniqueDays.length === 0) {
    return { days: 0, label: 'Sem sequência ainda' }
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const prev = parseDateKey(uniqueDays[index - 1]!)
    const next = parseDateKey(uniqueDays[index]!)
    const diffDays = Math.round((next.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000))

    if (diffDays === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return {
    days: longest,
    label: longest > 1 ? 'Dias seguidos com movimento' : 'Continue amanhã',
  }
}

function computeMostConsistentWeek(activities: ResumoAtividadeRecord[]) {
  const weekMap = new Map<string, number>()

  activities.forEach((activity) => {
    const key = resolveWeekStartDateKeyFromCompletedAt(activity.completedAt)
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  })

  const best = [...weekMap.entries()].sort((left, right) => right[1] - left[1])[0]
  if (!best) return { workouts: 0, label: 'Sem semana destaque' }

  const weekDate = parseDateKey(best[0])
  const label = weekDate.toLocaleDateString(PT_BR, {
    day: 'numeric',
    month: 'short',
    timeZone: APP_TIMEZONE,
  })

  return {
    workouts: best[1],
    label: `Semana de ${label}`,
  }
}

export function computeResumoHighlights(
  activities: ResumoAtividadeRecord[],
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): RunWalkResumoHighlightDto[] {
  const filtered = filterResumoActivities(activities, query, now)
  if (filtered.length === 0) return []

  const distanceRecord = [...filtered].sort((left, right) => right.distanceKm - left.distanceKm)[0]!
  const paceRecord = [...filtered]
    .filter((activity) => activity.paceMinPerKm != null)
    .sort((left, right) => (left.paceMinPerKm ?? 999) - (right.paceMinPerKm ?? 999))[0]
  const streak = computeLongestStreak(filtered)
  const bestWeek = computeMostConsistentWeek(filtered)

  return [
    {
      id: 'distance-record',
      title: 'Recorde de distância',
      value: `${distanceRecord.distanceKm.toFixed(1).replace('.', ',')} km`,
      subtitle: distanceRecord.activityName,
      accent: '#6ee7b7',
      activityId: distanceRecord.id,
    },
    {
      id: 'pace-record',
      title: 'Melhor ritmo',
      value: formatPaceMinPerKm(paceRecord?.paceMinPerKm ?? null),
      subtitle: paceRecord?.activityName ?? 'Sem dados',
      accent: '#93c5fd',
      activityId: paceRecord?.id,
    },
    {
      id: 'streak',
      title: 'Maior sequência',
      value: `${streak.days} dias`,
      subtitle: streak.label,
      accent: '#fbbf24',
    },
    {
      id: 'best-week',
      title: 'Semana mais consistente',
      value: `${bestWeek.workouts} treinos`,
      subtitle: bestWeek.label,
      accent: '#fb923c',
    },
  ]
}

export function buildResumoHeatmap(
  activities: ResumoAtividadeRecord[],
  now = new Date(),
): RunWalkResumoHeatmapCellDto[] {
  const { year, month, startKey, endKey } = resolveCurrentMonthBoundsInAppTz(now)
  const monthActivities = activities.filter((activity) => {
    const date = parseDateKey(activity.dateIso)
    return date.getFullYear() === year && date.getMonth() + 1 === month
  })

  const byDate = new Map<string, ResumoAtividadeRecord[]>()
  monthActivities.forEach((activity) => {
    const current = byDate.get(activity.dateIso) ?? []
    current.push(activity)
    byDate.set(activity.dateIso, current)
  })

  const maxMinutes = Math.max(
    1,
    ...[...byDate.values()].map((entries) =>
      entries.reduce((sum, activity) => sum + activity.activeMinutes, 0),
    ),
  )

  const daysCount = daysBetweenInclusive(startKey, endKey)

  return Array.from({ length: daysCount }, (_, index) => {
    const dateKey = shiftDateKey(startKey, index)
    const day = index + 1
    const dayActivities = byDate.get(dateKey) ?? []
    const activeMinutes = dayActivities.reduce((sum, activity) => sum + activity.activeMinutes, 0)
    const distanceKm = dayActivities.reduce((sum, activity) => sum + activity.distanceKm, 0)

    return {
      dateIso: dateKey,
      day,
      intensity: dayActivities.length > 0 ? activeMinutes / maxMinutes : 0,
      activeMinutes,
      distanceKm: Number(distanceKm.toFixed(3)),
      hasActivity: dayActivities.length > 0,
    }
  })
}

export function buildRunWalkAtividadesResumo(
  activities: ResumoAtividadeRecord[],
  query: ResumoRunWalkAtividadesQueryInput,
  now = new Date(),
): RunWalkAtividadesResumoDto {
  return {
    periodSummary: computeResumoPeriodSummary(activities, query, now),
    trendPoints: buildResumoTrendPoints(activities, query, now),
    heatmapCells: buildResumoHeatmap(activities, now),
    highlights: computeResumoHighlights(activities, query, now),
    chartDays: buildResumoChartDays(activities, query, now),
  }
}

// Exported for tests / chart mapping parity with app WeeklyCalendarDay activities[]
export function mapModalityToChartActivityType(modality: RunWalkModality) {
  return mapModalityToChartType(modality)
}
