import type { AdminRegisteredSpecialty } from './adminProfissionais'

export type AdminDoctorAllocation = 'nacional' | 'por_contrato'
export type AdminProfessionalCategory =
  | 'Médicos'
  | 'Psicólogos'
  | 'Nutricionistas'
  | 'Fonoaudiólogos'

export type AdminDoctorDocumentKind = 'identidade' | 'crm' | 'comprovante_endereco' | 'outro'

export type AdminDoctorDocument = {
  id: string
  kind: AdminDoctorDocumentKind | string
  label: string
  fileName: string
  uploadedAt: string
}

export type AdminDoctorAttendance = {
  id: string
  dateTimeLabel: string
  contractCity: string
  patientName: string
  durationMinutes: number
  documents: {
    id: string
    label: string
    fileName: string
  }[]
}

export type AdminDoctorReview = {
  id: string
  rating: number
  author: string
  comment: string
  createdAtLabel: string
}

export type AdminDoctorShift = {
  id: string
  dateLabel: string
  timeLabel: string
  city: string
  unitName: string
  specialty: string
  status: string
}

export type AdminDoctorStatus = 'ativo' | 'inativo'

export type AdminDoctorContractingEntity = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
}

export type AdminDoctor = {
  id: string
  name: string
  phone: string
  cpf: string
  rg: string
  crm: string
  ufCrm: string
  profession: AdminProfessionalCategory | string
  specialty: string
  specialties?: AdminRegisteredSpecialty[]
  avatarUrl: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  allocation: AdminDoctorAllocation
  contractingEntity: AdminDoctorContractingEntity | null
  onCallLabel: string
  status: AdminDoctorStatus
  isOnlineNow: boolean
  totalPatientsThisMonth: number
  averageRating: number
  totalReviews: number
  lastLoginAt: string
  lastLogoutAt: string | null
  documents: AdminDoctorDocument[]
  attendances: AdminDoctorAttendance[]
  reviews: AdminDoctorReview[]
  confirmedShifts?: AdminDoctorShift[]
  totalConsultations?: number
  completedConsultations?: number
  completionRate?: number
}
