import { adminClientesRows } from './adminClientesMock'
import type { AdminContractFilterKey, AdminStateKey } from '../types/adminDashboard'
import type {
  AdminPosConsultaClienteBreakdownRow,
  AdminPosConsultaDashboardFilters,
  AdminPosConsultaDashboardView,
} from '../types/adminPosConsultaDashboard'
import type { PrefeituraPosConsultaEvolucaoSlice } from '../types/prefeituraPosConsultaDashboard'
import type { AdminClienteRow, AdminClienteStatus } from '../types/adminClientes'

/** Base agregada cross-client (30 dias · rede inteira) — dados fictícios agregados. */
const NETWORK_BASE = {
  acompanhamentosAtivos: 1184,
  checkinsEnviados: 5440,
  checkinsRespondidos: 4192,
  evolucao: {
    melhorou: 2432,
    igual: 1296,
    piorou: 464,
  },
} as const

const PERIOD_SCALE: Record<string, number> = {
  hoje: 0.07,
  '7d': 0.42,
  '30d': 1,
}

function hashScale(seed: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  const normalized = (Math.abs(hash) % 1000) / 1000
  return min + normalized * (max - min)
}

function mapClienteStatusToContract(
  status: AdminClienteStatus,
): Exclude<AdminContractFilterKey, 'all'> {
  if (status === 'suspensa') return 'suspended'
  if (status === 'implantacao' || status === 'prospect') return 'expiring'
  return 'active'
}

function stateKeyFromUf(uf: string): Exclude<AdminStateKey, 'all'> {
  if (uf === 'DF') return 'df'
  if (uf === 'GO') return 'go'
  if (uf === 'MG') return 'mg'
  return 'sp'
}

function statusVolumeMultiplier(status: AdminClienteStatus): number {
  if (status === 'ativa') return 1
  if (status === 'implantacao') return 0.38
  if (status === 'suspensa') return 0.1
  return 0.04
}

function scaleCount(value: number, scale: number, min = 0): number {
  return Math.max(min, Math.round(value * scale))
}

function resolvePeriodScale(period: string): number {
  return PERIOD_SCALE[period] ?? 0.55
}

function filterClientes(filters: AdminPosConsultaDashboardFilters): AdminClienteRow[] {
  return adminClientesRows.filter((cliente) => {
    const stateKey = stateKeyFromUf(cliente.uf)
    const contractStatus = mapClienteStatusToContract(cliente.status)

    if (filters.state !== 'all' && stateKey !== filters.state) return false
    if (filters.city !== 'all' && cliente.id !== filters.city) return false
    if (filters.contract !== 'all' && contractStatus !== filters.contract) return false
    return true
  })
}

function buildClienteWeight(cliente: AdminClienteRow): number {
  return hashScale(cliente.id, 0.65, 1.35) * statusVolumeMultiplier(cliente.status)
}

function buildClienteBreakdownRow(
  cliente: AdminClienteRow,
  share: number,
  periodScale: number,
  minAcomp: number,
): AdminPosConsultaClienteBreakdownRow {
  const acompanhamentosAtivos = scaleCount(NETWORK_BASE.acompanhamentosAtivos * share, periodScale, minAcomp)
  const checkinsEnviados = scaleCount(NETWORK_BASE.checkinsEnviados * share, periodScale, minAcomp > 0 ? 8 : 0)
  const checkinsRespondidos = Math.min(
    checkinsEnviados,
    scaleCount(NETWORK_BASE.checkinsRespondidos * share, periodScale, minAcomp > 0 ? 4 : 0),
  )
  const taxaAdesaoPercent =
    checkinsEnviados > 0 ? Math.round((checkinsRespondidos / checkinsEnviados) * 100) : 0

  const evolucaoMelhorou = scaleCount(NETWORK_BASE.evolucao.melhorou * share, periodScale, 0)
  const evolucaoIgual = scaleCount(NETWORK_BASE.evolucao.igual * share, periodScale, 0)
  const evolucaoPiorou = scaleCount(NETWORK_BASE.evolucao.piorou * share, periodScale, 0)
  const evolucaoTotal = evolucaoMelhorou + evolucaoIgual + evolucaoPiorou
  const taxaMelhoraPercent =
    evolucaoTotal > 0 ? Math.round((evolucaoMelhorou / evolucaoTotal) * 100) : 0

  return {
    clientId: cliente.id,
    municipalityName: cliente.prefeitura,
    stateUf: cliente.uf,
    acompanhamentosAtivos,
    taxaAdesaoPercent,
    checkinsRealizados: checkinsRespondidos,
    taxaMelhoraPercent,
  }
}

