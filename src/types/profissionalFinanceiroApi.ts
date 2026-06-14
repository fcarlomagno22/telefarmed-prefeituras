export type ProfissionalRepasseStatus = 'pendente' | 'processando' | 'pago'

export type ProfissionalFinanceiroDadosPagamento = {
  profissionalId: string
  pixTipo: string
  pixChave: string
  bancoNome: string
  bancoCodigo: string
  agencia: string
  conta: string
  tipoConta: string
  titular: string
  atualizadoEm: string
}

export type ProfissionalFinanceiroExtratoItem = {
  consultaId: string
  codigoAtendimento: string
  finalizadaEm: string
  startAt: string
  endAt: string
  pacienteNome: string
  especialidadeNome: string
  valorCentavos: number
  valorReais: number
  billingStatus: 'realizado' | 'previsto' | 'cancelado'
}

export type ProfissionalFinanceiroRepasse = {
  id: string
  profissionalId: string
  competencia: string
  qtdConsultas: number
  qtdPrevistas?: number
  valorCentavos: number
  valorPrevistoCentavos?: number
  valorReais: number
  status: ProfissionalRepasseStatus
  pagoEm: string | null
  referenciaExterna: string | null
  criadoEm: string
  atualizadoEm: string
}

export type ProfissionalFinanceiroRepasseDetail = ProfissionalFinanceiroRepasse & {
  extrato: ProfissionalFinanceiroExtratoItem[]
  competenciaLabel: string
  fechamento?: ProfissionalFinanceiroFechamentoApi | null
}

export type ProfissionalFinanceiroFechamentoApi = {
  competencia: string
  status: 'aberto' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pago'
  submittedAt?: string
  approvedAt?: string
  paidAt?: string
  invoiceFileName?: string
  pixKeyUsed?: string
  rejectionReason?: string
}

export type ProfissionalFinanceiroSummary = {
  competenciaAtual: string
  totalPendenteCentavos: number
  totalPagoAnoCentavos: number
  consultasMesAtual: number
  consultasMesPrevistas?: number
  valorMesAtualCentavos: number
  valorMesPrevistoCentavos?: number
  totalPendente: number
  totalPagoAno: number
  valorMesAtual: number
}

export type UpdateProfissionalFinanceiroDadosPagamentoInput = {
  pixTipo?: string
  pixChave?: string
  bancoNome?: string
  bancoCodigo?: string
  agencia?: string
  conta?: string
  tipoConta?: string
  titular?: string
}
