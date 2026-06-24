/**
 * Tipos e defaults — Minha Rotina
 */

export type MyRoutineTab = 'today' | 'week' | 'profile'

export type MyRoutineTemplateId =
  | 'day-busy'
  | 'with-children'
  | 'health-focus'
  | 'post-consultation'

export type MyRoutineWeekendMode = 'rest' | 'balanced' | 'same-as-week'

export type MyRoutineTimeBlock = 'morning' | 'afternoon' | 'evening' | 'anytime'

export type MyRoutineTaskCategory =
  | 'health'
  | 'home'
  | 'work'
  | 'self-care'
  | 'medicine'
  | 'exercise'
  | 'meal'
  | 'sleep'
  | 'other'

export type MyRoutineLinkedModule =
  | 'mental-health-checkin'
  | 'eat-well-log'
  | 'run-walk'
  | 'my-appointments'
  | 'sleep-time'

export type MyRoutineScheduleType = 'fixed' | 'window' | 'trigger'

export type MyRoutineTaskPriority = 'essential' | 'desirable' | 'bonus'

export type MyRoutineTaskStatus = 'pending' | 'done' | 'snoozed' | 'skipped'

export type MyRoutineDayMode = 'normal' | 'light' | 'disrupted'

export type MyRoutineTaskRecurrence = {
  /** 0 = domingo … 6 = sábado (Date.getDay()) */
  daysOfWeek: number[]
}

export type MyRoutineTask = {
  id: string
  title: string
  category: MyRoutineTaskCategory
  scheduleType: MyRoutineScheduleType
  time?: string | null
  windowStart?: string | null
  windowEnd?: string | null
  triggerLabel?: string | null
  priority: MyRoutineTaskPriority
  block: MyRoutineTimeBlock
  recurrence?: MyRoutineTaskRecurrence | null
  linkedModule?: MyRoutineLinkedModule | null
  status: MyRoutineTaskStatus
  snoozedUntil?: string | null
  skipReason?: string | null
}

export type MyRoutineDayPlan = {
  dateIso: string
  tasks: MyRoutineTask[]
  minimalRoutineTaskIds: string[]
  dayMode: MyRoutineDayMode
}

export type MyRoutineWeekPlan = {
  weekStartIso: string
  days: Record<string, MyRoutineDayPlan>
  recurringTemplates: MyRoutineTask[]
  templateId: MyRoutineTemplateId | null
  updatedAt: string
}

export type MyRoutineRoutineBlockEntry = {
  block: MyRoutineTimeBlock
  activityIds: string[]
  notes?: string
}

export type MyRoutineIdealTier = {
  essential: string[]
  desirable: string[]
  bonus: string[]
}

export type MyRoutineIdealRoutine = {
  weekday: MyRoutineIdealTier
  weekend: MyRoutineIdealTier
}

export type MyRoutineOnboardingRecord = {
  completed: boolean
  completedAt: string | null
  lifeContext: string[]
  wakeTime: string | null
  sleepTime: string | null
  currentRoutineBlocks: MyRoutineRoutineBlockEntry[]
  obstructionNotes: string
  idealRoutine: MyRoutineIdealRoutine
  selectedTemplateId: MyRoutineTemplateId | null
  weekendMode: MyRoutineWeekendMode
}

export type MyRoutinePreferences = {
  notificationsEnabled: boolean
  morningBlockReminder: boolean
  taskReminders: boolean
  weeklyReviewReminder: boolean
  /** Usuário viu o modal explicativo de lembretes (UI-only, sem push nativo ainda). */
  notificationPermissionPromptSeen: boolean
  scheduleStyle: MyRoutineScheduleType
  intensity: 'light' | 'moderate' | 'ambitious'
}

export type MyRoutineWeeklyReview = {
  id: string
  weekStartIso: string
  createdAt: string
  workedWell: string
  blocked: string
  adjustment: string
  appliedAt: string | null
}

export type MyRoutineDayClosure = {
  dateIso: string
  energyLevel: 1 | 2 | 3 | 4 | 5
  adherenceLevel: 1 | 2 | 3 | 4 | 5
  tomorrowAdjustment: string
  createdAt: string
}

export type MyRoutineDayHistoryEntry = {
  dateIso: string
  minimalDone: number
  minimalTotal: number
  dayMode: MyRoutineDayMode
}

export { MY_ROUTINE_SEGMENT_TABS_FROM_CONTRACT as MY_ROUTINE_SEGMENT_TABS } from '../myRoutine/myRoutineTabContract'

export type MyRoutineLifeContextId =
  | 'work'
  | 'children'
  | 'study'
  | 'caregiver'
  | 'health'
  | 'shifts'
  | 'home'
  | 'alone'

export type MyRoutineHowItWorksStep = {
  id: number
  icon:
    | 'shield-checkmark-outline'
    | 'time-outline'
    | 'heart-outline'
    | 'calendar-outline'
  title: string
  summary: string
  detail: string
}

