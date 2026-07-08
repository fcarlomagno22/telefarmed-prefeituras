import { getDateKeyFromIsoInAppTz } from './atividades.formatters.js'
import type { createDisposicaoCheckinBodySchema } from './schemas.js'
import type {
  RunWalkDispositionMood,
  RunWalkDispositionRecommendation,
} from './types.js'
import type { z } from 'zod'

const APP_TIMEZONE = 'America/Sao_Paulo'
const HYDRATION_GOAL_ML = 2000
const HYDRATION_PARTIAL_ML = 1000

/** Alinhado a DispositionLevel (app_cidades/src/types/runWalk.ts). */
export type DispositionLevelDto = 'good' | 'moderate' | 'low' | 'rest'

/** Alinhado a DispositionFactor (app_cidades/src/types/runWalk.ts). */
export type DispositionFactorDto = {
  id: string
  label: string
  value: string
  considered: boolean
}

/** Alinhado a DispositionState (app_cidades/src/types/runWalk.ts). */
export type DispositionStateDto = {
  level: DispositionLevelDto
  message: string
  factors: DispositionFactorDto[]
}

/** GET /disposicao — inclui flag de check-in do dia. */
export type RunWalkDisposicaoDto = DispositionStateDto & {
  checkinCompletedToday: boolean
}

export type DispositionCheckinSignal = {
  mood: 'great' | 'good' | 'tired' | 'very-tired' | 'discomfort'
  sleptWell: boolean | null
  hasPain: boolean | null
  lowEnergy: boolean | null
}

export type DispositionRecentActivitySignal = {
  dateKey: string
  activeMinutes: number
  modality: string
}

/**
 * Sinais agregados para cálculo de disposição.
 *
 * Versão inicial (3.1): check-in do dia, atividades recentes e leituras de
 * paciente_metricas_leituras (hidratação/FC). Sono é estimado via check-in ou,
 * na ausência dele, hidratação como proxy leve de rotina.
 *
 * Fatores avançados (clima, dor clínica estruturada, wearable de sono) são fase futura.
 */
export type DispositionBuildInput = {
  todayDateKey: string
  checkin: DispositionCheckinSignal | null
  recentActivities: DispositionRecentActivitySignal[]
  hidratacaoMlHoje: number | null
  frequenciaBpm: number | null
  frequenciaBpmAvg7d: number | null
}

const MOOD_SCORE: Record<DispositionCheckinSignal['mood'], number> = {
  great: 20,
  good: 12,
  tired: -8,
  'very-tired': -22,
  discomfort: -18,
}

function shiftDateKey(dateKey: string, days: number): string {
  const instant = new Date(`${dateKey}T12:00:00.000-03:00`)
  instant.setUTCDate(instant.getUTCDate() + days)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) return dateKey
  return `${year}-${month}-${day}`
}

export function resolveTodayDateKeyInAppTz(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) {
    return getDateKeyFromIsoInAppTz(now.toISOString())
  }
  return `${year}-${month}-${day}`
}

export function resolveRecentActivitiesBounds(todayDateKey: string): {
  startIso: string
  endIso: string
  startDateKey: string
} {
  const startDateKey = shiftDateKey(todayDateKey, -2)
  return {
    startDateKey,
    startIso: `${startDateKey}T00:00:00.000-03:00`,
    endIso: `${todayDateKey}T23:59:59.999-03:00`,
  }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}

function resolveLevel(score: number): DispositionLevelDto {
  if (score >= 75) return 'good'
  if (score >= 55) return 'moderate'
  if (score >= 35) return 'low'
  return 'rest'
}

function resolveMessage(level: DispositionLevelDto): string {
  switch (level) {
    case 'good':
      return 'Sua disposição está boa'
    case 'moderate':
      return 'Disposição moderada — vale ajustar o ritmo'
    case 'low':
      return 'Disposição baixa — prefira algo mais leve'
    case 'rest':
      return 'Dia de descanso recomendado'
    default:
      return 'Sua disposição parece equilibrada hoje'
  }
}

