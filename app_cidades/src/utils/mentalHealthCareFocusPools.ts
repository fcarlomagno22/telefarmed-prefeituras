import type { MentalHealthCareFocusId } from '../types/mentalHealth'

export type CareFocusPoolSpec = {
  pool: string
  why: string
}

export const MENTAL_HEALTH_CARE_FOCUS_POOLS: Record<MentalHealthCareFocusId, CareFocusPoolSpec> = {
  anxiety: {
    pool: 'anxiety_grounding_low_intensity',
    why: 'Uma pausa curta pode ajudar a acalmar o corpo agora.',
  },
  sadness: {
    pool: 'depression_self_compassion_low',
    why: 'Um passo pequeno hoje já conta.',
  },
  stress: {
    pool: 'anxiety_grounding_low_intensity',
    why: 'Vamos simplificar: só uma coisa de cada vez.',
  },
  sleep: {
    pool: 'sleep_wind_down_low',
    why: 'Um cuidado leve para apoiar seu descanso.',
  },
  relationships: {
    pool: 'social_micro_step_low',
    why: 'Um micro-passo de conexão pode fazer diferença.',
  },
  work: {
    pool: 'track_anxiety_disorders_low',
    why: 'Organizar o próximo passo pode aliviar a pressão.',
  },
  loneliness: {
    pool: 'social_micro_step_low',
    why: 'Você não precisa fazer isso completamente sozinho(a).',
  },
  'self-esteem': {
    pool: 'depression_self_compassion_low',
    why: 'Trate-se hoje com a mesma gentileza que daria a um amigo.',
  },
  routine: {
    pool: 'universal_low_intensity',
    why: 'Um hábito pequeno já ajuda a organizar o dia.',
  },
  undecided: {
    pool: 'universal_low_intensity',
    why: 'Separamos um cuidado leve para o seu momento de hoje.',
  },
}

export function resolvePrimaryCareFocusPool(careFocus: string[] | undefined | null): CareFocusPoolSpec {
  const primary = (careFocus?.[0] ?? 'undecided') as MentalHealthCareFocusId
  return MENTAL_HEALTH_CARE_FOCUS_POOLS[primary] ?? MENTAL_HEALTH_CARE_FOCUS_POOLS.undecided
}
