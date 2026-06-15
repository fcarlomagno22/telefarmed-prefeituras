import type {
  PrefeituraPosConsultaDashboardFilters,
  PrefeituraPosConsultaDashboardView,
} from '../types/prefeituraPosConsultaDashboard'

/** Base agregada (30 dias · rede inteira) — números fictícios, sem identificação individual. */
const BASE_ACOMPANHAMENTOS_ATIVOS = 142
const BASE_CHECKINS_ENVIADOS = 680
const BASE_CHECKINS_RESPONDIDOS = 524
const BASE_EVOLUCAO = {
  melhorou: 304,
  igual: 162,
  piorou: 58,
} as const

const PERIOD_SCALE: Record<string, number> = {
  hoje: 0.07,
  '7d': 0.42,
  '30d': 1,
}

const REGION_SCALE: Record<string, number> = {
  todas: 1,
  centro: 0.28,
  central: 0.28,
  norte: 0.22,
  sul: 0.19,
  leste: 0.16,
  oeste: 0.15,
}

function hashScale(seed: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  const normalized = (Math.abs(hash) % 1000) / 1000
  return min + normalized * (max - min)
}

function resolveScale(filters: PrefeituraPosConsultaDashboardFilters): number {
  const periodScale = PERIOD_SCALE[filters.period] ?? 0.55
  const regionKey = filters.regionKey === 'central' ? 'centro' : filters.regionKey
  const regionScale = REGION_SCALE[regionKey] ?? 0.2
  const ubtScale =
    filters.unidadeUbtId && filters.unidadeUbtId !== 'todas'
      ? hashScale(filters.unidadeUbtId, 0.04, 0.12)
      : 1
  return periodScale * regionScale * ubtScale
}

function scaleCount(value: number, scale: number, min = 0): number {
  return Math.max(min, Math.round(value * scale))
}

export function buildPrefeituraPosConsultaDashboardMock(
  filters: PrefeituraPosConsultaDashboardFilters,
): PrefeituraPosConsultaDashboardView {
  const filterKey = `${filters.period}-${filters.regionKey}-${filters.unidadeUbtId ?? 'todas'}`
  const scale = resolveScale(filters)

  const acompanhamentosAtivos = scaleCount(BASE_ACOMPANHAMENTOS_ATIVOS, scale, filters.period === 'hoje' ? 3 : 8)
  const checkinsEnviados = scaleCount(BASE_CHECKINS_ENVIADOS, scale, filters.period === 'hoje' ? 12 : 24)
  const checkinsRespondidos = Math.min(
    checkinsEnviados,
    scaleCount(BASE_CHECKINS_RESPONDIDOS, scale, filters.period === 'hoje' ? 8 : 16),
  )
  const taxaAdesaoPercent =
    checkinsEnviados > 0 ? Math.round((checkinsRespondidos / checkinsEnviados) * 100) : 0

  const evolucaoCounts = {
    melhorou: scaleCount(BASE_EVOLUCAO.melhorou, scale, 0),
    igual: scaleCount(BASE_EVOLUCAO.igual, scale, 0),
    piorou: scaleCount(BASE_EVOLUCAO.piorou, scale, 0),
  }
  const evolucaoTotal =
    evolucaoCounts.melhorou + evolucaoCounts.igual + evolucaoCounts.piorou

  const evolucaoDistribuicao =
    evolucaoTotal === 0
      ? []
      : ([
          { key: 'melhorou' as const, label: 'Melhorou', count: evolucaoCounts.melhorou },
          { key: 'igual' as const, label: 'Estável', count: evolucaoCounts.igual },
          { key: 'piorou' as const, label: 'Piorou', count: evolucaoCounts.piorou },
        ].map((item) => ({
          ...item,
          percent: Math.round((item.count / evolucaoTotal) * 100),
        })))

  const taxaMelhoraPercent =
    evolucaoTotal > 0 ? Math.round((evolucaoCounts.melhorou / evolucaoTotal) * 100) : 0
  const checkinsPendentes = Math.max(0, checkinsEnviados - checkinsRespondidos)

  const isEmpty = acompanhamentosAtivos === 0 && checkinsEnviados === 0

  return {
    kpis: {
      acompanhamentosAtivos,
      taxaAdesaoPercent,
      checkinsRespondidos,
      checkinsEnviados,
      totalCheckinsRealizados: checkinsRespondidos,
      checkinsPendentes,
      taxaMelhoraPercent,
    },
    evolucaoDistribuicao,
    filterKey,
    isEmpty,
  }
}
