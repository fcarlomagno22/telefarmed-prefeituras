import type { ProfissionalPrestadorEmpresa } from './profissionalFinanceiro'

export type ProfissionalConselhoClasse =
  | 'medico'
  | 'psicologo'
  | 'fonoaudiologo'
  | 'nutricionista'

export type ProfissionalPerfilDocumentKind =
  | 'identidade'
  | 'crm'
  | 'comprovante'
  | 'contrato'
  | 'outro'

export type ProfissionalPerfilDocumentStatus = 'aprovado' | 'pendente' | 'vencido'

export type ProfissionalPerfilDocumentIconTone = 'orange' | 'blue' | 'green' | 'violet'

export type ProfissionalPerfilDocument = {
  id: string
  kind: ProfissionalPerfilDocumentKind
  label: string
  fileName: string
  uploadedAt: string
  status: ProfissionalPerfilDocumentStatus
  iconTone: ProfissionalPerfilDocumentIconTone
}

export type ProfissionalPerfilBankAccount = {
  bankName: string
  bankCode: string
  agency: string
  account: string
  accountType: 'corrente' | 'poupanca'
}

export type ProfissionalPerfilPixKeyType = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria'

export type ProfissionalPerfilCertificadoModo = 'conselho_nuvem' | 'a1_arquivo' | 'nao_cadastrado'

export type ProfissionalPerfilCertificadoStatus =
  | 'ativo'
  | 'pendente'
  | 'nao_cadastrado'
  | 'vencido'

/** Certificado ICP-Brasil para assinatura de documentos clínicos. */
export type ProfissionalPerfilCertificadoDigital = {
  modo: ProfissionalPerfilCertificadoModo
  status: ProfissionalPerfilCertificadoStatus
  updatedAt: string | null
  expiresAt: string | null
  /** Ex.: Certificado CFM em nuvem · ICP-Brasil · VALID */
  emissorDescricao: string | null
  arquivoNome: string | null
  titularNome: string | null
}

export type ProfissionalPerfilPublicSummary = {
  isOnline: boolean
  onlineLabel: string
  averageRating: number
  reviewCount: number
  totalAttendances: number
}

export type ProfissionalPerfil = {
  id: string
  fullName: string
  professionalTitle: string
  cpf: string
  rg: string
  conselhoClasse: ProfissionalConselhoClasse
  conselhoRegistro: string
  conselhoUf: string
  rqe: string
  birthDate: string
  specialty: string
  profession: string
  professionalDescription: string
  professionalAddress: string
  phone: string
  email: string
  avatarUrl: string
  empresa: ProfissionalPrestadorEmpresa
  bankAccount: ProfissionalPerfilBankAccount
  pixKeyType: ProfissionalPerfilPixKeyType
  documents: ProfissionalPerfilDocument[]
  certificadoDigital: ProfissionalPerfilCertificadoDigital
  publicSummary: ProfissionalPerfilPublicSummary
  profileCompletenessPercent: number
}
