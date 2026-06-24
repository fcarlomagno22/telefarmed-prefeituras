import { loadBloodPressureHistory } from './bloodPressureHistoryStorage'
import { PROFILE_SNAPSHOT } from './mockHealthMetrics'
import { loadHydrationHistory } from './hydrationHistoryStorage'
import { loadGlucoseHistory } from './glucoseHistoryStorage'
import { formatBloodPressureValue } from './mockHealthMetrics'
import { getTodayHydrationLiters } from './mockHydrationHistory'
import { ACTION_ICON_PALETTES } from '../theme/actionIconColors'
import type { ProfileSnapshot } from '../types/metrics'
import { calculateImc, formatImcValue, hasImcInputs } from '../utils/bmi'

export type HomeHealthMetricId = 'imc' | 'glicemia' | 'pressao' | 'hidratacao'

export type HomeHealthMetric = {
  id: HomeHealthMetricId
  label: string
  value: string
  unit: string | null
  empty: boolean
  gradient: readonly [string, string, string]
}

export const HOME_METRIC_VISUALS: Record<
  HomeHealthMetricId,
  { gradient: readonly [string, string, string]; unit: string | null }
> = {
  imc: {
    gradient: ['#67e8f9', '#0891b2', '#0e7490'],
    unit: 'kg/m²',
  },
  glicemia: {
    gradient: ACTION_ICON_PALETTES.myMetrics.iconGradient,
    unit: 'mg/dL',
  },
  pressao: {
    gradient: ['#fbbf24', '#f59e0b', '#d97706'],
    unit: 'mmHg',
  },
  hidratacao: {
    gradient: ['#7dd3fc', '#0ea5e9', '#0369a1'],
    unit: 'L',
  },
}

function latestByDate<T extends { recordedAt: string }>(entries: T[]): T | null {
  if (!entries.length) return null
  return [...entries].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )[0]
}

export async function loadHomeHealthSummary(
  profile: ProfileSnapshot = PROFILE_SNAPSHOT,
): Promise<HomeHealthMetric[]> {
  const [glucoseHistory, bloodPressureHistory, hydrationHistory] = await Promise.all([
    loadGlucoseHistory(),
    loadBloodPressureHistory(),
    loadHydrationHistory(),
  ])

  const imc = hasImcInputs(profile) ? calculateImc(profile) : null
  const latestGlucose = latestByDate(glucoseHistory)
  const latestPressure = latestByDate(bloodPressureHistory)
  const hydrationLiters = getTodayHydrationLiters(hydrationHistory)

  return [
    {
      id: 'imc',
      label: 'IMC',
      value: imc !== null ? formatImcValue(imc) : '—',
      unit: HOME_METRIC_VISUALS.imc.unit,
      empty: imc === null,
      gradient: HOME_METRIC_VISUALS.imc.gradient,
    },
    {
      id: 'glicemia',
      label: 'Glicemia',
      value: latestGlucose ? `${Math.round(latestGlucose.amountMg)}` : '—',
      unit: HOME_METRIC_VISUALS.glicemia.unit,
      empty: latestGlucose == null,
      gradient: HOME_METRIC_VISUALS.glicemia.gradient,
    },
    {
      id: 'pressao',
      label: 'Pressão',
      value: latestPressure
        ? formatBloodPressureValue(latestPressure.systolic, latestPressure.diastolic)
        : '—',
      unit: HOME_METRIC_VISUALS.pressao.unit,
      empty: latestPressure == null,
      gradient: HOME_METRIC_VISUALS.pressao.gradient,
    },
    {
      id: 'hidratacao',
      label: 'Hidratação',
      value:
        hydrationLiters > 0
          ? hydrationLiters.toFixed(1).replace('.', ',')
          : '—',
      unit: HOME_METRIC_VISUALS.hidratacao.unit,
      empty: hydrationLiters <= 0,
      gradient: HOME_METRIC_VISUALS.hidratacao.gradient,
    },
  ]
}