export const MY_ROUTINE_DEFAULT_WAKE_TIME = '07:00'
export const MY_ROUTINE_DEFAULT_SLEEP_TIME = '22:30'

export const MY_ROUTINE_HOW_IT_WORKS_INTRO =
  'Organize seu dia com leveza: o essencial primeiro, o resto quando der — sem culpa por pular ou simplificar.'

export const MY_ROUTINE_HOW_IT_WORKS_STEPS: MyRoutineHowItWorksStep[] = [
  {
    id: 1,
    icon: 'shield-checkmark-outline',
    title: 'Rotina mínima',
    summary: 'Essencial, desejável e bônus — nesta ordem.',
    detail:
      'Você escolhe o que realmente importa (essencial), o que gostaria de fazer (desejável) e extras opcionais (bônus). O app destaca os essenciais do dia e mede consistência só neles — não exige perfeição em tudo.',
  },
  {
    id: 2,
    icon: 'time-outline',
    title: 'Horário fixo ou janela',
    summary: 'Combine o que cabe na sua vida real.',
    detail:
      'Algumas tarefas têm horário certo (ex.: remédio às 8h). Outras usam janelas flexíveis (ex.: caminhada entre 12h e 14h) ou gatilhos (ex.: depois que os filhos dormirem). Você escolhe o formato que faz sentido.',
  },
  {
    id: 3,
    icon: 'heart-outline',
    title: 'Pular sem culpa',
    summary: 'Adiar, pular ou simplificar o dia.',
    detail:
      'Imprevistos acontecem. Você pode adiar uma tarefa, pular com um motivo leve ou ativar o modo dia leve — mantendo só os essenciais. O objetivo é continuar, não acertar 100% todo dia.',
  },
  {
    id: 4,
    icon: 'calendar-outline',
    title: 'Revisão semanal',
    summary: '5 minutos para ajustar a próxima semana.',
    detail:
      'No fim da semana, você conta o que funcionou, o que travou e o que quer mudar. Com base nisso, o plano pode simplificar automaticamente — menos tarefas, mais realismo.',
  },
]

export const MY_ROUTINE_LIFE_CONTEXT_OPTIONS: {
  id: MyRoutineLifeContextId
  label: string
}[] = [
  { id: 'work', label: 'Trabalho intenso' },
  { id: 'children', label: 'Com filhos' },
  { id: 'study', label: 'Estudando' },
  { id: 'caregiver', label: 'Cuido de alguém' },
  { id: 'health', label: 'Foco em saúde' },
  { id: 'shifts', label: 'Turnos / horários variáveis' },
  { id: 'home', label: 'Muito em casa' },
  { id: 'alone', label: 'Moro sozinho(a)' },
]

export const MY_ROUTINE_TIME_BLOCK_OPTIONS: {
  id: MyRoutineTimeBlock
  label: string
}[] = [
  { id: 'morning', label: 'Manhã' },
  { id: 'afternoon', label: 'Tarde' },
  { id: 'evening', label: 'Noite' },
]

export const MY_ROUTINE_WEEKEND_MODE_OPTIONS: {
  id: MyRoutineWeekendMode
  label: string
  description: string
}[] = [
  {
    id: 'rest',
    label: 'Descanso',
    description: 'Fim de semana mais leve — só essenciais.',
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'Menos bônus, mantém o essencial e parte do desejável.',
  },
  {
    id: 'same-as-week',
    label: 'Igual à semana',
    description: 'Mesma intensidade de segunda a domingo.',
  },
]

export const MY_ROUTINE_CURRENT_ACTIVITY_OPTIONS: {
  id: string
  label: string
  block: MyRoutineTimeBlock
}[] = [
  { id: 'wake-early', label: 'Acordar cedo', block: 'morning' },
  { id: 'breakfast', label: 'Café da manhã', block: 'morning' },
  { id: 'medicine-am', label: 'Remédios (manhã)', block: 'morning' },
  { id: 'exercise-am', label: 'Exercício', block: 'morning' },
  { id: 'school-run', label: 'Levar filhos à escola', block: 'morning' },
  { id: 'work-block', label: 'Trabalho / estudo', block: 'afternoon' },
  { id: 'lunch', label: 'Almoço', block: 'afternoon' },
  { id: 'nap', label: 'Soneca / pausa', block: 'afternoon' },
  { id: 'errands', label: 'Compras / afazeres', block: 'afternoon' },
  { id: 'dinner', label: 'Jantar', block: 'evening' },
  { id: 'screens', label: 'Tela / lazer', block: 'evening' },
  { id: 'wind-down', label: 'Preparar para dormir', block: 'evening' },
  { id: 'medicine-pm', label: 'Remédios (noite)', block: 'evening' },
]

