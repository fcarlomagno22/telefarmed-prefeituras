import type { MetricsResumoDto } from '../lib/api/vd/metricas'
import { loadMetricsResumo } from './metricsResumoStorage'
import { formatBloodPressureShort } from '../utils/bloodPressure'
import { formatImcValue } from '../utils/bmi'
import { ACTION_ICON_PALETTES } from '../theme/actionIconColors'

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

export function buildHomeHealthMetricsFromResumo(resumo: MetricsResumoDto): HomeHealthMetric[] {
  const { latest } = resumo
  const hydrationLiters =
    latest.hidratacaoMlHoje != null && latest.hidratacaoMlHoje > 0
      ? latest.hidratacaoMlHoje / 1000
      : 0

  return [
    {
      id: 'imc',
      label: 'IMC',
      value: latest.imc != null ? formatImcValue(latest.imc) : '—',
      unit: HOME_METRIC_VISUALS.imc.unit,
      empty: latest.imc == null,
      gradient: HOME_METRIC_VISUALS.imc.gradient,
    },
    {
      id: 'glicemia',
      label: 'Glicemia',
      value: latest.glicemiaMgDl != null ? `${Math.round(latest.glicemiaMgDl)}` : '—',
      unit: HOME_METRIC_VISUALS.glicemia.unit,
      empty: latest.glicemiaMgDl == null,
      gradient: HOME_METRIC_VISUALS.glicemia.gradient,
    },
    {
      id: 'pressao',
      label: 'Pressão',
      value:
        latest.pressaoSistolica != null && latest.pressaoDiastolica != null
          ? formatBloodPressureShort(latest.pressaoSistolica, latest.pressaoDiastolica)
          : '—',
      unit: HOME_METRIC_VISUALS.pressao.unit,
      empty: latest.pressaoSistolica == null || latest.pressaoDiastolica == null,
      gradient: HOME_METRIC_VISUALS.pressao.gradient,
    },
    {
      id: 'hidratacao',
      label: 'Hidratação',
      value: hydrationLiters > 0 ? hydrationLiters.toFixed(1).replace('.', ',') : '—',
      unit: HOME_METRIC_VISUALS.hidratacao.unit,
      empty: hydrationLiters <= 0,
      gradient: HOME_METRIC_VISUALS.hidratacao.gradient,
    },
  ]
}

/** Carrega cards da home via GET /vd/metricas/resumo (1 request). */
export async function loadHomeHealthSummary(patientCpf = 'guest'): Promise<HomeHealthMetric[]> {
  const resumo = await loadMetricsResumo(patientCpf)
  return buildHomeHealthMetricsFromResumo(resumo)
}