function summarizeRecentActivities(
  activities: DispositionRecentActivitySignal[],
  todayDateKey: string,
) {
  const minutesByDay = new Map<string, number>()
  for (const activity of activities) {
    minutesByDay.set(
      activity.dateKey,
      (minutesByDay.get(activity.dateKey) ?? 0) + activity.activeMinutes,
    )
  }

  const yesterdayKey = shiftDateKey(todayDateKey, -1)
  const yesterdayMinutes = minutesByDay.get(yesterdayKey) ?? 0
  const todayMinutes = minutesByDay.get(todayDateKey) ?? 0
  const daysWithActivity = minutesByDay.size
  const totalMinutes = activities.reduce((sum, activity) => sum + activity.activeMinutes, 0)

  return {
    yesterdayMinutes,
    todayMinutes,
    daysWithActivity,
    totalMinutes,
  }
}

function buildSleepFactor(
  checkin: DispositionCheckinSignal | null,
  hidratacaoMlHoje: number | null,
): DispositionFactorDto {
  if (checkin?.sleptWell === true) {
    return {
      id: 'sleep',
      label: 'Qualidade do sono',
      value: 'Boa noite de descanso',
      considered: true,
    }
  }

  if (checkin?.sleptWell === false) {
    return {
      id: 'sleep',
      label: 'Qualidade do sono',
      value: 'Sono prejudicado no check-in',
      considered: true,
    }
  }

  if (hidratacaoMlHoje != null && hidratacaoMlHoje >= 1500) {
    return {
      id: 'sleep',
      label: 'Qualidade do sono',
      value: 'Rotina de hidratação favorável (estimativa)',
      considered: true,
    }
  }

  return {
    id: 'sleep',
    label: 'Qualidade do sono',
    value: 'Sem registro recente',
    considered: true,
  }
}

function buildFatigueFactor(checkin: DispositionCheckinSignal | null): DispositionFactorDto {
  if (!checkin) {
    return {
      id: 'fatigue',
      label: 'Cansaço informado',
      value: 'Nenhum registro recente',
      considered: true,
    }
  }

  if (checkin.lowEnergy) {
    return {
      id: 'fatigue',
      label: 'Cansaço informado',
      value: 'Energia baixa no check-in',
      considered: true,
    }
  }

  if (checkin.mood === 'very-tired') {
    return {
      id: 'fatigue',
      label: 'Cansaço informado',
      value: 'Muito cansado(a)',
      considered: true,
    }
  }

  if (checkin.mood === 'tired') {
    return {
      id: 'fatigue',
      label: 'Cansaço informado',
      value: 'Cansaço leve relatado',
      considered: true,
    }
  }

  return {
    id: 'fatigue',
    label: 'Cansaço informado',
    value: 'Sem queixas de cansaço',
    considered: true,
  }
}

function buildRecentFactor(
  summary: ReturnType<typeof summarizeRecentActivities>,
): DispositionFactorDto {
  if (summary.yesterdayMinutes >= 50) {
    return {
      id: 'recent',
      label: 'Atividade recente',
      value: 'Carga elevada ontem',
      considered: true,
    }
  }

  if (summary.yesterdayMinutes >= 25) {
    return {
      id: 'recent',
      label: 'Atividade recente',
      value: 'Movimentou-se bastante ontem',
      considered: true,
    }
  }

  if (summary.todayMinutes > 0 && summary.yesterdayMinutes === 0) {
    return {
      id: 'recent',
      label: 'Atividade recente',
      value: 'Já se movimentou hoje',
      considered: true,
    }
  }

  if (summary.daysWithActivity === 0) {
    return {
      id: 'recent',
      label: 'Atividade recente',
      value: 'Descanso nos últimos dias',
      considered: true,
    }
  }

  return {
    id: 'recent',
    label: 'Atividade recente',
    value: 'Ritmo equilibrado nos últimos dias',
    considered: true,
  }
}

function buildHeartFactor(
  frequenciaBpm: number | null,
  frequenciaBpmAvg7d: number | null,
): DispositionFactorDto {
  if (frequenciaBpm == null) {
    return {
      id: 'heart',
      label: 'Frequência cardíaca',
      value: 'Sem registro recente',
      considered: true,
    }
  }

  const reference = frequenciaBpmAvg7d ?? 78
  if (frequenciaBpm > reference + 12) {
    return {
      id: 'heart',
      label: 'Frequência cardíaca',
      value: 'Levemente acima da sua média',
      considered: true,
    }
  }

  if (frequenciaBpm < reference - 15) {
    return {
      id: 'heart',
      label: 'Frequência cardíaca',
      value: 'Abaixo da sua média recente',
      considered: true,
    }
  }

  return {
    id: 'heart',
    label: 'Frequência cardíaca',
    value: 'Dentro da sua média',
    considered: true,
  }
}

