export type ProfissionalBillingShiftStatus = 'realizado' | 'previsto' | 'cancelado'

export type ProfissionalCompetenceClosureStatus =
  | 'aberto'
  | 'em_analise'
  | 'aprovado'
  | 'pago'
  | 'rejeitado'

/** Empresa prestadora cadastrada no perfil do profissional (PJ para NF e PIX). */
export type ProfissionalPixKeyType = 'cnpj' | 'email' | 'telefone' | 'aleatoria'

export type ProfissionalPrestadorEmpresa = {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  /** Tipo de chave PIX principal no cadastro. */
  pixKeyType: ProfissionalPixKeyType
  /** Chaves PIX cadastradas por tipo — todas vinculadas à mesma empresa prestadora. */
  pixKeys: Record<ProfissionalPixKeyType, string>
}

export type ProfissionalBillingShift = {
  id: string
  escalaShiftId: string
  competenceKey: string
  dateKey: string
  turnLabel: string
  startAt: string
  endAt: string
  modalityLabel: string
  status: ProfissionalBillingShiftStatus
  amountCents: number
  attendedCount: number
}

export type ProfissionalCompetenceClosure = {
  competenceKey: string
  status: ProfissionalCompetenceClosureStatus
  submittedAt?: string
  approvedAt?: string
  paidAt?: string
  invoiceFileName?: string
  invoiceNumber?: string
  pixKeyUsed?: string
  rejectionReason?: string
}

export type ProfissionalFinanceiroMonthSummary = {
  competenceKey: string
  shiftCount: number
  realizedCount: number
  forecastCents: number
  closureStatus: ProfissionalCompetenceClosureStatus
}
