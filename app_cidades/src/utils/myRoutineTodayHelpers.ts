import type { AppScreen } from '../types/auth'
import type {
  MyRoutineDayPlan,
  MyRoutineLinkedModule,
  MyRoutineTask,
  MyRoutineTimeBlock,
} from '../types/myRoutine'
import { computeMinimalRoutineProgress, pickNextTask } from './myRoutinePlanEngine'

export type MyRoutineDayPhase = 'planned' | 'in_progress' | 'minimal_ok' | 'day_closed'

export type MyRoutineTelefarmedShortcut = {
  id: string
  label: string
  subtitle: string
  icon: 'heart-outline' | 'restaurant-outline' | 'walk-outline' | 'calendar-outline' | 'moon-outline'
  route: AppScreen
}

export const MY_ROUTINE_TELEFARMED_SHORTCUTS: MyRoutineTelefarmedShortcut[] = [
  {
    id: 'mental-health',
    label: 'Saúde mental',
    subtitle: 'Check-in emocional',
    icon: 'heart-outline',
    route: 'mental-health',
  },
  {
    id: 'eat-well',
    label: 'Comer bem',
    subtitle: 'Registrar refeição',
    icon: 'restaurant-outline',
    route: 'eat-well',
  },
  {
    id: 'run-walk',
    label: 'Corrida e caminhada',
    subtitle: 'Movimento guiado',
    icon: 'walk-outline',
    route: 'run-walk',
  },
  {
    id: 'appointments',
    label: 'Consultas',
    subtitle: 'Agendar ou ver consultas',
    icon: 'calendar-outline',
    route: 'my-appointments',
  },
  {
    id: 'sleep-time',
    label: 'Hora de dormir',
    subtitle: 'Sono e relaxamento',
    icon: 'moon-outline',
    route: 'sleep-time',
  },
]

export const MY_ROUTINE_BLOCK_LABELS: Record<MyRoutineTimeBlock, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
  anytime: 'A qualquer momento',
}

export const MY_ROUTINE_BLOCK_ORDER: MyRoutineTimeBlock[] = [
  'morning',
  'afternoon',
  'evening',
  'anytime',
]

export const LINKED_MODULE_ROUTES: Record<MyRoutineLinkedModule, AppScreen> = {
  'mental-health-checkin': 'mental-health',
  'eat-well-log': 'eat-well',
  'run-walk': 'run-walk',
  'my-appointments': 'my-appointments',
  'sleep-time': 'sleep-time',
}

export const LINKED_MODULE_LABELS: Record<MyRoutineLinkedModule, string> = {
  'mental-health-checkin': 'Saúde mental',
  'eat-well-log': 'Comer bem',
  'run-walk': 'Corrida e caminhada',
  'my-appointments': 'Consultas',
  'sleep-time': 'Hora de dormir',
}

export function buildMyRoutineModuleLinkParams(
  taskId: string,
): { myRoutineReturnTaskId: string } {
  return { myRoutineReturnTaskId: taskId }
}

const BLOCK_DEFAULT_HOUR: Record<MyRoutineTimeBlock, number> = {
  morning: 8,
  afternoon: 14,
  evening: 20,
  anytime: 12,
}

export function parseTimeToHour(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) + Number(match[2]) / 60
}

export function getTaskMapHour(task: MyRoutineTask): number {
  if (task.scheduleType === 'fixed') {
    return parseTimeToHour(task.time) ?? BLOCK_DEFAULT_HOUR[task.block]
  }
  if (task.scheduleType === 'window') {
    return parseTimeToHour(task.windowStart) ?? BLOCK_DEFAULT_HOUR[task.block]
  }
  return BLOCK_DEFAULT_HOUR[task.block]
}

export function formatTaskScheduleLabel(task: MyRoutineTask): string {
  if (task.scheduleType === 'fixed' && task.time) {
    return `Horário fixo · ${task.time}`
  }
  if (task.scheduleType === 'window') {
    return `Janela · ${task.windowStart ?? '—'} – ${task.windowEnd ?? '—'}`
  }
  if (task.triggerLabel) return task.triggerLabel
  return 'Quando fizer sentido'
}

export function formatPriorityLabel(priority: MyRoutineTask['priority']): string {
  if (priority === 'essential') return 'Essencial'
  if (priority === 'desirable') return 'Desejável'
  return 'Bônus'
}

export function groupTasksByBlock(tasks: MyRoutineTask[]): Record<MyRoutineTimeBlock, MyRoutineTask[]> {
  const groups: Record<MyRoutineTimeBlock, MyRoutineTask[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    anytime: [],
  }

  for (const task of tasks) {
    groups[task.block].push(task)
  }

  for (const block of MY_ROUTINE_BLOCK_ORDER) {
    groups[block].sort((a, b) => getTaskMapHour(a) - getTaskMapHour(b))
  }

  return groups
}

export function resolveMyRoutineDayPhase(
  dayPlan: MyRoutineDayPlan,
  hasClosure: boolean,
  now = new Date(),
): MyRoutineDayPhase {
  if (hasClosure) return 'day_closed'

  const progress = computeMinimalRoutineProgress(dayPlan)
  if (progress.total > 0 && progress.done >= progress.total) return 'minimal_ok'

  const hasProgress = dayPlan.tasks.some(
    (task) => task.status === 'done' || task.status === 'skipped' || task.status === 'snoozed',
  )
  const nextTask = pickNextTask(dayPlan, now)

  if (hasProgress || nextTask) return 'in_progress'
  return 'planned'
}

export function buildDayHeroPhrase(
  dayPlan: MyRoutineDayPlan,
  phase: MyRoutineDayPhase,
  now = new Date(),
): string {
  if (phase === 'day_closed') return 'Dia encerrado — amanhã recomeçamos leve.'
  if (phase === 'minimal_ok') return 'Rotina mínima ok! O resto é bônus, no seu tempo.'
  if (dayPlan.dayMode === 'light') return 'Dia leve ativo — só o essencial por enquanto.'

  const nextTask = pickNextTask(dayPlan, now)
  if (nextTask) {
    return `Próximo: ${nextTask.title} · ${formatTaskScheduleLabel(nextTask)}`
  }

  const progress = computeMinimalRoutineProgress(dayPlan)
  if (progress.total === 0) return 'Seu dia está aberto — adicione o que fizer sentido.'
  if (progress.done === 0) return 'Comece pelo essencial — um passo de cada vez.'
  return 'Quase lá — revise o que ainda falta ou encerre o dia.'
}

export function countEssentialSkips(dayPlan: MyRoutineDayPlan): number {
  return dayPlan.tasks.filter(
    (task) => task.priority === 'essential' && task.status === 'skipped',
  ).length
}

export function createAdhocTaskId(): string {
  return `adhoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
