import type { WeeklyCalendarDay } from '../types/runWalk'
import type { SleepLogEntry, SleepQualityScore } from '../types/sleepLog'
import type {
  SleepCalendarDay,
  SleepDayStat,
  SleepHighlight,
  SleepQualityDistribution,
  SleepWeekSummary,
} from '../types/sleepHistory'
import {
  buildEatWellMonthDays,
  type EatWellCalendarDay,
} from './eatWellCalendarDays'
import { formatSleepDuration } from './sleepLogFormat'
import { toLocalDateIso } from './runWalkWeeklyChart'

const SLEEP_ACCENT = '#818cf8'

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function parseIsoDate(dateIso: string) {
  return new Date(`${dateIso}T12:00:00`)
}

function formatWeekdayShort(date: Date) {
  return date
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3)
}

function formatDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

export function formatSleepDeltaLabel(deltaPct: number | null) {
  if (deltaPct == null) return 'Sem comparação'
  if (deltaPct === 0) return 'Igual à semana anterior'
  const prefix = deltaPct > 0 ? '+' : ''
  return `${prefix}${deltaPct}% vs semana anterior`
}

export function getSleepLogDayKey(entry: SleepLogEntry) {
  return entry.wakeDateIso || entry.bedDateIso
}

export function indexSleepLogsByDay(entries: SleepLogEntry[]) {
  const map = new Map<string, SleepLogEntry>()

  for (const entry of entries) {
    const key = getSleepLogDayKey(entry)
    const existing = map.get(key)
    if (!existing || new Date(entry.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      map.set(key, entry)
    }
  }

  return map
}

export function attachSleepCalendarDayFlags(
  days: EatWellCalendarDay[] | SleepCalendarDay[],
  entriesByDay: Map<string, SleepLogEntry>,
): SleepCalendarDay[] {
  return days.map((day) => ({
    ...day,
    hasData: entriesByDay.has(day.dateIso),
  }))
}

function buildWeekDateIsos(referenceDate = new Date()) {
  const today = startOfDay(referenceDate)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return toLocalDateIso(date)
  })
}

