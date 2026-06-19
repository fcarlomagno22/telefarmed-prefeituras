import type {
  AttendanceSession,
  PatientAgeGroup,
  PatientRegistration,
} from '../../../types/attendance'

export type ScheduleAppointmentStep =
  | 'cpf_lookup'
  | 'confirm_registration'
  | 'age_group'
  | 'registration'
  | 'contacts'
  | 'address'
  | 'registration_consent'
  | 'specialty'
  | 'schedule_datetime'
  | 'success'

export type ScheduleAppointmentDraft = {
  registration: PatientRegistration
  ageGroup: PatientAgeGroup | null
  isReturningPatient: boolean
  specialtyId: string
  specialtyName: string
  selectedDate: Date
  selectedDoctorId: string
  selectedDoctorName?: string
  selectedTime: string
}

export type ScheduleAppointmentInitialState = {
  mode: 'new' | 'reschedule'
  rescheduleAppointmentId?: string
  step: ScheduleAppointmentStep
  registration: PatientRegistration
  session: AttendanceSession
  selectedDate: Date
  selectedDoctorId: string
  selectedTime: string
  isReturningPatient: boolean
  drawerTitle?: string
  drawerSubtitle?: string
}

export const scheduleFlowSteps = [
  { id: 'registration', label: 'CPF e cadastro' },
  { id: 'specialty', label: 'Especialidade' },
  { id: 'schedule', label: 'Data e hora' },
] as const

export function resolveScheduleStepIndex(step: ScheduleAppointmentStep): number {
  switch (step) {
    case 'cpf_lookup':
    case 'confirm_registration':
    case 'age_group':
    case 'registration':
    case 'contacts':
    case 'address':
    case 'registration_consent':
      return 0
    case 'specialty':
      return 1
    case 'schedule_datetime':
      return 2
    case 'success':
      return 3
    default:
      return 0
  }
}
