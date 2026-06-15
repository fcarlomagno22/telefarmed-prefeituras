import type {
  PrefeituraPosConsultaDashboardKpis,
  PrefeituraPosConsultaDashboardView,
  PrefeituraPosConsultaEvolucaoSlice,
} from './prefeituraPosConsultaDashboard'

export type AdminPosConsultaClienteBreakdownRow = {
  clientId: string
  municipalityName: string
  stateUf: string
  acompanhamentosAtivos: number
  taxaAdesaoPercent: number
  checkinsRealizados: number
  taxaMelhoraPercent: number
}

export type AdminPosConsultaDashboardView = PrefeituraPosConsultaDashboardView & {
  clientesBreakdown: AdminPosConsultaClienteBreakdownRow[]
}

export type AdminPosConsultaDashboardFilters = {
  period: string
  state: string
  city: string
  contract: string
}

export type {
  PrefeituraPosConsultaDashboardKpis,
  PrefeituraPosConsultaEvolucaoSlice,
}

export const EMPTY_ADMIN_POS_CONSULTA_DASHBOARD: AdminPosConsultaDashboardView = {
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
  clientesBreakdown: [],
  filterKey: '',
  isEmpty: true,
}
