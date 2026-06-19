export type ConfigProfession = {
  id: string
  name: string
  councilLabel: string
  councilAcronym: string
  active: boolean
  sortOrder: number
  specialtyIds: string[]
}

export type ConfigSpecialty = {
  id: string
  name: string
  active: boolean
  professionIds: string[]
  sortOrder: number
}

export type ConfigTriageServiceType = {
  id: string
  label: string
  specialtyId: string
  active: boolean
  sortOrder: number
}

export type ConfigContractType = {
  id: string
  label: string
  description: string
  active: boolean
  sortOrder?: number
}

/** Slugs dos tipos de contrato padrão da plataforma (não removíveis). */
export const PRESET_CONTRACT_TYPE_IDS = ['mensal', 'pacote_fechado', 'sob_demanda'] as const

export type PresetContractTypeId = (typeof PRESET_CONTRACT_TYPE_IDS)[number]

export function isPresetContractTypeId(id: string): id is PresetContractTypeId {
  return (PRESET_CONTRACT_TYPE_IDS as readonly string[]).includes(id)
}

export type ConfigCommercialRules = {
  defaultAllowExceedPackage: boolean
  defaultAvulsoUnitValueBrl: string
  minContractMonths: number
  defaultImplantationDays: number
  requireAuthorizedSpecialtiesOnContract: boolean
  blockConsultWhenPackageExceeded: boolean
}

export type ConfigExamCategory = {
  id: string
  name: string
  active: boolean
}

export type ConfigExamItem = {
  id: string
  name: string
  categoryId: string
  active: boolean
}

/** Slugs dos documentos padrão da plataforma (não removíveis). */
export const PRESET_LEGAL_DOCUMENT_IDS = [
  'termos_uso',
  'faq',
  'privacidade',
  'consentimento_informado',
  'lgpd',
  'cadastro_conferencia_dados',
  'cadastro_autorizacao_teleconsulta',
  'cadastro_ciencia_dados',
  'cadastro_permissao_notificacoes',
] as const

export type PresetLegalDocumentId = (typeof PRESET_LEGAL_DOCUMENT_IDS)[number]

export type LegalDocumentPortal = 'admin' | 'prefeitura' | 'ubt' | 'terminal'

export type ConfigLegalDocument = {
  id: string
  title: string
  content: string
  version: string
  updatedAtLabel: string
  published: boolean
  portals: LegalDocumentPortal[]
}

export function isPresetLegalDocumentId(id: string): id is PresetLegalDocumentId {
  return (PRESET_LEGAL_DOCUMENT_IDS as readonly string[]).includes(id)
}

export type AdminConfiguracoesState = {
  professions: ConfigProfession[]
  specialties: ConfigSpecialty[]
  triageServiceTypes: ConfigTriageServiceType[]
  contractTypes: ConfigContractType[]
  commercialRules: ConfigCommercialRules
  examCategories: ConfigExamCategory[]
  examItems: ConfigExamItem[]
  legalDocuments: ConfigLegalDocument[]
}

export type AdminConfiguracoesTab = 'clinico' | 'contratos' | 'consulta' | 'legal'
