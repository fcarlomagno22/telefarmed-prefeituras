import {
  ManualWalkEntry,
  StepsDayRecord,
  StepsGoalStatusLabel,
  StepsPeriod,
  StepsPeriodSummary,
} from '../types/steps'
import { IntegrationConnectionState } from '../types/healthIntegrations'

export const DEFAULT_STEPS_GOAL = 8000
export const DEFAULT_DISTANCE_GOAL_KM = 5

const STEPS_PER_MINUTE_ESTIMATE = 110
const STRIDE_KM = 0.000762

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function formatStepsCount(steps: number) {
  return Math.round(steps).toLocaleString('pt-BR')
}

export function estimateDistanceKm(steps: number) {
  return Number((steps * STRIDE_KM).toFixed(2))
}

export function formatDistanceKm(value: number, decimals = 1) {
  return value.toFixed(decimals).replace('.', ',')
}

export function formatDistanceKmLabel(value: number, decimals = 1) {
  return `${formatDistanceKm(value, decimals)} km`
}

export function getTodayDistanceKm(records: StepsDayRecord[]) {
  return estimateDistanceKm(getTodaySteps(records))
}

export type DistanceGoalStatusLabel = 'Abaixo da meta' | 'Na meta' | 'Meta batida'

export function getDistanceGoalStatus(
  km: number,
  goal = DEFAULT_DISTANCE_GOAL_KM,
): {
  label: DistanceGoalStatusLabel
  progress: number
  color: string
  bg: string
  border: string
} {
  const progress = goal > 0 ? km / goal : 0

  if (progress >= 1) {
    return {
      label: 'Meta batida',
      progress: Math.min(progress, 1),
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.14)',
      border: 'rgba(52, 211, 153, 0.35)',
    }
  }

  if (progress >= 0.85) {
    return {
      label: 'Na meta',
      progress,
      color: '#93c5fd',
      bg: 'rgba(147, 197, 253, 0.14)',
      border: 'rgba(147, 197, 253, 0.35)',
    }
  }

  return {
    label: 'Abaixo da meta',
    progress,
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.14)',
    border: 'rgba(251, 191, 36, 0.35)',
  }
}

export type DistancePeriodSummary = {
  min: number
  avg: number
  max: number
  total: number
  daysHitGoal: number
  daysInPeriod: number
  count: number
}

export function summarizeDistancePeriod(
  records: StepsDayRecord[],
  period: StepsPeriod,
  goal = DEFAULT_DISTANCE_GOAL_KM,
): DistancePeriodSummary {
  const filtered = filterStepsByPeriod(records, period)

  if (filtered.length === 0) {
    const daysInPeriod = period === 'today' ? 1 : period === 'week' ? 7 : 30
    return { min: 0, avg: 0, max: 0, total: 0, daysHitGoal: 0, daysInPeriod, count: 0 }
  }

  const values = filtered.map((record) => estimateDistanceKm(record.steps))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const total = Number(values.reduce((sum, value) => sum + value, 0).toFixed(2))
  const avg = Number((total / filtered.length).toFixed(2))
  const daysHitGoal = filtered.filter(
    (record) => estimateDistanceKm(record.steps) >= goal,
  ).length
  const daysInPeriod = period === 'today' ? 1 : period === 'week' ? 7 : 30

  return {
    min,
    avg,
    max,
    total,
    daysHitGoal,
    daysInPeriod,
    count: filtered.length,
  }
}

export function getDistanceRecordSourceLabel(
  source: StepsDayRecord['source'],
  hasDistanceSync: boolean,
) {
  if (source === 'Manual') return 'Registro manual'
  if (hasDistanceSync) return source
  return 'Estimado pelos passos'
}

export function getTodayDistanceSourceLabel(
  records: StepsDayRecord[],
  hasDistanceSync: boolean,
) {
  const today = startOfDay(new Date())
  const record = records.find((entry) => isSameDay(entry.date, today))

  if (!record || record.steps === 0) {
    return hasDistanceSync ? 'Sincronização de saúde' : 'Estimado pelos passos'
  }

  return getDistanceRecordSourceLabel(record.source, hasDistanceSync)
}

export function hasDistanceIntegration(
  connections: Record<string, IntegrationConnectionState>,
): boolean {
  return Object.values(connections).some(
    (connection) =>
      connection.status === 'connected' && connection.enabledPermissions?.includes('distance'),
  )
}

export function estimateCalories(steps: number) {
  return Math.round(steps * 0.04)
}

export function estimateStepsFromDuration(minutes: number) {
  return Math.round(minutes * STEPS_PER_MINUTE_ESTIMATE)
}

