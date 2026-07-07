import type { CrmPartnersClienteTipo, CrmPartnersComissaoStatus } from './crmPartnersParceiros'

export type CrmPartnersClienteContratoStatus = 'ativo' | 'pendente' | 'encerrado' | 'suspenso'

/** Repasse fixo por consulta realizada para um parceiro na operação do cliente. */
export type CrmPartnersClienteParticipacao = {
  id: string
  parceiroId: string
  parceiroNome: string
  valorPorConsulta: number
}

export type CrmPartnersClienteParticipacaoConfig = {
  participacoes: CrmPartnersClienteParticipacao[]
  vigenciaInicio: string
  observacoes: string | null
  definidaEm: string
}

export type CrmPartnersClienteContrato = {
  valorMensal: number
  dataInicio: string
  status: CrmPartnersClienteContratoStatus
}

export type CrmPartnersClienteParceiroHistorico = {
  id: string
  parceiroId: string
  parceiroNome: string
  dataInicio: string
  dataFim: string | null
  motivo: string | null
}

export type CrmPartnersClientePagamentoComissao = {
  id: string
  referencia: string
  parceiroNome: string
  valor: number
  status: CrmPartnersComissaoStatus
  dataPrevista: string | null
  dataPagamento: string | null
}

export type CrmPartnersClienteRow = {
  id: string
  razaoSocial: string
  tipo: CrmPartnersClienteTipo
  cnpj: string
  contatoNome: string
  contatoEmail: string
  contatoTelefone: string
  cidade: string
  uf: string
  contratoStatus: CrmPartnersClienteContratoStatus
  parceiroIndicadorId: string
  parceiroIndicadorNome: string
  participacaoDefinida: boolean
  participacaoResumo: string
}

export type CrmPartnersClienteDetail = {
  cliente: CrmPartnersClienteRow
  contrato: CrmPartnersClienteContrato
  participacao: CrmPartnersClienteParticipacaoConfig | null
  historicoParceiros: CrmPartnersClienteParceiroHistorico[]
  historicoPagamentos: CrmPartnersClientePagamentoComissao[]
}

export type CrmPartnersClienteFormValues = {
  razaoSocial: string
  tipo: CrmPartnersClienteTipo
  cnpj: string
  contatoNome: string
  contatoEmail: string
  contatoTelefone: string
  cidade: string
  uf: string
  parceiroIndicadorId: string
  valorMensal: string
  dataInicioContrato: string
  contratoStatus: CrmPartnersClienteContratoStatus
}

export type CrmPartnersClienteParticipacaoLinhaForm = {
  key: string
  parceiroId: string
  valorPorConsulta: string
}

export type CrmPartnersClienteParticipacaoFormValues = {
  linhas: CrmPartnersClienteParticipacaoLinhaForm[]
  vigenciaInicio: string
  observacoes: string
}

export type CrmPartnersClienteTrocarParceiroFormValues = {
  parceiroId: string
  motivo: string
  dataInicio: string
}

export type CrmPartnersClienteAction =
  | 'view'
  | 'define_participacao'
  | 'change_partner'
  | 'edit'
