import type {
  DispositionCheckinAnswers,
  DispositionRecommendation,
  DispositionState,
  RunWalkTodayState,
  TodayActivity,
  TodayActivityPreset,
  TodayActivityPresetId,
  WeeklyCalendarDay,
  WeeklyGoalStats,
} from '../types/runWalk'
import { formatWeeklyChartDate, toLocalDateIso } from '../utils/runWalkWeeklyChart'

const BEGINNER_RUN_WALK: TodayActivity = {
  id: 'today-beginner-run-walk',
  title: 'Corrida e caminhada para iniciantes',
  type: 'run-walk',
  durationMinutes: 26,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'aumentar o tempo correndo',
  structure: [
    { label: '5 minutos de caminhada' },
    { label: '6 blocos alternando corrida e caminhada' },
    { label: '4 minutos de desaceleração' },
  ],
  estimatedDistanceKm: 2.8,
  recommendedPace: 'Caminhada confortável · Corrida leve (consegue conversar)',
  terrain: 'Asfalto plano ou parque urbano',
  audioGuidance: true,
  warmup: '5 minutos de caminhada em ritmo tranquilo',
  cooldown: '4 minutos reduzindo gradualmente o ritmo até parar',
  importantCautions: [
    'Mantenha postura ereta e passos curtos na corrida',
    'Hidrate-se antes e depois da atividade',
    'Interrompa se sentir dor aguda ou falta de ar intensa',
  ],
}

const WALK_ACTIVITY: TodayActivity = {
  id: 'today-walk',
  title: 'Caminhada ativa',
  type: 'walk',
  durationMinutes: 30,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'melhorar sua regularidade',
  structure: [
    { label: '5 minutos caminhando devagar' },
    { label: '20 minutos em ritmo confortável' },
    { label: '5 minutos reduzindo o ritmo' },
  ],
  estimatedDistanceKm: 2.5,
  recommendedPace: 'Ritmo em que consegue conversar com tranquilidade',
  terrain: 'Calçada, parque ou trilha leve',
  audioGuidance: true,
  warmup: '5 minutos em ritmo bem leve',
  cooldown: '5 minutos reduzindo o passo até parar',
  importantCautions: [
    'Use calçado confortável com boa amortecimento',
    'Prefira superfícies planas se estiver retomando a atividade',
  ],
}

const LIGHT_WALK_ACTIVITY: TodayActivity = {
  id: 'today-light-walk',
  title: 'Caminhada leve',
  type: 'walk',
  durationMinutes: 15,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'manter o corpo em movimento',
  structure: [
    { label: '3 minutos aquecendo o passo' },
    { label: '10 minutos em ritmo tranquilo' },
    { label: '2 minutos reduzindo o ritmo' },
  ],
  estimatedDistanceKm: 1.2,
  recommendedPace: 'Ritmo bem confortável, sem pressa',
  terrain: 'Calçada plana ou parque',
  audioGuidance: true,
  warmup: '3 minutos caminhando devagar',
  cooldown: '2 minutos reduzindo até parar',
  importantCautions: ['Ideal para começar o dia ou retomar após pausa'],
}

const QUICK_ACTIVITY: TodayActivity = {
  id: 'today-quick-activity',
  title: 'Atividade rápida',
  type: 'walk',
  durationMinutes: 10,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'se movimentar mesmo com pouco tempo',
  structure: [
    { label: '2 minutos de aquecimento' },
    { label: '6 minutos em ritmo moderado' },
    { label: '2 minutos de desaceleração' },
  ],
  estimatedDistanceKm: 0.8,
  recommendedPace: 'Ritmo moderado e constante',
  terrain: 'Ao redor de casa ou do trabalho',
  audioGuidance: false,
  warmup: '2 minutos em ritmo leve',
  cooldown: '2 minutos caminhando devagar',
  importantCautions: ['Perfeita para dias corridos'],
}

const RECOVERY_WALK_ACTIVITY: TodayActivity = {
  id: 'today-recovery-walk',
  title: 'Recuperação ativa',
  type: 'walk',
  durationMinutes: 12,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'recuperar sem sobrecarregar',
  structure: [
    { label: '4 minutos caminhando devagar' },
    { label: '5 minutos com mobilidade leve' },
    { label: '3 minutos relaxando o passo' },
  ],
  estimatedDistanceKm: 0.9,
  recommendedPace: 'Ritmo regenerativo, respiração tranquila',
  terrain: 'Parque ou área arborizada',
  audioGuidance: true,
  warmup: '4 minutos em ritmo bem leve',
  cooldown: '3 minutos reduzindo gradualmente',
  importantCautions: ['Priorize conforto e respiração'],
}

