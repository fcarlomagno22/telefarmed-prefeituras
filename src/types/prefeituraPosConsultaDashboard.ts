import type { PosConsultaEvolucaoComparacao } from './posConsulta'

export type PrefeituraPosConsultaEvolucaoKey = PosConsultaEvolucaoComparacao

export type PrefeituraPosConsultaEvolucaoSlice = {
  key: PrefeituraPosConsultaEvolucaoKey
  label: string
  count: number
  percent: number
}

export type PrefeituraPosConsultaDashboardKpis = {
  /** Consultas finalizadas com plano de acompanhamento ativo no recorte. */
  acompanhamentosAtivos: number
  /** Percentual respondidos / enviados (0–100). */
  taxaAdesaoPercent: number
  checkinsRespondidos: number
  checkinsEnviados: number
  totalCheckinsRealizados: number
  /** Check-ins enviados ainda sem resposta no período. */
  checkinsPendentes: number
  /** Percentual de respostas com evolução positiva (melhorou). */
  taxaMelhoraPercent: number
}

export type PrefeituraPosConsultaDashboardView = {
  kpis: PrefeituraPosConsultaDashboardKpis
  evolucaoDistribuicao: PrefeituraPosConsultaEvolucaoSlice[]
  filterKey: string
  isEmpty: boolean
}

export type PrefeituraPosConsultaDashboardFilters = {
  period: string
  regionKey: string
  unidadeUbtId?: string
}

export const EMPTY_PREFEITURA_POS_CONSULTA_DASHBOARD: PrefeituraPosConsultaDashboardView = {
  kpis: {
    acompanhamentosAtivos: 0,
    taxaAdesaoPercent: 0,
    checkinsRespondidos: 0,
    checkinsEnviados: 0,
    totalCheckinsRealizados: 0,
    checkinsPendentes: 0,
    taxaMelhoraPercent: 0,
  },
  evolucaoDistribuicao: [],
  filterKey: '',
  isEmpty: true,
}
