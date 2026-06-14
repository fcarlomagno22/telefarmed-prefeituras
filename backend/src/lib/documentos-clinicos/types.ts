export type ClinicalDocumentKind = 'receita' | 'pedido_exame' | 'atestado'

export type ClinicalDocumentContext = {
  entidadeNome: string
  unitName: string
  specialty: string
  patientName: string
  patientCpfMasked: string
  patientAgeLabel: string
  patientCity: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorRqe: string
  emitidoEmLabel: string
  emitidoEmIso: string
  entidadeLogoBuffer?: Buffer | null
}

export type ClinicalDocumentSection = {
  title: string
  lines: string[]
}

export type ClinicalDocumentPayload = {
  kind: ClinicalDocumentKind
  context: ClinicalDocumentContext
  sections: ClinicalDocumentSection[]
  footerNote?: string
  codigoVerificacao: string
  verificationUrl: string
}

export type PrescricaoPdfItem = {
  medicamentoNome: string
  dosagem?: string
  via?: string
  frequencia?: string
  duracao?: string
  observacoes?: string
}

export type ExamePdfItem = {
  name: string
  exameId?: string
  observacoes?: string
}

export type AtestadoPdfData = {
  diasAfastamento: number
  dataInicio: string
  cid?: string
  motivo: string
  observacoes?: string
}