const RUNNER_ACTIVITY: TodayActivity = {
  id: 'today-easy-run',
  title: 'Corrida leve',
  type: 'run',
  durationMinutes: 35,
  intensity: 'comfortable',
  intensityLabel: 'Intensidade confortável',
  goal: 'desenvolver resistência',
  structure: [
    { label: '8 minutos de aquecimento em trote leve' },
    { label: '22 minutos em ritmo confortável e constante' },
    { label: '5 minutos de desaceleração' },
  ],
  estimatedDistanceKm: 5.2,
  recommendedPace: 'Ritmo aeróbico — ainda consegue falar frases curtas',
  terrain: 'Parque, ciclovia ou rua com pouco desnível',
  audioGuidance: true,
  warmup: '8 minutos progressivos até ritmo de corrida',
  cooldown: '5 minutos trotando bem leve e caminhando ao final',
  importantCautions: [
    'Evite acelerar nos primeiros minutos',
    'Observe sinais de cansaço e ajuste o ritmo se necessário',
  ],
}

const DEFAULT_DISPOSITION: DispositionState = {
  level: 'good',
  message: 'Sua disposição está boa',
  factors: [
    { id: 'sleep', label: 'Qualidade do sono', value: 'Boa noite de descanso', considered: true },
    { id: 'fatigue', label: 'Cansaço informado', value: 'Nenhum registro recente', considered: true },
    { id: 'recent', label: 'Atividade recente', value: 'Descanso adequado ontem', considered: true },
    { id: 'heart', label: 'Frequência cardíaca', value: 'Dentro da sua média', considered: true },
    { id: 'hydration', label: 'Hidratação', value: 'Meta parcialmente atingida', considered: true },
    { id: 'weather', label: 'Clima', value: 'Temperatura agradável', considered: true },
    { id: 'pain', label: 'Dores ou desconfortos', value: 'Nenhum relatado', considered: true },
  ],
}

const DEFAULT_WEEKLY_GOAL: WeeklyGoalStats = {
  completedActivities: 3,
  targetActivities: 4,
  activeMinutes: 96,
  targetActiveMinutes: 150,
  movementDays: 4,
  targetMovementDays: 5,
}

export function buildWeeklyCalendar(): WeeklyCalendarDay[] {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day

  function startOfDay(date: Date) {
    const next = new Date(date)
    next.setHours(0, 0, 0, 0)
    return next
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + index)

    const weekdayShort = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const dayLabel = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    const isToday = date.toDateString() === today.toDateString()
    const isFuture = startOfDay(date).getTime() > startOfDay(today).getTime()

    const templates: Array<{
      activities: WeeklyCalendarDay['activities']
      activeMinutes: number
    }> = [
      { activities: [{ type: 'run-walk', label: 'Corrida e caminhada', completed: true }], activeMinutes: 26 },
      { activities: [{ type: 'mobility', label: 'Mobilidade', completed: true }], activeMinutes: 18 },
      { activities: [{ type: 'rest', label: 'Descanso' }], activeMinutes: 0 },
      { activities: [{ type: 'walk', label: 'Caminhada', completed: true }], activeMinutes: 30 },
      { activities: [{ type: 'strength', label: 'Fortalecimento', completed: true }], activeMinutes: 22 },
      { activities: [{ type: 'run', label: 'Corrida leve' }], activeMinutes: 0 },
      { activities: [{ type: 'free', label: 'Atividade livre' }], activeMinutes: 0 },
    ]

    const template = templates[index] ?? { activities: [{ type: 'rest', label: 'Descanso' }], activeMinutes: 0 }

    return {
      dateIso: toLocalDateIso(date),
      dayLabel,
      weekdayShort,
      dateShort: formatWeeklyChartDate(date),
      isToday,
      isFuture,
      activeMinutes: isFuture ? 0 : template.activeMinutes,
      activities: template.activities,
    }
  })
}

export function getMockRunWalkTodayState(): RunWalkTodayState {
  return {
    activity: BEGINNER_RUN_WALK,
    disposition: DEFAULT_DISPOSITION,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    weeklyCalendar: buildWeeklyCalendar(),
  }
}

