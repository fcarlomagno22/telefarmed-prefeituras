import type { AdminMunicipalPatientDto } from '../admin-pacientes/types.js'

export type UbtPacienteDto = Omit<
  AdminMunicipalPatientDto,
  'municipality' | 'contractStatus' | 'registrationMonthLabel' | 'contractingEntityId' | 'contractingEntityRazaoSocial'
>

export type UbtPacientesSummaryDto = {
  totalUsers: number
  newUsers: number
  totalAppointments: number
  attendedThisMonth: number
}

export type UbtPacientesAboutDto = {
  ageDistribution: Array<{ label: string; percent: number }>
  genderDistribution: Array<{
    label: string
    percent: number
    gradientFrom: string
    gradientTo: string
  }>
  topNeighborhoodsByAppointments: Array<{ label: string; appointments: number }>
}

export type UbtPacientesFiltrosDto = {
  bairros: string[]
  registrationUnits: string[]
  unidadeUbtId: string
}

export type UbtPatientTerritoryPolicyDto = {
  municipio: string
  uf: string
  aceitaPacientesOutrosMunicipios: boolean
}

export type UbtPacientesListResponse = {
  rows: UbtPacienteDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListUbtPacientesQuery = {
  search?: string
  bairros?: string[]
  gender?: 'all' | 'feminino' | 'masculino'
  ageGroup?: 'all' | '0-17' | '18-29' | '30-59' | '60+'
  newUsers?: 'all' | 'this_month' | '30d'
  lastAppointment?: 'all' | 'today' | '7d' | '30d' | '90d' | 'inactive' | 'never'
  totalAppointments?: 'all' | 'inactive' | 'low' | 'frequent'
  incompleteData?: Array<'no_phone' | 'no_email' | 'no_emergency_contact'>
  inactiveConsultation?: 'all' | '6m' | '12m' | 'never'
  dataQuality?: 'all' | 'complete' | 'incomplete'
  registrationUnits?: string[]
  recentActivityOnly?: boolean
  sortBy?:
    | 'name_asc'
    | 'name_desc'
    | 'registered_asc'
    | 'registered_desc'
    | 'last_appointment_asc'
    | 'last_appointment_desc'
    | 'total_appointments_asc'
    | 'total_appointments_desc'
  page?: number
  pageSize?: number
}

export type UbtPatientRegistrationPayload = {
  fullName: string
  socialName?: string
  cpf: string
  birthDate: string
  gender: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  contacts?: Array<{ id?: string; name: string; phone: string; relationship?: string }>
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  photoDataUrl?: string
}

export type UbtPatientLookupResult =
  | {
      status: 'found'
      patient: UbtPatientRegistrationPayload
      patientId?: string
      linkedToUnit: boolean
      contractActive: boolean
    }
  | {
      status: 'found_pending_first_visit'
      patient: UbtPatientRegistrationPayload
      patientId?: string
      preCadastroId?: string
      specialtyId: string
      specialtyName: string
      linkedToUnit: boolean
      contractActive: boolean
    }
  | { status: 'not_found' }

export type UbtPatientLookupQuery = {
  cpf: string
  specialtyId?: string
  specialtyName?: string
}

export type UbtPacienteAnnotationDto = {
  id: string
  text: string
  createdAt: string
  authorLabel: string
}

export type UbtPacienteContactLogDto = {
  id: string
  at: string
  channel: 'whatsapp' | 'sms' | 'telefone' | 'presencial' | 'outro'
  phone: string
  note: string
  authorLabel: string
}

export type UbtPacienteConsultationDto = {
  id: string
  date: string
  time: string
  specialty: string
  professional: string
  status: 'concluida' | 'cancelada' | 'agendada'
  protocol: string
  ubtName: string
}

export type UbtScope = {
  entidadeContratanteId: string
  unidadeUbtId: string
  operadorId: string
  operadorNome: string
}
