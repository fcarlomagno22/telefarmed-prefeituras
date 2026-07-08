import {
  getDateKeyFromIsoInAppTz,
  resolveWeekBoundsFromStartDateKey,
} from './atividades.formatters.js'
import type { WeeklyGoalTargetsDto } from './metas-semanais.formatters.js'
import type { RunWalkModality } from './types.js'

const APP_TIMEZONE = 'America/Sao_Paulo'
const PT_BR = 'pt-BR'

export type WeeklyGoalStatsDto = {
  completedActivities: number
  targetActivities: number
  activeMinutes: number
  targetActiveMinutes: number
  movementDays: number
  targetMovementDays: number
}

export type WeeklyCalendarActivityDto = {
  type: 'walk' | 'run' | 'run-walk' | 'strength' | 'mobility' | 'rest' | 'free'
  label: string
  completed?: boolean
}

export type WeeklyCalendarDayDto = {
  dateIso: string
  dayLabel: string
  weekdayShort: string
  dateShort: string
  isToday: boolean
  isFuture: boolean
  activeMinutes: number
  activities: WeeklyCalendarActivityDto[]
}

export type RunWalkMetasSemanaisProgressoDto = {
  weekStartDate: string
  weeklyGoal: WeeklyGoalStatsDto
  weeklyCalendar: WeeklyCalendarDayDto[]
  dailyExtraMinutes: Record<string, number>
}

export type WeekProgressActivityRecord = {
  id: string
  modality: RunWalkModality
  activityName: string
  activeMinutes: number
  completedAt: string
}

export type BuildMetasSemanaisProgressoInput = {
  weekStartDate: string
  activities: WeekProgressActivityRecord[]
  targets: WeeklyGoalTargetsDto | null
  dailyExtraMinutes: Record<string, number>
  extraCompletedActivities: number
  now?: Date
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
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-').map(Number)
  const date = new Date(yearRaw, monthRaw - 1, dayRaw, 12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return getDateKeyInAppTzFromDate(date)
}

function parseDateKey(dateKey: string): Date {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-').map(Number)
  return new Date(yearRaw, monthRaw - 1, dayRaw, 12, 0, 0, 0)
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

export function mapModalityToWeeklyCalendarType(
  modality: RunWalkModality,
): WeeklyCalendarActivityDto['type'] {
  if (modality === 'run') return 'run'
  if (modality === 'run-walk') return 'run-walk'
  if (modality === 'free') return 'free'
  return 'walk'
}

function normalizeDailyExtraMinutes(
  dailyExtraMinutes: Record<string, number>,
): Record<string, number> {
  const normalized: Record<string, number> = {}

  for (const [dateIso, rawMinutes] of Object.entries(dailyExtraMinutes)) {
    const minutes = Number(rawMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) continue
    normalized[dateIso] = Math.round(minutes)
  }

  return normalized
}

function resolveTargets(targets: WeeklyGoalTargetsDto | null): WeeklyGoalTargetsDto {
  return {
    targetActivities: targets?.targetActivities ?? 0,
    targetActiveMinutes: targets?.targetActiveMinutes ?? 0,
    targetMovementDays: targets?.targetMovementDays ?? 0,
  }
}

export function buildMetasSemanaisProgresso(
  input: BuildMetasSemanaisProgressoInput,
): RunWalkMetasSemanaisProgressoDto {
  const now = input.now ?? new Date()
  const todayKey = getDateKeyInAppTzFromDate(now)
  const targets = resolveTargets(input.targets)
  const dailyExtraMinutes = normalizeDailyExtraMinutes(input.dailyExtraMinutes)

  const activitiesByDate = new Map<string, WeekProgressActivityRecord[]>()
  let activityMinutesTotal = 0

  for (const activity of input.activities) {
    const dateIso = getDateKeyFromIsoInAppTz(activity.completedAt)
    const current = activitiesByDate.get(dateIso) ?? []
    current.push(activity)
    activitiesByDate.set(dateIso, current)
    activityMinutesTotal += activity.activeMinutes
  }

  const extraMinutesTotal = Object.values(dailyExtraMinutes).reduce(
    (sum, minutes) => sum + minutes,
    0,
  )

  const weeklyCalendar: WeeklyCalendarDayDto[] = Array.from({ length: 7 }, (_, index) => {
    const dateIso = shiftDateKey(input.weekStartDate, index)
    const date = parseDateKey(dateIso)
    const dayActivities = activitiesByDate.get(dateIso) ?? []
    const extraMinutes = dailyExtraMinutes[dateIso] ?? 0
    const activityMinutes = dayActivities.reduce(
      (sum, activity) => sum + activity.activeMinutes,
      0,
    )
    const isFuture = dateIso > todayKey
    const activeMinutes = isFuture ? 0 : activityMinutes + extraMinutes

    const weekdayShort = date
      .toLocaleDateString(PT_BR, { weekday: 'short', timeZone: APP_TIMEZONE })
      .replace('.', '')
      .toLowerCase()

    let activities: WeeklyCalendarActivityDto[]

    if (isFuture) {
      activities = [{ type: 'rest', label: 'Descanso' }]
    } else if (dayActivities.length > 0) {
      activities = dayActivities.map((activity) => ({
        type: mapModalityToWeeklyCalendarType(activity.modality),
        label: activity.activityName,
        completed: true,
      }))
    } else if (extraMinutes > 0) {
      activities = [{ type: 'run-walk', label: 'Corrida e caminhada', completed: true }]
    } else {
      activities = [{ type: 'rest', label: 'Descanso' }]
    }

    return {
      dateIso,
      dayLabel: date.toLocaleDateString(PT_BR, {
        day: 'numeric',
        month: 'short',
        timeZone: APP_TIMEZONE,
      }),
      weekdayShort,
      dateShort: formatWeeklyChartDate(dateIso),
      isToday: dateIso === todayKey,
      isFuture,
      activeMinutes,
      activities,
    }
  })

  const movementDays = weeklyCalendar.filter(
    (day) => !day.isFuture && day.activeMinutes > 0,
  ).length

  return {
    weekStartDate: input.weekStartDate,
    weeklyGoal: {
      completedActivities: input.activities.length + input.extraCompletedActivities,
      targetActivities: targets.targetActivities,
      activeMinutes: activityMinutesTotal + extraMinutesTotal,
      targetActiveMinutes: targets.targetActiveMinutes,
      movementDays,
      targetMovementDays: targets.targetMovementDays,
    },
    weeklyCalendar,
    dailyExtraMinutes,
  }
}

export function resolveWeekDateKeys(semanaInicio: string): string[] {
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(semanaInicio, index))
}

export { resolveWeekBoundsFromStartDateKey }