export const TODAY_ACTIVITY_PRESETS: TodayActivityPreset[] = [
  {
    id: 'quick-activity',
    title: 'Atividade rápida',
    subtitle: '10 min · ideal para dias corridos',
    level: 'simple',
    activity: QUICK_ACTIVITY,
  },
  {
    id: 'light-walk',
    title: 'Caminhada leve',
    subtitle: '15 min · ritmo tranquilo',
    level: 'simple',
    activity: LIGHT_WALK_ACTIVITY,
  },
  {
    id: 'active-walk',
    title: 'Caminhada ativa',
    subtitle: '30 min · regularidade e resistência leve',
    level: 'moderate',
    activity: WALK_ACTIVITY,
  },
  {
    id: 'recovery-walk',
    title: 'Recuperação ativa',
    subtitle: '12 min · movimento regenerativo',
    level: 'moderate',
    activity: RECOVERY_WALK_ACTIVITY,
  },
  {
    id: 'beginner-run-walk',
    title: 'Corrida e caminhada',
    subtitle: '26 min · alternar corrida e caminhada',
    level: 'moderate',
    activity: BEGINNER_RUN_WALK,
  },
  {
    id: 'easy-run',
    title: 'Corrida leve',
    subtitle: '35 min · desenvolver resistência',
    level: 'advanced',
    activity: RUNNER_ACTIVITY,
  },
]

export function getTodayActivityPreset(id: TodayActivityPresetId): TodayActivityPreset {
  const preset = TODAY_ACTIVITY_PRESETS.find((item) => item.id === id)
  if (!preset) return TODAY_ACTIVITY_PRESETS[0]
  return preset
}

export function findTodayActivityById(activityId: string): TodayActivity | null {
  const preset = TODAY_ACTIVITY_PRESETS.find((item) => item.activity.id === activityId)
  return preset?.activity ?? null
}

export function getActivityByProfile(profile: 'beginner' | 'walker' | 'runner'): TodayActivity {
  if (profile === 'walker') return WALK_ACTIVITY
  if (profile === 'runner') return RUNNER_ACTIVITY
  return BEGINNER_RUN_WALK
}

export function getDispositionRecommendation(
  answers: DispositionCheckinAnswers,
): DispositionRecommendation {
  if (answers.mood === 'very-tired' || answers.lowEnergy) return 'rest'
  if (answers.mood === 'discomfort' || answers.hasPain) return 'recovery'
  if (answers.preferWalkOverRun) return 'swap-walk'
  if (answers.preferLighter) return 'light-walk'
  if (answers.mood === 'tired' || !answers.sleptWell) return 'reduce-time'
  if (answers.mood === 'good') return 'slower-pace'
  return 'keep'
}

export function getRecommendationLabel(recommendation: DispositionRecommendation): string {
  const labels: Record<DispositionRecommendation, string> = {
    keep: 'Manter a atividade planejada',
    'slower-pace': 'Diminuir o ritmo',
    'reduce-time': 'Reduzir o tempo da atividade',
    'swap-walk': 'Trocar corrida por caminhada',
    'light-walk': 'Fazer caminhada leve',
    recovery: 'Escolher recuperação ativa',
    rest: 'Descansar hoje',
  }
  return labels[recommendation]
}

export function applyActivityMenuAction(
  activity: TodayActivity,
  action: import('../types/runWalk').ActivityMenuAction,
): TodayActivity {
  switch (action) {
    case 'swap-walk':
      return { ...WALK_ACTIVITY, id: activity.id }
    case 'reduce-duration':
      return {
        ...activity,
        durationMinutes: Math.max(15, activity.durationMinutes - 10),
        structure: activity.structure.map((step, index) =>
          index === 1
            ? { label: step.label.replace(/\d+/, String(Math.max(5, activity.durationMinutes - 15))) }
            : step,
        ),
      }
    case 'reduce-intensity':
      return {
        ...activity,
        intensity: 'light',
        intensityLabel: 'Intensidade leve',
        recommendedPace: 'Ritmo bem confortável — priorize regularidade',
      }
    case 'tomorrow':
    case 'later':
    case 'reschedule':
    case 'free-activity':
    case 'report-tired':
    case 'report-discomfort':
    case 'skip':
    case 'remove-today':
    default:
      return activity
  }
}
