import type {
  MentalHealthCheckInCardData,
  MentalHealthCheckInEntry,
  MentalHealthMoodLevelId,
  MentalHealthTodayState,
  MentalHealthWeekDay,
  MentalHealthWeekDayLevel,
} from '../types/mentalHealth'
import type { DailyMicroPlan, UserClinicalState } from '../types/mentalHealthEngine'
import { resolveMentalHealthWelcomeState } from '../utils/mentalHealthGreeting'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const WEEK_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

function moodToWeekLevel(mood: MentalHealthMoodLevelId): MentalHealthWeekDayLevel {
  if (mood === 'very-bad' || mood === 'bad') return 'low'
  if (mood === 'neutral') return 'moderate'
  return 'good'
}

function buildWeekOverview(entries: MentalHealthCheckInEntry[]) {
  const today = new Date()
  const days: MentalHealthWeekDay[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - offset)
    const iso = toLocalDateIso(date)
    const dayEntries = entries.filter(
      (entry) => toLocalDateIso(new Date(entry.recordedAt)) === iso,
    )
    const latest = dayEntries[0] ?? null

    days.push({
      label: WEEK_DAY_LABELS[date.getDay()],
      level: latest ? moodToWeekLevel(latest.mood) : 'empty',
    })
  }

  const filledDays = days.filter((day) => day.level !== 'empty')
  const lowCount = filledDays.filter((day) => day.level === 'low').length
  const goodCount = filledDays.filter((day) => day.level === 'good').length

  let summary = 'Registre como está nos próximos dias para acompanharmos seu ritmo.'
  if (filledDays.length >= 3) {
    if (lowCount >= 3) {
      summary = 'Nos últimos dias, seus registros mostraram mais momentos difíceis.'
    } else if (goodCount >= 3) {
      summary = 'Seus registros recentes mostram mais estabilidade e leveza.'
    } else {
      summary = 'Seus registros variam ao longo da semana — isso é comum.'
    }
  }

  return { summary, days }
}

export { buildWeekOverview }

function buildTodayCare(
  checkInCard: MentalHealthCheckInCardData,
  plan: DailyMicroPlan | null,
  activityHistory: UserClinicalState['activity_history'],
  planDate: string,
) {
  const items = [
    {
      id: 'check-in',
      label: 'Check-in emocional',
      completed: checkInCard.state !== 'pending',
    },
  ]

  for (const activity of plan?.activities ?? []) {
    const entry = activityHistory.find(
      (item) => item.activity_id === activity.activity_id && item.plan_date === planDate,
    )
    items.push({
      id: activity.activity_id,
      label: activity.title,
      completed: entry?.status === 'completed' || entry?.feedback != null,
    })
  }

  return { items }
}

export function buildMentalHealthTodayState(input: {
  checkInCard: MentalHealthCheckInCardData
  hasSufficientHistory: boolean
  journalEntryToday?: boolean
  recentEntries: MentalHealthCheckInEntry[]
  clinicalState: UserClinicalState | null
  plan: DailyMicroPlan | null
  planDate: string
}): MentalHealthTodayState {
  const checkInCompleted = input.checkInCard.state !== 'pending'
  const welcomeState = resolveMentalHealthWelcomeState({
    checkInCompleted,
    hasSufficientHistory: input.hasSufficientHistory,
  })

  const firstPendingActivity =
    input.plan?.activities.find((activity) => {
      const entry = input.clinicalState?.activity_history.find(
        (item) =>
          item.activity_id === activity.activity_id && item.plan_date === input.planDate,
      )
      return entry?.status !== 'completed' && entry?.feedback == null
    }) ?? input.plan?.activities[0] ?? null

  return {
    welcomeState,
    checkInCard: input.checkInCard,
    momentActivity: firstPendingActivity
      ? {
          title: firstPendingActivity.title,
          subtitle: firstPendingActivity.subtitle_user ?? firstPendingActivity.objective_user,
          durationMinutes: firstPendingActivity.duration_min,
          typeLabel: 'Atividade guiada',
        }
      : null,
    todayCare: buildTodayCare(
      input.checkInCard,
      input.plan,
      input.clinicalState?.activity_history ?? [],
      input.planDate,
    ),
    weekOverview: buildWeekOverview(input.recentEntries),
    journal: {
      hasEntryToday: input.journalEntryToday ?? false,
      prompt: 'O que mais ocupou seus pensamentos hoje?',
    },
  }
}
