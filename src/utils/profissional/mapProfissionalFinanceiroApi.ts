import type {
  ProfissionalCompetenceClosure,
  ProfissionalCompetenceClosureStatus,
  ProfissionalBillingShift,
  ProfissionalPrestadorEmpresa,
  ProfissionalPixKeyType,
} from '../../types/profissionalFinanceiro'
import type {
  ProfissionalFinanceiroDadosPagamento,
  ProfissionalFinanceiroExtratoItem,
  ProfissionalFinanceiroFechamentoApi,
  ProfissionalFinanceiroRepasse,
  ProfissionalRepasseStatus,
} from '../../types/profissionalFinanceiroApi'
import type { ProfissionalFinanceiroStats } from './computeProfissionalFinanceiroStats'
import { computeProfissionalFinanceiroStats } from './computeProfissionalFinanceiroStats'
import { competenceKeyFromDate } from './profissionalCompetence'

export function repasseStatusToClosureStatus(
  status: ProfissionalRepasseStatus,
): ProfissionalCompetenceClosureStatus {
  switch (status) {
    case 'processando':
      return 'em_analise'
    case 'pago':
      return 'pago'
    default:
      return 'aberto'
  }
}

export function repassesToClosures(repasses: ProfissionalFinanceiroRepasse[]): ProfissionalCompetenceClosure[] {
  return repasses.map((repasse) => ({
    competenceKey: repasse.competencia,
    status: repasseStatusToClosureStatus(repasse.status),
    paidAt: repasse.pagoEm ?? undefined,
    pixKeyUsed: undefined,
  }))
}

export function fechamentoApiToClosure(
  fechamento: ProfissionalFinanceiroFechamentoApi,
): ProfissionalCompetenceClosure {
  return {
    competenceKey: fechamento.competencia,
    status: fechamento.status,
    submittedAt: fechamento.submittedAt,
    approvedAt: fechamento.approvedAt,
    paidAt: fechamento.paidAt,
    invoiceFileName: fechamento.invoiceFileName,
    pixKeyUsed: fechamento.pixKeyUsed,
    rejectionReason: fechamento.rejectionReason,
  }
}

export function mergeClosureWithFechamento(
  closures: ProfissionalCompetenceClosure[],
  fechamento: ProfissionalFinanceiroFechamentoApi | null | undefined,
): ProfissionalCompetenceClosure[] {
  if (!fechamento) return closures
  const merged = fechamentoApiToClosure(fechamento)
  const exists = closures.some((item) => item.competenceKey === merged.competenceKey)
  if (!exists) return [...closures, merged]
  return closures.map((item) =>
    item.competenceKey === merged.competenceKey ? { ...item, ...merged } : item,
  )
}

export function resolveCompetenceBounds(repasses: ProfissionalFinanceiroRepasse[]): string[] {
  const keys = new Set(repasses.map((r) => r.competencia))
  keys.add(competenceKeyFromDate(new Date()))
  return [...keys].sort()
}

export function extratoToBillingShifts(
  extrato: ProfissionalFinanceiroExtratoItem[],
  competenceKey: string,
): ProfissionalBillingShift[] {
  return extrato.map((item) => {
    const dateKey = (item.startAt ?? item.finalizadaEm).slice(0, 10)
    return {
      id: item.consultaId,
      escalaShiftId: item.codigoAtendimento,
      competenceKey,
      dateKey,
      turnLabel: item.especialidadeNome || 'Consulta',
      startAt: item.startAt ?? item.finalizadaEm,
      endAt: item.endAt ?? item.finalizadaEm,
      modalityLabel: 'Telemedicina',
      status: item.billingStatus,
      amountCents: item.billingStatus === 'cancelado' ? 0 : item.valorCentavos,
      attendedCount: item.billingStatus === 'realizado' ? 1 : 0,
    }
  })
}

export function statsFromBillingShifts(shifts: ProfissionalBillingShift[]): ProfissionalFinanceiroStats {
  return computeProfissionalFinanceiroStats(shifts)
}

export function statsFromRepasseDetail(
  valorCentavos: number,
  qtdConsultas: number,
): ProfissionalFinanceiroStats {
  return {
    totalShifts: qtdConsultas,
    realizedCount: qtdConsultas,
    scheduledCount: 0,
    canceledCount: 0,
    forecastCents: valorCentavos,
    potentialCents: valorCentavos,
  }
}

function normalizePixKeyType(value: string): ProfissionalPixKeyType {
  if (value === 'cpf' || value === 'cnpj') return 'cnpj'
  if (value === 'email' || value === 'telefone' || value === 'aleatoria') return value
  return 'cnpj'
}

export function dadosPagamentoToEmpresa(
  dados: ProfissionalFinanceiroDadosPagamento,
): ProfissionalPrestadorEmpresa {
  const pixKeyType = normalizePixKeyType(dados.pixTipo)
  const pixKeys: Record<ProfissionalPixKeyType, string> = {
    cnpj: '',
    email: '',
    telefone: '',
    aleatoria: '',
  }
  pixKeys[pixKeyType] = dados.pixChave

  return {
    id: dados.profissionalId,
    razaoSocial: dados.titular,
    nomeFantasia: dados.titular,
    cnpj: dados.pixTipo === 'cnpj' ? dados.pixChave : '',
    pixKeyType,
    pixKeys,
  }
}

export function forecastRowsFromRepasses(repasses: ProfissionalFinanceiroRepasse[]) {
  return repasses.map((repasse) => ({
    key: repasse.competencia,
    realizados: repasse.valorCentavos,
    previstos: repasse.valorPrevistoCentavos ?? 0,
    total: repasse.valorCentavos + (repasse.valorPrevistoCentavos ?? 0),
    qtdConsultas: repasse.qtdConsultas + (repasse.qtdPrevistas ?? 0),
  }))
}
