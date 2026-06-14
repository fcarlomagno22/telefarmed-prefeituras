import type { MedicoCadastroFormation } from '../config/medicoCadastroForm'

/** Status da candidatura (uma palavra no badge). */
export type AdminCandidaturaStatus =
  | 'pendente'
  | 'em_analise'
  | 'incompleto'
  | 'aprovado'
  | 'reprovado'

export type AdminCandidaturaDocumentStatus = 'pendente' | 'aprovado' | 'reprovado'

export type AdminCandidaturaEmpresaStatus =
  | 'nao_informado'
  | 'aguardando_finalizacao'
  | 'vinculada'

export type AdminCandidaturaDocument = {
  id: string
  kind: string
  label: string
  fileName: string
  uploadedAtLabel: string
  status: AdminCandidaturaDocumentStatus
  rejectReason?: string
  /** URL do arquivo enviado (storage). Se ausente, usa pré-visualização simulada. */
  fileUrl?: string
  /** Preenchido quando o admin pede reenvio deste documento. */
  complementRequestedAtLabel?: string
}

export type AdminCandidaturaTimelineEvent = {
  id: string
  atLabel: string
  title: string
  detail?: string
  actor?: string
}

export type AdminRegisteredSpecialty = {
  name: string
  rqe?: string
}

export type AdminCandidaturaEmpresa = {
  status: AdminCandidaturaEmpresaStatus
  cnpj?: string
  razaoSocial?: string
  municipio?: string
  uf?: string
}

export type AdminProfissionalCandidatura = {
  id: string
  fullName: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  formation: MedicoCadastroFormation
  formationLabel: string
  specialty: string
  specialties?: AdminRegisteredSpecialty[]
  councilLabel: string
  councilNumber: string
  councilUf: string
  rqe?: string
  professionalDescription: string
  addressSummary: string
  submittedAtLabel: string
  status: AdminCandidaturaStatus
  assignedAnalyst?: string
  documents: AdminCandidaturaDocument[]
  empresa: AdminCandidaturaEmpresa
  timeline: AdminCandidaturaTimelineEvent[]
  accessCodeSentAtLabel?: string
  finalizedAtLabel?: string
}

export type AdminProfissionaisTab = 'candidaturas' | 'ativos'
