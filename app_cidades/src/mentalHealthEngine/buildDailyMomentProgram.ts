import type { MentalHealthMoodLevelId } from '../types/mentalHealth'
import { isCrisisCheckInMood, isPositiveCheckInMood } from '../types/mentalHealth'
import { resolvePrimaryCareFocusPool } from '../utils/mentalHealthCareFocusPools'

export type MomentProgramStep = {
  slot: 'now' | 'daytime' | 'evening'
  pool: string
  why: string
  ruleId: string
}

const ANXIOUS_EMOTIONS = new Set(['Preocupado', 'Sobrecarregado', 'Frustrado', 'Confuso', 'Irritado'])
const LOW_EMOTIONS = new Set(['Triste', 'Sozinho', 'Cansado'])
const POSITIVE_EMOTIONS = new Set(['Grato', 'Esperançoso', 'Animado', 'Tranquilo'])

function resolveTrackPoolId(primaryTrackId: string | null | undefined) {
  if (!primaryTrackId) return null
  return `track_${primaryTrackId}_low`
}

function resolveNowStep(input: {
  mood?: MentalHealthMoodLevelId
  emotions: string[]
  emotionIntensity?: number | null
  influenceValence?: string | null
}): MomentProgramStep {
  const { mood, emotions, emotionIntensity, influenceValence } = input

  if (isCrisisCheckInMood(mood ?? null)) {
    return {
      slot: 'now',
      pool: 'fallback_safe_low',
      why: 'Vamos começar com algo bem curto e seguro para este momento.',
      ruleId: 'moment_now_crisis',
    }
  }

  if (emotionIntensity != null && emotionIntensity >= 4) {
    return {
      slot: 'now',
      pool: 'fallback_safe_low',
      why: 'Vamos começar com algo bem curto para este momento.',
      ruleId: 'moment_now_high_intensity',
    }
  }

  if (emotions.some((item) => ANXIOUS_EMOTIONS.has(item)) || influenceValence === 'negative') {
    return {
      slot: 'now',
      pool: 'anxiety_grounding_low_intensity',
      why: 'Uma pausa curta pode ajudar a acalmar o corpo agora.',
      ruleId: 'moment_now_anxiety',
    }
  }

  if (emotions.some((item) => LOW_EMOTIONS.has(item)) && !isPositiveCheckInMood(mood ?? null)) {
    return {
      slot: 'now',
      pool: 'depression_self_compassion_low',
      why: 'Você pode tratar este momento com mais gentileza.',
      ruleId: 'moment_now_low_emotion',
    }
  }

  if (mood === 'neutral') {
    return {
      slot: 'now',
      pool: 'universal_low_intensity',
      why: 'Um cuidado leve para o momento em que você está.',
      ruleId: 'moment_now_neutral',
    }
  }

  if (isPositiveCheckInMood(mood ?? null) || emotions.some((item) => POSITIVE_EMOTIONS.has(item))) {
    return {
      slot: 'now',
      pool: 'wellness_maintenance',
      why: 'Que bom! Vamos fortalecer o que está ajudando você hoje.',
      ruleId: 'moment_now_well',
    }
  }

  return {
    slot: 'now',
    pool: 'universal_low_intensity',
    why: 'Separamos algo leve para o seu momento de hoje.',
    ruleId: 'moment_now_default',
  }
}

function resolveSupportProgram(
  input: {
    mood?: MentalHealthMoodLevelId
    emotions: string[]
    reactions: string[]
    influences: string[]
  },
  maxSteps: number,
): MomentProgramStep[] {
  const steps: MomentProgramStep[] = [resolveNowStep(input)]

  steps.push({
    slot: 'daytime',
    pool: 'depression_behavioral_activation_low',
    why: 'Um passo pequeno hoje já conta.',
    ruleId: 'moment_support_activation',
  })

  if (steps.length < maxSteps) {
    const needsConnection =
      input.emotions.includes('Sozinho') || input.reactions.includes('Fiquei isolado')
    steps.push({
      slot: 'daytime',
      pool: needsConnection ? 'social_micro_step_low' : 'depression_self_compassion_low',
      why: needsConnection
        ? 'Um micro-passo de conexão pode fazer diferença.'
        : 'Trate-se com gentileza ao longo do dia.',
      ruleId: needsConnection ? 'moment_support_connection' : 'moment_support_compassion',
    })
  }

  if (steps.length < maxSteps) {
    const eveningPool = input.influences.includes('Sono')
      ? 'sleep_wind_down_low'
      : 'evening_wind_down'
    steps.push({
      slot: 'evening',
      pool: eveningPool,
      why: input.influences.includes('Sono')
        ? 'Preparar o corpo para descansar pode facilitar a noite.'
        : 'Um fechamento calmo para o dia de hoje.',
      ruleId: 'moment_support_evening',
    })
  }

  return steps.slice(0, maxSteps)
}

