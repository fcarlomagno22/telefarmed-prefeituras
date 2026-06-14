import {
  profissionalFinanceiroClosuresInitial,
  profissionalPrestadorEmpresa,
} from '../../../data/profissionalFinanceiroMock'
import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import type { ProfissionalCompetenceClosureStatus } from '../../../types/profissionalFinanceiro'
import type {
  ProfissionalFinanceiroDadosPagamento,
  ProfissionalFinanceiroExtratoItem,
  ProfissionalFinanceiroRepasse,
  ProfissionalFinanceiroRepasseDetail,
  ProfissionalFinanceiroSummary,
  ProfissionalRepasseStatus,
  UpdateProfissionalFinanceiroDadosPagamentoInput,
} from '../../../types/profissionalFinanceiroApi'
import { buildProfissionalBillingShifts } from '../../../utils/profissional/buildProfissionalBillingShifts'
import {
  competenceKeyFromDate,
  formatCompetenceLabel,
} from '../../../utils/profissional/profissionalCompetence'
import { mockDelay } from '../delay'

export class ProfissionalFinanceiroApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalFinanceiroApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalFinanceiroApiError(
  error: unknown,
): error is ProfissionalFinanceiroApiError {
  return error instanceof ProfissionalFinanceiroApiError
}

export type {
  ProfissionalFinanceiroDadosPagamento,
  ProfissionalFinanceiroExtratoItem,
  ProfissionalFinanceiroRepasse,
  ProfissionalFinanceiroRepasseDetail,
  ProfissionalFinanceiroSummary,
}

function buildInitialDadosPagamento(): ProfissionalFinanceiroDadosPagamento {
  const profile = profissionalLoggedProfile
  const empresa = profissionalPrestadorEmpresa

  return {
    profissionalId: profile.id,
    pixTipo: empresa.pixKeyType,
    pixChave: empresa.pixKeys[empresa.pixKeyType],
    bancoNome: profile.bankAccount?.bankName ?? '',
    bancoCodigo: profile.bankAccount?.bankCode ?? '',
    agencia: profile.bankAccount?.agency ?? '',
    conta: profile.bankAccount?.account ?? '',
    tipoConta: profile.bankAccount?.accountType ?? 'corrente',
    titular: empresa.razaoSocial,
    atualizadoEm: new Date().toISOString(),
  }
}

let dadosPagamentoState = buildInitialDadosPagamento()

function closureStatusToRepasseStatus(
  status: ProfissionalCompetenceClosureStatus,
): ProfissionalRepasseStatus {
  switch (status) {
    case 'pago':
      return 'pago'
    case 'em_analise':
      return 'processando'
    default:
      return 'pendente'
  }
}

function allShiftsByCompetence() {
  const grouped = new Map<string, ReturnType<typeof buildProfissionalBillingShifts>>()

  for (const shift of buildProfissionalBillingShifts()) {
    const list = grouped.get(shift.competenceKey) ?? []
    list.push(shift)
    grouped.set(shift.competenceKey, list)
  }

  return grouped
}

function buildRepasses(): ProfissionalFinanceiroRepasse[] {
  const grouped = allShiftsByCompetence()

  return profissionalFinanceiroClosuresInitial.map((closure) => {
    const shifts = grouped.get(closure.competenceKey) ?? []
    const realizados = shifts.filter((shift) => shift.status === 'realizado')
    const previstos = shifts.filter((shift) => shift.status === 'previsto')
    const valorCentavos = realizados.reduce((sum, shift) => sum + shift.amountCents, 0)
    const valorPrevistoCentavos = previstos.reduce((sum, shift) => sum + shift.amountCents, 0)
    const qtdConsultas = realizados.length
    const qtdPrevistas = previstos.length

    return {
      id: `repasse-${closure.competenceKey}`,
      profissionalId: profissionalLoggedProfile.id,
      competencia: closure.competenceKey,
      qtdConsultas,
      qtdPrevistas,
      valorCentavos,
      valorPrevistoCentavos,
      valorReais: valorCentavos / 100,
      status: closureStatusToRepasseStatus(closure.status),
      pagoEm: closure.paidAt ?? null,
      referenciaExterna: null,
      criadoEm: closure.submittedAt ?? `${closure.competenceKey}-05T10:00:00`,
      atualizadoEm: closure.approvedAt ?? closure.submittedAt ?? `${closure.competenceKey}-05T10:00:00`,
    }
  })
}

