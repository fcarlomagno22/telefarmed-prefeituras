import { PrefeituraContratoError } from './errors.js'
import {
  monthlyContractedQuota,
  monthlyUsageDenominator,
  resolvePrefeituraContratoModalidade,
} from './contract-modality.js'
import {
  buildMonthOutcome,
  clampIsoRange,
  computeAvulsoCount,
  contractEndIso,
  contractStartIso,
  isMonthWithinContract,
} from './contract-period.js'
import { formatDateLabelBr, monthBounds, monthLabel, todayIsoInBrazil } from './cycle.js'
import {
  mapMonthConsultations,
  monthLabelLong,
  type ConsultaOperacionalRow,
  type MonthConsultationDto,
} from './month-detail.formatters.js'
import {
  countConsultasRealizadas,
  loadConsultasForMonthDetail,
  loadContratoById,
  loadEntidadeContratoInfo,
  loadTipoContratoNome,
} from './query.service.js'

const MAX_CONSULTATIONS = 500

export type PrefeituraContratoMonthDetailDto = {
  month: {
    key: string
    year: number
    month: number
    label: string
    contracted: number
    performed: number
    avulsoCount: number
    outcome: 'within' | 'reached' | 'exceeded'
  }
  monthLabelLong: string
  contractNumber: string
  contractPeriodLabel: string
  municipalityName: string
  contractStartsAtLabel: string
  contractEndsAtLabel: string
  kpis: {
    contracted: number
    performed: number
    usagePercent: number
    avulsoCount: number
  }
  consultations: MonthConsultationDto[]
  totalConsultations: number
  truncated: boolean
}

export async function getPrefeituraContratoMonthDetail(
  entidadeId: string,
  contratoId: string,
  year: number,
  month: number,
): Promise<PrefeituraContratoMonthDetailDto> {
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    throw new PrefeituraContratoError('Competência inválida.', 'INVALID_DATA', 400)
  }

  const contrato = await loadContratoById(entidadeId, contratoId)
  if (!contrato) {
    throw new PrefeituraContratoError('Contrato não encontrado.', 'NOT_FOUND', 404)
  }

  const status = contrato.status === 'ativo' ? 'active' : 'expired'
  if (
    !isMonthWithinContract({
      year,
      month,
      dataAssinatura: contrato.data_assinatura,
      dataEncerramento: contrato.data_encerramento,
      status,
    })
  ) {
    throw new PrefeituraContratoError(
      'Competência fora da vigência deste contrato.',
      'OUT_OF_CONTRACT',
      404,
    )
  }

  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const currentMonthKey = `${todayIsoInBrazil().slice(0, 4)}-${todayIsoInBrazil().slice(5, 7)}`
  if (monthKey > currentMonthKey) {
    throw new PrefeituraContratoError(
      'Competência futura não disponível para consulta.',
      'FUTURE_MONTH',
      404,
    )
  }

  const bounds = monthBounds(year, month)
  const contractStart = contractStartIso(contrato.data_assinatura)
  const monthQueryRange = clampIsoRange(
    bounds.startIso,
    bounds.endIso,
    contractStart,
    contractEndIso(contrato.data_encerramento),
  )

  const [entidade, tipoLabel, performed, cumulativePerformed, rows] = await Promise.all([
    loadEntidadeContratoInfo(entidadeId),
    loadTipoContratoNome(contrato.tipo),
    countConsultasRealizadas(
      entidadeId,
      monthQueryRange.startIso,
      monthQueryRange.endIso,
    ),
    countConsultasRealizadas(
      entidadeId,
      contractStart,
      monthQueryRange.endIso,
    ),
    loadConsultasForMonthDetail(
      entidadeId,
      monthQueryRange.startIso,
      monthQueryRange.endIso,
      MAX_CONSULTATIONS + 1,
    ),
  ])

  const packageTotal = contrato.consultas_contratadas ?? 0
  const modalidade = resolvePrefeituraContratoModalidade(contrato.tipo, tipoLabel)
  const monthlyQuota = monthlyContractedQuota(modalidade, packageTotal)

  let avulsoCount = 0
  if (modalidade === 'mensal') {
    avulsoCount = computeAvulsoCount(performed, packageTotal, contrato.permite_ultrapassar)
  } else if (modalidade === 'pacote_fechado' && packageTotal > 0 && contrato.permite_ultrapassar) {
    const prevCumulative = cumulativePerformed - performed
    const remainingBefore = Math.max(0, packageTotal - prevCumulative)
    avulsoCount = Math.max(0, performed - remainingBefore)
  }

  const truncated = rows.length > MAX_CONSULTATIONS
  const limitedRows = truncated ? rows.slice(0, MAX_CONSULTATIONS) : rows
  const consultations = mapMonthConsultations(limitedRows as ConsultaOperacionalRow[])

  const usageDenominator = monthlyUsageDenominator(modalidade, packageTotal, monthlyQuota)
  const usagePercent =
    usageDenominator > 0
      ? Math.min(100, Math.round((performed / usageDenominator) * 10000) / 100)
      : 0

  const startsAt = contrato.data_assinatura
  const endsAt = contrato.data_encerramento ?? contrato.data_assinatura
  const municipality = `${String(entidade?.municipio ?? '—')}/${String(entidade?.uf ?? '—')}`

  return {
    month: {
      key: monthKey,
      year,
      month,
      label: monthLabel(year, month),
      contracted: monthlyQuota,
      performed,
      avulsoCount,
      outcome:
        modalidade === 'pacote_fechado'
          ? avulsoCount > 0
            ? 'exceeded'
            : packageTotal > 0 && cumulativePerformed >= packageTotal
              ? 'reached'
              : 'within'
          : buildMonthOutcome(performed, packageTotal, avulsoCount),
    },
    monthLabelLong: monthLabelLong(year, month),
    contractNumber: contrato.numero?.trim() || '—',
    contractPeriodLabel: `${tipoLabel ?? 'Pacote mensal'} · ${status === 'active' ? municipality : `Encerrado · ${municipality}`}`,
    municipalityName: String(entidade?.municipio ?? '—'),
    contractStartsAtLabel: formatDateLabelBr(startsAt),
    contractEndsAtLabel: formatDateLabelBr(endsAt),
    kpis: {
      contracted: monthlyQuota,
      performed,
      usagePercent,
      avulsoCount,
    },
    consultations,
    totalConsultations: performed,
    truncated,
  }
}
