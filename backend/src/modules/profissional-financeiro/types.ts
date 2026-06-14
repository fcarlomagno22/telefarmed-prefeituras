export type ProfissionalRepasseStatusApi = 'pendente' | 'processando' | 'pago'

export type ProfissionalFechamentoStatusApi =
  | 'aberto'
  | 'em_analise'
  | 'aprovado'
  | 'rejeitado'
  | 'pago'

export type ProfissionalFinanceiroContext = {
  profissionalId: string
}

export type RepasseRow = {
  id: string
  profissional_id: string
  competencia: string
  qtd_consultas: number
  valor_centavos: number
  status: ProfissionalRepasseStatusApi
  pago_em: string | null
  referencia_externa: string | null
  criado_em: string
  atualizado_em: string
}

export type DadosPagamentoRow = {
  id: string
  profissional_id: string
  pix_tipo: string
  pix_chave: string
  banco_nome: string
  banco_codigo: string
  agencia: string
  conta: string
  tipo_conta: string
  titular: string
  criado_em: string
  atualizado_em: string
}

export type FechamentoRow = {
  id: string
  profissional_id: string
  repasse_id: string | null
  competencia: string
  status: ProfissionalFechamentoStatusApi
  invoice_file_name: string
  invoice_storage_path: string
  invoice_mime_type: string
  pix_tipo: string
  pix_chave: string
  submitted_at: string | null
  approved_at: string | null
  paid_at: string | null
  rejection_reason: string
  criado_em: string
  atualizado_em: string
}
