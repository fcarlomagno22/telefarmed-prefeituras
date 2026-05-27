import type { AdminProfessionalCategory } from '../../../../data/adminMedicosMock'
import { specialties } from '../../../../data/specialties'

export type AdminProfessionalCreateStep = 'profile' | 'address' | 'photo' | 'success'

export type AdminProfessionalCreateDraft = {
  fullName: string
  profession: AdminProfessionalCategory
  specialty: string
  councilNumber: string
  councilUf: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  photoDataUrl: string
  password: string
  passwordConfirm: string
}

export const adminProfessionalCreateFlowSteps = [
  { id: 'profile', label: 'Dados' },
  { id: 'address', label: 'Endereço' },
  { id: 'photo', label: 'Foto' },
] as const

export const professionalCategoryOptions: {
  value: AdminProfessionalCategory
  label: string
}[] = [
  { value: 'Médicos', label: 'Médico' },
  { value: 'Psicólogos', label: 'Psicólogo' },
  { value: 'Nutricionistas', label: 'Nutricionista' },
  { value: 'Fonoaudiólogos', label: 'Fonoaudiólogo' },
]

export const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export function emptyAdminProfessionalCreateDraft(): AdminProfessionalCreateDraft {
  return {
    fullName: '',
    profession: 'Médicos',
    specialty: '',
    councilNumber: '',
    councilUf: 'SP',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    photoDataUrl: '',
    password: '',
    passwordConfirm: '',
  }
}

export function resolveAdminProfessionalCreateStepIndex(step: AdminProfessionalCreateStep): number {
  switch (step) {
    case 'profile':
      return 0
    case 'address':
      return 1
    case 'photo':
      return 2
    case 'success':
      return 3
    default:
      return 0
  }
}

export function getCouncilLabel(profession: AdminProfessionalCategory): string {
  switch (profession) {
    case 'Médicos':
      return 'CRM'
    case 'Psicólogos':
      return 'CRP'
    case 'Nutricionistas':
      return 'CRN'
    case 'Fonoaudiólogos':
      return 'CRFa'
    default:
      return 'Conselho'
  }
}

export function getSpecialtyOptionsForProfession(profession: AdminProfessionalCategory) {
  const available = specialties.filter((item) => item.available)

  switch (profession) {
    case 'Psicólogos':
      return available.filter((item) => /psicolog/i.test(item.name))
    case 'Nutricionistas':
      return available.filter((item) => /nutri|nutrologia/i.test(item.name))
    case 'Fonoaudiólogos':
      return available.filter((item) => /fonoaudi/i.test(item.name))
    default:
      return available.filter(
        (item) =>
          !/^psicologia$/i.test(item.name) &&
          !/^orientação nutricional$/i.test(item.name) &&
          !/^fonoaudiologia$/i.test(item.name),
      )
  }
}

export function isProfileStepReady(draft: AdminProfessionalCreateDraft) {
  return (
    draft.fullName.trim().length >= 3 &&
    draft.specialty.trim().length > 0 &&
    draft.councilNumber.replace(/\D/g, '').length >= 3 &&
    draft.councilUf.trim().length === 2
  )
}

export function isAddressStepReady(draft: AdminProfessionalCreateDraft) {
  return (
    draft.zipCode.replace(/\D/g, '').length === 8 &&
    draft.street.trim().length > 0 &&
    draft.number.trim().length > 0 &&
    draft.neighborhood.trim().length > 0 &&
    draft.city.trim().length > 0 &&
    draft.state.trim().length === 2
  )
}

export function isPhotoStepReady(draft: AdminProfessionalCreateDraft) {
  return Boolean(draft.photoDataUrl)
}