function buildEvolucaoDistribuicao(
  melhorou: number,
  igual: number,
  piorou: number,
): PrefeituraPosConsultaEvolucaoSlice[] {
  const total = melhorou + igual + piorou
  if (total === 0) return []

  return [
    { key: 'melhorou', label: 'Melhorou', count: melhorou },
    { key: 'igual', label: 'Estável', count: igual },
    { key: 'piorou', label: 'Piorou', count: piorou },
  ].map((item) => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
}

export function buildAdminPosConsultaDashboardMock(
  filters: AdminPosConsultaDashboardFilters,
): AdminPosConsultaDashboardView {
  const filterKey = `${filters.period}-${filters.state}-${filters.city}-${filters.contract}`
  const periodScale = resolvePeriodScale(filters.period)
  const minAcomp = filters.period === 'hoje' ? 2 : 6

  const clientes = filterClientes(filters)
  const weights = clientes.map((cliente) => buildClienteWeight(cliente))
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)

  const clientesBreakdown = clientes
    .map((cliente, index) => {
      const share = weightSum > 0 ? weights[index]! / weightSum : 0
      return buildClienteBreakdownRow(cliente, share, periodScale, minAcomp)
    })
    .filter((row) => row.acompanhamentosAtivos > 0 || row.checkinsRealizados > 0)
    .sort((a, b) => b.acompanhamentosAtivos - a.acompanhamentosAtivos)

  const acompanhamentosAtivos = clientesBreakdown.reduce(
    (sum, row) => sum + row.acompanhamentosAtivos,
    0,
  )
  const checkinsRespondidos = clientesBreakdown.reduce(
    (sum, row) => sum + row.checkinsRealizados,
    0,
  )
  const checkinsEnviados = clientesBreakdown.reduce((sum, row) => {
    const adesao = row.taxaAdesaoPercent / 100
    if (adesao <= 0) return sum + row.checkinsRealizados
    return sum + Math.round(row.checkinsRealizados / adesao)
  }, 0)

  const taxaAdesaoPercent =
    checkinsEnviados > 0 ? Math.round((checkinsRespondidos / checkinsEnviados) * 100) : 0

  const evolucaoMelhorou = clientesBreakdown.reduce((sum, row) => {
    if (row.taxaMelhoraPercent <= 0 || row.checkinsRealizados <= 0) return sum
    return sum + Math.round((row.taxaMelhoraPercent / 100) * row.checkinsRealizados)
  }, 0)
  const evolucaoRestante = Math.max(0, checkinsRespondidos - evolucaoMelhorou)
  const evolucaoIgual = Math.round(evolucaoRestante * 0.72)
  const evolucaoPiorou = Math.max(0, evolucaoRestante - evolucaoIgual)

  const evolucaoDistribuicao = buildEvolucaoDistribuicao(
    evolucaoMelhorou,
    evolucaoIgual,
    evolucaoPiorou,
  )
  const evolucaoTotal = evolucaoMelhorou + evolucaoIgual + evolucaoPiorou
  const taxaMelhoraPercent =
    evolucaoTotal > 0 ? Math.round((evolucaoMelhorou / evolucaoTotal) * 100) : 0
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
    clientesBreakdown,
    filterKey,
    isEmpty,
  }
}