export const MY_ROUTINE_IDEAL_ACTIVITY_OPTIONS: {
  id: string
  label: string
  tier: MyRoutineTaskPriority
}[] = [
  { id: 'sleep-7h', label: 'Dormir bem', tier: 'essential' },
  { id: 'medicine', label: 'Tomar remédios', tier: 'essential' },
  { id: 'water', label: 'Beber água', tier: 'essential' },
  { id: 'mental-checkin', label: 'Check-in emocional', tier: 'essential' },
  { id: 'walk', label: 'Caminhada / movimento', tier: 'desirable' },
  { id: 'meal-log', label: 'Registrar refeição', tier: 'desirable' },
  { id: 'pause', label: 'Pausa de 10 min', tier: 'desirable' },
  { id: 'read', label: 'Leitura', tier: 'bonus' },
  { id: 'hobby', label: 'Hobby', tier: 'bonus' },
  { id: 'organize', label: 'Organizar casa', tier: 'bonus' },
]

export const MY_ROUTINE_ONBOARDING_STEPS = [
  { id: 1, title: 'Boas-vindas', subtitle: 'Seu dia, no seu ritmo' },
  { id: 2, title: 'Sua vida hoje', subtitle: 'Contexto e horários' },
  { id: 3, title: 'Rotina atual', subtitle: 'Como é seu dia agora' },
  { id: 4, title: 'Rotina ideal', subtitle: 'O que você quer cultivar' },
  { id: 5, title: 'Escolher template', subtitle: 'Um ponto de partida' },
  { id: 6, title: 'Plano gerado', subtitle: 'Prévia da sua semana' },
] as const

export function emptyMyRoutineIdealTier(): MyRoutineIdealTier {
  return { essential: [], desirable: [], bonus: [] }
}

export function emptyMyRoutineIdealRoutine(): MyRoutineIdealRoutine {
  return {
    weekday: emptyMyRoutineIdealTier(),
    weekend: emptyMyRoutineIdealTier(),
  }
}

export function emptyMyRoutineOnboardingRecord(): MyRoutineOnboardingRecord {
  return {
    completed: false,
    completedAt: null,
    lifeContext: [],
    wakeTime: null,
    sleepTime: null,
    currentRoutineBlocks: [],
    obstructionNotes: '',
    idealRoutine: emptyMyRoutineIdealRoutine(),
    selectedTemplateId: null,
    weekendMode: 'balanced',
  }
}

export function emptyMyRoutineDayPlan(dateIso: string): MyRoutineDayPlan {
  return {
    dateIso,
    tasks: [],
    minimalRoutineTaskIds: [],
    dayMode: 'normal',
  }
}

export function emptyMyRoutineWeekPlan(weekStartIso: string): MyRoutineWeekPlan {
  return {
    weekStartIso,
    days: {},
    recurringTemplates: [],
    templateId: null,
    updatedAt: new Date().toISOString(),
  }
}

export function emptyMyRoutinePreferences(): MyRoutinePreferences {
  return {
    notificationsEnabled: true,
    morningBlockReminder: true,
    taskReminders: true,
    weeklyReviewReminder: true,
    notificationPermissionPromptSeen: false,
    scheduleStyle: 'window',
    intensity: 'moderate',
  }
}

export function mergeMyRoutineOnboardingRecord(
  base: MyRoutineOnboardingRecord,
  patch: Partial<MyRoutineOnboardingRecord>,
): MyRoutineOnboardingRecord {
  return {
    ...base,
    ...patch,
    idealRoutine: patch.idealRoutine
      ? {
          weekday: {
            ...base.idealRoutine.weekday,
            ...patch.idealRoutine.weekday,
          },
          weekend: {
            ...base.idealRoutine.weekend,
            ...patch.idealRoutine.weekend,
          },
        }
      : base.idealRoutine,
    currentRoutineBlocks: patch.currentRoutineBlocks ?? base.currentRoutineBlocks,
    lifeContext: patch.lifeContext ?? base.lifeContext,
  }
}

export function mergeMyRoutineDayPlan(
  base: MyRoutineDayPlan,
  patch: Partial<MyRoutineDayPlan>,
): MyRoutineDayPlan {
  return {
    ...base,
    ...patch,
    tasks: patch.tasks ?? base.tasks,
    minimalRoutineTaskIds: patch.minimalRoutineTaskIds ?? base.minimalRoutineTaskIds,
  }
}

export function mergeMyRoutineWeekPlan(
  base: MyRoutineWeekPlan,
  patch: Partial<MyRoutineWeekPlan>,
): MyRoutineWeekPlan {
  return {
    ...base,
    ...patch,
    days: patch.days ? { ...base.days, ...patch.days } : base.days,
    recurringTemplates: patch.recurringTemplates ?? base.recurringTemplates,
  }
}

export function mergeMyRoutinePreferences(
  base: MyRoutinePreferences,
  patch: Partial<MyRoutinePreferences>,
): MyRoutinePreferences {
  return { ...base, ...patch }
}
