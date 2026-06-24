import type {
  MyRoutineDayHistoryEntry,
  MyRoutineDayPlan,
  MyRoutineDayMode,
  MyRoutineOnboardingRecord,
  MyRoutineTask,
  MyRoutineWeekPlan,
  MyRoutineWeeklyReview,
} from '../types/myRoutine'
import { emptyMyRoutineDayPlan, emptyMyRoutineWeekPlan } from '../types/myRoutine'
import { toLocalDateIso } from './runWalkWeeklyChart'
import {
  resolveMyRoutineTemplate,
  tasksFromIdealLabels,
  type MyRoutineTemplateDefinition,
} from './myRoutineTemplates'

const BLOCK_ORDER: MyRoutineTask['block'][] = ['morning', 'afternoon', 'evening', 'anytime']

function createTaskId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`
}

function cloneTask(
  seed: Omit<MyRoutineTask, 'id' | 'status'>,
  id: string,
): MyRoutineTask {
  return {
    ...seed,
    id,
    status: 'pending',
    time: seed.time ?? null,
    windowStart: seed.windowStart ?? null,
    windowEnd: seed.windowEnd ?? null,
    triggerLabel: seed.triggerLabel ?? null,
    recurrence: seed.recurrence ?? null,
    linkedModule: seed.linkedModule ?? null,
  }
}

function isWeekendDate(dateIso: string): boolean {
  const day = new Date(`${dateIso}T12:00:00`).getDay()
  return day === 0 || day === 6
}

export function getWeekStartIso(referenceDate = new Date()): string {
  const today = new Date(referenceDate)
  today.setHours(12, 0, 0, 0)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  today.setDate(today.getDate() + mondayOffset)
  return toLocalDateIso(today)
}

export function buildWeekDateIsos(weekStartIso: string): string[] {
  const monday = new Date(`${weekStartIso}T12:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return toLocalDateIso(date)
  })
}

function taskAppliesOnDay(task: Omit<MyRoutineTask, 'id' | 'status'>, dayOfWeek: number): boolean {
  const days = task.recurrence?.daysOfWeek
  if (!days || days.length === 0) return true
  return days.includes(dayOfWeek)
}

function buildTasksForDay(
  template: MyRoutineTemplateDefinition,
  record: MyRoutineOnboardingRecord,
  dateIso: string,
  idPrefix: string,
): MyRoutineTask[] {
  const dayOfWeek = new Date(`${dateIso}T12:00:00`).getDay()
  const weekend = isWeekendDate(dateIso)
  const weekendMode = record.weekendMode

  if (weekend && weekendMode === 'rest') {
    const essentials = record.idealRoutine.weekend.essential
    const seeds = [
      ...template.baseTasks.filter((task) => task.priority === 'essential'),
      ...tasksFromIdealLabels(essentials, 'essential', 'anytime'),
    ]
    return seeds
      .filter((task) => taskAppliesOnDay(task, dayOfWeek))
      .slice(0, 3)
      .map((seed, index) => cloneTask(seed, createTaskId(`${idPrefix}-rest`, index)))
  }

  const ideal = weekend ? record.idealRoutine.weekend : record.idealRoutine.weekday
  const intensity = weekend && weekendMode === 'balanced' ? 0.7 : 1

  const seeds: Omit<MyRoutineTask, 'id' | 'status'>[] = [
    ...template.baseTasks,
    ...tasksFromIdealLabels(ideal.essential, 'essential', 'morning'),
    ...tasksFromIdealLabels(ideal.desirable, 'desirable', 'afternoon'),
    ...(intensity >= 1 ? tasksFromIdealLabels(ideal.bonus, 'bonus', 'evening') : []),
  ]

  return seeds
    .filter((task) => taskAppliesOnDay(task, dayOfWeek))
    .map((seed, index) => cloneTask(seed, createTaskId(idPrefix, index)))
}

function resolveMinimalTaskIds(tasks: MyRoutineTask[]): string[] {
  return tasks.filter((task) => task.priority === 'essential').map((task) => task.id)
}

function resolveDayModeForDate(
  record: MyRoutineOnboardingRecord,
  dateIso: string,
): MyRoutineDayMode {
  if (isWeekendDate(dateIso) && record.weekendMode === 'rest') return 'light'
  return 'normal'
}

