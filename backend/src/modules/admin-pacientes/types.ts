import type { TipoEntidade } from '../../lib/entidadeBranding/types.js'

export type AdminContractStatus = 'ativo' | 'encerrado'

export type PacienteStatus = 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso'

export type AdminMunicipalPatientDto = {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  avatarClassName: string
  bairro: string
  phone: string
  cpf: string
  birthDate: string
  age: number
  lastAppointmentDate: string
  lastAppointmentRelative: string
  totalAppointments: number
  municipalRecordId: string
  firstAttendanceUnit: string
  registeredAt: string
  monthsWithoutConsultation: number | null
  dataQuality: 'complete' | 'incomplete'
  missingFields: string[]
  municipality: string
  contractStatus: AdminContractStatus
  registrationMonthLabel: 'Dez' | 'Jan' | 'Fev' | 'Mar' | 'Abr' | 'Mai'
  contractingEntityId: string
  contractingEntityRazaoSocial: string
}

export type AdminPatientUbtVinculoDto = {
  id: string
  nome: string
  principal: boolean
  municipio: string
  uf: string
}

export type AdminPatientConsultationDto = {
  id: string
  date: string
  time: string
  specialty: string
  professional: string
  status: 'concluida' | 'cancelada' | 'agendada'
  protocol: string
  ubtName: string
}

export type AdminPatientDetailProfileDto = {
  email: string
  socialName: string
  genderLabel: string
  nationality: string
  raceColor: string
  guardianName: string
  guardianCpf: string
  guardianRelationship: string
  guardianPhone: string
  guardianAttendanceAuthorized: boolean
  residenceMunicipalityIbgeCode?: string
  cns: string
  cnsPendente: boolean
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  contacts: Array<{ id?: string; name: string; phone: string; relationship?: string }>
  registrationUnit: string
  registeredAt: string
  notes: string
}

export type AdminMunicipalPatientDetailDto = AdminMunicipalPatientDto & {
  ubts?: AdminPatientUbtVinculoDto[]
  consultations?: AdminPatientConsultationDto[]
  profile?: AdminPatientDetailProfileDto
}

export type AdminPatientProntuarioPrescriptionDto = {
  id: string
  medicationName: string
  dosage: string
  route: string
  frequency: string
  duration: string
  notes: string
}

export type AdminPatientProntuarioExamRequestDto = {
  id: string
  examName: string
  notes: string
}

export type AdminPatientProntuarioMessageDto = {
  id: string
  from: 'doctor' | 'patient' | 'system'
  time: string
  text: string
  attachmentUrl?: string
  attachmentName?: string
}

export type AdminPatientProntuarioIssuedDocumentDto = {
  id: string
  kind: string
  title: string
  meta: string
  fileName: string
  signedAtLabel?: string
  downloadUrl?: string
  codigoVerificacao?: string
}

export type AdminPatientProntuarioPatientUploadDto = {
  id: string
  type: 'pdf' | 'image'
  url: string
  name: string
}

export type AdminPatientProntuarioEntryDto = {
  id: string
  attendanceId: string
  dateTimeIso: string
  dateTimeLabel: string
  specialty: string
  professionalName: string
  professionalCrm: string
  ubtName: string
  status: 'concluido' | 'interrompido'
  durationMinutes: number
  triageSummary?: string
  clinicalNotes: string
  prescriptions: AdminPatientProntuarioPrescriptionDto[]
  examRequests: AdminPatientProntuarioExamRequestDto[]
  issuedDocuments: AdminPatientProntuarioIssuedDocumentDto[]
  patientUploads: AdminPatientProntuarioPatientUploadDto[]
  messages: AdminPatientProntuarioMessageDto[]
}

export type AdminPatientProntuarioDto = {
  patient: {
    id: string
    name: string
    photoUrl: string
    birthDate: string
    age: number
    genderLabel: string
    cpf: string
    municipalRecordId: string
    municipality: string
    contractingEntityRazaoSocial: string
    registrationUnit: string
    registeredAt: string
    city: string
    neighborhood: string
  }
  entries: AdminPatientProntuarioEntryDto[]
}

export type PacientesSummaryDto = {
  totalPacientes: number
  novosNoMesAtual: number
  contratoAtivo: number
  contratoEncerrado: number
  registrosIncompletos: number
  novosCadastrosPorMes: { label: string; count: number }[]
  cadastrosPorMunicipio: { label: string; registrations: number }[]
  basePorStatusContratual: { label: string; registrations: number }[]
  municipios: string[]
}

export type AdminPatientContractingEntityDto = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
  contractStatus: AdminContractStatus
  aceitaPacientesOutrosMunicipios: boolean
  tipoEntidade: TipoEntidade
}

export type ListPacientesQuery = {
  search?: string
  cpf?: string
  municipio?: string
  status?: PacienteStatus | 'all'
  contractStatus?: AdminContractStatus | 'all'
  entidadeContratanteId?: string
}

export type PatientRegistrationConsentInput = {
  dataReviewed: true
  teleconsultationAuthorized: true
  dataUsageAcknowledged: true
  notificationsAllowed: true
  operatorName: string
  registeredAt: string
  registrationUnitId?: string
  registrationUnitName: string
  operatorUserId?: string
  operatorAdminId?: string
}

export type PreCadastroRegistrationInput = {
  entidadeContratanteId: string
  unidadeUbtId?: string
  fullName: string
  socialName?: string
  cpf: string
  birthDate: string
  gender: string
  nationality: string
  raceColor: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  guardianRelationship?: string
  guardianPhone?: string
  guardianAttendanceAuthorized?: boolean
  contacts?: { id?: string; name: string; phone: string; relationship?: string }[]
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  residenceMunicipalityIbgeCode?: string
  photoDataUrl?: string
  cns?: string
  cnsPendente?: boolean
  registrationConsent?: PatientRegistrationConsentInput
  concluirImmediately?: boolean
}

export type UpdatePacienteInput = {
  fullName?: string
  socialName?: string
  birthDate?: string
  gender?: string
  nationality?: string
  raceColor?: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  guardianRelationship?: string
  guardianPhone?: string
  guardianAttendanceAuthorized?: boolean
  contacts?: { id?: string; name: string; phone: string; relationship?: string }[]
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  residenceMunicipalityIbgeCode?: string
  photoDataUrl?: string
  cns?: string
  cnsPendente?: boolean
  registrationConsent?: PatientRegistrationConsentInput
}

export type CreatePacienteInput = PreCadastroRegistrationInput & {
  status?: PacienteStatus
}
