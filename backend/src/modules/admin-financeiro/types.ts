export type FechamentoCompetenciaStatus =
  | 'aberto'
  | 'em_apuracao'
  | 'pre_fechado'
  | 'fechado'
  | 'reaberto'

export type ContaReceberStatusVencimento = 'a_vencer' | 'paga' | 'atrasada'

export type ContaPagarStatus = 'pendente' | 'pago' | 'atrasado'

export type ContaPagarRecorrencia = 'mensal' | 'unica'

export type ContaPagarOrigem = 'manual' | 'repasse_profissional'

export type ContaPagarRepasseConferenciaStatus = 'pendente_conferencia' | 'conferido'

export type FornecedorSituacao = 'ativa' | 'inativa' | 'nao_informado'

export type NotaFiscalFechamentoStatus = 'emitting' | 'issued' | 'failed'

export type EscalaRepasseModalidade = 'plantao_fixo' | 'por_consulta' | 'hibrido'

export type EscalaRepasseTratamentoInelegivel =
  | 'proporcional_consultas'
  | 'aguardando_analise_manual'

export type EscalaRepasseCriteriosPresenca = {
  minPercentualOnline: number
  exigeEncerramentoFormal: boolean
  minConsultasConcluidas: number
  aceitaSemDemandaComprovada: boolean
  tratamentoInelegivel: EscalaRepasseTratamentoInelegivel
}

export type EscalaRepasseRule = {
  modalidade: EscalaRepasseModalidade
  valorPlantaoCentavos: number
  valorConsultaCentavos: number
  percentualFixoHibrido?: number
  criteriosPresenca: EscalaRepasseCriteriosPresenca
}

export type AdminPlantaoElegibilidade = 'elegivel' | 'parcial' | 'indeferido' | 'pendente'

export type PlantaoDecisaoAnalista = 'aprovado' | 'aprovado_parcial' | 'indeferido'

export type AdminRepasseProfissionalStatus =
  | 'pendente_conferencia'
  | 'aprovado'
  | 'pago'
  | 'rejeitado'

export type FinanceiroSummaryDto = {
  receitaPrevista: number
  receitaRecebida: number
  despesasTotais: number
  saldoOperacional: number
  totalEmAtrasoReceber: number
}

export type NotaFiscalDto = {
  status: NotaFiscalFechamentoStatus
  invoiceNumber?: string
  issuedAt?: string
  downloadUrl?: string
}

export type FechamentoCompetenciaDto = {
  id: string
  prefeitura: string
  contratoNumero: string
  modalidade: string
  competencia: string
  consumoPercentual: number | null
  excedeuLimite: boolean
  valorBase: number
  valorExcedente: number
  ajustes: number
  valorFinal: number
  status: FechamentoCompetenciaStatus
  vencimento: string
  statusVencimento: ContaReceberStatusVencimento
  notaFiscal?: NotaFiscalDto | null
}

export type CentroCustoDto = {
  id: string
  nome: string
}

export type FornecedorDto = {
  id: string
  cnpj: string
  razaoSocial: string
  situacao: FornecedorSituacao
  contatoEmail: string
  contatoTelefone: string
  pessoaContato: string
  observacoes: string
}

export type ContaPagarDto = {
  id: string
  fornecedorId: string
  descricao: string
  centroCustoId: string
  recorrencia: ContaPagarRecorrencia
  valor: number
  vencimento: string
  status: ContaPagarStatus
  origem?: ContaPagarOrigem
  repasseCompetenciaId?: string
  repasseDraftId?: string
  repasseConferenciaStatus?: ContaPagarRepasseConferenciaStatus
  repasseSnapshot?: unknown
}

export type BalancoDto = {
  receita: number
  despesa: number
  resultado: number
  lucratividadePercentual: number
  despesasPagas: number
  totalEmAtrasoReceber: number
  despesasPorCentro: Array<{
    id: string
    nome: string
    valorBase: number
    ajuste: number
    valor: number
  }>
}

export type CnpjLookupDto = {
  razaoSocial?: string
  situacao?: FornecedorSituacao
  contatoEmail?: string
  contatoTelefone?: string
  pessoaContato?: string
}

export type PlantaoAuditoriaDto = {
  id: string
  profissionalId: string
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
  competencia: string
  slotLabel: string
  horarioPrevistoInicio: string
  horarioPrevistoFim: string
  enteredAt: string | null
  endedAt: string | null
  percentualOnline: number | null
  consultasAgendadas: number
  encaixes: number
  atendidos: number
  naoCompareceu: number
  desistiu: number
  encerramentoFormal: boolean
  plantaoEncerrado: boolean
  repasseRule: EscalaRepasseRule
  valorDeclaradoCentavos: number | null
  decisaoAnalista?: PlantaoDecisaoAnalista | null
  observacaoAnalista?: string | null
  decididoEm?: string | null
  decididoPorAdminId?: string | null
}

export type RepasseCompetenciaDto = {
  id: string
  profissionalId: string
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
  competencia: string
  qtdPlantoes: number
  regraPredominante: EscalaRepasseModalidade
  totalAtendidos: number
  valorCalculadoCentavos: number
  valorNFCentavos: number | null
  elegibilidadeAgregada: AdminPlantaoElegibilidade
  status: AdminRepasseProfissionalStatus
  temAlerta: boolean
  nfFileName: string | null
  nfEnviadaEm: string | null
  plantoes: PlantaoAuditoriaDto[]
}

export type FechamentoRow = {
  id: string
  contrato_id: string
  competencia_mes: string
  consumo_percentual: number | string | null
  excedeu_limite: boolean
  valor_base_centavos: number
  valor_excedente_centavos: number
  ajustes_centavos: number
  valor_final_centavos: number
  status: FechamentoCompetenciaStatus
  vencimento: string
  status_vencimento: ContaReceberStatusVencimento
  fechado_em: string | null
  fechado_por_admin_id: string | null
}

export type ContaPagarRow = {
  id: string
  fornecedor_id: string
  descricao: string
  centro_custo_id: string
  recorrencia: ContaPagarRecorrencia
  valor_centavos: number
  vencimento: string
  status: ContaPagarStatus
  origem: ContaPagarOrigem
  profissional_fechamento_id: string | null
  motivo_ajuste: string
  repasse_conferencia_status: ContaPagarRepasseConferenciaStatus | null
  repasse_snapshot: unknown
}

export type ProfissionalFechamentoRow = {
  id: string
  profissional_id: string
  competencia: string
  status: string
  invoice_file_name: string
  invoice_storage_path: string
  submitted_at: string | null
  approved_at: string | null
  paid_at: string | null
  rejection_reason: string
  valor_calculado_centavos: number
  valor_aprovado_centavos: number | null
  motivo_ajuste: string
  valor_nf_centavos: number | null
  conta_pagar_id: string | null
  correcao_motivo: string
  plantoes_snapshot: unknown
}