function formatWeekLabel(dateIsos: string[]) {
  const first = dateIsos[0]
  const last = dateIsos[6]
  if (!first || !last) return 'Esta semana'

  const firstDate = parseIsoDate(first)
  const lastDate = parseIsoDate(last)
  const month = lastDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${firstDate.getDate()} – ${lastDate.getDate()} ${month}`
}

function buildDayStat(
  dateIso: string,
  entriesByDay: Map<string, SleepLogEntry>,
  referenceDate = new Date(),
): SleepDayStat {
  const date = parseIsoDate(dateIso)
  const today = startOfDay(referenceDate)
  const dayStart = startOfDay(date)
  const entry = entriesByDay.get(dateIso) ?? null

  return {
    dateIso,
    weekdayLabel: formatWeekdayShort(date),
    dayNumber: date.getDate(),
    isToday: dayStart.getTime() === today.getTime(),
    isFuture: dayStart.getTime() > today.getTime(),
    hasData: entry != null,
    durationMinutes: entry?.durationMinutes ?? 0,
    quality: entry?.quality ?? null,
    wakeCount: entry?.wakeCount ?? 0,
    entry,
  }
}

function buildQualityDistribution(dayStats: SleepDayStat[]): SleepQualityDistribution {
  return dayStats.reduce<SleepQualityDistribution>(
    (acc, day) => {
      if (!day.hasData || day.quality == null) return acc
      if (day.quality >= 5) acc.excellent += 1
      else if (day.quality >= 4) acc.good += 1
      else if (day.quality >= 3) acc.fair += 1
      else acc.poor += 1
      return acc
    },
    { excellent: 0, good: 0, fair: 0, poor: 0 },
  )
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildHighlights(dayStats: SleepDayStat[]): SleepHighlight[] {
  const withData = dayStats.filter((day) => day.hasData && !day.isFuture)
  if (withData.length === 0) return []

  const bestQuality = [...withData].sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0))[0]
  const longest = [...withData].sort((a, b) => b.durationMinutes - a.durationMinutes)[0]
  const calmest = [...withData].sort((a, b) => a.wakeCount - b.wakeCount)[0]

  const highlights: SleepHighlight[] = []

  if (bestQuality?.quality) {
    highlights.push({
      id: 'best-quality',
      title: 'Melhor noite',
      subtitle: bestQuality.weekdayLabel,
      value: `${bestQuality.quality}/5`,
      dateIso: bestQuality.dateIso,
      accentColor: '#a5b4fc',
    })
  }

  if (longest) {
    highlights.push({
      id: 'longest-sleep',
      title: 'Mais horas dormidas',
      subtitle: longest.weekdayLabel,
      value: formatSleepDuration(longest.durationMinutes),
      dateIso: longest.dateIso,
      accentColor: '#6366f1',
    })
  }

  if (calmest) {
    highlights.push({
      id: 'calmest-night',
      title: calmest.wakeCount === 0 ? 'Noite contínua' : 'Menos despertares',
      subtitle: calmest.weekdayLabel,
      value: calmest.wakeCount === 0 ? '0x' : `${calmest.wakeCount}x`,
      dateIso: calmest.dateIso,
      accentColor: '#c4b5fd',
    })
  }

  return highlights
}

function buildWeekSummaryForDates(
  dateIsos: string[],
  entriesByDay: Map<string, SleepLogEntry>,
  referenceDate = new Date(),
): SleepWeekSummary {
  const dayStats = dateIsos.map((dateIso) => buildDayStat(dateIso, entriesByDay, referenceDate))
  const loggedDays = dayStats.filter((day) => day.hasData && !day.isFuture)
  const avgDurationMinutes = Math.round(average(loggedDays.map((day) => day.durationMinutes)))
  const avgQuality = Number(
    average(loggedDays.map((day) => day.quality ?? 0)).toFixed(1),
  )

  return {
    weekLabel: formatWeekLabel(dateIsos),
    nightsLogged: loggedDays.length,
    avgDurationMinutes,
    avgQuality,
    totalWakeCount: loggedDays.reduce((sum, day) => sum + day.wakeCount, 0),
    durationDeltaPct: null,
    qualityDeltaPct: null,
    dayStats,
    qualityDistribution: buildQualityDistribution(dayStats),
    highlights: buildHighlights(dayStats),
  }
}

export function buildSleepWeekSummary(
  entries: SleepLogEntry[],
  referenceDate = new Date(),
  anchorDateIso?: string,
): SleepWeekSummary {
  const entriesByDay = indexSleepLogsByDay(entries)
  const anchor = anchorDateIso ? parseIsoDate(anchorDateIso) : referenceDate
  const weekDateIsos = buildWeekDateIsos(anchor)
  const current = buildWeekSummaryForDates(weekDateIsos, entriesByDay, referenceDate)

  const previousWeekIsos = weekDateIsos.map((dateIso) => {
    const date = parseIsoDate(dateIso)
    date.setDate(date.getDate() - 7)
    return toLocalDateIso(date)
  })
  const previous = buildWeekSummaryForDates(previousWeekIsos, entriesByDay, referenceDate)
  const previousLogged = previous.dayStats.filter((day) => day.hasData)

  return {
    ...current,
    durationDeltaPct: formatDeltaPct(
      current.avgDurationMinutes,
      previousLogged.length > 0
        ? Math.round(average(previousLogged.map((day) => day.durationMinutes)))
        : 0,
    ),
    qualityDeltaPct: formatDeltaPct(
      current.avgQuality,
      previousLogged.length > 0
        ? Number(average(previousLogged.map((day) => day.quality ?? 0)).toFixed(1))
        : 0,
    ),
  }
}

export function buildSleepMonthDayStats(
  entries: SleepLogEntry[],
  monthKey: string,
  referenceDate = new Date(),
): SleepDayStat[] {
  const entriesByDay = indexSleepLogsByDay(entries)
  const days = buildEatWellMonthDays(monthKey, referenceDate)
  return days.map((day) => buildDayStat(day.dateIso, entriesByDay, referenceDate))
}

export function getSleepQualityHeatmapColor(
  quality: SleepQualityScore | null,
  hasData: boolean,
  isFuture: boolean,
) {
  if (isFuture) return 'rgba(255,255,255,0.04)'
  if (!hasData || quality == null) return 'rgba(255,255,255,0.07)'

  switch (quality) {
    case 5:
      return 'rgba(99, 102, 241, 0.82)'
    case 4:
      return 'rgba(129, 140, 248, 0.72)'
    case 3:
      return 'rgba(165, 180, 252, 0.58)'
    case 2:
      return 'rgba(251, 191, 36, 0.58)'
    default:
      return 'rgba(248, 113, 113, 0.62)'
  }
}

export function getSleepQualityTier(avgQuality: number) {
  if (avgQuality >= 4.5) {
    return {
      label: 'Excelente',
      gradientColors: ['#c4b5fd', '#6366f1', '#4338ca'] as const,
    }
  }
  if (avgQuality >= 3.5) {
    return {
      label: 'Boa',
      gradientColors: ['#a5b4fc', '#6366f1', '#4f46e5'] as const,
    }
  }
  if (avgQuality >= 2.5) {
    return {
      label: 'Regular',
      gradientColors: ['#fde68a', '#f59e0b', '#d97706'] as const,
    }
  }
  return {
    label: 'Precisa de atenção',
    gradientColors: ['#fca5a5', '#ef4444', '#dc2626'] as const,
  }
}

export function filterEntriesForDate(
  entries: SleepLogEntry[],
  dateIso: string,
) {
  return entries.filter((entry) => getSleepLogDayKey(entry) === dateIso)
}

export function mapSleepDayStatsToWeeklyChartDays(dayStats: SleepDayStat[]): WeeklyCalendarDay[] {
  return dayStats.map((day) => ({
    dateIso: day.dateIso,
    dayLabel: String(day.dayNumber),
    weekdayShort: day.weekdayLabel,
    isToday: day.isToday,
    isFuture: day.isFuture,
    activeMinutes: day.hasData ? day.durationMinutes : 0,
    activities: [],
  }))
}

export { buildEatWellMonthDays as buildSleepMonthDays, SLEEP_ACCENT }