function resolveMaintenanceProgram(
  input: {
    mood?: MentalHealthMoodLevelId
    emotions: string[]
    influences: string[]
    careFocus: string[]
    primaryTrackId: string | null
  },
  maxSteps: number,
): MomentProgramStep[] {
  const steps: MomentProgramStep[] = [resolveNowStep(input)]

  const careFocus = resolvePrimaryCareFocusPool(input.careFocus)
  const trackPool = resolveTrackPoolId(input.primaryTrackId)
  const nowPool = steps[0]?.pool

  if (steps.length < maxSteps && careFocus.pool !== nowPool) {
    steps.push({
      slot: 'daytime',
      pool: careFocus.pool,
      why: careFocus.why,
      ruleId: 'moment_maintain_care_focus',
    })
  } else if (steps.length < maxSteps) {
    steps.push({
      slot: 'daytime',
      pool: 'universal_low_intensity',
      why: 'Um hábito pequeno ajuda a sustentar o que já está funcionando.',
      ruleId: 'moment_maintain_habit',
    })
  }

  if (steps.length < maxSteps) {
    const eveningPool =
      input.influences.includes('Sono')
        ? 'sleep_wind_down_low'
        : trackPool && trackPool !== careFocus.pool
          ? trackPool
          : 'evening_wind_down'

    const eveningWhy = input.influences.includes('Sono')
      ? 'Um cuidado leve para apoiar seu descanso.'
      : trackPool && eveningPool === trackPool
        ? 'Com base no que você nos contou, um cuidado para manter o equilíbrio.'
        : 'Um momento calmo para fechar o dia.'

    steps.push({
      slot: 'evening',
      pool: eveningPool,
      why: eveningWhy,
      ruleId: 'moment_maintain_evening',
    })
  }

  return steps.slice(0, maxSteps)
}

function targetStepCount(mood: MentalHealthMoodLevelId | undefined, hasTodayCheckIn: boolean) {
  if (!hasTodayCheckIn || !mood) return 2
  if (isCrisisCheckInMood(mood)) return 4
  if (isPositiveCheckInMood(mood)) return 3
  if (mood === 'neutral') return 3
  return 4
}

export function buildDailyMomentProgram(input: {
  mood?: MentalHealthMoodLevelId
  emotions: string[]
  emotionIntensity?: number | null
  influences: string[]
  influenceValence?: string | null
  reactions: string[]
  careFocus: string[]
  primaryTrackId: string | null
  hasTodayCheckIn: boolean
  maxActivities: number
}): MomentProgramStep[] {
  const maxSteps = Math.min(
    input.maxActivities,
    targetStepCount(input.mood, input.hasTodayCheckIn),
  )

  if (!input.hasTodayCheckIn || !input.mood) {
    return [
      {
        slot: 'now',
        pool: 'fallback_safe_low',
        why: 'Registre como está hoje para montarmos cuidados mais personalizados.',
        ruleId: 'moment_no_checkin',
      },
      {
        slot: 'daytime',
        pool: 'universal_low_intensity',
        why: 'Enquanto isso, algo leve para o seu dia.',
        ruleId: 'moment_no_checkin_daytime',
      },
    ].slice(0, maxSteps)
  }

  if (isCrisisCheckInMood(input.mood) || input.mood === 'bad') {
    return resolveSupportProgram(input, maxSteps)
  }

  if (input.mood === 'neutral') {
    const steps = resolveMaintenanceProgram(input, maxSteps)
    if (steps[0]) {
      steps[0] = {
        slot: 'now',
        pool: 'universal_low_intensity',
        why: 'Um cuidado leve para o momento em que você está.',
        ruleId: 'moment_now_neutral',
      }
    }
    return steps
  }

  return resolveMaintenanceProgram(input, maxSteps)
}
