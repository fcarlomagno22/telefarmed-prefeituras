import type { EscalaRepasseModalidade, EscalaRepasseRule } from './adminEscala'

/** Classificação automática de elegibilidade para repasse (auditada contra repasseRule do slot). */
export type AdminPlantaoElegibilidade = 'elegivel' | 'parcial' | 'indeferido' | 'pendente'

export type PlantaoDecisaoAnalista = 'aprovado' | 'aprovado_parcial' | 'indeferido'

export type AdminRepasseProfissionalStatus =
  | 'pendente_conferencia'
  | 'aprovado'
  | 'pago'
  | 'rejeitado'

/** Plantão executado com dados de presença e demanda para auditoria financeira.
 *
 * TODO(backend): GET /admin/financeiro/repasse-profissionais deve retornar plantões com repasseRule
 * copiada de escala_slots.repasse_regra no momento da execução/publicação do slot. */
export type AdminPlantaoAuditoriaRow = {
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
  /** Snapshot imutável da regra do slot — definida na criação da escala; fonte da verdade no financeiro. */
  repasseRule: EscalaRepasseRule
  valorDeclaradoCentavos: number | null
  decisaoAnalista?: PlantaoDecisaoAnalista | null
  observacaoAnalista?: string | null
  decididoEm?: string | null
}

/** Linha agregada por profissional + competência na aba Repasse profissionais. */
export type AdminRepasseProfissionalCompetenciaRow = {
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
  /** Nome do arquivo NF enviado pelo profissional (mock). */
  nfFileName: string | null
  nfEnviadaEm: string | null
  plantoes: AdminPlantaoAuditoriaRow[]
}

/** Snapshot de plantão no rascunho de conta a pagar gerada pelo repasse. */
export type AdminContaPagarRepassePlantaoResumo = {
  id: string
  slotLabel: string
  data: string
  modalidade: EscalaRepasseModalidade
  atendidos: number
  valorCalculadoCentavos: number
  elegibilidade: AdminPlantaoElegibilidade
  alertasResolvidos: boolean
}

/** Snapshot persistido em financeiro_contas_pagar.repasse_snapshot ao aprovar competência. */
export type AdminContaPagarRepasseSnapshot = {
  competenciaId: string
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
  competencia: string
  valorCalculadoCentavos: number
  valorAprovadoCentavos: number
  valorNFCentavos: number | null
  motivoAjuste: string | null
  nfFileName: string | null
  plantaoIds: string[]
  plantoesResumo: AdminContaPagarRepassePlantaoResumo[]
  aprovadoEm: string
}

/** Rascunho local gerado ao aprovar competência — vincula conta a pagar à auditoria. */
export type AdminContaPagarRepasseDraft = {
  id: string
  competenciaId: string
  contaPagarId: string
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
  competencia: string
  valorCalculadoCentavos: number
  valorAprovadoCentavos: number
  valorNFCentavos: number | null
  motivoAjuste: string | null
  nfFileName: string | null
  plantaoIds: string[]
  plantoesResumo: AdminContaPagarRepassePlantaoResumo[]
  aprovadoEm: string
}

export type RepasseCompetenciaAprovadaPayload = {
  competenciaRow: AdminRepasseProfissionalCompetenciaRow
  valorAprovadoCentavos: number
  motivoAjuste: string | null
}

export type SubmitPlantaoDecisaoPayload = {
  competenciaId: string
  plantaoId: string
  decisao: PlantaoDecisaoAnalista
  observacao?: string
}