export function generateWeekPlanFromOnboarding(
  record: MyRoutineOnboardingRecord,
  referenceDate = new Date(),
): MyRoutineWeekPlan {
  const template = resolveMyRoutineTemplate(record)
  const weekStartIso = getWeekStartIso(referenceDate)
  const days: Record<string, MyRoutineDayPlan> = {}

  for (const dateIso of buildWeekDateIsos(weekStartIso)) {
    const tasks = buildTasksForDay(template, record, dateIso, dateIso)
    days[dateIso] = {
      dateIso,
      tasks,
      minimalRoutineTaskIds: resolveMinimalTaskIds(tasks),
      dayMode: resolveDayModeForDate(record, dateIso),
    }
  }

  return {
    weekStartIso,
    days,
    recurringTemplates: template.baseTasks.map((seed, index) =>
      cloneTask(seed, createTaskId(`recurring-${template.id}`, index)),
    ),
    templateId: template.id,
    updatedAt: new Date().toISOString(),
  }
}

export function getTodayPlan(weekPlan: MyRoutineWeekPlan, dateIso: string): MyRoutineDayPlan {
  const fromWeek = weekPlan.days[dateIso]
  if (fromWeek) return fromWeek
  return emptyMyRoutineDayPlan(dateIso)
}

export function applyWeeklyReviewAdjustments(
  plan: MyRoutineWeekPlan,
  review: Pick<MyRoutineWeeklyReview, 'adjustment' | 'blocked'>,
): MyRoutineWeekPlan {
  const adjustment = `${review.adjustment} ${review.blocked}`.toLowerCase()
  const shouldSimplify =
    adjustment.includes('menos') ||
    adjustment.includes('simples') ||
    adjustment.includes('reduz') ||
    adjustment.includes('cansad')

  if (!shouldSimplify) {
    return { ...plan, updatedAt: new Date().toISOString() }
  }

  const days: Record<string, MyRoutineDayPlan> = {}
  for (const [dateIso, dayPlan] of Object.entries(plan.days)) {
    days[dateIso] = suggestLightDayPlan(dayPlan)
  }

  return {
    ...plan,
    days,
    updatedAt: new Date().toISOString(),
  }
}

export function suggestLightDayPlan(dayPlan: MyRoutineDayPlan): MyRoutineDayPlan {
  const essentialTasks = dayPlan.tasks.filter((task) => task.priority === 'essential')
  return {
    ...dayPlan,
    dayMode: 'light',
    tasks: essentialTasks.map((task) => ({
      ...task,
      status: task.status === 'pending' ? 'pending' : task.status,
    })),
    minimalRoutineTaskIds: essentialTasks.map((task) => task.id),
  }
}

export function computeMinimalRoutineProgress(dayPlan: MyRoutineDayPlan): {
  done: number
  total: number
  ratio: number
} {
  const total = dayPlan.minimalRoutineTaskIds.length
  if (total === 0) return { done: 0, total: 0, ratio: 0 }

  const done = dayPlan.tasks.filter(
    (task) =>
      dayPlan.minimalRoutineTaskIds.includes(task.id) &&
      (task.status === 'done' || task.status === 'skipped'),
  ).length

  return { done, total, ratio: done / total }
}

function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function taskSortScore(task: MyRoutineTask, now: Date): number {
  const blockScore = BLOCK_ORDER.indexOf(task.block) * 10_000

  if (task.scheduleType === 'fixed') {
    const minutes = parseTimeToMinutes(task.time)
    if (minutes == null) return blockScore
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return blockScore + minutes + (minutes < nowMinutes ? 24 * 60 : 0)
  }

  if (task.scheduleType === 'window') {
    const start = parseTimeToMinutes(task.windowStart) ?? blockScore
    return blockScore + start
  }

  return blockScore + 20_000
}

export function pickNextTask(dayPlan: MyRoutineDayPlan, now = new Date()): MyRoutineTask | null {
  const pending = dayPlan.tasks.filter((task) => {
    if (task.status === 'done' || task.status === 'skipped') return false
    if (task.status === 'snoozed' && task.snoozedUntil) {
      if (new Date(task.snoozedUntil).getTime() > now.getTime()) return false
      return true
    }
    return task.status === 'pending'
  })

  if (pending.length === 0) return null

  return [...pending].sort((a, b) => taskSortScore(a, now) - taskSortScore(b, now))[0] ?? null
}

export function shouldSuggestSimplify(dayHistory: MyRoutineDayHistoryEntry[]): boolean {
  if (dayHistory.length < 3) return false

  const recent = [...dayHistory]
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, 3)

  return recent.every(
    (entry) => entry.minimalTotal > 0 && entry.minimalDone < entry.minimalTotal,
  )
}

export function ensureMyRoutineWeekPlan(
  record: MyRoutineOnboardingRecord,
  existing: MyRoutineWeekPlan | null,
  referenceDate = new Date(),
): MyRoutineWeekPlan {
  const weekStartIso = getWeekStartIso(referenceDate)
  if (existing && existing.weekStartIso === weekStartIso) return existing
  if (existing) return existing
  return generateWeekPlanFromOnboarding(record, referenceDate)
}

export { emptyMyRoutineWeekPlan }
