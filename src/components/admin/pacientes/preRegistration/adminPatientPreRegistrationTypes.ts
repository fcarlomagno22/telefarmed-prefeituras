import type { AdminPatientContractingEntity } from '../../../../data/adminPacientesMock'
import type { PatientAgeGroup, PatientRegistration } from '../../../../data/unitDashboardMock'

export type AdminPatientPreRegistrationStep =
  | 'contracting_entity'
  | 'cpf_lookup'
  | 'existing_registration_choice'
  | 'age_group'
  | 'registration'
  | 'contacts'
  | 'address'
  | 'success'

export type AdminPatientPreRegistrationDraft = {
  registration: PatientRegistration
  ageGroup: PatientAgeGroup | null
  isReturningPatient: boolean
  contractingEntity: AdminPatientContractingEntity
}

export const adminPatientPreRegistrationFlowSteps = [
  { id: 'entity', label: 'Entidade' },
  { id: 'patient', label: 'Paciente' },
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
      return 1
    case 'age_group':
    case 'registration':
    case 'contacts':
    case 'address':
      return 2
    case 'success':
      return 3
    default:
      return 0
  }
}
