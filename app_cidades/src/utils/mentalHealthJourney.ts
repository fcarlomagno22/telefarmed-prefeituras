import type { MentalHealthCheckInCardData } from '../types/mentalHealth'

export type MentalHealthJourneyPhase = 'know_you' | 'check_in' | 'reflect' | 'care_today'

export type MentalHealthJourneyState = {
  phase: MentalHealthJourneyPhase
  initialAnamnesisComplete: boolean
  initialAnamnesisPercent: number
  extendedAnamnesisPercent: number
  showTellUsMore: boolean
  checkInDone: boolean
  hasTodayPlan: boolean
  planActivitiesTotal: number
  planActivitiesCompleted: number
}

export function resolveMentalHealthJourney(input: {
  initialAnamnesisComplete: boolean
  initialAnamnesisPercent: number
  extendedAnamnesisPercent: number
  extendedAnamnesisComplete: boolean
  checkInCard: MentalHealthCheckInCardData
  hasTodayPlan: boolean
  planActivitiesTotal: number
  planActivitiesCompleted: number
}): MentalHealthJourneyState {
  const checkInDone = input.checkInCard.state !== 'pending'

  let phase: MentalHealthJourneyPhase = 'check_in'

  if (!input.initialAnamnesisComplete) {
    phase = 'know_you'
  } else if (input.hasTodayPlan) {
    phase = 'care_today'
  } else if (checkInDone) {
    phase = 'reflect'
  } else {
    phase = 'check_in'
  }

  return {
    phase,
    initialAnamnesisComplete: input.initialAnamnesisComplete,
    initialAnamnesisPercent: input.initialAnamnesisPercent,
    extendedAnamnesisPercent: input.extendedAnamnesisPercent,
    showTellUsMore: input.initialAnamnesisComplete && !input.extendedAnamnesisComplete,
    checkInDone,
    hasTodayPlan: input.hasTodayPlan,
    planActivitiesTotal: input.planActivitiesTotal,
    planActivitiesCompleted: input.planActivitiesCompleted,
  }
}

export const JOURNEY_STEPS = [
  { id: 'know_you', label: 'Conhecer você' },
  { id: 'check_in', label: 'Momento de hoje' },
  { id: 'reflect', label: 'Seu registro' },
  { id: 'care_today', label: 'Cuidados do dia' },
] as const

export type JourneyStepTheme = {
  light: string
  main: string
  border: string
  glow: string
}

export const JOURNEY_STEP_THEMES: JourneyStepTheme[] = [
  {
    light: '#fde68a',
    main: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.55)',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  {
    light: '#a5f3fc',
    main: '#0891b2',
    border: 'rgba(8, 145, 178, 0.55)',
    glow: 'rgba(8, 145, 178, 0.4)',
  },
  {
    light: '#c4b5fd',
    main: '#7c3aed',
    border: 'rgba(124, 58, 237, 0.55)',
    glow: 'rgba(124, 58, 237, 0.4)',
  },
  {
    light: '#86efac',
    main: '#16a34a',
    border: 'rgba(22, 163, 74, 0.55)',
    glow: 'rgba(22, 163, 74, 0.4)',
  },
]

export function getActiveStepIndex(phase: MentalHealthJourneyPhase) {
  return JOURNEY_STEPS.findIndex((step) => step.id === phase)
}
