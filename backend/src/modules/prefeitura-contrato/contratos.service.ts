import { PrefeituraContratoError } from './errors.js'
import { resolvePrefeituraContratoModalidade } from './contract-modality.js'
import {
  clampIsoRange,
  contractEndIso,
  contractStartIso,
  resolveContractHistoryMonths,
} from './contract-period.js'
import { formatDateLabelBr, getMonthlyCycle, monthBounds } from './cycle.js'
import { aggregateMonthlyHistory, patchMonthlyRow } from './monthly-history.service.js'
import { buildPackageUsageView } from './package-usage.formatters.js'
import {
  countConsultasRealizadas,
  loadConsultasForHistory,
  loadContratoById,
  loadContratoEspecialidades,
  loadContratosForEntidade,
  loadEntidadeContratoInfo,
  loadTipoContratoNome,
} from './query.service.js'
import type { ContratoEntidadeRow, PrefeituraPackageUsageDto } from './types.js'

type MonthlyRowDto = {
  key: string
  year: number
  month: number
  label: string
  contracted: number
  performed: number
  avulsoCount: number
  outcome: 'within' | 'reached' | 'exceeded'
}

type ContratoInfoDto = {
  contractNumber: string
  municipalityName: string
  legalName: string
  signedAt: string
  startsAt: string
  endsAt: string
  modalidade: 'mensal' | 'pacote_fechado' | 'sob_demanda'
  contractTypeLabel: string
  monthlyPackageConsultations: number
  allowsAvulsoAfterPackage: boolean
  avulsoUnitValueBrl: number
  commercialTeam: string
  commercialEmail: string
}

type UtilizacaoDto = {
  consultasContratadas: number | null
  consultasRealizadas: number
  percentualUtilizado: number | null
  permiteUltrapassar: boolean
  tipo: string
  currentMonth: {
    year: number
    month: number
    contracted: number
    performed: number
    avulsoCount: number
  }
}

type EspecialidadeDto = {
  id: string
  nome: string
  precoContratadoBrl: number | null
  precoExcedenteBrl: number | null
}

export type PrefeituraContratoOptionDto = {
  id: string
  title: string
  subtitle: string
  contractNumber: string
  status: 'active' | 'expired'
}

export type PrefeituraContratoDetailDto = {
  id: string
  status: 'active' | 'expired'
  selectorTitle: string
  selectorSubtitle: string
  info: ContratoInfoDto
  monthlyHistory: MonthlyRowDto[]
  utilizacao: UtilizacaoDto
  especialidades: EspecialidadeDto[]
  packageUsage: PrefeituraPackageUsageDto
}

function mapContratoStatus(status: string): 'active' | 'expired' {
  return status === 'ativo' ? 'active' : 'expired'
}