function buildSummary(repasses: ProfissionalFinanceiroRepasse[]): ProfissionalFinanceiroSummary {
  const current = competenceKeyFromDate(new Date())
  const currentRepasse = repasses.find((repasse) => repasse.competencia === current)
  const yearPrefix = `${new Date().getFullYear()}-`

  const totalPendenteCentavos = repasses
    .filter((repasse) => repasse.status === 'pendente' || repasse.status === 'processando')
    .reduce((sum, repasse) => sum + repasse.valorCentavos, 0)

  const totalPagoAnoCentavos = repasses
    .filter((repasse) => repasse.status === 'pago' && repasse.competencia.startsWith(yearPrefix))
    .reduce((sum, repasse) => sum + repasse.valorCentavos, 0)

  return {
    competenciaAtual: current,
    totalPendenteCentavos,
    totalPagoAnoCentavos,
    consultasMesAtual: currentRepasse?.qtdConsultas ?? 0,
    valorMesAtualCentavos: currentRepasse?.valorCentavos ?? 0,
    totalPendente: totalPendenteCentavos / 100,
    totalPagoAno: totalPagoAnoCentavos / 100,
    valorMesAtual: (currentRepasse?.valorCentavos ?? 0) / 100,
  }
}

function buildExtrato(competencia: string): ProfissionalFinanceiroExtratoItem[] {
  const shifts = (allShiftsByCompetence().get(competencia) ?? []).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )

  return shifts.map((shift, index) => ({
    consultaId: shift.id,
    codigoAtendimento: shift.escalaShiftId,
    finalizadaEm: shift.endAt,
    startAt: shift.startAt,
    endAt: shift.endAt,
    pacienteNome:
      shift.status === 'realizado' ? `Paciente ${index + 1}` : 'Plantão previsto',
    especialidadeNome: shift.turnLabel,
    valorCentavos: shift.amountCents,
    valorReais: shift.amountCents / 100,
    billingStatus: shift.status,
  }))
}

function buildRepasseDetail(competencia: string): ProfissionalFinanceiroRepasseDetail {
  const repasse = buildRepasses().find((row) => row.competencia === competencia)
  if (!repasse) {
    throw new ProfissionalFinanceiroApiError('Competência não encontrada.', 404, 'REPASSE_NOT_FOUND')
  }

  return {
    ...repasse,
    extrato: buildExtrato(competencia),
    competenciaLabel: formatCompetenceLabel(competencia),
  }
}

export async function fetchProfissionalFinanceiroSummary(
  _accessToken: string,
): Promise<ProfissionalFinanceiroSummary> {
  void _accessToken
  return mockDelay(buildSummary(buildRepasses()))
}

export async function fetchProfissionalFinanceiroDadosPagamento(
  _accessToken: string,
): Promise<ProfissionalFinanceiroDadosPagamento> {
  void _accessToken
  return mockDelay(structuredClone(dadosPagamentoState))
}

export async function updateProfissionalFinanceiroDadosPagamento(
  _accessToken: string,
  payload: UpdateProfissionalFinanceiroDadosPagamentoInput,
): Promise<ProfissionalFinanceiroDadosPagamento> {
  void _accessToken
  dadosPagamentoState = {
    ...dadosPagamentoState,
    ...payload,
    atualizadoEm: new Date().toISOString(),
  }
  return mockDelay(structuredClone(dadosPagamentoState))
}

export async function fetchProfissionalFinanceiroRepasses(
  _accessToken: string,
  query?: {
    competenciaFrom?: string
    competenciaTo?: string
    status?: ProfissionalRepasseStatus
    limit?: number
    offset?: number
  },
): Promise<ProfissionalFinanceiroRepasse[]> {
  void _accessToken
  let rows = buildRepasses()

  if (query?.competenciaFrom) {
    rows = rows.filter((row) => row.competencia >= query.competenciaFrom!)
  }
  if (query?.competenciaTo) {
    rows = rows.filter((row) => row.competencia <= query.competenciaTo!)
  }
  if (query?.status) {
    rows = rows.filter((row) => row.status === query.status)
  }

  const offset = query?.offset ?? 0
  const limit = query?.limit ?? rows.length
  return mockDelay(rows.slice(offset, offset + limit))
}

export async function fetchProfissionalFinanceiroRepasseDetail(
  _accessToken: string,
  competencia: string,
): Promise<ProfissionalFinanceiroRepasseDetail> {
  void _accessToken
  return mockDelay(buildRepasseDetail(competencia))
}

export async function syncProfissionalFinanceiroRepasse(
  _accessToken: string,
  competencia?: string,
): Promise<ProfissionalFinanceiroRepasse | null> {
  void _accessToken
  if (!competencia) return mockDelay(null)
  const repasse = buildRepasses().find((row) => row.competencia === competencia) ?? null
  return mockDelay(repasse)
}
