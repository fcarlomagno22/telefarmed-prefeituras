import type { MentalHealthTodayState } from '../types/mentalHealth'
import { resolveMentalHealthWelcomeState } from '../utils/mentalHealthGreeting'
import type { MentalHealthCheckInCardData } from '../types/mentalHealth'

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

function buildWeekDays() {
  return WEEK_DAYS.map((label, index) => {
    if (index >= 5) return { label, level: 'empty' as const }
    if (index === 4) return { label, level: 'low' as const }
    if (index === 3) return { label, level: 'moderate' as const }
    return { label, level: 'moderate' as const }
  })
}

function buildTodayCare(checkInCard: MentalHealthCheckInCardData) {
  const checkInCompleted = checkInCard.state !== 'pending'

  return {
    items: [
      { id: 'check-in', label: 'Check-in emocional', completed: checkInCompleted },
      { id: 'breathing', label: 'Respiração guiada (3 min)', completed: false },
      { id: 'journal', label: 'Registro breve do dia', completed: false },
    ],
  }
}

export function getMockMentalHealthTodayState(input: {
  checkInCard: MentalHealthCheckInCardData
  hasSufficientHistory: boolean
  journalEntryToday?: boolean
}): MentalHealthTodayState {
  const checkInCompleted = input.checkInCard.state !== 'pending'
  const welcomeState = resolveMentalHealthWelcomeState({
    checkInCompleted,
    hasSufficientHistory: input.hasSufficientHistory,
  })

  return {
    welcomeState,
    checkInCard: input.checkInCard,
    momentActivity: {
      title: 'Organize seus pensamentos',
      subtitle: 'Exercício curto de respiração e reflexão',
      durationMinutes: 5,
      typeLabel: 'Atividade guiada',
    },
    todayCare: buildTodayCare(input.checkInCard),
    weekOverview: {
      summary: 'Dias mais pesados no meio da semana, com leve melhora ontem.',
      days: buildWeekDays(),
    },
    journal: {
      hasEntryToday: input.journalEntryToday ?? false,
      prompt: 'O que mais ocupou seus pensamentos hoje?',
    },
  }
}
