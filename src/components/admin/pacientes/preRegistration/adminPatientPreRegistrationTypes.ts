import type { AdminPatientContractingEntity } from '../../../../types/adminPacientes'
import type { PatientAgeGroup, PatientRegistration } from '../../../../types/attendance'

export type AdminPatientPreRegistrationStep =
  | 'contracting_entity'
  | 'cpf_lookup'
  | 'existing_registration_choice'
  | 'age_group'
  | 'registration'
  | 'contacts'
  | 'address'
  | 'registration_consent'
  | 'success'

export type AdminPatientPreRegistrationDraft = {
  registration: PatientRegistration
  ageGroup: PatientAgeGroup | null
  isReturningPatient: boolean
  contractingEntity: AdminPatientContractingEntity
}

export const adminPatientPreRegistrationFlowSteps = [
  { id: 'entity', label: 'Entidade' },
  { id: 'registration', label: 'Cadastro' },
  { id: 'done', label: 'Confirmado' },
] as const

export function resolveAdminPatientPreRegistrationStepIndex(
  step: AdminPatientPreRegistrationStep,
): number {
  switch (step) {
    case 'contracting_entity':
      return 0
    case 'cpf_lookup':
    case 'existing_registration_choice':
    case 'age_group':
    case 'registration':
    case 'contacts':
    case 'address':
    case 'registration_consent':
      return 1
    case 'success':
      return 2
    default:
      return 0
  }
}
