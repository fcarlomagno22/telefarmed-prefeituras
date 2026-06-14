import { prefeituraConsultationPackageBase } from '../../../data/prefeituraConsultationPackageMock'
import {
  buildPrefeituraContratoMonthDetail,
  type PrefeituraContratoMonthContractMeta,
  type PrefeituraContratoMonthDetail,
} from '../../../data/prefeituraContratoMonthConsultations'
import { specialties } from '../../../data/specialties'
import type {
  PrefeituraContratoEspecialidade,
  PrefeituraContratoInfo,
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoOption,
  PrefeituraContratoRecord,
  PrefeituraContratoUtilizacao,
} from '../../../types/prefeituraContrato'
import { mockDelay } from '../delay'

export class PrefeituraContratoApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraContratoApiError'
    this.status = status
    this.code = code
  }
}

export type { PrefeituraContratoInfo }

type ContratoDetailApi = PrefeituraContratoRecord & {
  utilizacao: PrefeituraContratoUtilizacao
  especialidades: PrefeituraContratoEspecialidade[]
}

const CONTRACT_OPTIONS: PrefeituraContratoOption[] = [
  {
    id: 'contrato-ativo-2026',
    title: 'Contrato vigente 2026',
    subtitle: 'Pacote mensal · Brasília/DF',
    contractNumber: 'TFM-2026-0042',
    status: 'active',
  },
  {
    id: 'contrato-2025',
    title: 'Contrato 2025',
    subtitle: 'Encerrado · Brasília/DF',
    contractNumber: 'TFM-2025-0018',
    status: 'expired',
  },
]

function monthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function buildMonthlyHistory(
  status: 'active' | 'expired',
  startsAt: string,
  endsAt: string,
): PrefeituraContratoMonthlyRow[] {
  const contracted = prefeituraConsultationPackageBase.contractedTotal
  const [startYear, startMonth] = startsAt.split('-').map(Number)
  const [endYear, endMonth] = endsAt.split('-').map(Number)
  const rows: PrefeituraContratoMonthlyRow[] = []

  let year = startYear
  let month = startMonth
  let index = 0

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    const isCurrentOrPast = monthKey <= `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const performed =
      status === 'expired'
        ? Math.round((contracted / 12) * (0.8 + (index % 4) * 0.05))
        : isCurrentOrPast && index === 0
          ? 1
          : 0
    const monthlyContracted = status === 'active' ? 0 : contracted
    const avulsoCount =
      monthlyContracted > 0 && performed > monthlyContracted ? performed - monthlyContracted : 0
    const outcome: PrefeituraContratoMonthlyRow['outcome'] =
      avulsoCount > 0 ? 'exceeded' : performed >= contracted ? 'reached' : 'within'

    rows.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      label: monthLabel(year, month),
      contracted: monthlyContracted,
      performed,
      avulsoCount,
      outcome,
    })

    index += 1
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    if (rows.length > 120) break
  }

  return rows
}

function buildContractInfo(status: 'active' | 'expired', contractNumber: string): PrefeituraContratoInfo {
  const startsAt = status === 'active' ? '2026-01-01' : '2025-01-01'
  const endsAt = status === 'active' ? '2026-12-31' : '2025-12-31'
  return {
    contractNumber,
    municipalityName: 'Brasília',
    legalName: 'Prefeitura do Distrito Federal',
    signedAt: startsAt,
    startsAt,
    endsAt,
    modalidade: status === 'active' ? 'pacote_fechado' : 'mensal',
    contractTypeLabel: status === 'active' ? 'Franquia Global' : 'Pacote mensal',
    monthlyPackageConsultations: prefeituraConsultationPackageBase.contractedTotal,
    allowsAvulsoAfterPackage: true,
    avulsoUnitValueBrl: 118,
    commercialTeam: 'Telefarmed · Contas públicas',
    commercialEmail: 'contratos@telefarmed.com.br',
  }
}

function buildEspecialidades(): PrefeituraContratoEspecialidade[] {
  return specialties
    .filter((item) => item.available)
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      nome: item.name,
      precoContratadoBrl: 0,
      precoExcedenteBrl: 118,
    }))
}

function buildUtilizacao(history: PrefeituraContratoMonthlyRow[]): PrefeituraContratoUtilizacao {
  const now = new Date()
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const current = history.find((row) => row.key === currentKey) ?? history[0]!
  return {
    consultasContratadas: current.contracted,
    consultasRealizadas: current.performed,
    percentualUtilizado: Math.min(100, Math.round((current.performed / current.contracted) * 100)),
    permiteUltrapassar: true,
    tipo: 'Pacote mensal',
    currentMonth: {
      year: current.year,
      month: current.month,
      contracted: current.contracted,
      performed: current.performed,
      avulsoCount: current.avulsoCount,
    },
  }
}

function buildContratoDetail(option: PrefeituraContratoOption): ContratoDetailApi {
  const info = buildContractInfo(option.status, option.contractNumber)
  const monthlyHistory = buildMonthlyHistory(option.status, info.startsAt, info.endsAt)
  const utilizacao = buildUtilizacao(monthlyHistory)
  const especialidades = buildEspecialidades()

  return {
    id: option.id,
    status: option.status,
    selectorTitle: option.title,
    selectorSubtitle: option.subtitle,
    info,
    monthlyHistory,
    utilizacao,
    especialidades,
  }
}

const contratosState = new Map(CONTRACT_OPTIONS.map((option) => [option.id, buildContratoDetail(option)]))

export function isPrefeituraContratoApiError(error: unknown): error is PrefeituraContratoApiError {
  return error instanceof PrefeituraContratoApiError
}

export function mapApiContratoToRecord(contrato: ContratoDetailApi): {
  record: PrefeituraContratoRecord
  utilizacao: PrefeituraContratoUtilizacao
  especialidades: PrefeituraContratoEspecialidade[]
} {
  const { utilizacao, especialidades, ...record } = contrato
  return { record, utilizacao, especialidades }
}

function ensureContrato(contratoId: string) {
  const contrato = contratosState.get(contratoId)
  if (!contrato) {
    throw new PrefeituraContratoApiError('Contrato não encontrado.', 404, 'CONTRACT_NOT_FOUND')
  }
  return contrato
}

export async function fetchPrefeituraContratos(_accessToken: string) {
  void _accessToken
  return mockDelay([...CONTRACT_OPTIONS], 60)
}

export async function fetchPrefeituraContratoAtivo(_accessToken: string) {
  void _accessToken
  const active = contratosState.get('contrato-ativo-2026') ?? null
  return mockDelay(active, 60)
}

export async function fetchPrefeituraContratoById(_accessToken: string, contratoId: string) {
  void _accessToken
  return mockDelay(ensureContrato(contratoId), 70)
}

export async function fetchPrefeituraContratoEspecialidades(
  _accessToken: string,
  contratoId: string,
) {
  void _accessToken
  return mockDelay(ensureContrato(contratoId).especialidades, 60)
}

export async function fetchPrefeituraContratoUtilizacao(
  _accessToken: string,
  contratoId: string,
) {
  void _accessToken
  return mockDelay(ensureContrato(contratoId).utilizacao, 60)
}

export async function fetchPrefeituraContratoCompetencias(
  _accessToken: string,
  contratoId: string,
) {
  void _accessToken
  return mockDelay(ensureContrato(contratoId).monthlyHistory, 60)
}

export async function fetchPrefeituraContratoMonthDetail(
  _accessToken: string,
  contratoId: string,
  year: number,
  month: number,
  contractMeta?: PrefeituraContratoMonthContractMeta,
): Promise<PrefeituraContratoMonthDetail> {
  void _accessToken
  const contrato = ensureContrato(contratoId)
  const monthRow =
    contrato.monthlyHistory.find((row) => row.year === year && row.month === month) ??
    ({
      key: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      label: `${String(month).padStart(2, '0')}/${year}`,
      contracted: contrato.info.monthlyPackageConsultations,
      performed: 0,
      avulsoCount: 0,
      outcome: 'within' as const,
    })

  return mockDelay(
    buildPrefeituraContratoMonthDetail(monthRow, contractMeta ?? {
      contractNumber: contrato.info.contractNumber,
      periodLabel: contrato.selectorSubtitle,
      municipalityName: contrato.info.municipalityName,
      startsAt: contrato.info.startsAt,
      endsAt: contrato.info.endsAt,
    }),
    80,
  )
}
