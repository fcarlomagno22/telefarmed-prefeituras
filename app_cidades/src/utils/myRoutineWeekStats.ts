import type {
  MyRoutineDayPlan,
  MyRoutineOnboardingRecord,
  MyRoutineTask,
  MyRoutineWeekPlan,
} from '../types/myRoutine'
import { buildWeekDateIsos, computeMinimalRoutineProgress } from './myRoutinePlanEngine'
import { toLocalDateIso } from './runWalkWeeklyChart'

export type MyRoutineWeekSummary = {
  minimalOkDays: number
  tasksDone: number
  lightDays: number
  totalDays: number
}

export type MyRoutineWeekDayPreview = {
  dateIso: string
  weekdayShort: string
  isWeekend: boolean
  isToday: boolean
  dayPlan: MyRoutineDayPlan
  essentialCount: number
  doneCount: number
  previewTitles: string[]
  minimalComplete: boolean
}

const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

export function shiftWeekStartIso(weekStartIso: string, deltaWeeks: number): string {
  const date = new Date(`${weekStartIso}T12:00:00`)
  date.setDate(date.getDate() + deltaWeeks * 7)
  return toLocalDateIso(date)
}

export function formatWeekRangeLabel(weekStartIso: string): string {
  const monday = new Date(`${weekStartIso}T12:00:00`)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startDay = monday.getDate()
  const endDay = sunday.getDate()
  const startMonth = monday.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const endMonth = sunday.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${endMonth}`
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`
}

export function buildRecentWeekStarts(count = 12, referenceDate = new Date()): string[] {
  const current = getWeekStartIsoFromDate(referenceDate)
  return Array.from({ length: count }, (_, index) => shiftWeekStartIso(current, -index))
}

function getWeekStartIsoFromDate(referenceDate: Date): string {
  const today = new Date(referenceDate)
  today.setHours(12, 0, 0, 0)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  today.setDate(today.getDate() + mondayOffset)
  return toLocalDateIso(today)
}

export function isWeekendDateIso(dateIso: string): boolean {
  const day = new Date(`${dateIso}T12:00:00`).getDay()
  return day === 0 || day === 6
}

export function computeWeekSummary(days: Record<string, MyRoutineDayPlan>): MyRoutineWeekSummary {
  const dayList = Object.values(days)
  let minimalOkDays = 0
  let tasksDone = 0
  let lightDays = 0

  for (const day of dayList) {
    const progress = computeMinimalRoutineProgress(day)
    if (progress.total > 0 && progress.done >= progress.total) minimalOkDays += 1
    tasksDone += day.tasks.filter((task) => task.status === 'done').length
    if (day.dayMode === 'light') lightDays += 1
  }

  return {
    minimalOkDays,
    tasksDone,
    lightDays,
    totalDays: dayList.length,
  }
}

export function buildWeekDayPreviews(
  weekPlan: MyRoutineWeekPlan,
  mergedDays: Record<string, MyRoutineDayPlan>,
  todayIso = toLocalDateIso(new Date()),
): MyRoutineWeekDayPreview[] {
  const dateIsos = buildWeekDateIsos(weekPlan.weekStartIso)

  return dateIsos.map((dateIso, index) => {
    const dayPlan = mergedDays[dateIso] ?? weekPlan.days[dateIso] ?? {
      dateIso,
      tasks: [],
      minimalRoutineTaskIds: [],
      dayMode: 'normal' as const,
    }
    const progress = computeMinimalRoutineProgress(dayPlan)
    const essentialCount = dayPlan.minimalRoutineTaskIds.length
    const doneCount = dayPlan.tasks.filter((task) => task.status === 'done').length
    const previewTitles = dayPlan.tasks.slice(0, 3).map((task) => task.title)

    return {
      dateIso,
      weekdayShort: WEEKDAY_SHORT[index] ?? '—',
      isWeekend: isWeekendDateIso(dateIso),
      isToday: dateIso === todayIso,
      dayPlan,
      essentialCount,
      doneCount,
      previewTitles,
      minimalComplete: progress.total > 0 && progress.done >= progress.total,
    }
  })
}

export function mergeWeekPlanTaskStatuses(
  previous: MyRoutineWeekPlan,
  next: MyRoutineWeekPlan,
): MyRoutineWeekPlan {
  const days: Record<string, MyRoutineDayPlan> = {}

  for (const [dateIso, newDay] of Object.entries(next.days)) {
    const oldDay = previous.days[dateIso]
    if (!oldDay) {
      days[dateIso] = newDay
      continue
    }

    const statusById = new Map(oldDay.tasks.map((task) => [task.id, task]))
    const statusByTitle = new Map(oldDay.tasks.map((task) => [task.title.toLowerCase(), task]))

    const tasks = newDay.tasks.map((task) => {
      const prev =
        statusById.get(task.id) ?? statusByTitle.get(task.title.toLowerCase())
      if (!prev) return task
      return {
        ...task,
        status: prev.status,
        snoozedUntil: prev.snoozedUntil ?? null,
        skipReason: prev.skipReason ?? null,
      }
    })

    days[dateIso] = {
      ...newDay,
      tasks,
      dayMode: oldDay.dayMode !== 'normal' ? oldDay.dayMode : newDay.dayMode,
    }
  }

  return { ...next, days }
}

export function countWeekTasks(plan: MyRoutineWeekPlan): number {
  return Object.values(plan.days).reduce((sum, day) => sum + day.tasks.length, 0)
}

export function countWeekEssentials(plan: MyRoutineWeekPlan): number {
  return Object.values(plan.days).reduce((sum, day) => sum + day.minimalRoutineTaskIds.length, 0)
}

export function reorderTasks(tasks: MyRoutineTask[], fromIndex: number, toIndex: number): MyRoutineTask[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return tasks
  if (fromIndex >= tasks.length || toIndex >= tasks.length) return tasks

  const next = [...tasks]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function toggleTaskPriority(task: MyRoutineTask): MyRoutineTask {
  const order: MyRoutineTask['priority'][] = ['essential', 'desirable', 'bonus']
  const index = order.indexOf(task.priority)
  const nextPriority = order[(index + 1) % order.length]
  return { ...task, priority: nextPriority }
}

export function syncMinimalIdsForDay(dayPlan: MyRoutineDayPlan): MyRoutineDayPlan {
  return {
    ...dayPlan,
    minimalRoutineTaskIds: dayPlan.tasks
      .filter((task) => task.priority === 'essential')
      .map((task) => task.id),
  }
}

export function applyTemplateToWeekPlan(
  previous: MyRoutineWeekPlan,
  record: MyRoutineOnboardingRecord,
  templateId: MyRoutineOnboardingRecord['selectedTemplateId'],
  generate: (rec: MyRoutineOnboardingRecord, ref: Date) => MyRoutineWeekPlan,
): MyRoutineWeekPlan {
  const reference = new Date(`${previous.weekStartIso}T12:00:00`)
  const regenerated = generate(
    { ...record, selectedTemplateId: templateId },
    reference,
  )
  return mergeWeekPlanTaskStatuses(previous, {
    ...regenerated,
    weekStartIso: previous.weekStartIso,
  })
}

export function createRecurringTaskSeed(title: string): Omit<MyRoutineTask, 'id' | 'status'> {
  return {
    title: title.trim(),
    category: 'other',
    scheduleType: 'window',
    windowStart: '09:00',
    windowEnd: '12:00',
    priority: 'desirable',
    block: 'anytime',
    recurrence: { daysOfWeek: [1, 2, 3, 4, 5] },
    time: null,
    triggerLabel: null,
    linkedModule: null,
  }
}

export function cloneTaskWithId(
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