function readContactField(contato: unknown, key: string): string {
  if (!contato || typeof contato !== 'object' || Array.isArray(contato)) return ''
  const value = (contato as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.trim() : ''
}

function buildContratoInfo(
  contrato: ContratoEntidadeRow,
  entidade: Awaited<ReturnType<typeof loadEntidadeContratoInfo>>,
  avulsoUnitValueBrl: number,
  modalidade: ReturnType<typeof resolvePrefeituraContratoModalidade>,
  contractTypeLabel: string,
): ContratoInfoDto {
  const contato = entidade?.contato_contrato
  return {
    contractNumber: contrato.numero?.trim() || '—',
    municipalityName: String(entidade?.municipio ?? '—'),
    legalName: String(entidade?.razao_social ?? entidade?.nome_exibicao ?? '—'),
    signedAt: contrato.data_assinatura,
    startsAt: contrato.data_assinatura,
    endsAt: contrato.data_encerramento ?? contrato.data_assinatura,
    modalidade,
    contractTypeLabel,
    monthlyPackageConsultations: contrato.consultas_contratadas ?? 0,
    allowsAvulsoAfterPackage: contrato.permite_ultrapassar,
    avulsoUnitValueBrl,
    commercialTeam: readContactField(contato, 'name') || 'Telefarmed · Contas públicas',
    commercialEmail: readContactField(contato, 'email') || 'contratos@telefarmed.com.br',
  }
}

async function buildContratoDetail(
  contrato: ContratoEntidadeRow,
  entidadeId: string,
): Promise<PrefeituraContratoDetailDto> {
  const [entidade, tipoLabel, especialidadesRows] = await Promise.all([
    loadEntidadeContratoInfo(entidadeId),
    loadTipoContratoNome(contrato.tipo),
    loadContratoEspecialidades(contrato.id),
  ])

  const packageTotal = contrato.consultas_contratadas ?? 0
  const modalidade = resolvePrefeituraContratoModalidade(contrato.tipo, tipoLabel)
  const historyMonths = resolveContractHistoryMonths({
    dataAssinatura: contrato.data_assinatura,
    dataEncerramento: contrato.data_encerramento,
  })

  const cycle = getMonthlyCycle()
  const contractStart = contractStartIso(contrato.data_assinatura)
  const contractEnd = contractEndIso(contrato.data_encerramento)
  const currentMonthKey = `${cycle.cycleStart.slice(0, 4)}-${cycle.cycleStart.slice(5, 7)}`

  const historyRangeStart =
    historyMonths.length > 0
      ? monthBounds(historyMonths[0]!.year, historyMonths[0]!.month)
      : monthBounds(
          Number(cycle.cycleStart.slice(0, 4)),
          Number(cycle.cycleStart.slice(5, 7)),
        )
  const historyRangeEnd =
    historyMonths.length > 0
      ? monthBounds(
          historyMonths[historyMonths.length - 1]!.year,
          historyMonths[historyMonths.length - 1]!.month,
        )
      : historyRangeStart

  const historyQueryRange = clampIsoRange(
    `${historyRangeStart.cycleStart}T00:00:00.000-03:00`,
    historyRangeEnd.endIso,
    contractStart,
    contractEnd,
  )

  const currentCycleRange = clampIsoRange(cycle.startIso, cycle.endIso, contractStart, contractEnd)
  const contractUsageRange = clampIsoRange(
    contractStart,
    historyRangeEnd.endIso,
    contractStart,
    contractEnd,
  )

  const [historyRows, currentMonthPerformed, totalContractPerformed] = await Promise.all([
    loadConsultasForHistory(entidadeId, historyQueryRange.startIso, historyQueryRange.endIso),
    countConsultasRealizadas(
      entidadeId,
      currentCycleRange.startIso,
      currentCycleRange.endIso,
    ),
    countConsultasRealizadas(
      entidadeId,
      contractUsageRange.startIso,
      contractUsageRange.endIso,
    ),
  ])

  let monthlyHistory = aggregateMonthlyHistory(
    historyRows,
    packageTotal,
    modalidade,
    contrato.permite_ultrapassar,
    historyMonths,
  )

  monthlyHistory = patchMonthlyRow(
    monthlyHistory,
    currentMonthKey,
    currentMonthPerformed,
    packageTotal,
    modalidade,
    contrato.permite_ultrapassar,
  )

  const currentHistoryRow = monthlyHistory.find((row) => row.key === currentMonthKey)
  const usagePerformed =
    modalidade === 'mensal' ? currentMonthPerformed : totalContractPerformed
  const usagePercent =
    packageTotal > 0 ? Math.min(100, Math.round((usagePerformed / packageTotal) * 100)) : null

  const excedentePrices = especialidadesRows
    .filter((row) => row.tipo === 'excedente')
    .map((row) => Number(row.valor_consulta_centavos))
    .filter((value) => value > 0)

  const avulsoUnitValueBrl =
    excedentePrices.length > 0
      ? Math.round(excedentePrices.reduce((sum, value) => sum + value, 0) / excedentePrices.length) /
        100
      : 118

  const especialidades: EspecialidadeDto[] = especialidadesRows
    .filter((row) => row.tipo === 'contratado')
    .map((row) => {
      const config = row.config_especialidades as { nome?: string } | null
      const excedente = especialidadesRows.find(
        (item) => item.especialidade_id === row.especialidade_id && item.tipo === 'excedente',
      )
      return {
        id: String(row.especialidade_id),
        nome: String(config?.nome ?? row.especialidade_id),
        precoContratadoBrl: Number(row.valor_consulta_centavos) / 100,
        precoExcedenteBrl: excedente ? Number(excedente.valor_consulta_centavos) / 100 : null,
      }
    })

  const utilizacao: UtilizacaoDto = {
    consultasContratadas: contrato.consultas_contratadas,
    consultasRealizadas: usagePerformed,
    percentualUtilizado: usagePercent,
    permiteUltrapassar: contrato.permite_ultrapassar,
    tipo: tipoLabel ?? contrato.tipo,
    currentMonth: {
      year: currentHistoryRow?.year ?? Number(cycle.cycleStart.slice(0, 4)),
      month: currentHistoryRow?.month ?? Number(cycle.cycleStart.slice(5, 7)),
      contracted: currentHistoryRow?.contracted ?? 0,
      performed: currentMonthPerformed,
      avulsoCount: currentHistoryRow?.avulsoCount ?? 0,
    },
  }

  const info = buildContratoInfo(
    contrato,
    entidade,
    avulsoUnitValueBrl,
    modalidade,
    tipoLabel ?? 'Pacote mensal',
  )
  const status = mapContratoStatus(contrato.status)

  return {
    id: contrato.id,
    status,
    selectorTitle:
      status === 'active'
        ? `Contrato vigente ${cycle.cycleStart.slice(0, 4)}`
        : `Contrato ${formatDateLabelBr(contrato.data_encerramento ?? contrato.data_assinatura).slice(-4)}`,
    selectorSubtitle: `${tipoLabel ?? 'Pacote mensal'} · ${status === 'active' ? `${String(entidade?.municipio ?? '—')}/${String(entidade?.uf ?? '—')}` : `Encerrado · ${String(entidade?.municipio ?? '—')}/${String(entidade?.uf ?? '—')}`}`,
    info,
    monthlyHistory,
    utilizacao,
    especialidades,
    packageUsage: buildPackageUsageView({
      contractedTotal: packageTotal,
      usedInCycle: usagePerformed,
      permiteUltrapassar: contrato.permite_ultrapassar,
    }),
  }
}

export async function listPrefeituraContratos(
  entidadeId: string,
): Promise<PrefeituraContratoOptionDto[]> {
  const [contratos, entidade] = await Promise.all([
    loadContratosForEntidade(entidadeId),
    loadEntidadeContratoInfo(entidadeId),
  ])

  const municipality = String(entidade?.municipio ?? 'Município')
  const uf = String(entidade?.uf ?? '')

  return Promise.all(
    contratos.map(async (contrato) => {
      const tipoLabel = (await loadTipoContratoNome(contrato.tipo)) ?? 'Pacote mensal'
      const status = mapContratoStatus(contrato.status)
      return {
        id: contrato.id,
        title:
          status === 'active'
            ? `Contrato vigente ${contrato.data_assinatura.slice(0, 4)}`
            : `Contrato ${contrato.data_assinatura.slice(0, 4)}`,
        subtitle: `${tipoLabel} · ${status === 'active' ? `${municipality}/${uf}` : `Encerrado · ${municipality}/${uf}`}`,
        contractNumber: contrato.numero?.trim() || '—',
        status,
      }
    }),
  )
}

export async function getPrefeituraContratoAtivo(
  entidadeId: string,
): Promise<PrefeituraContratoDetailDto | null> {
  const contratos = await loadContratosForEntidade(entidadeId)
  const active = contratos.find((row) => row.status === 'ativo')
  if (!active) return null
  return buildContratoDetail(active, entidadeId)
}

export async function getPrefeituraContratoById(
  entidadeId: string,
  contratoId: string,
): Promise<PrefeituraContratoDetailDto> {
  const contrato = await loadContratoById(entidadeId, contratoId)
  if (!contrato) {
    throw new PrefeituraContratoError('Contrato não encontrado.', 'NOT_FOUND', 404)
  }
  return buildContratoDetail(contrato, entidadeId)
}