function buildHydrationFactor(hidratacaoMlHoje: number | null): DispositionFactorDto {
  if (hidratacaoMlHoje == null) {
    return {
      id: 'hydration',
      label: 'Hidratação',
      value: 'Sem registro hoje',
      considered: true,
    }
  }

  if (hidratacaoMlHoje >= HYDRATION_GOAL_ML) {
    return {
      id: 'hydration',
      label: 'Hidratação',
      value: 'Meta atingida hoje',
      considered: true,
    }
  }

  if (hidratacaoMlHoje >= HYDRATION_PARTIAL_ML) {
    return {
      id: 'hydration',
      label: 'Hidratação',
      value: 'Meta parcialmente atingida',
      considered: true,
    }
  }

  return {
    id: 'hydration',
    label: 'Hidratação',
    value: 'Abaixo do ideal hoje',
    considered: true,
  }
}

function buildPainFactor(checkin: DispositionCheckinSignal | null): DispositionFactorDto {
  if (checkin?.hasPain) {
    return {
      id: 'pain',
      label: 'Dores ou desconfortos',
      value: 'Desconforto relatado no check-in',
      considered: true,
    }
  }

  if (checkin?.mood === 'discomfort') {
    return {
      id: 'pain',
      label: 'Dores ou desconfortos',
      value: 'Desconforto relatado no check-in',
      considered: true,
    }
  }

  return {
    id: 'pain',
    label: 'Dores ou desconfortos',
    value: 'Nenhum relatado',
    considered: true,
  }
}

export function buildDefaultDispositionState(): DispositionStateDto {
  return {
    level: 'good',
    message: 'Sua disposição parece equilibrada hoje',
    factors: [
      {
        id: 'sleep',
        label: 'Qualidade do sono',
        value: 'Sem registro recente',
        considered: true,
      },
      {
        id: 'fatigue',
        label: 'Cansaço informado',
        value: 'Nenhum registro recente',
        considered: true,
      },
      {
        id: 'recent',
        label: 'Atividade recente',
        value: 'Sem atividades nos últimos dias',
        considered: true,
      },
      {
        id: 'heart',
        label: 'Frequência cardíaca',
        value: 'Sem registro recente',
        considered: true,
      },
      {
        id: 'hydration',
        label: 'Hidratação',
        value: 'Sem registro hoje',
        considered: true,
      },
      {
        id: 'weather',
        label: 'Clima',
        value: 'Indisponível nesta versão',
        considered: false,
      },
      {
        id: 'pain',
        label: 'Dores ou desconfortos',
        value: 'Nenhum relatado',
        considered: true,
      },
    ],
  }
}

export function buildDispositionState(input: DispositionBuildInput): DispositionStateDto {
  const recentSummary = summarizeRecentActivities(input.recentActivities, input.todayDateKey)

  let score = 72

  if (input.checkin) {
    score += MOOD_SCORE[input.checkin.mood]
    if (input.checkin.sleptWell === true) score += 10
    if (input.checkin.sleptWell === false) score -= 14
    if (input.checkin.hasPain === true) score -= 18
    if (input.checkin.lowEnergy === true) score -= 10
  } else if (input.hidratacaoMlHoje != null) {
    if (input.hidratacaoMlHoje >= 1500) score += 4
    if (input.hidratacaoMlHoje < 800) score -= 4
  }

  if (recentSummary.yesterdayMinutes >= 50) score -= 12
  else if (recentSummary.yesterdayMinutes >= 30) score -= 7
  else if (recentSummary.daysWithActivity === 0) score += 4

  if (input.frequenciaBpm != null) {
    const reference = input.frequenciaBpmAvg7d ?? 78
    if (input.frequenciaBpm > reference + 12) score -= 8
    else if (input.frequenciaBpm >= reference - 15 && input.frequenciaBpm <= reference + 12) {
      score += 3
    }
  }

  if (input.hidratacaoMlHoje != null) {
    if (input.hidratacaoMlHoje >= HYDRATION_GOAL_ML) score += 5
    else if (input.hidratacaoMlHoje < HYDRATION_PARTIAL_ML) score -= 5
  }

  if (input.checkin?.mood === 'very-tired') {
    score = Math.min(score, 40)
  }
  if (input.checkin?.hasPain || input.checkin?.mood === 'discomfort') {
    score = Math.min(score, 45)
  }
  if (input.checkin?.mood === 'great') {
    score = Math.max(score, 76)
  }

  const level = resolveLevel(clampScore(score))

  return {
    level,
    message: resolveMessage(level),
    factors: [
      buildSleepFactor(input.checkin, input.hidratacaoMlHoje),
      buildFatigueFactor(input.checkin),
      buildRecentFactor(recentSummary),
      buildHeartFactor(input.frequenciaBpm, input.frequenciaBpmAvg7d),
      buildHydrationFactor(input.hidratacaoMlHoje),
      {
        id: 'weather',
        label: 'Clima',
        value: 'Indisponível nesta versão',
        considered: false,
      },
      buildPainFactor(input.checkin),
    ],
  }
}

