import type { RunWalkActivitySummary } from '../data/runWalkActivitySummaryStorage'
import { getActivityDateIso } from '../data/runWalkActivityHistoryStorage'
import type { WeeklyCalendarDay } from '../types/runWalk'
import type {
  RunWalkHistoryAdvancedFilters,
  RunWalkHistoryDateRange,
  RunWalkHistoryHeatmapCell,
  RunWalkHistoryHighlight,
  RunWalkHistoryKmSplit,
  RunWalkHistoryModalityComparison,
  RunWalkHistoryMonthGroup,
  RunWalkHistoryPacePoint,
  RunWalkHistoryPeriod,
  RunWalkHistoryPeriodSummary,
  RunWalkHistorySort,
  RunWalkHistoryTrendPoint,
} from '../types/runWalkHistory'
import {
  calculateAveragePaceMinPerKm,
  formatPaceMinPerKm,
} from './runWalkActivityStats'
import { haversineDistanceKm } from './geo'
import { formatWeeklyChartDate, toLocalDateIso } from './runWalkWeeklyChart'

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function getPeriodDays(period: RunWalkHistoryPeriod) {
  if (period === '7d') return 7
  if (period === '30d') return 30
  if (period === '90d') return 90
  return null
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function parseIsoDate(iso: string) {
  return startOfDay(new Date(`${iso}T12:00:00`))
}

function getCustomRangeDays(customRange: RunWalkHistoryDateRange) {
  const start = parseIsoDate(customRange.startIso)
  const end = parseIsoDate(customRange.endIso)
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
}

export function getPeriodRange(
  period: RunWalkHistoryPeriod,
  now = new Date(),
  customRange?: RunWalkHistoryDateRange | null,
) {
  if (period === 'custom' && customRange) {
    const start = parseIsoDate(customRange.startIso)
    const end = endOfDay(parseIsoDate(customRange.endIso))
    return start.getTime() <= end.getTime()
      ? { start, end }
      : { start: parseIsoDate(customRange.endIso), end: endOfDay(parseIsoDate(customRange.startIso)) }
  }

  const days = getPeriodDays(period)
  if (days == null) {
    return { start: null as Date | null, end: endOfDay(now) }
  }

  const end = endOfDay(now)
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

export function getPreviousMonthRange(now = new Date()) {
  const reference = startOfDay(now)
  const month = reference.getMonth()
  const year = reference.getFullYear()
  const previousMonth = month === 0 ? 11 : month - 1
  const previousYear = month === 0 ? year - 1 : year

  const start = new Date(previousYear, previousMonth, 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(previousYear, previousMonth + 1, 0)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function isWithinRange(iso: string, start: Date | null, end: Date | null) {
  const time = new Date(iso).getTime()
  if (start && time < start.getTime()) return false
  if (end && time > end.getTime()) return false
  return true
}

function computeDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function aggregateSummary(activities: RunWalkActivitySummary[]): Omit<
  RunWalkHistoryPeriodSummary,
  'distanceDeltaPct' | 'minutesDeltaPct' | 'workoutsDeltaPct' | 'caloriesDeltaPct'
> {
  return activities.reduce(
    (acc, activity) => ({
      totalDistanceKm: acc.totalDistanceKm + activity.distanceKm,
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

export function filterHistoryActivities(
  activities: RunWalkActivitySummary[],
  period: RunWalkHistoryPeriod,
  advanced: RunWalkHistoryAdvancedFilters,
  selectedDateIso?: string | null,
  now = new Date(),
  customRange?: RunWalkHistoryDateRange | null,
) {
  const { start, end } = getPeriodRange(period, now, customRange)

  return activities.filter((activity) => {
    if (!isWithinRange(activity.completedAt, start, end)) return false
    if (activity.distanceKm < advanced.minDistanceKm) return false
    if (selectedDateIso && getActivityDateIso(activity) !== selectedDateIso) return false
    return true
  })
}

export function sortHistoryActivities(
  activities: RunWalkActivitySummary[],
  sort: RunWalkHistorySort,
) {
  const sorted = [...activities]

  if (sort === 'distance') {
    return sorted.sort((left, right) => right.distanceKm - left.distanceKm)
  }

  if (sort === 'duration') {
    return sorted.sort((left, right) => right.elapsedSeconds - left.elapsedSeconds)
  }

  return sorted.sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  )
}

export function computeHistoryPeriodSummary(
  activities: RunWalkActivitySummary[],
  period: RunWalkHistoryPeriod,
  now = new Date(),
  customRange?: RunWalkHistoryDateRange | null,
): RunWalkHistoryPeriodSummary {
  const currentRange = getPeriodRange(period, now, customRange)
  const previousRange = getPreviousMonthRange(now)

  const current = activities.filter((activity) =>
    isWithinRange(activity.completedAt, currentRange.start, currentRange.end),
  )
  const previous = activities.filter((activity) =>
    isWithinRange(activity.completedAt, previousRange.start, previousRange.end),
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

export function buildHistoryChartDays(
  activities: RunWalkActivitySummary[],
  metric: 'minutes' | 'distance' = 'minutes',
  daysCount = 7,
  now = new Date(),
): WeeklyCalendarDay[] {
  const today = startOfDay(now)

  return Array.from({ length: daysCount }, (_, index) => {
    const offset = daysCount - 1 - index
    const date = new Date(today)
    date.setDate(today.getDate() - offset)

    const dateIso = toLocalDateIso(date)
    const dayActivities = activities.filter((activity) => getActivityDateIso(activity) === dateIso)
    const activeMinutes = dayActivities.reduce((sum, activity) => sum + activity.activeMinutes, 0)
    const distanceKm = dayActivities.reduce((sum, activity) => sum + activity.distanceKm, 0)
    const displayValue = metric === 'distance' ? Math.round(distanceKm * 10) : activeMinutes

    const weekdayShort = date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toLowerCase()

    return {
      dateIso,
      dayLabel: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      weekdayShort,
      dateShort: formatWeeklyChartDate(date),
      isToday: offset === 0,
      isFuture: false,
      activeMinutes: displayValue,
      activities:
        dayActivities.length > 0
          ? dayActivities.map((activity) => ({
              type:
                activity.modality === 'run'
                  ? ('run' as const)
                  : activity.modality === 'run-walk'
                    ? ('run-walk' as const)
                    : ('walk' as const),
              label: activity.activityName,
              completed: true,
            }))
          : [{ type: 'rest' as const, label: 'Descanso' }],
    }
  })
}

export function buildHistoryChartDaysForPeriod(
  activities: RunWalkActivitySummary[],
  period: RunWalkHistoryPeriod,
  metric: 'minutes' | 'distance' = 'minutes',
  now = new Date(),
  customRange?: RunWalkHistoryDateRange | null,
): WeeklyCalendarDay[] {
  const { start, end } = getPeriodRange(period, now, customRange)
  const rangeEnd = end ?? startOfDay(now)

  let daysCount: number

  if (period === 'custom' && customRange) {
    daysCount = getCustomRangeDays(customRange)
    return buildHistoryChartDaysForRange(activities, customRange.startIso, customRange.endIso, metric)
  }

  if (start) {
    daysCount = Math.floor((rangeEnd.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  } else if (activities.length > 0) {
    const earliestIso = activities
      .map((activity) => getActivityDateIso(activity))
      .sort()[0]
    const earliest = startOfDay(new Date(`${earliestIso}T12:00:00`))
    daysCount =
      Math.floor((rangeEnd.getTime() - earliest.getTime()) / (24 * 60 * 60 * 1000)) + 1
  } else {
    daysCount = 7
  }

  return buildHistoryChartDays(activities, metric, Math.max(daysCount, 1), now)
}

export function buildHistoryChartDaysForRange(
  activities: RunWalkActivitySummary[],
  startIso: string,
  endIso: string,
  metric: 'minutes' | 'distance' = 'minutes',
): WeeklyCalendarDay[] {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  const rangeStart = start.getTime() <= end.getTime() ? start : end
  const rangeEnd = start.getTime() <= end.getTime() ? end : start
  const today = startOfDay(new Date())

  const daysCount =
    Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)) + 1

  return Array.from({ length: daysCount }, (_, index) => {
    const date = new Date(rangeStart)
    date.setDate(rangeStart.getDate() + index)

    const dateIso = toLocalDateIso(date)
    const dayActivities = activities.filter((activity) => getActivityDateIso(activity) === dateIso)
    const activeMinutes = dayActivities.reduce((sum, activity) => sum + activity.activeMinutes, 0)
    const distanceKm = dayActivities.reduce((sum, activity) => sum + activity.distanceKm, 0)
    const displayValue = metric === 'distance' ? Math.round(distanceKm * 10) : activeMinutes

    const weekdayShort = date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toLowerCase()

    return {
      dateIso,
      dayLabel: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      weekdayShort,
      dateShort: formatWeeklyChartDate(date),
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
      activeMinutes: displayValue,
      activities:
        dayActivities.length > 0
          ? dayActivities.map((activity) => ({
              type:
                activity.modality === 'run'
                  ? ('run' as const)
                  : activity.modality === 'run-walk'
                    ? ('run-walk' as const)
                    : ('walk' as const),
              label: activity.activityName,
              completed: true,
            }))
          : [{ type: 'rest' as const, label: 'Descanso' }],
    }
  })
}

export function formatHistoryPeriodLabel(
  period: RunWalkHistoryPeriod,
  customRange?: RunWalkHistoryDateRange | null,
) {
  if (period === 'custom' && customRange) {
    const start = parseIsoDate(customRange.startIso).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const end = parseIsoDate(customRange.endIso).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${start} – ${end}`
  }
  if (period === '7d') return 'Últimos 7 dias'
  if (period === '30d') return 'Últimos 30 dias'
  if (period === '90d') return 'Últimos 90 dias'
  return 'Todo o histórico'
}

export function getHistoryChartSectionTitle(
  period: RunWalkHistoryPeriod,
  customRange?: RunWalkHistoryDateRange | null,
) {
  if (period === 'custom' && customRange) {
    return `Atividade de ${formatHistoryPeriodLabel(period, customRange)}`
  }
  if (period === '7d') return 'Atividade nos últimos 7 dias'
  if (period === '30d') return 'Atividade nos últimos 30 dias'
  if (period === '90d') return 'Atividade nos últimos 90 dias'
  return 'Atividade no período'
}

export function buildHistoryTrendPoints(
  activities: RunWalkActivitySummary[],
): RunWalkHistoryTrendPoint[] {
  return [...activities]
    .sort(
      (left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime(),
    )
    .slice(-12)
    .map((activity) => {
      const date = new Date(activity.completedAt)
      return {
        id: activity.id,
        label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        value: activity.distanceKm,
        dateIso: getActivityDateIso(activity),
        activityName: activity.activityName,
      }
    })
}

export type TrendLineGeometry = {
  plotLeft: number
  plotWidth: number
  plotTop: number
  plotHeight: number
  linePath: string
  areaPath: string
  points: Array<{ x: number; y: number; index: number }>
  yTicks: Array<{ value: number; y: number }>
}

export function buildHistoryTrendGeometry(
  points: RunWalkHistoryTrendPoint[],
  width: number,
  height: number,
): TrendLineGeometry | null {
  if (points.length === 0) return null

  const paddingLeft = 34
  const paddingRight = 12
  const paddingTop = 16
  const paddingBottom = 28

  const plotLeft = paddingLeft
  const plotWidth = Math.max(1, width - paddingLeft - paddingRight)
  const plotTop = paddingTop
  const plotHeight = Math.max(1, height - paddingTop - paddingBottom)

  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(maxValue - minValue, 0.5)

  const yMin = Math.max(0, minValue - range * 0.15)
  const yMax = maxValue + range * 0.15

  function scaleY(value: number) {
    if (yMax === yMin) return plotTop + plotHeight / 2
    return plotTop + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight
  }

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (index / (points.length - 1)) * plotWidth
    const y = scaleY(point.value)
    return { x, y, index }
  })

  const linePath = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? plotLeft} ${
    plotTop + plotHeight
  } L ${coords[0]?.x ?? plotLeft} ${plotTop + plotHeight} Z`

  const tickValues = [yMin, yMin + (yMax - yMin) / 2, yMax]

  return {
    plotLeft,
    plotWidth,
    plotTop,
    plotHeight,
    linePath,
    areaPath,
    points: coords,
    yTicks: tickValues.map((value) => ({
      value: Math.round(value * 10) / 10,
      y: scaleY(value),
    })),
  }
}

export function computeHistoryHighlights(
  activities: RunWalkActivitySummary[],
): RunWalkHistoryHighlight[] {
  if (activities.length === 0) return []

  const distanceRecord = [...activities].sort((left, right) => right.distanceKm - left.distanceKm)[0]
  const paceRecord = [...activities]
    .filter((activity) => activity.paceMinPerKm != null)
    .sort((left, right) => (left.paceMinPerKm ?? 999) - (right.paceMinPerKm ?? 999))[0]
  const streak = computeLongestStreak(activities)
  const bestWeek = computeMostConsistentWeek(activities)

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

function computeLongestStreak(activities: RunWalkActivitySummary[]) {
  const uniqueDays = [...new Set(activities.map((activity) => getActivityDateIso(activity)))].sort()

  if (uniqueDays.length === 0) {
    return { days: 0, label: 'Sem sequência ainda' }
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const prev = new Date(`${uniqueDays[index - 1]}T12:00:00`)
    const next = new Date(`${uniqueDays[index]}T12:00:00`)
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

function computeMostConsistentWeek(activities: RunWalkActivitySummary[]) {
  const weekMap = new Map<string, number>()

  activities.forEach((activity) => {
    const date = new Date(activity.completedAt)
    const weekStart = new Date(date)
    const weekday = weekStart.getDay()
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday
    weekStart.setDate(weekStart.getDate() + mondayOffset)
    const key = toLocalDateIso(weekStart)
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  })

  const best = [...weekMap.entries()].sort((left, right) => right[1] - left[1])[0]
  if (!best) return { workouts: 0, label: 'Sem semana destaque' }

  const weekDate = new Date(`${best[0]}T12:00:00`)
  const label = weekDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })

  return {
    workouts: best[1],
    label: `Semana de ${label}`,
  }
}

export function groupHistoryByMonth(
  activities: RunWalkActivitySummary[],
): RunWalkHistoryMonthGroup[] {
  const groups = new Map<string, RunWalkActivitySummary[]>()

  activities.forEach((activity) => {
    const date = new Date(activity.completedAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const current = groups.get(key) ?? []
    current.push(activity)
    groups.set(key, current)
  })

  return [...groups.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([key, monthActivities]) => {
      const [year, month] = key.split('-').map(Number)
      const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })

      return {
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        activities: monthActivities.sort(
          (left, right) =>
            new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
        ),
      }
    })
}

export function buildHistoryHeatmap(
  activities: RunWalkActivitySummary[],
  now = new Date(),
): RunWalkHistoryHeatmapCell[] {
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const byDate = new Map<string, RunWalkActivitySummary[]>()

  activities.forEach((activity) => {
    const date = new Date(activity.completedAt)
    if (date.getFullYear() !== year || date.getMonth() !== month) return
    const iso = getActivityDateIso(activity)
    const current = byDate.get(iso) ?? []
    current.push(activity)
    byDate.set(iso, current)
  })

  const maxMinutes = Math.max(
    1,
    ...[...byDate.values()].map((entries) =>
      entries.reduce((sum, activity) => sum + activity.activeMinutes, 0),
    ),
  )

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = new Date(year, month, day)
    const dateIso = toLocalDateIso(date)
    const dayActivities = byDate.get(dateIso) ?? []
    const activeMinutes = dayActivities.reduce((sum, activity) => sum + activity.activeMinutes, 0)
    const distanceKm = dayActivities.reduce((sum, activity) => sum + activity.distanceKm, 0)

    return {
      dateIso,
      day,
      intensity: dayActivities.length > 0 ? activeMinutes / maxMinutes : 0,
      activeMinutes,
      distanceKm,
      hasActivity: dayActivities.length > 0,
    }
  })
}

export function generateHistoryInsight(
  activities: RunWalkActivitySummary[],
  period: RunWalkHistoryPeriod,
  now = new Date(),
): string | null {
  const summary = computeHistoryPeriodSummary(activities, period, now)
  if (summary.totalWorkouts === 0) return null

  if (summary.distanceDeltaPct != null && summary.distanceDeltaPct >= 10) {
    return `Você percorreu ${summary.distanceDeltaPct}% a mais que no mês anterior.`
  }

  if (summary.workoutsDeltaPct != null && summary.workoutsDeltaPct >= 15) {
    return `Sua consistência subiu ${summary.workoutsDeltaPct}% — semana mais sólida.`
  }

  const weekdayCounts = new Map<number, number>()
  const filtered = filterHistoryActivities(activities, period, {
    minDistanceKm: 0,
  })

  filtered.forEach((activity) => {
    const weekday = new Date(activity.completedAt).getDay()
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1)
  })

  const bestWeekday = [...weekdayCounts.entries()].sort((left, right) => right[1] - left[1])[0]
  if (bestWeekday && bestWeekday[1] >= 2) {
    const weekdayNames = [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
    ]
    return `Seu melhor dia costuma ser ${weekdayNames[bestWeekday[0]]}.`
  }

  return 'Cada treino registrado fortalece sua evolução.'
}

export function computeKmSplits(activity: RunWalkActivitySummary): RunWalkHistoryKmSplit[] {
  if (activity.trail.length < 2 || activity.distanceKm < 0.5) return []

  const splits: RunWalkHistoryKmSplit[] = []
  let cumulativeKm = 0
  let splitStartIndex = 0
  let nextKmMark = 1

  for (let index = 1; index < activity.trail.length; index += 1) {
    cumulativeKm += haversineDistanceKm(activity.trail[index - 1], activity.trail[index])

    if (cumulativeKm >= nextKmMark || index === activity.trail.length - 1) {
      const splitTrail = activity.trail.slice(splitStartIndex, index + 1)
      const elapsedSeconds = Math.max(
        1,
        Math.round((splitTrail[splitTrail.length - 1].recordedAt - splitTrail[0].recordedAt) / 1000),
      )
      let splitDistance = 0
      for (let splitIndex = 1; splitIndex < splitTrail.length; splitIndex += 1) {
        splitDistance += haversineDistanceKm(splitTrail[splitIndex - 1], splitTrail[splitIndex])
      }

      splits.push({
        km: nextKmMark,
        elapsedSeconds,
        paceMinPerKm: calculateAveragePaceMinPerKm(splitDistance, elapsedSeconds),
      })

      splitStartIndex = index
      nextKmMark += 1
      if (nextKmMark > Math.ceil(activity.distanceKm)) break
    }
  }

  return splits
}

export function computePaceSeries(activity: RunWalkActivitySummary): RunWalkHistoryPacePoint[] {
  if (activity.trail.length < 3) return []

  const points: RunWalkHistoryPacePoint[] = []
  let cumulativeKm = 0

  for (let index = 2; index < activity.trail.length; index += 2) {
    const window = activity.trail.slice(Math.max(0, index - 4), index + 1)
    let windowDistance = 0
    for (let windowIndex = 1; windowIndex < window.length; windowIndex += 1) {
      windowDistance += haversineDistanceKm(window[windowIndex - 1], window[windowIndex])
    }

    cumulativeKm += windowDistance
    const elapsedSeconds = Math.max(
      1,
      Math.round((window[window.length - 1].recordedAt - window[0].recordedAt) / 1000),
    )

    points.push({
      distanceKm: cumulativeKm,
      paceMinPerKm: calculateAveragePaceMinPerKm(windowDistance, elapsedSeconds),
      elapsedSeconds,
    })
  }

  return points
}

export function compareWithPreviousSameModality(
  activity: RunWalkActivitySummary,
  activities: RunWalkActivitySummary[],
): RunWalkHistoryModalityComparison | null {
  const previous = activities
    .filter(
      (entry) =>
        entry.modality === activity.modality &&
        entry.id !== activity.id &&
        new Date(entry.completedAt).getTime() < new Date(activity.completedAt).getTime(),
    )
    .sort(
      (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
    )[0]

  if (!previous) return null

  const paceDeltaSeconds =
    activity.paceMinPerKm != null && previous.paceMinPerKm != null
      ? Math.round((activity.paceMinPerKm - previous.paceMinPerKm) * 60)
      : null

  return {
    previousActivityId: previous.id,
    previousDateLabel: new Date(previous.completedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
    paceDeltaSeconds,
    distanceDeltaKm: activity.distanceKm - previous.distanceKm,
  }
}

export function didHitDailyGoal(activity: RunWalkActivitySummary, targetMinutesPerDay: number) {
  return activity.activeMinutes >= targetMinutesPerDay
}

export const HISTORY_MONTH_DELTA_SUFFIX = 'vs mês anterior'

export function formatDeltaLabel(
  deltaPct: number | null,
  suffix: string = HISTORY_MONTH_DELTA_SUFFIX,
) {
  if (deltaPct == null) return `Sem base ${suffix}`
  if (deltaPct === 0) return `Estável ${suffix}`
  const sign = deltaPct > 0 ? '+' : ''
  return `${sign}${deltaPct}% ${suffix}`
}

export function formatActivityDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
