export type ClinicoProfessionDto = {
  id: string
  name: string
  councilLabel: string
  councilAcronym: string
  active: boolean
  sortOrder: number
  specialtyIds: string[]
}

export type ClinicoSpecialtyDto = {
  id: string
  name: string
  active: boolean
  professionIds: string[]
  sortOrder: number
}

export type ClinicoCatalogDto = {
  professions: ClinicoProfessionDto[]
  specialties: ClinicoSpecialtyDto[]
}

export type SaveClinicoCatalogInput = {
  professions: Omit<ClinicoProfessionDto, 'specialtyIds'>[]
  specialties: ClinicoSpecialtyDto[]
}

export type ContractTypeDto = {
  id: string
  label: string
  description: string
  active: boolean
  sortOrder: number
}

export type CommercialRulesDto = {
  defaultAllowExceedPackage: boolean
  defaultAvulsoUnitValueBrl: string
  minContractMonths: number
  defaultImplantationDays: number
  requireAuthorizedSpecialtiesOnContract: boolean
  blockConsultWhenPackageExceeded: boolean
}

export type ContratosCatalogDto = {
  contractTypes: ContractTypeDto[]
  commercialRules: CommercialRulesDto
}

export type CreateContractTypeInput = {
  id: string
  label: string
  description: string
  active?: boolean
}

export type UpdateContractTypeInput = {
  label: string
  description: string
}

export type SaveCommercialRulesInput = CommercialRulesDto

export type ExamCategoryDto = {
  id: string
  name: string
  active: boolean
  sortOrder: number
}

export type ExamItemDto = {
  id: string
  name: string
  categoryId: string
  active: boolean
  sortOrder: number
}

export type ConsultaCatalogDto = {
  examCategories: ExamCategoryDto[]
  examItems: ExamItemDto[]
}

export type CreateExamCategoryInput = {
  id: string
  name: string
  active?: boolean
}

export type UpdateExamCategoryInput = {
  name: string
}

export type CreateExamItemInput = {
  id: string
  name: string
  categoryId: string
  active?: boolean
}

export type UpdateExamItemInput = {
  name: string
  categoryId: string
}

export type LegalDocumentPortal = 'admin' | 'prefeitura' | 'ubt' | 'terminal'

export type LegalDocumentDto = {
  id: string
  title: string
  content: string
  version: string
  updatedAtLabel: string
  published: boolean
  portals: LegalDocumentPortal[]
  sortOrder: number
}

export type LegalCatalogDto = {
  documents: LegalDocumentDto[]
}

export type CreateLegalDocumentInput = {
  id: string
  title: string
  content?: string
  version: string
  updatedAtLabel: string
  published?: boolean
  portals: LegalDocumentPortal[]
}

export type UpdateLegalDocumentInput = {
  title: string
  content: string
  version: string
  updatedAtLabel: string
  portals: LegalDocumentPortal[]
}