export function mapRecentActivityRow(row: {
  active_minutes: number
  completed_at: string
  modality: string
}): DispositionRecentActivitySignal {
  return {
    dateKey: getDateKeyFromIsoInAppTz(row.completed_at),
    activeMinutes: Number(row.active_minutes),
    modality: row.modality,
  }
}

/** Alinhado a DispositionCheckinAnswers (app_cidades/src/types/runWalk.ts). */
export type CreateDisposicaoCheckinInput = z.infer<typeof createDisposicaoCheckinBodySchema>

/** Alinhado a DispositionRecommendation (app_cidades/src/types/runWalk.ts). */
export type DispositionRecommendationDto = RunWalkDispositionRecommendation

export type RunWalkDisposicaoCheckinDto = {
  checkinDate: string
  mood: RunWalkDispositionMood
  sleptWell: boolean | null
  hasPain: boolean | null
  lowEnergy: boolean | null
  preferLighter: boolean | null
  preferWalkOverRun: boolean | null
  recommendation: DispositionRecommendationDto
  recommendationLabel: string
  createdAt: string
  updatedAt: string
}

export type RunWalkDisposicaoCheckinResultDto = {
  checkin: RunWalkDisposicaoCheckinDto
  disposition: RunWalkDisposicaoDto
}

/** Mesma prioridade de getDispositionRecommendation em mockRunWalk.ts. */
export function resolveDispositionRecommendation(
  answers: CreateDisposicaoCheckinInput,
): DispositionRecommendationDto {
  if (answers.mood === 'very-tired' || answers.lowEnergy) return 'rest'
  if (answers.mood === 'discomfort' || answers.hasPain) return 'recovery'
  if (answers.preferWalkOverRun) return 'swap-walk'
  if (answers.preferLighter) return 'light-walk'
  if (answers.mood === 'tired' || answers.sleptWell === false) return 'reduce-time'
  if (answers.mood === 'good') return 'slower-pace'
  return 'keep'
}

export function getDispositionRecommendationLabel(
  recommendation: DispositionRecommendationDto,
): string {
  const labels: Record<DispositionRecommendationDto, string> = {
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

export function mapCheckinRowToDto(row: {
  checkin_date: string
  mood: RunWalkDispositionMood
  slept_well: boolean | null
  has_pain: boolean | null
  low_energy: boolean | null
  prefer_lighter: boolean | null
  prefer_walk_over_run: boolean | null
  recommendation: string | null
  criado_em: string
  atualizado_em: string
}): RunWalkDisposicaoCheckinDto {
  const recommendation = (row.recommendation ??
    'keep') as DispositionRecommendationDto

  return {
    checkinDate: row.checkin_date,
    mood: row.mood,
    sleptWell: row.slept_well,
    hasPain: row.has_pain,
    lowEnergy: row.low_energy,
    preferLighter: row.prefer_lighter,
    preferWalkOverRun: row.prefer_walk_over_run,
    recommendation,
    recommendationLabel: getDispositionRecommendationLabel(recommendation),
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }
}