export function getStepsGoalStatus(
  steps: number,
  goal = DEFAULT_STEPS_GOAL,
): {
  label: StepsGoalStatusLabel
  progress: number
  color: string
  bg: string
  border: string
} {
  const progress = steps / goal

  if (progress >= 1) {
    return {
      label: 'Meta batida',
      progress: Math.min(progress, 1),
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.14)',
      border: 'rgba(52, 211, 153, 0.35)',
    }
  }

  if (progress >= 0.85) {
    return {
      label: 'Na meta',
      progress,
      color: '#6ee7b7',
      bg: 'rgba(110, 231, 183, 0.14)',
      border: 'rgba(110, 231, 183, 0.35)',
    }
  }

  return {
    label: 'Abaixo da meta',
    progress,
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.14)',
    border: 'rgba(251, 191, 36, 0.35)',
  }
}

export function formatStepsDayLabel(date: Date) {
  const today = startOfDay(new Date())
  const target = startOfDay(date)
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'

  return target.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
}

export function formatPeakWindow(start?: number, end?: number) {
  if (start === undefined || end === undefined) return null
  const pad = (hour: number) => `${String(hour).padStart(2, '0')}h`
  return `${pad(start)}–${pad(end)}`
}

export function getTodaySteps(records: StepsDayRecord[]) {
  const today = startOfDay(new Date())
  return records.find((record) => isSameDay(record.date, today))?.steps ?? 0
}

export function filterStepsByPeriod(records: StepsDayRecord[], period: StepsPeriod) {
  const today = startOfDay(new Date())
  const daysBack = period === 'today' ? 0 : period === 'week' ? 6 : 29
  const start = new Date(today)
  start.setDate(today.getDate() - daysBack)

  return records
    .filter((record) => startOfDay(record.date).getTime() >= start.getTime())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function summarizeStepsPeriod(
  records: StepsDayRecord[],
  period: StepsPeriod,
  goal = DEFAULT_STEPS_GOAL,
): StepsPeriodSummary {
  const filtered = filterStepsByPeriod(records, period)

  if (filtered.length === 0) {
    const daysInPeriod = period === 'today' ? 1 : period === 'week' ? 7 : 30
    return { min: 0, avg: 0, max: 0, total: 0, daysHitGoal: 0, daysInPeriod, count: 0 }
  }

  const values = filtered.map((record) => record.steps)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const total = values.reduce((sum, value) => sum + value, 0)
  const avg = Math.round(total / filtered.length)
  const daysHitGoal = filtered.filter((record) => record.steps >= goal).length
  const daysInPeriod = period === 'today' ? 1 : period === 'week' ? 7 : 30

  return {
    min,
    avg,
    max,
    total,
    daysHitGoal,
    daysInPeriod,
    count: filtered.length,
  }
}

function buildDayRecord(
  daysAgo: number,
  steps: number,
  source: StepsDayRecord['source'],
  peakHourStart?: number,
  peakHourEnd?: number,
): StepsDayRecord {
  const date = startOfDay(new Date())
  date.setDate(date.getDate() - daysAgo)

  return {
    id: `steps-${daysAgo}-${source}-${steps}`,
    date,
    steps,
    source,
    peakHourStart,
    peakHourEnd,
  }
}

export function createMockStepsHistory(): StepsDayRecord[] {
  const sources: StepsDayRecord['source'][] = [
    'Apple Health',
    'Apple Health',
    'Galaxy Watch',
    'Health Connect',
    'Apple Health',
  ]

  return Array.from({ length: 30 }, (_, index) => {
    const daysAgo = index
    const noise = seededNoise(index + 17) - 0.5
    const wave = Math.sin(index / 3.8) * 2200
    const steps = Math.max(1200, Math.round(DEFAULT_STEPS_GOAL + wave + noise * 2800))
    const source = sources[index % sources.length]
    const peakStart = 17 + (index % 3)
    const peakEnd = peakStart + 1

    return buildDayRecord(daysAgo, steps, source, peakStart, peakEnd)
  }).sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function hasStepsIntegration(
  connections: Record<string, IntegrationConnectionState>,
): boolean {
  return Object.values(connections).some(
    (connection) =>
      connection.status === 'connected' && connection.enabledPermissions?.includes('steps'),
  )
}

export function addManualWalkToRecords(
  records: StepsDayRecord[],
  entry: ManualWalkEntry,
): StepsDayRecord[] {
  const today = startOfDay(new Date())
  const existing = records.find((record) => isSameDay(record.date, today))

  if (existing) {
    return records.map((record) =>
      record.id === existing.id
        ? {
            ...record,
            steps: record.steps + entry.steps,
            source: record.source === 'Manual' ? 'Manual' : record.source,
          }
        : record,
    )
  }

  return [
    {
      id: `manual-${Date.now()}`,
      date: today,
      steps: entry.steps,
      source: 'Manual',
      peakHourStart: new Date().getHours(),
      peakHourEnd: new Date().getHours() + 1,
    },
    ...records,
  ]
}
