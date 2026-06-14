import type {
  DadosPagamentoRow,
  FechamentoRow,
  ProfissionalFechamentoStatusApi,
  RepasseRow,
} from './types.js'

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function formatCompetenceLabel(competencia: string): string {
  const [year, month] = competencia.split('-')
  const monthIndex = Number.parseInt(month ?? '1', 10) - 1
  const label = MONTH_LABELS[monthIndex] ?? competencia
  return `${label} de ${year}`
}

export function currentCompetenceKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function formatRepasseApi(
  row: RepasseRow,
  extratoSummary?: {
    valorRealizadoCentavos: number
    valorPrevistoCentavos: number
    qtdRealizadas: number
    qtdPrevistas: number
  },
) {
  const valorCentavos = Number(row.valor_centavos ?? 0)
  return {
    id: String(row.id),
    profissionalId: String(row.profissional_id),
    competencia: String(row.competencia),
    qtdConsultas: Number(row.qtd_consultas ?? 0),
    qtdPrevistas: extratoSummary?.qtdPrevistas ?? 0,
    valorCentavos,
    valorPrevistoCentavos: extratoSummary?.valorPrevistoCentavos ?? 0,
    valorReais: valorCentavos / 100,
    status: row.status,
    pagoEm: row.pago_em ? String(row.pago_em) : null,
    referenciaExterna: row.referencia_externa ? String(row.referencia_externa) : null,
    criadoEm: String(row.criado_em),
    atualizadoEm: String(row.atualizado_em),
  }
}

export function formatDadosPagamentoApi(row: DadosPagamentoRow) {
  return {
    profissionalId: String(row.profissional_id),
    pixTipo: String(row.pix_tipo ?? ''),
    pixChave: String(row.pix_chave ?? ''),
    bancoNome: String(row.banco_nome ?? ''),
    bancoCodigo: String(row.banco_codigo ?? ''),
    agencia: String(row.agencia ?? ''),
    conta: String(row.conta ?? ''),
    tipoConta: String(row.tipo_conta ?? ''),
    titular: String(row.titular ?? ''),
    atualizadoEm: String(row.atualizado_em),
  }
}

export function formatFechamentoApi(row: FechamentoRow | null) {
  if (!row) return null
  return {
    competencia: String(row.competencia),
    status: row.status as ProfissionalFechamentoStatusApi,
    submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    approvedAt: row.approved_at ? String(row.approved_at) : undefined,
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
    invoiceFileName: row.invoice_file_name ? String(row.invoice_file_name) : undefined,
    pixKeyUsed: row.pix_chave ? String(row.pix_chave) : undefined,
    rejectionReason: row.rejection_reason?.trim() ? String(row.rejection_reason) : undefined,
  }
}

export function fechamentoStatusToRepasseStatus(
  status: ProfissionalFechamentoStatusApi,
): RepasseRow['status'] {
  switch (status) {
    case 'em_analise':
    case 'aprovado':
      return 'processando'
    case 'pago':
      return 'pago'
    default:
      return 'pendente'
  }
}

export function repasseStatusToFechamentoStatus(
  repasseStatus: RepasseRow['status'],
  fechamento: FechamentoRow | null,
): ProfissionalFechamentoStatusApi {
  if (fechamento?.status && fechamento.status !== 'aberto') {
    return fechamento.status
  }
  switch (repasseStatus) {
    case 'processando':
      return 'em_analise'
    case 'pago':
      return 'pago'
    default:
      return 'aberto'
  }
}

export function formatExtratoItem(item: {
  consultaId: string
  codigoAtendimento: string
  finalizadaEm: string
  startAt: string
  endAt: string
  pacienteNome: string
  especialidadeNome: string
  valorCentavos: number
  billingStatus: 'realizado' | 'previsto' | 'cancelado'
}) {
  return {
    consultaId: item.consultaId,
    codigoAtendimento: item.codigoAtendimento,
    finalizadaEm: item.finalizadaEm,
    startAt: item.startAt,
    endAt: item.endAt,
    pacienteNome: item.pacienteNome,
    especialidadeNome: item.especialidadeNome,
    valorCentavos: item.valorCentavos,
    valorReais: item.valorCentavos / 100,
    billingStatus: item.billingStatus,
  }
}
