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
  { id: 'patient', label: 'Paciente' },
  { id: 'registration', label: 'Cadastro' },
  { id: 'specialty', label: 'Especialidade' },
  { id: 'schedule', label: 'Data e hora' },
  { id: 'done', label: 'Confirmado' },
] as const

export function resolveScheduleStepIndex(step: ScheduleAppointmentStep): number {
  switch (step) {
    case 'cpf_lookup':
      return 0
    case 'confirm_registration':
    case 'age_group':
    case 'registration':
    case 'contacts':
    case 'address':
      return 1
    case 'specialty':
      return 2
    case 'schedule_datetime':
      return 3
    case 'success':
      return 4
    default:
      return 0
  }
}
